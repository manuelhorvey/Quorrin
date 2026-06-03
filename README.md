# QuantForge

![Python](https://img.shields.io/badge/python-3.12%2B-blue)
![Status](https://img.shields.io/badge/status-paper%20trading-green)
![WalkForward](https://img.shields.io/badge/walk--forward-36%20assets%20screened-success)
![Portfolio](https://img.shields.io/badge/portfolio-20%20live%20assets-blue)
[![codecov](https://codecov.io/gh/manuelhorvey/QuantForge/graph/badge.svg)](https://codecov.io/gh/manuelhorvey/QuantForge)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

Cross-sectional multi-asset research and paper trading engine with walk-forward asset selection, per-asset binary XGBoost models, seven-layer governance, MetaTrader 5 bridge execution, and a React dashboard.

---

# Design Philosophy

> alpha is fragile; infrastructure robustness matters more.

The system prioritizes:

* walk-forward validation,
* deterministic execution,
* train/serve symmetry,
* replayability,
* governance layering,
* per-asset isolation,
* and operational observability

over maximizing in-sample returns.

Every promoted asset must survive expanding-window validation before entering the live paper portfolio. Runtime execution is treated as a systems-engineering problem rather than purely a signal-generation problem.

---

# System Lifecycle

```
Research Universe (36+ assets)
        ↓
Walk-Forward Screening (5-fold expanding window)
        ↓
Asset Selection (GREEN / YELLOW / RED)
        ↓
Per-Asset Model Training (binary XGBoost)
        ↓
Live Inference (every 300s)
        ↓
Governance Filters (7 layers)
        ↓
Execution & Positioning (MT5 or PaperBroker)
        ↓
State Persistence + Replay
```

---

# Core Properties

* Walk-forward validated before deployment
* Per-asset model independence
* Deterministic execution contracts
* Replay-oriented state persistence (SQLite WAL)
* Governance-first exposure control
* Parallel isolated asset actors
* Train/serve feature symmetry
* Immutable execution attribution chain
* Single centralized entry authority
* Failure-domain isolation across assets
* MT5 bridge for live demo execution via Wine

---

# System Overview

QuantForge operates as a factor-style allocation and execution platform.

A universe of 36+ FX, commodity, and equity-index tickers is screened using expanding-window walk-forward backtests. Assets are scored on directional consistency, information coefficient, hit rate, and regime robustness before being promoted into the live paper portfolio.

Each promoted asset runs an independent binary XGBoost model conditioned on:

* volatility-adjusted carry,
* multi-horizon momentum (21/63/126/252d),
* z-score reversion,
* volatility regime behavior,
* and cross-asset macro momentum (DXY, VIX, SPX, WTI).

Execution is governed by a seven-layer risk and validity framework with archetype-aware trade management. Orders can be routed through either a PaperBroker (simulated fills with slippage/impact) or the MT5 bridge to a live Exness demo account.

```
┌────────────────┐
│ Research       │
│ Universe       │
│ 36+ Assets     │
└──────┬─────────┘
       │
       ▼
┌────────────────┐
│ Walk-Forward   │
│ Validation     │
│ 5-Fold         │
└──────┬─────────┘
       │
       ▼
┌────────────────┐
│ Asset          │
│ Selection      │
│ GREEN/YELLOW   │
│ RED            │
└──────┬─────────┘
       │
       ▼
┌────────────────┐
│ Live Inference │
│ Per-Asset      │
│ Binary XGBoost │
└──────┬─────────┘
       │
       ▼
┌────────────────┐          ┌─────────────────┐
│ Governance     │          │  MT5 Bridge     │
│ 7 Layers       │─────▶    │  (Wine Python)  │
└──────┬─────────┘          └────────┬─────────┘
       │                             │
       ▼                             ▼
┌────────────────┐          ┌─────────────────┐
│ Execution      │          │  MetaTrader 5   │
│ + Positioning  │          │  Exness Demo    │
└──────┬─────────┘          └─────────────────┘
       │
       ▼
┌────────────────┐
│ Portfolio      │
│ Risk-Parity    │
└────────────────┘
```

---

# Current Portfolio

20 live paper-traded assets promoted from the research universe.

| Asset      | Ticker       | sl_mult | tp_mult | Allocation |
| ---------- | ------------ | ------- | ------- | ---------- |
| AUDCHF     | AUDCHF=X     | 0.50    | 1.50    | 6.5%       |
| AUDNZD     | AUDNZD=X     | 0.50    | 1.50    | 6.5%       |
| CADCHF     | CADCHF=X     | 0.50    | 1.50    | 6.5%       |
| CADJPY     | CADJPY=X     | 0.50    | 1.50    | 6.5%       |
| CHFJPY     | CHFJPY=X     | 0.50    | 1.50    | 6.5%       |
| CL         | CL=F         | 0.50    | 1.50    | 7.0%       |
| ES         | ES=F         | 0.50    | 2.50    | 7.7%       |
| EURCAD     | EURCAD=X     | 0.50    | 1.50    | 6.5%       |
| GC         | GC=F         | 0.50    | 1.50    | 6.5%       |
| GBPCAD     | GBPCAD=X     | 0.50    | 1.50    | 6.5%       |
| GBPCHF     | GBPCHF=X     | 0.50    | 1.50    | 6.5%       |
| GBPNZD     | GBPNZD=X     | 0.50    | 1.50    | 6.5%       |
| NZDCAD     | NZDCAD=X     | 0.50    | 1.50    | 6.5%       |
| NQ         | NQ=F         | 0.50    | 2.50    | 7.8%       |
| ^DJI       | ^DJI         | 0.50    | 1.50    | 7.0%       |
| USDCHF     | USDCHF=X     | 0.50    | 1.50    | 6.5%       |
| USDCAD     | USDCAD=X     | 0.50    | 1.50    | 6.5%       |
| USDJPY     | USDJPY=X     | 0.50    | 1.50    | 6.5%       |

Weekly risk-parity rebalancing redistributes capital proportionally.

---

# MT5 Bridge Integration

QuantForge can route data fetching and order execution through a live MetaTrader 5 terminal (Exness demo) running under Wine.

## Architecture

```
Linux Host                          Wine Prefix
┌─────────────┐                ┌──────────────────────┐
│ Engine      │── TCP :9876 ──▶│ mt5_bridge.py        │
│ mt5_client  │◀───────────────│ (Python 3.12 via      │
│ (Python)    │                │  Wine → MetaTrader5)  │
└─────────────┘                ├──────────────────────┤
                               │ MetaTrader 5 terminal │
                               │ terminal64.exe        │
                               │ (Exness demo account) │
                               └──────────────────────┘
```

## Capabilities

* Real-time price streaming (bid/ask)
* Historical OHLCV and tick data
* Account info and position management
* Market, limit, and stop order placement
* Stop-loss and take-profit modification
* Position closing

## Symbol Mapping

QuantForge tickers (e.g. `GC=F`) are mapped to MT5 symbols (e.g. `XAUUSD`) via `configs/mt5_symbol_map.yaml`.

## Capital Sync

When MT5 is enabled, each engine cycle syncs internal capital bases to the live Exness account equity. Position sizing uses the real account balance.

---

# Why Binary Classification?

QuantForge intentionally reduces the prediction problem to directional participation rather than return magnitude estimation.

The system optimizes for:

* directional consistency,
* ranking stability,
* calibration simplicity,
* execution compatibility,
* and governance composability

rather than precise return forecasting.

HOLD states are intentionally removed during training to avoid ambiguous class boundaries.

---

# Research & Validation Pipeline

## Walk-Forward Validation

All assets are evaluated using expanding-window walk-forward testing:

* 3-year training window
* 1-year forward test
* 5 folds
* per-asset PT/SL calibration
* IC + hit-rate scoring
* consistency weighting
* bidirectionality validation

Only promoted assets enter the live portfolio.

---

# Feature Engineering

## Alpha Features

Built in `features/alpha_features.py`.

Primary feature families:

* Volatility-adjusted carry
* Multi-horizon momentum (21 / 63 / 126 / 252d)
* Z-score mean reversion
* Volatility regime ratio
* Day-of-week effects
* Cross-asset macro momentum (DXY, VIX, SPX, WTI)

## Market Structure Regimes

Inference-only archetype features derived from OHLCV:

* EMA spread
* ADX(14)
* RSI(14)
* Bollinger z-score

Used for execution conditioning, trade management, and regime-aware positioning.

---

# Model Architecture

Each asset runs an independent binary XGBoost model.

```text
Objective: binary:logistic
Trees:     300
Depth:     2
LR:        0.02
```

No shared multi-asset model exists.

---

# Inference Pipeline

```text
1. Fetch live OHLCV (MT5 or yfinance)
2. Refresh latest price
3. Fetch macro data
4. Build alpha features
5. Validate truncation behavior
6. Validate model hot-swap integrity
7. Run XGBoost inference
8. Classify market structure
9. Apply execution strategy
10. Enqueue async diagnostics
11. Route through 7 governance layers
12. Execute or defer
```

---

# Execution Architecture

```
TradeDecision
      ↓
EntryOptimizer
      ↓
ExecutionPolicyLayer
      ↓
_can_enter()  (single entry authority)
      ↓
PositionManager
      ↓
Attribution Engine
```

Orders route through either:
- **PaperBroker** — simulated fills with slippage and market impact
- **MT5Broker** — live Exness demo via Wine bridge

## Key Invariants

### Single Entry Authority
All entry paths route through `_can_enter()`. No component may bypass centralized admission control.

### Immutable Execution Contract
```
PolicyDecision → FillResult → AttributionRecord
```
Execution artifacts are append-only and replay-safe.

### Train/Serve Symmetry
The same alpha feature builder is used in both training and live inference.

### Replay-Oriented Persistence
Persistent state is stored in SQLite WAL mode with append-oriented semantics.

---

# Governance Framework

QuantForge uses independently configurable governance layers with worst-wins aggregation.

| Layer                  | Frequency   | Scope     | Effect                    |
| ---------------------- | ----------- | --------- | ------------------------- |
| Exposure state machine | Per tick    | Per asset | Exposure scaling          |
| Feature stability      | Per retrain | Per asset | Validity penalty          |
| Meta-labeling          | Per signal  | Per asset | Position scalar           |
| Macro regime overlay   | Weekly      | Global    | Exposure + SL adjustments |
| Liquidity regime       | Per signal  | Per asset | Exposure + halt logic     |
| PSI drift              | Per cycle   | Per asset | Penalty + halt            |
| Portfolio drawdown     | Global      | Portfolio | Global throttling         |

---

# Failure Isolation

Each `AssetEngine` executes independently via parallel orchestration (`EngineOrchestrator` with `ThreadPoolExecutor`). Failures in data ingestion, diagnostics, governance, execution, or model inference cannot halt the global engine.

---

# Dashboard

A React SPA (TypeScript, Vite, Tailwind CSS) served on port 5000.

## Features

* 6-layer execution dashboard (FilterBar → ExecutionQualityStrip → Attribution Breakdown → MAE/MFE Scatter → Execution Friction → Trade Table)
* Governance overlays (narrative status, liquidity badges, PSI drift panel, connection status)
* Risk-parity rebalancing visualization
* Historical trade log with attribution decomposition
* Zod-validated API responses

### API Endpoints

| Endpoint            | Format | Purpose                     |
| ------------------- | ------ | --------------------------- |
| `state.json`        | JSON   | Engine snapshot             |
| `trades.json`       | JSON   | Trade history               |
| `attribution.json`  | JSON   | Execution decomposition     |
| `narrative.json`    | JSON   | Macro narrative status      |
| `liquidity.json`    | JSON   | Liquidity regime per asset  |
| `psi.json`          | JSON   | PSI drift monitoring        |
| `governance.json`   | JSON   | Governance layer state      |
| `risk_parity.json`  | JSON   | Risk-parity weights         |
| `execution.json`    | JSON   | Execution quality metrics   |
| `shadow.json`       | JSON   | Shadow trade comparison     |
| `analytics.json`    | JSON   | Portfolio analytics         |

---

# Runtime Optimizations

* Vectorized triple-barrier labeling
* Broadcast-based inference operations
* Async diagnostics off hot path (daemon consumer thread)
* SQLite WAL persistence
* TTL macro cache
* Parallel asset orchestration (ThreadPoolExecutor, max_workers=8)
* Inference truncation validation
* Object-identity model hot-swap verification

---

# Getting Started

## Prerequisites

- Python 3.12+
- Wine 11+ (for MT5 bridge — skip if using yfinance only)
- `xvfb-run` (for headless MT5 terminal)
- Node.js + Yarn (for dashboard build)

## Install

```bash
git clone https://github.com/manuelhorvey/QuantForge.git
cd QuantForge

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

## MT5 Setup (optional)

Only needed if you want to use the MetaTrader 5 bridge for live demo execution:

```bash
# Install MT5 terminal in Wine prefix
./scripts/setup_mt5_wine.sh

# Configure credentials in .env
cp .env.example .env
# Edit .env: set MT5_ACCOUNT, MT5_PASSWORD, MT5_SERVER
```

## Run

```bash
# One-command launcher: builds dashboard, starts MT5 terminal, bridge, and engine
./monitor_all

# Or for yfinance-only mode (no MT5):
# Set data_source: yfinance in configs/paper_trading.yaml
python -m paper_trading.ops.monitor
```

Dashboard: [http://localhost:5000](http://localhost:5000)

---

# Environment Variables

| Variable                      | Required | Purpose                                |
| ----------------------------- | -------- | -------------------------------------- |
| `PYTHONPATH`                  | Yes      | Set to `.`                             |
| `QUANTFORGE_REFRESH_INTERVAL` | No       | Engine loop interval (default 300s)     |
| `MT5_ACCOUNT`                 | No*      | Exness MT5 account number              |
| `MT5_PASSWORD`                | No*      | Exness MT5 account password            |
| `MT5_SERVER`                  | No*      | Exness MT5 server (e.g. Exness-MT5Trial2) |
| `OPENCODE_ZEN_API_KEY`        | No       | Weekly narrative extraction            |
| `WINE_PREFIX`                 | No       | Wine prefix path (default ~/.wine_mt5) |
| `MT5_BRIDGE_PORT`             | No       | Bridge TCP port (default 9876)          |

\* Required when `mt5.enabled: true` in config.

---

# Key Scripts

| Script                                         | Purpose                         |
| ---------------------------------------------- | ------------------------------- |
| `./monitor_all`                                | One-command launch (terminal + bridge + engine + dashboard) |
| `~/.local/bin/mt5-terminal`                    | Launch MT5 terminal via Wine    |
| `~/.local/bin/mt5-bridge`                      | Launch MT5 bridge server        |
| `scripts/walk_forward_backtest.py`             | Multi-ticker validation         |
| `scripts/score_tickers.py`                     | Asset scoring                   |
| `scripts/generate_promotion_report.py`         | Portfolio report generation     |
| `scripts/train_all_assets.py`                  | Full retraining                 |
| `scripts/setup_mt5_wine.sh`                    | MT5 Wine environment setup      |
| `benchmarks/microbenchmark.py`                 | Runtime benchmarking            |

---

# Repository Structure

```text
configs/
    paper_trading.yaml        # Primary engine config
    mt5_symbol_map.yaml       # MT5 symbol mapping
features/
    alpha_features.py
    archetypes.py
    labels.py
paper_trading/
    engine.py                 # Main engine + capital sync
    asset_engine.py           # Per-asset lifecycle
    orchestrator/             # Parallel AssetActor execution
    inference/                # Live inference pipeline
    execution/
        paper_broker.py       # Simulated fills
        mt5_broker.py         # MT5 live execution
        bridge.py             # Broker abstraction
    ops/
        monitor.py            # Main loop + dashboard server
        data_fetcher.py       # Data with MT5 fallback
        mt5_bridge.py         # Wine-side TCP bridge server
        mt5_client.py         # Host-side bridge client
    governance/               # 7-layer governance
    position/                 # Position management
    services/                 # Engine services (narrative, rebalance, state)
    dashboard/                # React SPA (Vite + TypeScript)
scripts/                      # CLI tools
docs/                         # Documentation + ADRs
shared/                       # Strategy registry, sizing, execution config
monitoring/                   # PSI drift, validity, importance tracking
benchmarks/                   # Performance benchmarks
tests/                        # Test suite
```

---

# Known Constraints

* Paper trading only (no live capital)
* Yahoo Finance primary data source (with MT5 as optional supplement)
* MT5 bridge requires Wine on Linux
* Some FX crosses may produce incomplete first-cycle bars
* Macro data sourced entirely from Yahoo Finance
* Dashboard requires `yarn build` after asset list changes
* MT5 bridge is single-threaded — concurrent requests are serialized via RLock

---

# Roadmap

* Deterministic full-day replay reconstruction
* Event-sequence validation tooling
* Extended execution quality analytics
* Multi-engine distributed orchestration
* Portfolio-level regime optimization
* Shadow execution comparison tooling
* Async MT5 bridge for concurrent symbol queries

---

# License

MIT License.

Research and paper-trading system only.

Not financial advice.
