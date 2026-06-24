import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage, optimal_leaf_ordering


def _get_quasi_diag(link: np.ndarray, dist: np.ndarray | None = None) -> list[int]:
    """Quasi-diagonalized leaf order from a linkage matrix.

    When *dist* is provided, applies *optimal_leaf_ordering* to guarantee a
    consistent leaf order even when the underlying distance matrix violates
    the metric triangle inequality (the root cause of the original SERIAL-index
    dendrogram instability).

    Args:
        link: Linkage matrix from ``scipy.cluster.hierarchy.linkage``.
        dist: Optional condensed or redundant distance matrix.  If supplied,
            *optimal_leaf_ordering* is applied before traversal.

    Returns:
        List of leaf indices in quasi-diagonal order.
    """
    if dist is not None:
        link = optimal_leaf_ordering(link, dist)
    return _get_quasi_diag_single(link)


def _get_quasi_diag_single(link: np.ndarray) -> list[int]:
    """Iterative leaf-order extraction from a linkage matrix.

    This is the original traversal (renamed) — it builds the order bottom-up
    by following the merge structure of the dendrogram.
    """
    link = link.astype(int)
    n = link.shape[0] + 1
    items = [[i] for i in range(n)]
    for i in range(link.shape[0]):
        left = int(link[i, 0])
        right = int(link[i, 1])
        items.append(items[left] + items[right])
    return items[-1]


def _get_cluster_variance(cov: pd.DataFrame, cluster_indices: list[int]) -> float:
    cluster_cov = cov.iloc[cluster_indices, cluster_indices]
    w = np.ones(len(cluster_indices)) / len(cluster_indices)
    return w @ cluster_cov.values @ w


def _hrp_weights(cov: pd.DataFrame, link: np.ndarray) -> pd.Series:
    weights = pd.Series(1.0, index=cov.index)

    # Standard HRP recursive bisection (Lopez de Prado, 2016).
    # Uses the quasi-diagonal order from the (already OLO-optimised) linkage
    # matrix, then recursively bisects the ordered list.
    order = _get_quasi_diag(link)

    def _bisect(cluster: list[int]) -> None:
        if len(cluster) < 2:
            return
        mid = len(cluster) // 2
        left = cluster[:mid]
        right = cluster[mid:]
        var_left = _get_cluster_variance(cov, left)
        var_right = _get_cluster_variance(cov, right)
        alpha = 1 - var_left / (var_left + var_right)
        alpha = np.clip(alpha, 0.0, 1.0)
        for j in left:
            weights.iloc[j] *= alpha
        for j in right:
            weights.iloc[j] *= 1 - alpha
        _bisect(left)
        _bisect(right)

    _bisect(order)
    return weights / weights.sum()


def hrp_allocation(returns: pd.DataFrame, method: str = "single") -> dict[str, float]:
    cov = returns.cov()
    corr = returns.corr()
    dist = np.sqrt(2 * (1 - corr.clip(-1, 1)))
    link = linkage(dist.values, method=method)
    link = optimal_leaf_ordering(link, dist.values.astype(np.double))
    w = _hrp_weights(cov, link)
    return dict(w)


def hrp_allocation_with_vol_target(
    returns: pd.DataFrame,
    target_vol: float = 0.15,
    method: str = "single",
) -> dict[str, float]:
    w = hrp_allocation(returns, method=method)
    cov = returns.cov() * 252
    assets = list(w.keys())
    weights = np.array([w[a] for a in assets])
    portfolio_var = weights @ cov.values @ weights
    portfolio_vol = np.sqrt(portfolio_var) if portfolio_var > 0 else 1.0
    leverage = target_vol / portfolio_vol
    leverage = min(leverage, 1.0)
    scaled = {a: w[a] * leverage for a in assets}
    return scaled
