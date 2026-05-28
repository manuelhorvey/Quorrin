# QuantForge Documentation

Project documentation for the QuantForge cross-sectional factor ranking and paper trading system.

## Guides

| Guide | Description |
|-------|-------------|
| [`PAPER_TRADING_RUNBOOK.md`](PAPER_TRADING_RUNBOOK.md) | Daily/weekly ops, halt responses, troubleshooting |
| [`SYSTEM_OVERVIEW.md`](SYSTEM_OVERVIEW.md) | Architecture, components, data flow |
| [`GOVERNANCE_LAYER.md`](GOVERNANCE_LAYER.md) | 7-layer governance: validity, narrative, liquidity, PSI, halt chain |
| [`FEATURES.md`](FEATURES.md) | Alpha features, data ingestion, archetype features, regime features, labeling |
| [`LIVE_CONTRACT.md`](../LIVE_CONTRACT.md) | Immutable production system contract (model, feature, data, label specs) |

### Core Pipeline

| Stage | Module | Purpose |
|---|---|---|
| Screening | `scripts/walk_forward_backtest.py`, `score_tickers.py` | Multi-ticker walk-forward backtest, promotion scoring |
| Training | `paper_trading/inference/training.py` | Binary XGBoost training with alpha features |
| Inference | `paper_trading/inference/pipeline.py` | Live pipeline: OHLCV → alpha features → XGBoost → decision |
| Portfolio | `paper_trading/portfolio_builder.py` | 13-asset equal-risk portfolio from YAML config |
| Engine | `paper_trading/engine.py` | Paper trading orchestrator (300s cycle) |

### Historical Research Archives

Prior system documentation is archived at `archive/research_system_v1/`.

| Document | Description |
|---|---|
| `ARCHITECTURE_FOUNDATIONS.md` | Research theorems about model architecture, labeling, regime routing |
| `HARDENING_ROADMAP.md` | Execution physics, Phases 0–6 implementation journey |
| `SURVIVAL_SIMULATION.md` | Adversarial survival testing framework |
| `RESEARCH_DECISIONS.md` | 6-month investigation arc and experimental results |
| `BASELINE_SNAPSHOT.md` | System snapshot from 2026-05-19 (pre-refactoring) |

## ADRs

Architecture Decision Records in [`adr/`](adr/) — see [`adr/ADR-000-index.md`](adr/ADR-000-index.md) for the full list.

## Conventions

- ADRs follow the standard [Michael Nygard template](https://github.com/joelparkerhenderson/architecture-decision-record)
- All docs are written in Markdown
- `LIVE_CONTRACT.md` at the project root is the immutable system contract
