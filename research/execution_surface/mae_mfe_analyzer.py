"""MAE/MFE Surface Analysis.

For every trade from replay, compute:
  - MAE (Maximum Adverse Excursion) — max price move against position
  - MFE (Maximum Favorable Excursion) — max price move in favor of position

Then analyze by:
  - regime (low_vol, transition, high_vol)
  - confidence bucket (low/medium/high)
  - asset
  - signal age (hold bars)

This directly quantifies whether the "edge half-life is short" hypothesis holds:
  - profitable trades should move fast (high MFE early)
  - losing trades should linger (high MAE without recovery)
"""

import os, sys, json, logging
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from features.registry import FEATURE_REGISTRY

logger = logging.getLogger("quantforge.execution_surface.mae_mfe")
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

SANDBOX_BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                            'data', 'sandbox')


def compute_mae_mfe_for_trade(trade_row: pd.Series, ohlc: pd.DataFrame) -> dict:
    """Compute MAE and MFE for a single trade from OHLC data.

    Args:
        trade_row: single trade record from replay output
        ohlc: DataFrame with ['high', 'low', 'close'] index by datetime

    Returns:
        dict with mae_pct, mfe_pct, mae_idx, mfe_idx, and normalized metrics
    """
    entry_time = trade_row['entry_time']
    exit_time = trade_row['exit_time']
    entry_price = float(trade_row['entry_price'])
    side = trade_row['side']

    # Get OHLC bars during hold period
    bars = ohlc.loc[entry_time:exit_time]
    if len(bars) < 2:
        return {
            'mae_pct': 0.0, 'mfe_pct': 0.0,
            'mae_idx': 0, 'mfe_idx': 0,
        }

    high = bars['high'].values
    low = bars['low'].values

    if side == 'long':
        mfe_pct = (high / entry_price - 1).max() * 100
        mae_pct = (low / entry_price - 1).min() * 100  # negative
        mfe_idx = int(np.argmax(high / entry_price - 1))
        mae_idx = int(np.argmin(low / entry_price - 1))
    else:
        mfe_pct = (entry_price / low - 1).max() * 100
        mae_pct = (entry_price / high - 1).min() * 100  # negative
        mfe_idx = int(np.argmax(entry_price / low - 1))
        mae_idx = int(np.argmin(entry_price / high - 1))

    # Normalize by hold bars as fraction
    hold_bars = len(bars) - 1  # exclude entry bar

    return {
        'mae_pct': round(float(mae_pct), 4),
        'mfe_pct': round(float(mfe_pct), 4),
        'mae_idx': mae_idx,
        'mfe_idx': mfe_idx,
        'mae_fraction': round(float(mae_idx / hold_bars), 4) if hold_bars > 0 else 0.0,
        'mfe_fraction': round(float(mfe_idx / hold_bars), 4) if hold_bars > 0 else 0.0,
        'entry_price': round(float(entry_price), 4),
        'exit_price': round(float(trade_row['exit_price']), 4),
        'return_pct': round(float(trade_row['return_pct']) * 100, 4),
    }


def confidence_bucket(conf: float) -> str:
    if conf >= 66:
        return 'high'
    elif conf >= 33:
        return 'medium'
    return 'low'


