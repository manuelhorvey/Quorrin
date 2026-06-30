#!/usr/bin/env bash
# Fail scan if any TODO / FIXME / XXX / HACK / BUG markers are present in
# production code (not tests).  Production code must always be on track.
set -uo pipefail

PATTERNS='TODO|FIXME|XXX|HACK|BUG'

EXIT_CODE=0
for f in "$@"; do
    if [[ "$f" == *.py ]]; then
        # Skip docstrings / comments tagged "Note: ..."
        matches=$(grep -nE "$PATTERNS" "$f" 2>/dev/null || true)
        if [[ -n "$matches" ]]; then
            echo "FORBIDDEN_MARKER in $f:"
            echo "$matches" | head -5
            EXIT_CODE=1
        fi
    fi
done

exit "$EXIT_CODE"
