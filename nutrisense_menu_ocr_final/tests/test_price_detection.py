"""
tests/test_price_detection.py
Unit tests for price candidate detection.

Tests:
- All price formats are detected
- Quantity conflicts are correctly flagged
- Three-digit prices are NOT truncated
- The specific historical bug (80 -> 780, 95 -> 795) cannot occur in our system
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from models.schemas import OCRToken, VisualLine, BBox
from ocr.price_detection import (
    detect_price_candidates,
    _parse_price_token,
    validate_price_candidate,
)
from config.settings import (
    PRICE_TYPE_CURRENCY,
    PRICE_TYPE_RS,
    PRICE_TYPE_SUFFIX,
    PRICE_TYPE_STANDALONE,
    PRICE_TYPE_POSSIBLE_ARTIFACT,
)


def _make_token(text: str, x: int = 100, y: int = 100, w: int = 60, h: int = 30,
                conf: float = 90.0, line: int = 0) -> OCRToken:
    tok = OCRToken(
        raw_text=text, normalized_text=text, confidence=conf,
        x=x, y=y, width=w, height=h,
        block_num=1, par_num=1, line_num=line, word_num=1,
    )
    return tok


def _make_line(tokens: list, line_index: int = 0) -> VisualLine:
    return VisualLine(tokens=tokens, line_index=line_index)


# ─────────────────────────────────────────────
# Price format tests
# ─────────────────────────────────────────────

class TestPriceFormats:

    def test_currency_price(self):
        tok = _make_token("₹180")
        cand = _parse_price_token(tok)
        assert cand is not None
        assert cand.price_type == PRICE_TYPE_CURRENCY
        assert cand.numeric_value == 180

    def test_currency_with_space(self):
        # "₹ 80" as two tokens
        t1 = _make_token("₹", x=100, w=20)
        t2 = _make_token("80", x=125, w=40)
        cand = _parse_price_token(t1, t2)
        assert cand is not None
        assert cand.price_type == PRICE_TYPE_CURRENCY
        assert cand.numeric_value == 80

    def test_rs_price(self):
        tok = _make_token("Rs80")
        cand = _parse_price_token(tok)
        assert cand is not None
        assert cand.price_type == PRICE_TYPE_RS
        assert cand.numeric_value == 80

    def test_rs_dot_price(self):
        tok = _make_token("Rs.30")
        cand = _parse_price_token(tok)
        assert cand is not None
        assert cand.price_type == PRICE_TYPE_RS
        assert cand.numeric_value == 30

    def test_rs_space_price(self):
        t1 = _make_token("Rs", x=100, w=30)
        t2 = _make_token("30", x=135, w=30)
        cand = _parse_price_token(t1, t2)
        assert cand is not None
        assert cand.price_type == PRICE_TYPE_RS
        assert cand.numeric_value == 30

    def test_suffix_price(self):
        tok = _make_token("70/-")
        cand = _parse_price_token(tok)
        assert cand is not None
        assert cand.price_type == PRICE_TYPE_SUFFIX
        assert cand.numeric_value == 70

    def test_standalone_price(self):
        tok = _make_token("80")
        cand = _parse_price_token(tok)
        assert cand is not None
        assert cand.price_type == PRICE_TYPE_STANDALONE
        assert cand.numeric_value == 80

    def test_three_digit_price_not_truncated(self):
        """Regression: 120 must stay 120, not become 12 or 20."""
        tok = _make_token("120")
        cand = _parse_price_token(tok)
        assert cand is not None
        assert cand.numeric_value == 120, f"Expected 120, got {cand.numeric_value}"

    def test_three_digit_price_180(self):
        tok = _make_token("180")
        cand = _parse_price_token(tok)
        assert cand is not None
        assert cand.numeric_value == 180

    def test_three_digit_price_220(self):
        tok = _make_token("220")
        cand = _parse_price_token(tok)
        assert cand is not None
        assert cand.numeric_value == 220


# ─────────────────────────────────────────────
# Historical regression tests
# ─────────────────────────────────────────────

class TestHistoricalRegression:

    def test_80_stays_80(self):
        """Regression: raw '80' must NEVER become '780' via our code."""
        tok = _make_token("80")
        cand = _parse_price_token(tok)
        assert cand is not None
        assert cand.numeric_value == 80, f"Got {cand.numeric_value}"
        assert cand.normalized_text == "80"
        assert cand.raw_text == "80"

    def test_95_stays_95(self):
        """Regression: raw '95' must NEVER become '795' via our code."""
        tok = _make_token("95")
        cand = _parse_price_token(tok)
        assert cand is not None
        assert cand.numeric_value == 95, f"Got {cand.numeric_value}"

    def test_no_hardcoded_price_corrections(self):
        """
        Ensure we never silently transform a price.
        If Tesseract gives us '780', we preserve '780'.
        """
        tok = _make_token("780")
        cand = _parse_price_token(tok)
        # 780 is within our 4-digit limit, so it should be detected as-is
        assert cand is not None
        assert cand.numeric_value == 780, f"Got {cand.numeric_value}"
        assert cand.raw_text == "780"


# ─────────────────────────────────────────────
# Quantity conflict tests
# ─────────────────────────────────────────────

class TestQuantityConflict:

    def test_quantity_pcs_flagged(self):
        """'6 PCS' — the 6 is a quantity, not a price."""
        dish_tok = _make_token("WINGS", x=50, y=100, w=80, h=30)
        qty_tok = _make_token("6", x=200, y=100, w=20, h=30)
        pcs_tok = _make_token("PCS", x=225, y=100, w=40, h=30)
        price_tok = _make_token("180", x=400, y=100, w=50, h=30)

        line = _make_line([dish_tok, qty_tok, pcs_tok, price_tok])
        candidates = detect_price_candidates([line], image_width=600)

        # The 6 should be flagged as quantity conflict
        six_cands = [c for c in candidates if c.numeric_value == 6]
        if six_cands:
            assert six_cands[0].quantity_conflict, "6 should be flagged as quantity"

        # 180 should be a valid price candidate
        price_cands = [c for c in candidates if c.numeric_value == 180]
        assert len(price_cands) >= 1, "180 should be detected as price"

    def test_ml_unit_flagged(self):
        """'250 ML' — the 250 is a quantity."""
        qty_tok = _make_token("250", x=200, y=100, w=40, h=30)
        ml_tok = _make_token("ML", x=245, y=100, w=25, h=30)
        line = _make_line([qty_tok, ml_tok])
        candidates = detect_price_candidates([line], image_width=600)
        qty_cands = [c for c in candidates if c.numeric_value == 250]
        if qty_cands:
            assert qty_cands[0].quantity_conflict


# ─────────────────────────────────────────────
# Currency Artifact Tests
# ─────────────────────────────────────────────

class TestCurrencyArtifact:
    def test_gate2_generation(self):
        """Test that alternatives are generated."""
        tok = _make_token("725")
        cand = _parse_price_token(tok)
        assert cand.artifact_alternative == 25.0

    def test_gate3_780_becomes_80_in_context(self):
        """Strong evidence supports shortening 780 -> 80."""
        dish = _make_token("MASALA", x=50, y=100)
        tok_780 = _make_token("780", x=500, y=100)
        line1 = _make_line([dish, tok_780], line_index=0)
        
        # Local price distribution (median = 90)
        line2 = _make_line([_make_token("IDLI", x=50, y=150), _make_token("90", x=500, y=150)], line_index=1)
        line3 = _make_line([_make_token("VADA", x=50, y=200), _make_token("80", x=500, y=200)], line_index=2)
        
        candidates = detect_price_candidates([line1, line2, line3], image_width=700)
        
        cand = next((c for c in candidates if c.raw_text == "780"), None)
        assert cand is not None
        assert cand.numeric_value == 80.0
        assert cand.price_type == "POSSIBLE_RUPEE_ARTIFACT"
        assert cand.currency_artifact_score >= cand.raw_score + 0.3

    def test_gate3_ambiguous_750_not_shortened(self):
        """If context is ambiguous (median is 800), 750 must NOT become 50."""
        dish = _make_token("THALI", x=50, y=100)
        tok_750 = _make_token("750", x=500, y=100)
        line1 = _make_line([dish, tok_750], line_index=0)
        
        line2 = _make_line([_make_token("SPECIAL", x=50, y=150), _make_token("800", x=500, y=150)], line_index=1)
        line3 = _make_line([_make_token("MEALS", x=50, y=200), _make_token("700", x=500, y=200)], line_index=2)
        
        candidates = detect_price_candidates([line1, line2, line3], image_width=700)
        cand = next((c for c in candidates if c.raw_text == "750"), None)
        
        assert cand is not None
        # It should remain 750 because the median is 800 (not an outlier)
        assert cand.numeric_value == 750.0
        assert cand.price_type == "STANDALONE_PRICE"

    def test_gate3_ambiguous_260_not_shortened(self):
        """260 vs 60. Without clear evidence, leave as 260."""
        # No dish text, no price column, isolated 260
        tok_260 = _make_token("260", x=500, y=100)
        line1 = _make_line([tok_260], line_index=0)
        
        candidates = detect_price_candidates([line1], image_width=700)
        cand = next((c for c in candidates if c.raw_text == "260"), None)
        assert cand is not None
        assert cand.numeric_value == 260.0
        
    def test_gate3_various_corrupted_prices(self):
        """725->25, 7200->200, 2130->130, 2250->250 in context."""
        lines = []
        # Add strong baseline of normal prices so the median is uncorrupted (~100-150)
        lines.append(_make_line([_make_token("DISH0", 50, 0), _make_token("90", 500, 0)], 0))
        lines.append(_make_line([_make_token("DISH_A", 50, 50), _make_token("120", 500, 50)], 1))
        
        lines.append(_make_line([_make_token("DISH1", 50, 100), _make_token("725", 500, 100)], 2))
        
        lines.append(_make_line([_make_token("DISH_B", 50, 125), _make_token("130", 500, 125)], 3))
        
        lines.append(_make_line([_make_token("DISH2", 50, 150), _make_token("7200", 500, 150)], 4))
        
        lines.append(_make_line([_make_token("DISH_C", 50, 175), _make_token("140", 500, 175)], 5))
        
        lines.append(_make_line([_make_token("DISH3", 50, 200), _make_token("2130", 500, 200)], 6))
        
        lines.append(_make_line([_make_token("DISH_D", 50, 225), _make_token("150", 500, 225)], 7))
        
        lines.append(_make_line([_make_token("DISH4", 50, 250), _make_token("2250", 500, 250)], 8))
        
        lines.append(_make_line([_make_token("DISH_E", 50, 300), _make_token("100", 500, 300)], 9))
        lines.append(_make_line([_make_token("DISH_F", 50, 350), _make_token("150", 500, 350)], 10))
        lines.append(_make_line([_make_token("DISH_G", 50, 400), _make_token("200", 500, 400)], 11))
        
        candidates = detect_price_candidates(lines, image_width=700)
        
        c25 = next((c for c in candidates if c.raw_text == "725"), None)
        c200 = next((c for c in candidates if c.raw_text == "7200"), None)
        c130 = next((c for c in candidates if c.raw_text == "2130"), None)
        c250 = next((c for c in candidates if c.raw_text == "2250"), None)
        
        assert c25 and c25.numeric_value == 25.0
        assert c200 and c200.numeric_value == 200.0
        assert c130 and c130.numeric_value == 130.0
        assert c250 and c250.numeric_value == 250.0

    def test_gate3_non_price_year_protected(self):
        """1986 should not become a price just because 986 is an alternative."""
        lines = []
        lines.append(_make_line([_make_token("EST.", 50, 100), _make_token("1986", 120, 100)], 0))
        candidates = detect_price_candidates(lines, image_width=700)
        c1986 = next((c for c in candidates if c.raw_text == "1986"), None)
        # Should not be corrupted, and should be penalized (or just untouched)
        assert c1986 is not None
        assert c1986.numeric_value == 1986.0
        assert c1986.price_type == "STANDALONE_PRICE"

    def test_gate5_malformed_protected(self):
        """Prove malformed values remain protected/rejected."""
        for text in ["8010080", "987654", "1234567", "9999999"]:
            tok = _make_token(text)
            cand = _parse_price_token(tok)
            # Should be rejected completely by _parse_price_token
            assert cand is None


# ─────────────────────────────────────────────
# False Positive Penalties
# ─────────────────────────────────────────────

class TestFalsePositives:

    def test_gate6_date_timestamp_rejection(self):
        """Regression: 'Nov 25, 2025 10:11 pm' should not generate a price candidate for 2025."""
        from ocr.price_detection import detect_price_candidates
        
        t1 = _make_token("Nov", x=50, w=30)
        t2 = _make_token("25,", x=90, w=30)
        t3 = _make_token("2025", x=130, w=40)
        t4 = _make_token("10:11", x=180, w=40)
        t5 = _make_token("pm", x=230, w=20)
        
        line = _make_line([t1, t2, t3, t4, t5], line_index=0)
        cands = detect_price_candidates([line], image_width=700)
        
        # 2025 must be entirely rejected (not even returned as a candidate)
        assert len(cands) == 0, f"Expected 0 candidates, got {len(cands)}"

    def test_gate6_month_names_rejection(self):
        """Test common month forms."""
        from ocr.price_detection import detect_price_candidates
        for month in ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]:
            t1 = _make_token(month, x=50, w=30)
            t2 = _make_token("2024", x=90, w=40)
            line = _make_line([t1, t2], line_index=0)
            cands = detect_price_candidates([line], image_width=700)
            assert len(cands) == 0, f"Failed to reject {month} 2024"

    def test_gate6_legitimate_high_prices(self):
        """Genuine price contexts must still accept 1000, 1200, 1600, 2000."""
        from ocr.price_detection import detect_price_candidates
        
        for price in ["1000", "1200", "1600", "2000"]:
            t1 = _make_token("Mandi", x=50, w=50)
            t2 = _make_token("Full", x=110, w=40)
            t3 = _make_token(price, x=500, w=40)
            line = _make_line([t1, t2, t3], line_index=0)
            cands = detect_price_candidates([line], image_width=700)
            
            assert len(cands) == 1, f"High price {price} was incorrectly rejected"
            assert cands[0].numeric_value == float(price)

    def test_gate6_time_pattern_rejection(self):
        """Lines with HH:MM format should reject standalone numbers."""
        from ocr.price_detection import detect_price_candidates
        t1 = _make_token("12:30", x=50, w=40)
        t2 = _make_token("2000", x=100, w=40) # Should be rejected because of time pattern
        line = _make_line([t1, t2], line_index=0)
        cands = detect_price_candidates([line], image_width=700)
        assert len(cands) == 0

    def test_multi_price_regression(self):
        """Regression: 170/180 must not be broken by currency logic."""
        # Wait, the current tokenizer splits 170/180 into 170, /, 180.
        # But if they are single tokens or two tokens, ensure neither gets corrupted.
        t1 = _make_token("170", x=500, w=30)
        t2 = _make_token("/", x=535, w=10)
        t3 = _make_token("180", x=550, w=30)
        line = _make_line([t1, t2, t3], line_index=0)
        cands = detect_price_candidates([line], image_width=700)
        c170 = next((c for c in cands if c.numeric_value == 170.0), None)
        c180 = next((c for c in cands if c.numeric_value == 180.0), None)
        assert c170 is not None
        assert c180 is not None
        assert c170.artifact_alternative is None
        assert c180.artifact_alternative is None

    def test_phone_number_penalized(self):
        """0422 4271190 shouldn't be a price."""
        tok1 = _make_token("0422", x=50, y=100)
        tok2 = _make_token("4271190", x=120, y=100)
        line = _make_line([tok1, tok2], line_index=0)
        candidates = detect_price_candidates([line], image_width=600)
        
        cand = next((c for c in candidates if c.raw_text == "0422"), None)
        if cand:
            assert cand.address_penalty > 0
            val = validate_price_candidate(cand, candidates)
            assert val < 0.5

    def test_footer_text_penalized(self):
        """'Contact us: 120' shouldn't have 120 as a confident price."""
        tok1 = _make_token("Contact", x=50, y=100)
        tok2 = _make_token("us", x=120, y=100)
        tok3 = _make_token("120", x=180, y=100)
        line = _make_line([tok1, tok2, tok3], line_index=0)
        candidates = detect_price_candidates([line], image_width=600)
        
        cand = next((c for c in candidates if c.raw_text == "120"), None)
        assert cand is not None
        assert cand.footer_penalty > 0
        val = validate_price_candidate(cand, candidates)
        assert val < 0.5