def analyze_asset(name: str, predictions: pd.DataFrame) -> dict:
    """Run MAE/MFE analysis on all trades from the retrained replay at medium geometry.

    Args:
        name: asset name
        predictions: OOS predictions DataFrame with OHLC

    Returns:
        dict with per-trade results and aggregated surface analysis
    """
    logger.info('Analyzing MAE/MFE for %s...', name)

    # Run replay at medium geometry
    from research.execution_surface.replay_engine import replay, ReplayConfig
    config = ReplayConfig(sl_mult=0.75, tp_mult=2.25)
    trades = replay(predictions, config)

    if len(trades) < 10:
        logger.warning('  %s: only %d trades, skipping', name, len(trades))
        return None

    # Build OHLC with all required columns for MAE computation
    ohlc = pd.DataFrame({
        'high': predictions['high'],
        'low': predictions['low'],
        'close': predictions['close'],
    })

    # Compute MAE/MFE for each trade
    enriched = []
    for _, tr in trades.iterrows():
        mae_mfe = compute_mae_mfe_for_trade(tr, ohlc)
        tr_dict = tr.to_dict()
        tr_dict.update(mae_mfe)
        tr_dict['confidence_bucket'] = confidence_bucket(tr_dict.get('conf_at_entry', 0))
        enriched.append(tr_dict)

    df = pd.DataFrame(enriched)

    # Surface analysis by dimensions
    analysis = {
        'asset': name,
        'n_trades': len(df),
        'n_winning': int((df['return_pct'] > 0).sum()),
        'n_losing': int((df['return_pct'] <= 0).sum()),
        'overall': {
            'avg_mae': round(float(df['mae_pct'].mean()), 4),
            'avg_mfe': round(float(df['mfe_pct'].mean()), 4),
            'med_mae': round(float(df['mae_pct'].median()), 4),
            'med_mfe': round(float(df['mfe_pct'].median()), 4),
            'mae_mfe_ratio': round(float(df['mae_pct'].abs().mean() / df['mfe_pct'].mean()), 4) if df['mfe_pct'].mean() > 0 else 0,
            'avg_return': round(float(df['return_pct'].mean()), 4),
            'avg_hold_bars': round(float(df['hold_bars'].mean()), 1),
        },
        'by_outcome': {},
        'by_regime': {},
        'by_confidence': {},
        'by_hold_bars': {},
    }

    # By outcome (winning vs losing)
    for outcome, label in [(True, 'winning'), (False, 'losing')]:
        sub = df[df['return_pct'] > 0] if outcome else df[df['return_pct'] <= 0]
        if len(sub) > 0:
            analysis['by_outcome'][label] = {
                'n_trades': len(sub),
                'avg_mae': round(float(sub['mae_pct'].mean()), 4),
                'avg_mfe': round(float(sub['mfe_pct'].mean()), 4),
                'med_mae': round(float(sub['mae_pct'].median()), 4),
                'med_mfe': round(float(sub['mfe_pct'].median()), 4),
                'avg_hold_bars': round(float(sub['hold_bars'].mean()), 1),
                'avg_peak_idx_fraction': round(float(sub['mfe_fraction'].mean()), 4),
            }

    # By regime
    for regime in df['regime'].unique():
        sub = df[df['regime'] == regime]
        if len(sub) < 3:
            continue
        analysis['by_regime'][regime] = {
            'n_trades': len(sub),
            'win_rate': round(float((sub['return_pct'] > 0).mean()), 4),
            'avg_mae': round(float(sub['mae_pct'].mean()), 4),
            'avg_mfe': round(float(sub['mfe_pct'].mean()), 4),
            'mae_mfe_ratio': round(float(sub['mae_pct'].abs().mean() / sub['mfe_pct'].mean()), 4) if sub['mfe_pct'].mean() > 0 else 0,
            'avg_return': round(float(sub['return_pct'].mean()), 4),
        }

    # By confidence bucket
    for cb in ['low', 'medium', 'high']:
        sub = df[df['confidence_bucket'] == cb]
        if len(sub) < 3:
            continue
        analysis['by_confidence'][cb] = {
            'n_trades': len(sub),
            'win_rate': round(float((sub['return_pct'] > 0).mean()), 4),
            'avg_mae': round(float(sub['mae_pct'].mean()), 4),
            'avg_mfe': round(float(sub['mfe_pct'].mean()), 4),
            'mae_mfe_ratio': round(float(sub['mae_pct'].abs().mean() / sub['mfe_pct'].mean()), 4) if sub['mfe_pct'].mean() > 0 else 0,
            'avg_return': round(float(sub['return_pct'].mean()), 4),
        }

    # By hold bars buckets
    hold_buckets = [(0, 3, '1-3'), (4, 7, '4-7'), (8, 15, '8-15'), (16, 999, '16+')]
    for lo, hi, label in hold_buckets:
        sub = df[(df['hold_bars'] >= lo) & (df['hold_bars'] <= hi)]
        if len(sub) < 3:
            continue
        analysis['by_hold_bars'][label] = {
            'n_trades': len(sub),
            'win_rate': round(float((sub['return_pct'] > 0).mean()), 4),
            'avg_mae': round(float(sub['mae_pct'].mean()), 4),
            'avg_mfe': round(float(sub['mfe_pct'].mean()), 4),
            'mae_mfe_ratio': round(float(sub['mae_pct'].abs().mean() / sub['mfe_pct'].mean()), 4) if sub['mfe_pct'].mean() > 0 else 0,
            'avg_return': round(float(sub['return_pct'].mean()), 4),
        }

    return analysis


