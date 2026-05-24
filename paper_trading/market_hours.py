"""Weekend market-hours check for QuantForge paper trading engine.

Forex markets are effectively closed from Friday 5pm ET to Sunday 5pm ET.
For simplicity, weekends (Sat/Sun + Fri after 5pm ET) are treated as closed.
"""

from datetime import datetime

import pytz

ET = pytz.timezone("US/Eastern")


def is_market_closed() -> bool:
    """Return True if no major market is open (weekend / forex closed window)."""
    now = datetime.now(tz=ET)
    # Saturday (5) or Sunday (6)
    if now.weekday() >= 5:
        return True
    # Friday after 5pm ET (forex close)
    return now.weekday() == 4 and now.hour >= 17
