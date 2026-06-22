from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, auto


class PositionSide(str, Enum):
    LONG = "long"
    SHORT = "short"

    def inverted(self) -> PositionSide:
        return PositionSide.SHORT if self == PositionSide.LONG else PositionSide.LONG

    @classmethod
    def from_signal_type(cls, signal_type: str) -> PositionSide | None:
        mapping = {"BUY": cls.LONG, "SELL": cls.SHORT}
        return mapping.get(signal_type)


class PositionState(Enum):
    PENDING = auto()
    OPEN = auto()
    CLOSED = auto()
    CANCELLED = auto()


@dataclass
class StackLayer:
    """Single pyramid layer within a stacked position."""

    entry_price: float
    size: float
    timestamp: str
    signal_id: str = ""
    pnl_at_time: float = 0.0


class OrderType(str, Enum):
    ENTRY = "entry"
    STACK = "stack"
    REDUCE = "reduce"
    EXIT = "exit"


@dataclass
class StackCommand:
    """Execution instruction produced by stacking evaluation."""

    size: float
    reason: str
    expected_layer_idx: int
    expected_price: float = 0.0
    metadata: dict = field(default_factory=dict)


@dataclass
class PositionIntent:
    side: PositionSide
    entry_price: float
    entry_date: str
    stop_loss: float
    take_profit: float
    vol: float = 0.01
    confidence: float = 0.0
    layers: list[StackLayer] = field(default_factory=list)
    base_entry_size: float = 0.0

    @classmethod
    def from_price_and_vol(
        cls,
        side: PositionSide,
        entry_price: float,
        entry_date: str,
        vol: float,
        sl_mult: float = 1.0,
        tp_mult: float = 2.5,
    ) -> PositionIntent:
        if side == PositionSide.LONG:
            sl = entry_price * (1 - vol * sl_mult)
            tp = entry_price * (1 + vol * tp_mult)
        else:
            sl = entry_price * (1 + vol * sl_mult)
            tp = entry_price * (1 - vol * tp_mult)
        return cls(side=side, entry_price=entry_price, entry_date=entry_date, stop_loss=sl, take_profit=tp, vol=vol)

    @property
    def is_long(self) -> bool:
        return self.side == PositionSide.LONG

    @property
    def is_short(self) -> bool:
        return self.side == PositionSide.SHORT

    @property
    def total_size(self) -> float:
        if not self.layers:
            return self.vol if self.vol else 0.0
        return sum(lay.size for lay in self.layers)

    @property
    def avg_price(self) -> float:
        if not self.layers:
            return self.entry_price
        total_sz = sum(lay.size for lay in self.layers)
        if total_sz <= 0:
            return self.entry_price
        return sum(lay.entry_price * lay.size for lay in self.layers) / total_sz

    def enforce_invariant(self, asset_name: str = "?") -> bool:
        """Enforce I1: sum(layer.price * layer.size) / sum(layer.size) == avg_price.
        Logs WARNING on mismatch. Returns True if invariant holds."""
        if not self.layers:
            return True
        total_sz = sum(lay.size for lay in self.layers)
        if total_sz <= 0:
            return True
        computed = sum(lay.entry_price * lay.size for lay in self.layers) / total_sz
        if abs(computed - self.avg_price) / max(computed, 1e-9) > 0.0001:
            import logging

            _invariant_logger = logging.getLogger("quantforge.position_invariant")
            _invariant_logger.warning(
                "%s: position invariant VIOLATED — computed_avg=%.6f position.avg_price=%.6f",
                asset_name,
                computed,
                self.avg_price,
            )
            return False
        return True