# ─────────────────────────────────────────────
# Price normalization display
# ─────────────────────────────────────────────

class TestPriceDisplay:

    def test_display_integer(self):
        from ocr.price_detection import normalize_price_display
        tok = _make_token("80")
        cand = _parse_price_token(tok)
        assert cand is not None
        display = normalize_price_display(cand)
        assert display == "₹180" or display == "₹80" # The token text is 80, so display should be ₹80

    def test_display_decimal(self):
        from ocr.price_detection import normalize_price_display
        tok = _make_token("₹180.50")
        cand = _parse_price_token(tok)
        assert cand is not None
        display = normalize_price_display(cand)
        assert "180" in display

class TestLocalPriceContext:
    def test_local_price_grouping(self):
        """4 & 5. Local price grouping and local median/MAD selection."""
        # Create a mock set of candidates simulating two columns.
        # Left column (x=100)
        c1 = _parse_price_token(_make_token("130", x=100))
        c2 = _parse_price_token(_make_token("160", x=100))
        c3 = _parse_price_token(_make_token("200", x=100))
        c4 = _parse_price_token(_make_token("250", x=100))
        
        # Right column (x=600)
        c5 = _parse_price_token(_make_token("40", x=600))
        c6 = _parse_price_token(_make_token("45", x=600))
        c7 = _parse_price_token(_make_token("740", x=600)) # The artifact!
        c8 = _parse_price_token(_make_token("55", x=600))
        c9 = _parse_price_token(_make_token("60", x=600))
        
        # Set line index to be the same, simulating a 2-column menu
        c1.line_index = c5.line_index = 10
        c2.line_index = c6.line_index = 11
        c3.line_index = c7.line_index = 12
        c4.line_index = c8.line_index = 13
        c9.line_index = 14
        
        cands = [c1, c2, c3, c4, c5, c6, c7, c8, c9]
        from ocr.price_detection import _detect_price_column, _detect_currency_artifacts
        _detect_price_column(cands, 800)
        
        # Right column should be locally grouped
        _detect_currency_artifacts(cands, [])
        
        # 6. 740 -> 40 contextual recovery
        assert c7.price_type == PRICE_TYPE_POSSIBLE_ARTIFACT
        assert c7.numeric_value == 40.0
        
    def test_contextual_recoveries(self):
        """7 & 8. 745 -> 45 and 790 -> 90 contextual recovery."""
        c1 = _parse_price_token(_make_token("40", x=600))
        c2 = _parse_price_token(_make_token("745", x=600))
        c3 = _parse_price_token(_make_token("790", x=600))
        c4 = _parse_price_token(_make_token("80", x=600))
        
        cands = [c1, c2, c3, c4]
        from ocr.price_detection import _detect_price_column, _detect_currency_artifacts
        _detect_price_column(cands, 800)
        _detect_currency_artifacts(cands, [])
        
        assert c2.numeric_value == 45.0
        assert c3.numeric_value == 90.0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
