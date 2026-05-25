# QuantForge Documentation

Project documentation and reference materials for the QuantForge quantitative trading framework.

## Quick Start

| Guide | Description |
|-------|-------------|
| [`PAPER_TRADING_RUNBOOK.md`](PAPER_TRADING_RUNBOOK.md) | Daily/weekly ops, halt responses, troubleshooting |
| [`SYSTEM_OVERVIEW.md`](SYSTEM_OVERVIEW.md) | Architecture, components, data flow |
| [`GOVERNANCE_LAYER.md`](GOVERNANCE_LAYER.md) | 7-layer governance: validity, narrative, liquidity, PSI, halt chain |
| [`FEATURES.md`](FEATURES.md) | FeatureContract system, driver atlas, cross-asset isolation |
| [`ARCHITECTURE_FOUNDATIONS.md`](ARCHITECTURE_FOUNDATIONS.md) | Model architecture, labeling, regime classifier |
| [`HARDENING_ROADMAP.md`](HARDENING_ROADMAP.md) | Execution physics, extended history, lead-lag, adaptive macro |
| [`SURVIVAL_SIMULATION.md`](SURVIVAL_SIMULATION.md) | Adversarial survival testing, deleveraging feedback |

## ADRs

Architecture Decision Records in [`adr/`](adr/) — see [`adr/ADR-000-index.md`](adr/ADR-000-index.md) for the full list.

## Conventions

- ADRs follow the standard [Michael Nygard template](https://github.com/joelparkerhenderson/architecture-decision-record)
- All docs are written in Markdown
- `LIVE_CONTRACT.md` at the project root is the immutable system contract
