"""Phase C — Geometry-Consistent Retraining.

For each candidate asset, retrain models with label geometries that match
the execution geometry being tested. This eliminates the mismatch between
decision boundaries learned during training and payoff surfaces during replay.

Protocol:
  1. For each asset × candidate geometry (sl_mult, tp_mult):
     - Regenerate tb20 labels with pt_sl = [tp_mult, sl_mult]
     - Retrain XGBoost on new labels
     - Walk-forward (5yr train / 1yr test), store OOS predictions
     - Replay with matching (sl_mult, tp_mult)
     - Compute: WF Sharpe, Replay Sharpe, plateau width
  2. Compare across geometries to find the most robust configuration.

Output: data/sandbox/{NAME}/retrain/  — per-geometry results
         data/sandbox/retrain_report.json  — cross-geometry comparison
"""

import os, sys, json, logging
from dataclasses import replace
import pandas as pd
import numpy as np
import xgboost as xgb
import yfinance as yf

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from features.builder import compute_macro_derived, build_features
from features.registry import FEATURE_REGISTRY, ASSET_LABEL_PARAMS
from research.execution_surface.replay_engine import replay, ReplayConfig
from research.execution_surface.monte_carlo import compute_trade_metrics, MIN_TRADES

logger = logging.getLogger("quantforge.execution_surface.retrain")
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

SANDBOX_BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                            'data', 'sandbox')
WF_TRAIN_YEARS = 5
MIN_TRAIN_ROWS = 200
MIN_TEST_ROWS = 30
MODEL_PARAMS = {
    'n_estimators': 300, 'max_depth': 2, 'learning_rate': 0.02,
    'objective': 'multi:softprob', 'num_class': 3,
    'random_state': 42, 'n_jobs': 1, 'tree_method': 'hist', 'verbosity': 0,
}

# Candidate geometries to test (all at 3:1 R:R)
CANDIDATE_GEOMETRIES = [
    {'label': 'tight',  'pt_sl': [1.5, 0.5],   'sl_mult': 0.5,  'tp_mult': 1.5},
    {'label': 'medium', 'pt_sl': [2.25, 0.75],  'sl_mult': 0.75, 'tp_mult': 2.25},
    {'label': 'loose',  'pt_sl': [3.0, 1.0],    'sl_mult': 1.0,  'tp_mult': 3.0},
]

# Assets from Phase A with strongest under-monetization signal
TARGET_ASSETS = ['NZDJPY', 'EURAUD', 'USDJPY', 'CADJPY', 'USDCAD', 'AUDJPY']


def _normalize(df):
    df = df.copy()
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)
    if df.index.tz is None:
        df.index = df.index.tz_localize('US/Eastern')
    else:
        df.index = df.index.tz_convert('US/Eastern')
    return df


def fetch_history(ticker, years=15):
    end = pd.Timestamp.now()
    start = f'{end.year - years}-01-01'
    df = yf.download(ticker, start=start, end=end.strftime('%Y-%m-%d'), auto_adjust=True, progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0] for c in df.columns]
    df = df.rename(columns={'Close': 'close', 'High': 'high', 'Low': 'low', 'Open': 'open', 'Volume': 'volume'})
    return _normalize(df)


def compute_volatility(close, span=100):
    returns = np.log(close / close.shift(1))
    return returns.ewm(span=span).std()


def compute_atr(high, low, close, period=14):
    tr = np.maximum(high - low, np.maximum(
        abs(high - close.shift(1)), abs(low - close.shift(1))
    ))
    return tr.rolling(period).mean()


def classify_vol_regime(close):
    vol = compute_volatility(close)
    recent = vol.dropna().iloc[-min(252, len(vol)):]
    if len(recent) < 20:
        return 'unknown'
    low_thresh = recent.quantile(0.33)
    high_thresh = recent.quantile(0.67)
    latest = recent.iloc[-1]
    if latest <= low_thresh:
        return 'low_vol'
    elif latest >= high_thresh:
        return 'high_vol'
    return 'transition'


