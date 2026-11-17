"""
ocr/pairing.py
Dish ↔ Price pairing engine.

DESIGN:
- Score-based: every (dish, price) pair gets a numeric score
- Multiple signals: same line, vertical alignment, x-ordering, column, proximity
- Prioritise same-row relationships
- Never cross-pair columns (left column dish ↔ right column price forbidden)
- Distance alone MUST NOT dominate
- Each price is paired to at most one dish (greedy assignment by score)
- Each dish is paired to at most one price
"""

from __future__ import annotations
import statistics
from typing import List, Dict, Optional, Tuple, Set

from config.settings import (
    PAIR_WEIGHT_SAME_LINE,
    PAIR_WEIGHT_DISH_LEFT_PRICE,
    PAIR_WEIGHT_PRICE_COLUMN,
    PAIR_WEIGHT_VERTICAL_ALIGN,
    PAIR_WEIGHT_SAME_BLOCK,
    PAIR_WEIGHT_ROW_CONSISTENCY,
    PAIR_WEIGHT_PROXIMITY,
    MIN_PAIR_SCORE,
    MAX_VERTICAL_DIST_FRAC,
)
from models.schemas import (
    DishCandidate,
    PriceCandidate,
    VisualLine,
)
from utils.logging_utils import get_logger

log = get_logger("ocr.pairing")


def _vertical_distance(dish: DishCandidate, price: PriceCandidate) -> float:
    """Absolute vertical center distance in pixels."""
    d_center = dish.bbox.y + dish.bbox.height / 2
    p_center = price.bbox.y + price.bbox.height / 2
    return abs(d_center - p_center)


def _median_line_height(lines: List[VisualLine]) -> float:
    heights = [line.height() for line in lines if line.height() > 0]
    if not heights:
        return 30.0
    return statistics.median(heights)


def _same_column_check(dish: DishCandidate, price: PriceCandidate, image_width: int, has_two_columns: bool = True) -> bool:
    if not has_two_columns or image_width < 400: return True
    mid = image_width / 2.0
    if dish.bbox.x < mid: return price.bbox.x <= mid + 40
    else: return price.bbox.x >= mid - 40

def compute_pair_score(
    has_two_columns: bool,
    dish: DishCandidate,
    price: PriceCandidate,
    lines: List[VisualLine],
    image_width: int,
    image_height: int,
    median_h: float,
) -> float:
    """
    Compute a pairing score for a (dish, price) candidate pair.
    Higher score = better pairing.

    Returns negative infinity if the pair is geometrically impossible.
    """
    score = 0.0

    # ── Hard reject: price to the LEFT of dish (unusual and suspicious) ──
    dish_right_x = dish.bbox.x + dish.bbox.width
    price_left_x = price.bbox.x
    if price_left_x < dish.bbox.x - 10:
        # Price is clearly to the left of dish — very unlikely pairing
        return float("-inf")

    # ── Hard reject: different columns ───────────────────────────────────
    if not _same_column_check(dish, price, image_width, has_two_columns):
        return float("-inf")

    # ── Hard reject: too far vertically ──────────────────────────────────
    vert_dist = _vertical_distance(dish, price)
    max_vert = MAX_VERTICAL_DIST_FRAC * image_height
    if vert_dist > max_vert:
        return float("-inf")

    # ── SIGNAL 1: Same reconstructed visual line ──────────────────────────
    if dish.line_index == price.line_index and dish.line_index >= 0:
        score += PAIR_WEIGHT_SAME_LINE

    # ── SIGNAL 2: Dish is to the left of price ────────────────────────────
    if dish_right_x <= price_left_x + 20:  # small tolerance
        score += PAIR_WEIGHT_DISH_LEFT_PRICE

    # ── SIGNAL 3: Price in detected price column ──────────────────────────
    if price.in_price_column:
        score += PAIR_WEIGHT_PRICE_COLUMN

    # ── SIGNAL 4: Vertical alignment ─────────────────────────────────────
    norm_vert = vert_dist / max(median_h, 1)
    vert_score = max(0.0, 1.0 - norm_vert) * PAIR_WEIGHT_VERTICAL_ALIGN
    score += vert_score

    # ── SIGNAL 5: Same OCR block ─────────────────────────────────────────
    # Check if any source tokens share block_num
    dish_blocks = {t.block_num for t in dish.source_tokens}
    price_blocks = {t.block_num for t in price.source_tokens}
    if dish_blocks & price_blocks:
        score += PAIR_WEIGHT_SAME_BLOCK

    # ── SIGNAL 6: Row pattern consistency ────────────────────────────────
    # If the vertical distance matches the typical inter-row spacing, reward it
    row_spacings = []
    for line_a in lines:
        for line_b in lines:
            if line_b.line_index == line_a.line_index + 1:
                spacing = line_b.center_y() - line_a.center_y()
                if spacing > 0:
                    row_spacings.append(spacing)

    if row_spacings:
        median_spacing = statistics.median(row_spacings)
        if median_spacing > 0:
            spacing_match = abs(vert_dist - 0) / max(median_spacing, 1)
            if spacing_match < 0.3:  # within 30% of row spacing
                score += PAIR_WEIGHT_ROW_CONSISTENCY

    # ── SIGNAL 7: Horizontal proximity (normalized) ───────────────────────
    # How close is the price to the right edge of the dish (horizontally)?
    h_gap = max(0, price_left_x - dish_right_x)
    norm_h_gap = h_gap / max(image_width, 1)
    proximity_score = max(0.0, 1.0 - norm_h_gap * 3) * PAIR_WEIGHT_PROXIMITY
    score += proximity_score

    return score


