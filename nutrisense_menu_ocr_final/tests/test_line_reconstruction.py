"""
tests/test_line_reconstruction.py
Unit tests for the visual line reconstruction algorithm.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from models.schemas import OCRToken
from ocr.line_reconstruction import reconstruct_lines


def _tok(text: str, x: int, y: int, w: int = 80, h: int = 30) -> OCRToken:
    return OCRToken(
        raw_text=text, normalized_text=text, confidence=90.0,
        x=x, y=y, width=w, height=h,
        block_num=1, par_num=1, line_num=0, word_num=1,
    )


class TestLineReconstruction:

    def test_single_line(self):
        """Three tokens on the same horizontal line → 1 line."""
        tokens = [
            _tok("IDLI", x=50, y=100),
            _tok("40",   x=500, y=103),   # slight y offset (common in OCR)
        ]
        lines = reconstruct_lines(tokens)
        assert len(lines) == 1
        assert "IDLI" in lines[0].full_text()
        assert "40" in lines[0].full_text()

    def test_separate_lines(self):
        """Three distinct rows → 3 lines."""
        tokens = [
            _tok("IDLI",       x=50, y=100),
            _tok("40",         x=500, y=100),
            _tok("VADA",       x=50, y=160),
            _tok("30",         x=500, y=160),
            _tok("MASALA DOSA",x=50, y=220),
            _tok("80",         x=500, y=220),
        ]
        lines = reconstruct_lines(tokens)
        assert len(lines) == 3

    def test_token_order_in_line(self):
        """Tokens within a line must be sorted left-to-right."""
        tokens = [
            _tok("₹80",      x=500, y=100),
            _tok("MASALA",   x=50,  y=100),
            _tok("DOSA",     x=145, y=102),
        ]
        lines = reconstruct_lines(tokens)
        assert len(lines) == 1
        sorted_toks = lines[0].sorted_tokens()
        assert sorted_toks[0].normalized_text == "MASALA"
        assert sorted_toks[-1].normalized_text == "₹80"

    def test_multiword_on_same_line(self):
        """MASALA + DOSA must be on the same line."""
        tokens = [
            _tok("MASALA", x=50, y=100),
            _tok("DOSA",   x=150, y=99),
            _tok("80",     x=500, y=100),
        ]
        lines = reconstruct_lines(tokens)
        assert len(lines) == 1
        text = lines[0].full_text()
        assert "MASALA" in text
        assert "DOSA" in text
        assert "80" in text

    def test_empty_tokens(self):
        """Empty token list returns empty list."""
        lines = reconstruct_lines([])
        assert lines == []

    def test_lines_sorted_top_to_bottom(self):
        """Lines must be ordered top-to-bottom."""
        tokens = [
            _tok("ITEM3", x=50, y=300),
            _tok("ITEM1", x=50, y=100),
            _tok("ITEM2", x=50, y=200),
        ]
        lines = reconstruct_lines(tokens)
        assert len(lines) == 3
        assert lines[0].tokens[0].normalized_text == "ITEM1"
        assert lines[1].tokens[0].normalized_text == "ITEM2"
        assert lines[2].tokens[0].normalized_text == "ITEM3"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