def retrain_and_replay_one(name: str, ticker: str, geometry: dict, force: bool = False) -> dict:
    """Retrain with geometry-consistent labels, walk-forward, and replay.

    Args:
        name: asset name (e.g., 'NZDJPY')
        ticker: yahoo ticker (e.g., 'NZDJPY=X')
        geometry: dict with 'pt_sl', 'sl_mult', 'tp_mult', 'label'
        force: re-run even if cached

    Returns:
        dict with walk-forward metrics and replay metrics for this geometry.
    """
    label_str = geometry['label']
    pt_sl = geometry['pt_sl']
    sl_mult = geometry['sl_mult']
    tp_mult = geometry['tp_mult']

    out_dir = os.path.join(SANDBOX_BASE, name, 'retrain')
    os.makedirs(out_dir, exist_ok=True)
    oos_path = os.path.join(out_dir, f'oos_{label_str}.parquet')
    result_path = os.path.join(out_dir, f'result_{label_str}.json')

    if os.path.exists(result_path) and not force:
        with open(result_path) as f:
            return json.load(f)

    logger.info('=' * 60)
    logger.info('%s — geometry=%s (pt_sl=%s, sl=%.2f, tp=%.2f)',
                name, label_str, pt_sl, sl_mult, tp_mult)
    logger.info('=' * 60)

    # 1. Create modified contract with custom label_params
    contract = FEATURE_REGISTRY[ticker]
    new_label_params = {**contract.label_params, 'pt_sl': pt_sl}
    new_contract = replace(contract, label_params=new_label_params)

    # 2. Fetch data
    logger.info('  Fetching data...')
    df = fetch_history(ticker)
    logger.info('  %d rows', len(df))

    logger.info('  Loading macro and ref...')
    macro_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                              'data', 'processed', 'macro_factors.parquet')
    macro = compute_macro_derived(pd.read_parquet(macro_path))
    ref = fetch_history('SPY', years=15) if contract.requires_ref else None

    # 3. Build features with new labels
    logger.info('  Building features with pt_sl=%s...', pt_sl)
    features_df = build_features(df, macro, ref, new_contract)
    logger.info('  %d feature rows', len(features_df))

    X = features_df[list(contract.features)]
    y = features_df['label'].astype(int)
    close = df['close'].reindex(X.index).ffill()
    high = df['high'].reindex(X.index).ffill()
    low = df['low'].reindex(X.index).ffill()
    open_ = df['open'].reindex(X.index).ffill()
    volume = df['volume'].reindex(X.index).ffill()
    vol_series = compute_volatility(close)
    atr_series = compute_atr(high, low, close)

    # 4. Walk-forward
    years = sorted(X.index.year.unique())
    test_years = [y for y in years if y >= years[0] + WF_TRAIN_YEARS
                  and y <= pd.Timestamp.now().year]

    chunks = []
    wf_metrics = []
    for ty in test_years:
        tr_end = ty - 1
        tr_start = tr_end - WF_TRAIN_YEARS + 1
        train_mask = ((X.index >= pd.Timestamp(f'{tr_start}-01-01', tz='US/Eastern'))
                      & (X.index <= pd.Timestamp(f'{tr_end}-12-31', tz='US/Eastern')))
        test_mask = ((X.index >= pd.Timestamp(f'{ty}-01-01', tz='US/Eastern'))
                     & (X.index <= pd.Timestamp(f'{ty}-12-31', tz='US/Eastern')))
        X_train = X[train_mask]
        y_train = y[train_mask]
        X_test = X[test_mask]

        if len(X_train) < MIN_TRAIN_ROWS or len(X_test) < MIN_TEST_ROWS:
            logger.info('  %s %d: insufficient data (train=%d, test=%d), skipping',
                        name, ty, len(X_train), len(X_test))
            continue

        model = xgb.XGBClassifier(**MODEL_PARAMS)
        split_idx = int(len(X_train) * 0.8)
        model.fit(
            X_train.iloc[:split_idx], y_train.iloc[:split_idx],
            eval_set=[(X_train.iloc[split_idx:], y_train.iloc[split_idx:])],
            verbose=False,
        )
        proba = model.predict_proba(X_test)
        preds = model.predict(X_test)

        chunk = pd.DataFrame(index=X_test.index)
        chunk['open'] = open_.reindex(X_test.index)
        chunk['high'] = high.reindex(X_test.index)
        chunk['low'] = low.reindex(X_test.index)
        chunk['close'] = close.reindex(X_test.index)
        chunk['volume'] = volume.reindex(X_test.index)
        chunk['signal'] = preds.astype(int)
        chunk['prob_long'] = proba[:, 2]
        chunk['prob_short'] = proba[:, 0]
        chunk['prob_neutral'] = proba[:, 1]
        chunk['confidence'] = proba.max(axis=1) * 100
        chunk['volatility'] = vol_series.reindex(X_test.index)
        chunk['atr'] = atr_series.reindex(X_test.index)
        chunk['year'] = ty
        chunk['regime'] = classify_vol_regime(close.loc[:X_test.index[-1]])

        chunks.append(chunk)

        # Compute per-year WF metrics
        test_returns = close.reindex(X_test.index).pct_change()
        long_mask = preds == 2
        short_mask = preds == 0
        trade_rets = pd.Series(0.0, index=X_test.index)
        trade_rets[long_mask] = test_returns[long_mask]
        trade_rets[short_mask] = -test_returns[short_mask]
        trades_only = trade_rets[trade_rets != 0]
        if len(trades_only) >= MIN_TRADES:
            wf_sharpe = (trades_only.mean() / trades_only.std() * np.sqrt(252)
                         if trades_only.std() > 0 else 0.0)
            wf_pf = (trades_only[trades_only > 0].sum()
                     / abs(trades_only[trades_only < 0].sum())
                     if (trades_only < 0).any() else float('inf'))
            wf_win_rate = (trades_only > 0).mean()
        else:
            wf_sharpe = 0.0
            wf_pf = 0.0
            wf_win_rate = 0.0

        wf_metrics.append({
            'year': ty,
            'n_trades': len(trades_only),
            'n_long': int((preds == 2).sum()),
            'n_short': int((preds == 0).sum()),
            'sharpe': round(float(wf_sharpe), 4),
            'pf': round(float(wf_pf), 4),
            'win_rate': round(float(wf_win_rate), 4),
        })
        logger.info('  %s %d:  n=%d  L=%d S=%d  Sharpe=%.4f  PF=%.2f',
                    name, ty, len(trades_only), int((preds == 2).sum()),
                    int((preds == 0).sum()), wf_sharpe, wf_pf)

    if not chunks:
        logger.warning('  %s: no OOS predictions generated', name)
        return None

    oos_df = pd.concat(chunks).sort_index()
    oos_df.to_parquet(oos_path)
    logger.info('  OOS predictions saved (%d rows) to %s', len(oos_df), oos_path)

    # Aggregate walk-forward metrics across all years
    wf_summary = pd.DataFrame(wf_metrics)
    avg_wf_sharpe = float(wf_summary['sharpe'].mean()) if len(wf_summary) > 0 else 0.0
    avg_wf_pf = float(wf_summary['pf'].mean()) if len(wf_summary) > 0 else 0.0
    avg_wf_win = float(wf_summary['win_rate'].mean()) if len(wf_summary) > 0 else 0.0
    total_wf_trades = int(wf_summary['n_trades'].sum()) if len(wf_summary) > 0 else 0
    logger.info('  WF avg: Sharpe=%.4f  PF=%.2f  Win=%.2f%%  Total trades=%d',
                avg_wf_sharpe, avg_wf_pf, avg_wf_win * 100, total_wf_trades)

    # 5. Replay with matching (sl_mult, tp_mult)
    logger.info('  Running replay with sl=%.2f, tp=%.2f...', sl_mult, tp_mult)
    config = ReplayConfig(sl_mult=sl_mult, tp_mult=tp_mult)
    trades = replay(oos_df, config)
    replay_metrics = compute_trade_metrics(trades, sl_mult, tp_mult)
    if replay_metrics.get('valid'):
        logger.info('  Replay: Sharpe=%.4f  PF=%.2f  Win=%.2f%%  Trades=%d',
                    replay_metrics.get('sharpe', 0), replay_metrics.get('pf', 0),
                    replay_metrics.get('win_rate', 0) * 100, replay_metrics.get('n_trades', 0))
    else:
        logger.info('  Replay: INVALID (%d trades)', replay_metrics.get('n_trades', 0))

    # 6. Assemble result
    result = {
        'asset': name,
        'ticker': ticker,
        'geometry_label': label_str,
        'pt_sl': pt_sl,
        'sl_mult': sl_mult,
        'tp_mult': tp_mult,
        'n_years': len(wf_metrics),
        'walk_forward': {
            'avg_sharpe': round(avg_wf_sharpe, 4),
            'avg_pf': round(avg_wf_pf, 4),
            'avg_win_rate': round(avg_wf_win, 4),
            'total_trades': total_wf_trades,
            'yearly': wf_metrics,
        },
        'replay': {
            'valid': replay_metrics.get('valid', False),
            'sharpe': replay_metrics.get('sharpe'),
            'pf': replay_metrics.get('pf'),
            'win_rate': replay_metrics.get('win_rate'),
            'n_trades': replay_metrics.get('n_trades'),
            'expectancy': replay_metrics.get('expectancy'),
            'max_dd': replay_metrics.get('max_dd'),
            'payoff_asym': replay_metrics.get('payoff_asym'),
            'stop_hit_freq': replay_metrics.get('stop_hit_freq'),
        },
        'n_oos_predictions': len(oos_df),
    }

    with open(result_path, 'w') as f:
        json.dump(result, f, indent=2, default=str)
    logger.info('  Result saved to %s', result_path)
    return result


