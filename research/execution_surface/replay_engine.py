"""Phase A.2 — Replay frozen signals with OHLC-driven lifecycle simulation.

Given frozen OOS predictions (with OHLC bars) and candidate (sl_mult, tp_mult),
simulate trade lifecycle using High/Low for barrier checks.

Trade policy (explicit):
- Single active position per asset
- Hard close before reversal (no flipping without closing first)
- No pyramiding
- OHLC bars drive lifecycle simulation (not prediction frequency)
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import Optional


@dataclass
class ReplayConfig:
    sl_mult: float = 1.0
    tp_mult: float = 2.5


@dataclass
class PositionState:
    side: str
    entry_price: float
    entry_time: pd.Timestamp
    sl_price: float
    tp_price: float
    vol_at_entry: float
    conf_at_entry: float
    entry_idx: int  # row index in the predictions DataFrame


def check_barrier_hit(row: pd.Series, pos: PositionState) -> Optional[tuple[str, float]]:
    """Check if High/Low breached SL/TP for a given bar.

    Returns ('sl', exit_price) or ('tp', exit_price) or None.
    Uses high for TP triggers (long) and SL triggers (short).
    Uses low for SL triggers (long) and TP triggers (short).
    """
    high = float(row['high'])
    low = float(row['low'])

    if pos.side == 'long':
        if low <= pos.sl_price:
            return ('sl', pos.sl_price)
        if high >= pos.tp_price:
            return ('tp', pos.tp_price)
    else:
        if high >= pos.sl_price:
            return ('sl', pos.sl_price)
        if low <= pos.tp_price:
            return ('tp', pos.tp_price)
    return None


def compute_trade_return(side: str, entry: float, exit_price: float) -> float:
    if side == 'long':
        return exit_price / entry - 1.0
    else:
        return entry / exit_price - 1.0


def replay(predictions: pd.DataFrame, config: ReplayConfig) -> pd.DataFrame:
    """Replay frozen predictions through lifecycle simulation.

    Args:
        predictions: DataFrame with columns [open, high, low, close, signal,
                     prob_long, prob_short, prob_neutral, confidence,
                     volatility, atr, year, regime]
        config: ReplayConfig with sl_mult and tp_mult

    Returns:
        DataFrame of trade records with columns:
        entry_time, exit_time, side, entry_price, exit_price,
        sl_price, tp_price, reason, hold_bars, return_pct,
        vol_at_entry, conf_at_entry, year, regime
    """
    trades = []
    pos: Optional[PositionState] = None

    for idx, (timestamp, row) in enumerate(predictions.iterrows()):
        signal = int(row['signal'])
        close = float(row['close'])

        # 1. Check existing position for SL/TP hit (using H/L)
        if pos is not None:
            hit = check_barrier_hit(row, pos)
            if hit is not None:
                reason, exit_price = hit
                ret = compute_trade_return(pos.side, pos.entry_price, exit_price)
                trades.append({
                    'entry_time': pos.entry_time,
                    'exit_time': timestamp,
                    'side': pos.side,
                    'entry_price': pos.entry_price,
                    'exit_price': exit_price,
                    'sl_price': pos.sl_price,
                    'tp_price': pos.tp_price,
                    'reason': reason,
                    'hold_bars': idx - pos.entry_idx,
                    'return_pct': ret,
                    'vol_at_entry': pos.vol_at_entry,
                    'conf_at_entry': pos.conf_at_entry,
                    'year': int(row['year']),
                    'regime': str(row['regime']),
                })
                pos = None

        # 2. Determine desired side from signal
        if signal == 2:
            desired = 'long'
        elif signal == 0:
            desired = 'short'
        else:
            continue  # FLAT — no action

        # 3. Position management
        if pos is None:
            vol = float(row.get('volatility', 0.01))
            if pd.isna(vol) or vol <= 0:
                vol = 0.01
            sl = close * (1 - vol * config.sl_mult) if desired == 'long' else close * (1 + vol * config.sl_mult)
            tp = close * (1 + vol * config.tp_mult) if desired == 'long' else close * (1 - vol * config.tp_mult)
            pos = PositionState(
                side=desired, entry_price=close, entry_time=timestamp,
                sl_price=sl, tp_price=tp,
                vol_at_entry=vol, conf_at_entry=float(row['confidence']),
                entry_idx=idx,
            )
        elif pos.side != desired:
            # Hard close before reversal
            ret = compute_trade_return(pos.side, pos.entry_price, close)
            trades.append({
                'entry_time': pos.entry_time,
                'exit_time': timestamp,
                'side': pos.side,
                'entry_price': pos.entry_price,
                'exit_price': close,
                'sl_price': pos.sl_price,
                'tp_price': pos.tp_price,
                'reason': 'flip',
                'hold_bars': idx - pos.entry_idx,
                'return_pct': ret,
                'vol_at_entry': pos.vol_at_entry,
                'conf_at_entry': pos.conf_at_entry,
                'year': int(row['year']),
                'regime': str(row['regime']),
            })
            vol = float(row.get('volatility', 0.01))
            if pd.isna(vol) or vol <= 0:
                vol = 0.01
            sl = close * (1 - vol * config.sl_mult) if desired == 'long' else close * (1 + vol * config.sl_mult)
            tp = close * (1 + vol * config.tp_mult) if desired == 'long' else close * (1 - vol * config.tp_mult)
            pos = PositionState(
                side=desired, entry_price=close, entry_time=timestamp,
                sl_price=sl, tp_price=tp,
                vol_at_entry=vol, conf_at_entry=float(row['confidence']),
                entry_idx=idx,
            )
        # else: same side as current position — HOLD (no action)

    # Close any open position at end of data
    if pos is not None:
        last_row = predictions.iloc[-1]
        ret = compute_trade_return(pos.side, pos.entry_price, float(last_row['close']))
        trades.append({
            'entry_time': pos.entry_time,
            'exit_time': predictions.index[-1],
            'side': pos.side,
            'entry_price': pos.entry_price,
            'exit_price': float(last_row['close']),
            'sl_price': pos.sl_price,
            'tp_price': pos.tp_price,
            'reason': 'expiry',
            'hold_bars': len(predictions) - 1 - pos.entry_idx,
            'return_pct': ret,
            'vol_at_entry': pos.vol_at_entry,
            'conf_at_entry': pos.conf_at_entry,
            'year': int(last_row['year']),
            'regime': str(last_row['regime']),
        })

    if not trades:
        return pd.DataFrame(columns=[
            'entry_time', 'exit_time', 'side', 'entry_price', 'exit_price',
            'sl_price', 'tp_price', 'reason', 'hold_bars', 'return_pct',
            'vol_at_entry', 'conf_at_entry', 'year', 'regime',
        ])
    return pd.DataFrame(trades)