def run_all():
    """Run MAE/MFE analysis on all 6 Phase C assets (medium geometry)."""
    assets = ['NZDJPY', 'EURAUD', 'USDJPY', 'CADJPY', 'USDCAD', 'AUDJPY']
    report = {}

    for name in assets:
        oos_path = os.path.join(SANDBOX_BASE, name, 'retrain', 'oos_medium.parquet')
        if not os.path.exists(oos_path):
            logger.warning('%s: no retrained predictions at %s', name, oos_path)
            continue
        predictions = pd.read_parquet(oos_path)
        result = analyze_asset(name, predictions)
        if result:
            report[name] = result

    # Save
    out_path = os.path.join(SANDBOX_BASE, 'mae_mfe_analysis.json')
    with open(out_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    logger.info('MAE/MFE analysis saved to %s', out_path)

    # Print summary
    print('\n' + '=' * 120)
    print('MAE/MFE SURFACE ANALYSIS — MEDIUM GEOMETRY (sl=0.75, tp=2.25)')
    print('=' * 120)

    print(f'\n{"Asset":12s} {"N":>5s} {"Win%":>6s} {"Avg MAE":>8s} {"Avg MFE":>8s} '
          f'{"M/M":>6s} {"Avg Ret":>8s} {"Hold":>5s} '
          f'{"W MAE":>7s} {"W MFE":>7s} {"L MAE":>7s} {"L MFE":>7s}')
    print('-' * 120)

    for name in sorted(report.keys()):
        r = report[name]
        o = r['overall']
        wo = r['by_outcome'].get('winning', {})
        lo = r['by_outcome'].get('losing', {})
        print(f'{name:12s} {r["n_trades"]:>5d} {r["n_winning"]/r["n_trades"]*100:>5.1f}% '
              f'{o["avg_mae"]:>8.2f} {o["avg_mfe"]:>8.2f} '
              f'{o["mae_mfe_ratio"]:>6.3f} {o["avg_return"]:>8.2f} '
              f'{o["avg_hold_bars"]:>4.0f}  '
              f'{wo.get("avg_mae", 0):>7.2f} {wo.get("avg_mfe", 0):>7.2f} '
              f'{lo.get("avg_mae", 0):>7.2f} {lo.get("avg_mfe", 0):>7.2f}')
    print()

    # By confidence summary
    print('--- BY CONFIDENCE BUCKET ---')
    for name in sorted(report.keys()):
        r = report[name]
        print(f'\n{name}:')
        for cb in ['low', 'medium', 'high']:
            if cb not in r['by_confidence']:
                continue
            c = r['by_confidence'][cb]
            print(f'  {cb:8s}: n={c["n_trades"]:4d}  WR={c["win_rate"]:.1%}  '
                  f'MAE={c["avg_mae"]:6.2f}%  MFE={c["avg_mfe"]:6.2f}%  '
                  f'Ret={c["avg_return"]:6.2f}%')
    print()

    # By hold bars summary
    print('--- BY HOLD BARS ---')
    for name in sorted(report.keys()):
        r = report[name]
        print(f'\n{name}:')
        for label in ['1-3', '4-7', '8-15', '16+']:
            if label not in r['by_hold_bars']:
                continue
            h = r['by_hold_bars'][label]
            print(f'  {label:6s}: n={h["n_trades"]:4d}  WR={h["win_rate"]:.1%}  '
                  f'MAE={h["avg_mae"]:6.2f}%  MFE={h["avg_mfe"]:6.2f}%  '
                  f'Ret={h["avg_return"]:6.2f}%')
    print()

    # Edge half-life summary
    print('--- EDGE HALF-LIFE ANALYSIS ---')
    print('(MFE peak timing as fraction of hold period — lower = edge materializes faster)')
    for name in sorted(report.keys()):
        r = report[name]
        wo = r['by_outcome'].get('winning', {})
        lo = r['by_outcome'].get('losing', {})
        peak_frac = wo.get('avg_peak_idx_fraction', 0)
        print(f'  {name:12s}: winning trades peak at {peak_frac:.0%} of hold duration')
    print()

    print('=' * 120)
    print('INTERPRETATION')
    print('=' * 120)
    print()
    print('If MAE/MFE ratio >> 1.0: adverse excursion dominates — losing trades drift')
    print('If MAE/MFE ratio ~ 1.0: symmetric — no edge from stop placement')
    print('If MAE/MFE ratio < 1.0: favorable excursion dominates — stop is noise')
    print()
    print('Key indicator: winning trades should have low MAE (they move right)')
    print('and high MFE (they move far). Losing trades should have high MAE')
    print('(they drift) and low MFE (no recovery).')
    print()
    print('If MFE peaks early in winning trades: edge has short half-life')
    print('If MFE peaks late: edge persistence is longer')
    print()

    return report


if __name__ == '__main__':
    run_all()