def run_all(force=False, assets=None):
    """Run geometry-consistent retraining for target assets."""
    targets = assets or TARGET_ASSETS
    ticker_map = {c.name: t for t, c in FEATURE_REGISTRY.items()}

    report = {}
    for name in targets:
        ticker = ticker_map.get(name)
        if ticker is None:
            logger.warning('%s: ticker not found, skipping', name)
            continue
        asset_results = []
        for geo in CANDIDATE_GEOMETRIES:
            try:
                result = retrain_and_replay_one(name, ticker, geo, force=force)
                if result:
                    asset_results.append(result)
            except Exception as e:
                logger.error('%s / %s: FAILED — %s', name, geo['label'], e)
                import traceback; traceback.print_exc()

        if asset_results:
            report[name] = asset_results

    # Save cross-geometry comparison
    report_path = os.path.join(SANDBOX_BASE, 'retrain_report.json')
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    logger.info('Report saved to %s', report_path)

    # Console comparison
    print('\n' + '=' * 120)
    print('PHASE C — GEOMETRY-CONSISTENT RETRAINING RESULTS')
    print('=' * 120)
    for name, results in sorted(report.items()):
        print(f'\n{name}:')
        header = f'  {"Geometry":10s} {"WF Sharpe":>10s} {"WF PF":>6s} {"Replay Sharpe":>14s} {"Replay PF":>10s} {"Replay Win":>10s} {"Trades":>7s} {"Plateau?":>8s}'
        print(header)
        print('  ' + '-' * (len(header) - 2))
        for r in results:
            wf = r['walk_forward']
            rp = r['replay']
            geo = r['geometry_label']
            valid = 'YES' if rp.get('valid') else 'NO'
            rp_sharpe = f'{rp["sharpe"]:.4f}' if rp.get('sharpe') is not None else 'N/A'
            rp_pf = f'{rp["pf"]:.2f}' if rp.get('pf') is not None else 'N/A'
            rp_win = f'{rp["win_rate"]:.2%}' if rp.get('win_rate') is not None else 'N/A'
            print(f'  {geo:10s} {wf["avg_sharpe"]:>10.4f} {wf["avg_pf"]:>6.2f} '
                  f'{rp_sharpe:>14s} {rp_pf:>10s} {rp_win:>10s} '
                  f'{rp["n_trades"]:>7d} {valid:>8s}')
    print('\n' + '=' * 120)
    return report


if __name__ == '__main__':
    run_all()