def pair_dishes_and_prices(
    dishes: List[DishCandidate],
    prices: List[PriceCandidate],
    lines: List[VisualLine],
    image_width: int,
    image_height: int,
) -> List[Tuple[DishCandidate, PriceCandidate, float]]:
    """
    Main pairing function.

    Returns a list of (dish, price, score) tuples sorted by score descending.
    Each dish and price appears at most once.

    Algorithm:
    1. Compute all valid (dish, price) pair scores.
    2. Sort by score descending.
    3. Greedy assignment: accept the highest-score pair, mark both as used.
    """
    if not dishes or not prices:
        log.warning("No dishes or no prices to pair")
        return []

    median_h = _median_line_height(lines)

    # ── Compute all pair scores ───────────────────────────────────────────
    all_pairs: List[Tuple[DishCandidate, PriceCandidate, float]] = []
    
    has_two_columns = any(d.bbox.x >= image_width/2 for d in dishes) and any(p.bbox.x < image_width/2 for p in prices)
    first_header_y = min([d.bbox.y for d in dishes if d.is_section_heading], default=0)
    dishes = [d for d in dishes if d.bbox.y >= first_header_y - 20]
    prices = [p for p in prices if p.bbox.y >= first_header_y - 20]

    left_dishes = sorted([d for d in dishes if d.bbox.x < image_width / 2 and not d.is_section_heading], key=lambda d: d.bbox.y)
    right_dishes = sorted([d for d in dishes if d.bbox.x >= image_width / 2 and not d.is_section_heading], key=lambda d: d.bbox.y)
    left_prices = sorted([p for p in prices if p.bbox.x < image_width / 2 and not p.quantity_conflict], key=lambda p: p.bbox.y)
    right_prices = sorted([p for p in prices if p.bbox.x >= image_width / 2 and not p.quantity_conflict], key=lambda p: p.bbox.y)
    
    dish_orders = {}
    for i, d in enumerate(left_dishes): dish_orders[id(d)] = i
    for i, d in enumerate(right_dishes): dish_orders[id(d)] = i
    
    price_orders = {}
    for i, p in enumerate(left_prices): price_orders[id(p)] = i
    for i, p in enumerate(right_prices): price_orders[id(p)] = i
    
    for dish in dishes:
        if dish.is_section_heading:
            continue
        for price in prices:
            if price.quantity_conflict:
                continue
            s = compute_pair_score(has_two_columns, dish, price, lines, image_width, image_height, median_h)
            
            
            
            
                    
            if s != float("-inf") and s >= MIN_PAIR_SCORE:
                all_pairs.append((dish, price, s))

    # ── Sort by score descending ──────────────────────────────────────────
    all_pairs.sort(key=lambda x: x[2], reverse=True)

    log.debug(
        f"Pairing: {len(dishes)} dishes x {len(prices)} prices -> {len(all_pairs)} valid pairs"
    )
    for d, p, s in all_pairs[:10]:  # log top 10
        log.debug(
            f"  score={s:.2f} | '{d.normalized_text}' "
            f"(line {d.line_index}) ↔ '{p.raw_text}' (line {p.line_index})"
        )

    # ── Greedy assignment ─────────────────────────────────────────────────
    used_dishes: Set[int] = set()
    used_prices: Set[int] = set()
    accepted: List[Tuple[DishCandidate, PriceCandidate, float]] = []

    for dish, price, score in all_pairs:
        d_id = id(dish)
        p_id = id(price)
        if d_id not in used_dishes and p_id not in used_prices:
            accepted.append((dish, price, score))
            used_dishes.add(d_id)
            used_prices.add(p_id)

    log.info(f"Pairing result: {len(accepted)} dish-price pairs accepted")
    for d, p, s in accepted:
        log.info(f"  '{d.normalized_text}' ↔ '{p.raw_text}'  score={s:.2f}")

    return accepted





















