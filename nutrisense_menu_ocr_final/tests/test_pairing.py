"""
tests/test_pairing.py
Unit tests for dish-price pairing engine.

Tests:
- Correct same-row pairing
- No cross-pairing
- Two-column menu pairing
- Same price for different dishes all survive
- Section headings are not paired
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from models.schemas import (
    OCRToken, VisualLine, BBox,
    DishCandidate, PriceCandidate,
)
from ocr.pairing import pair_dishes_and_prices
from config.settings import PRICE_TYPE_STANDALONE


def _tok(text: str, x: int, y: int, w: int = 80, h: int = 30) -> OCRToken:
    return OCRToken(
        raw_text=text, normalized_text=text, confidence=90.0,
        x=x, y=y, width=w, height=h,
        block_num=1, par_num=1, line_num=0, word_num=1,
    )


def _dish(name: str, x: int, y: int, w: int = 200, h: int = 30,
          line_index: int = -1, is_heading: bool = False) -> DishCandidate:
    tok = _tok(name, x, y, w, h)
    return DishCandidate(
        raw_text=name, normalized_text=name.title(),
        bbox=BBox(x, y, w, h),
        ocr_confidence=90.0,
        source_tokens=[tok],
        line_index=line_index,
        is_section_heading=is_heading,
    )


def _price(val: float, x: int, y: int, w: int = 50, h: int = 30,
           line_index: int = -1) -> PriceCandidate:
    tok = _tok(str(int(val)), x, y, w, h)
    return PriceCandidate(
        raw_text=str(int(val)),
        normalized_text=str(int(val)),
        price_type=PRICE_TYPE_STANDALONE,
        numeric_value=val,
        bbox=BBox(x, y, w, h),
        ocr_confidence=90.0,
        price_confidence=0.7,
        source_tokens=[tok],
        line_index=line_index,
    )


def _line(tokens: list, line_index: int = 0) -> VisualLine:
    return VisualLine(tokens=tokens, line_index=line_index)


class TestBasicPairing:

    def test_simple_same_row_pairing(self):
        """IDLI (line 0) → 40 (line 0), VADA (line 1) → 30 (line 1)."""
        dishes = [
            _dish("IDLI", x=50, y=100, line_index=0),
            _dish("VADA", x=50, y=160, line_index=1),
        ]
        prices = [
            _price(40, x=500, y=100, line_index=0),
            _price(30, x=500, y=160, line_index=1),
        ]
        lines = [
            _line([_tok("IDLI", 50, 100), _tok("40", 500, 100)], 0),
            _line([_tok("VADA", 50, 160), _tok("30", 500, 160)], 1),
        ]
        pairs = pair_dishes_and_prices(dishes, prices, lines, 700, 400)
        result = {d.raw_text: p.numeric_value for d, p, _ in pairs}
        assert result.get("IDLI") == 40, f"IDLI→{result.get('IDLI')}"
        assert result.get("VADA") == 30, f"VADA→{result.get('VADA')}"

    def test_no_cross_pairing(self):
        """IDLI must pair with 40 (same row), NOT 30."""
        dishes = [
            _dish("IDLI", x=50, y=100, line_index=0),
            _dish("VADA", x=50, y=160, line_index=1),
        ]
        prices = [
            _price(40, x=500, y=100, line_index=0),
            _price(30, x=500, y=160, line_index=1),
        ]
        lines = [
            _line([], 0),
            _line([], 1),
        ]
        pairs = pair_dishes_and_prices(dishes, prices, lines, 700, 400)
        result = {d.raw_text: p.numeric_value for d, p, _ in pairs}
        assert result.get("IDLI") == 40
        assert result.get("VADA") == 30

    def test_same_price_different_dishes_survive(self):
        """IDLI ₹40, VADA ₹40, DOSA ₹40 — all three must be paired."""
        dishes = [
            _dish("IDLI", x=50, y=100, line_index=0),
            _dish("VADA", x=50, y=160, line_index=1),
            _dish("DOSA", x=50, y=220, line_index=2),
        ]
        prices = [
            _price(40, x=500, y=100, line_index=0),
            _price(40, x=500, y=160, line_index=1),
            _price(40, x=500, y=220, line_index=2),
        ]
        lines = [_line([], i) for i in range(3)]
        pairs = pair_dishes_and_prices(dishes, prices, lines, 700, 500)
        assert len(pairs) == 3, f"Expected 3 pairs, got {len(pairs)}"

    def test_section_heading_not_paired(self):
        """BREAKFAST section heading must not be paired with any price."""
        dishes = [
            _dish("BREAKFAST", x=50, y=50, line_index=0, is_heading=True),
            _dish("IDLI",      x=50, y=110, line_index=1),
        ]
        prices = [_price(40, x=500, y=110, line_index=1)]
        lines = [_line([], i) for i in range(2)]
        pairs = pair_dishes_and_prices(dishes, prices, lines, 700, 300)
        dish_names = [d.raw_text for d, _, _ in pairs]
        assert "BREAKFAST" not in dish_names
        assert "IDLI" in dish_names


class TestTwoColumnPairing:

    def test_left_column_not_paired_with_right_price(self):
        """
        Left column dish (x~50) should NOT pair with right column price (x~750).
        Image width = 900 → mid = 450.
        """
        dishes = [
            _dish("IDLI",       x=50,  y=100, line_index=0),
            _dish("VEG BIRYANI",x=500, y=100, line_index=0),
        ]
        prices = [
            _price(40,  x=320, y=100, line_index=0),
            _price(120, x=800, y=100, line_index=0),
        ]
        lines = [_line([], 0)]
        pairs = pair_dishes_and_prices(dishes, prices, lines, 900, 300)
        result = {d.raw_text: p.numeric_value for d, p, _ in pairs}
        # IDLI (left) should pair with 40 (left), VEG BIRYANI (right) with 120 (right)
        assert result.get("IDLI") == 40, f"IDLI should→40, got {result}"
        assert result.get("VEG BIRYANI") == 120, f"VEG BIRYANI should→120, got {result}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
