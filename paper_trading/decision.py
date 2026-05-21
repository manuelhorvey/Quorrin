from dataclasses import dataclass


@dataclass
class TradeDecision:
    """
    Pure model intent — what the model wants to do.
    No execution details, no side effects.
    """

    asset: str
    signal: str
    label: int
    confidence: float
    prob_long: float
    prob_short: float
    prob_neutral: float
    close_price: float
    timestamp: str
    position_size: float


@dataclass
class PositionIntent:
    """
    Execution expression — how to implement a TradeDecision.
    Concrete entry, stop-loss, take-profit, and vol.
    """

    side: str
    entry_price: float
    entry_date: str
    stop_loss: float
    take_profit: float
    vol: float

    @classmethod
    def from_price_and_vol(
        cls, side: str, entry_price: float, entry_date: str, vol: float, sl_mult: float = 1.0, tp_mult: float = 2.5
    ) -> "PositionIntent":
        if side == "long":
            sl = entry_price * (1 - vol * sl_mult)
            tp = entry_price * (1 + vol * tp_mult)
        else:
            sl = entry_price * (1 + vol * sl_mult)
            tp = entry_price * (1 - vol * tp_mult)
        return cls(side=side, entry_price=entry_price, entry_date=entry_date, stop_loss=sl, take_profit=tp, vol=vol)
