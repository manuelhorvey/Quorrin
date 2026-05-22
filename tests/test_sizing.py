import pandas as pd
import numpy as np
import pytest
from shared.sizing import VolTargetSizing

def test_vol_target_sizing_basic():
    close = pd.Series([100 + i for i in range(100)])
    config = {"vol_scalar": True}
    strategy = VolTargetSizing(window=30, target_vol=0.30)
    
    size = strategy.compute(close, config)
    assert 0 < size <= 1.0

def test_vol_target_sizing_no_scalar():
    close = pd.Series([100 + i for i in range(100)])
    config = {"vol_scalar": False}
    strategy = VolTargetSizing(window=30, target_vol=0.30)
    
    size = strategy.compute(close, config)
    assert size == 1.0

def test_regime_aware_sizing_range():
    close = pd.Series([100 for _ in range(100)]) # zero volatility
    config = {"vol_scalar": True}
    # Base strategy with target_vol=0.1
    strategy = VolTargetSizing(window=30, target_vol=0.1, regime_aware=True)
    
    # Range regime should multiply target_vol by 1.2
    # rets will be 0, rv will be 0. Scalar will be target / 1e-9 capped at 1.0.
    # To see the difference, let's use a non-zero volatility.
    
    rets = np.random.normal(0, 0.01, 100)
    close = pd.Series(100 * np.exp(np.cumsum(rets)))
    
    size_neutral = strategy.compute(close, config, regime="neutral")
    size_range = strategy.compute(close, config, regime="range")
    
    # size_range should be 1.2x size_neutral (unless capped at 1.0)
    if size_neutral < 0.8:
        assert pytest.approx(size_range) == size_neutral * 1.2
    else:
        assert size_range >= size_neutral

def test_regime_aware_sizing_volatile():
    rets = np.random.normal(0, 0.02, 100)
    close = pd.Series(100 * np.exp(np.cumsum(rets)))
    config = {"vol_scalar": True}
    strategy = VolTargetSizing(window=30, target_vol=0.1, regime_aware=True)
    
    size_neutral = strategy.compute(close, config, regime="neutral")
    size_volatile = strategy.compute(close, config, regime="volatile")
    
    # size_volatile should be 0.5x size_neutral
    assert pytest.approx(size_volatile) == size_neutral * 0.5

def test_regime_aware_disabled():
    rets = np.random.normal(0, 0.01, 100)
    close = pd.Series(100 * np.exp(np.cumsum(rets)))
    config = {"vol_scalar": True}
    strategy = VolTargetSizing(window=30, target_vol=0.1, regime_aware=False)
    
    size_neutral = strategy.compute(close, config, regime="neutral")
    size_range = strategy.compute(close, config, regime="range")
    
    assert size_neutral == size_range
