#!/usr/bin/env bash
# Dependency guard for live/ (paper_trading/) — CI-only, non-runtime.
# Fails if live module imports any disallowed research/orphaned package.
set -euo pipefail

LIVE_DIR="paper_trading"
DISALLOWED=(
    "execution\\."
    "portfolio\\."
    "risk\\."
    "signals\\."
    "models\\."
    "diagnostics\\."
    "equity\\."
    "backtests\\."
    "archive\\."
    "configs\\.driver_atlas"
)

HAD_ERROR=0
for pattern in "${DISALLOWED[@]}"; do
    results=$(grep -rn "^from ${pattern}\|^import ${pattern}" "$LIVE_DIR" 2>/dev/null || true)
    if [ -n "$results" ]; then
        echo "FORBIDDEN IMPORT: ${pattern}"
        echo "$results"
        HAD_ERROR=1
    fi
done

if [ $HAD_ERROR -ne 0 ]; then
    echo ""
    echo "ERROR: paper_trading/ (live system) must not import research/orphaned modules."
    echo "Blocked patterns: ${DISALLOWED[*]}"
    exit 1
fi

echo "OK: paper_trading/ has no disallowed imports."
exit 0
