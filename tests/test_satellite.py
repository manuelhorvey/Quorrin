import numpy as np
import pandas as pd
import pytest

import paper_trading.engine as engine_module
from paper_trading.engine import PaperTradingEngine
from paper_trading.satellite import GateDecision, HighVolSatellite


def test_record_return_tracks_metrics_without_compounding_active_value():
    sat = HighVolSatellite(total_aum=100_000)
    sat.deploy_capital(sat.max_capital)
    sat.position_active = True
    sat.current_value = 5_000.0

    sat.record_return(0.10)

    assert sat.current_value == 5_000.0
    assert sat._daily_returns == [0.10]


def test_run_satellite_marks_active_position_to_live_btc_price(monkeypatch):
    sat = HighVolSatellite(total_aum=100_000)
    sat.deploy_capital(sat.max_capital)
    sat.position_active = True
    sat.position_entry = 100.0
    sat.position_side = "long"
    sat.entry_price = 100.0
    sat.stop_price = 50.0
    sat.target_price = 200.0
    sat.current_value = 5_000.0
    sat._entry_capital = 5_000.0
    sat._last_gate = GateDecision(allowed=True)

    price_data = pd.DataFrame({"close": [100.0, 120.0]})
    monkeypatch.setattr(engine_module, "fetch_btc_price", lambda assets: price_data)
    monkeypatch.setattr(
        engine_module,
        "compute_btc_context",
        lambda data: {
            "vol_zscore": 0.0,
            "returns_63d": np.array([0.0, 0.20]),
            "returns_all": np.array([0.20]),
        },
    )
    monkeypatch.setattr(engine_module, "fetch_macro_context", lambda: (0.0, 0.0))
    monkeypatch.setattr(engine_module, "compute_core_returns", lambda assets: None)

    engine = PaperTradingEngine.__new__(PaperTradingEngine)
    engine.assets = {}
    engine.satellite = sat
    engine._detect_crisis_regime = lambda: False

    results = {}
    engine._run_satellite(results)

    assert sat.current_value == pytest.approx(6_000.0)
    assert sat.peak_value == pytest.approx(6_000.0)
    assert sat._daily_returns == [0.20]
    assert results["satellite"]["current_value"] == 6_000.0
