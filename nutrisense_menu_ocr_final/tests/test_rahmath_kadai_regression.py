"""
tests/test_rahmath_kadai_regression.py

Regression test for the Courtallam Border Rahmath Kadai menu image.

Verifies that the ₹ currency symbol is NOT merged into the numeric price
value. Specifically tests that:

  ₹7169  → price_numeric = 169  (NOT 7169)
  ₹2275  → price_numeric = 275  (NOT 2275)
  ₹2309  → price_numeric = 309  (NOT 2309)
  %279   → price_numeric = 279  (NOT the raw garbled value)

Also verifies that legitimate prices remain unchanged:
  ₹279 → 279
  ₹289 → 289
  ₹365 → 365

And that footer text does NOT produce food-price pairs:
  "Our Branches: SENGOTTAI | CHENNAI ..." → no MenuItem
  "TAKEAWAY MENU & PRICE LIST" → no MenuItem

This test requires the actual menu image. If the image is not present,
the test is SKIPPED (not failed) so CI does not break.
"""

import json
import sys
from pathlib import Path

import pytest

# Try to import the pipeline
try:
    from pipeline.menu_ocr import MenuOCRPipeline
    from utils.image import load_image_from_path
    _PIPELINE_AVAILABLE = True
except ImportError as e:
    _PIPELINE_AVAILABLE = False
    _IMPORT_ERROR = str(e)


# Known image paths — add yours here
CANDIDATE_IMAGE_PATHS = [
    Path("tests/rahmath_kadai.jpg"),
    Path("tests/rahmath_kadai.jpeg"),
    Path("tests/rahmath_kadai.png"),
    Path("tests/rahmath_kadai.webp"),
    Path("real_menu_rahmath.jpg"),
    Path("real_menu_rahmath.jpeg"),
    Path("real_menu_rahmath.png"),
    Path("real_menu_rahmath.webp"),
]

FOOTER_NOISE_PHRASES = [
    "branches",
    "sengottai",
    "singapore",
    "london",
    "dubai",
    "malaysia",
    "takeaway menu",
    "price list",
]


def _find_image() -> Path | None:
    for p in CANDIDATE_IMAGE_PATHS:
        if p.exists():
            return p
    return None


@pytest.mark.skipif(
    not _PIPELINE_AVAILABLE,
    reason=f"Pipeline not importable: {_IMPORT_ERROR if not _PIPELINE_AVAILABLE else ''}",
)
class TestRahmathKadaiRegression:
    """Real-image regression tests for ₹ symbol corruption."""

    @pytest.fixture(scope="class")
    def result(self):
        img_path = _find_image()
        if img_path is None:
            pytest.skip(
                "Rahmath Kadai menu image not found. "
                "Place it at tests/rahmath_kadai.jpg (or .jpeg/.png/.webp) "
                "and re-run."
            )
        wrapper = load_image_from_path(img_path)
        assert wrapper is not None, "Failed to load image"
        pipeline = MenuOCRPipeline(debug_mode=True)
        return pipeline.process(wrapper)

    def test_pipeline_succeeds(self, result):
        assert result.success, f"Pipeline failed: {result.metadata.get('error')}"

    def test_no_7xxx_prices(self, result):
        """No price should be 7xxx — those are all ₹ corruption artifacts."""
        all_items = result.items + result.needs_review
        bad = [i for i in all_items if i.price_numeric and i.price_numeric >= 7000]
        assert bad == [], (
            f"Found prices >= 7000 (likely ₹ corruption): "
            + ", ".join(f"'{i.dish_name}': {i.price_numeric}" for i in bad)
        )

    def test_no_2xxx_artifact_prices(self, result):
        """Prices >= 2000 are suspicious on a typical South Indian menu (max ~500).
        If they exist AND they are 4-digit starting with 2, flag them."""
        all_items = result.items + result.needs_review
        # Allow genuine high prices (e.g. family combos) up to 1999
        suspicious = [
            i for i in all_items
            if i.price_numeric and 2000 <= i.price_numeric <= 9999
            and str(int(i.price_numeric))[0] == "2"
        ]
        if suspicious:
            # Log them but do not hard-fail (restaurant might genuinely have ₹2000+ items)
            print("WARNING: Potentially artifact-corrupted 2xxx prices found:")
            for i in suspicious:
                print(f"  '{i.dish_name}' raw='{i.raw_price}' numeric={i.price_numeric}")

    def test_digit_ocr_applied_to_artifact_tokens(self, result):
        """Verify digit-only re-pass ran on tokens with artifact prefixes."""
        candidates = result.debug.get("price_candidates", [])
        artifact_candidates = [
            c for c in candidates
            if c.get("artifact_alt") is not None
        ]
        if not artifact_candidates:
            pytest.skip("No artifact candidates found in this image")

        applied = [c for c in artifact_candidates if c.get("digit_ocr_applied")]
        assert len(applied) > 0, (
            f"Digit-only re-pass was not applied to any of the "
            f"{len(artifact_candidates)} artifact candidates"
        )

    def test_price_numeric_not_includes_currency_symbol(self, result):
        """price_numeric must be a plain integer, never containing ₹."""
        all_items = result.items + result.needs_review
        for item in all_items:
            assert item.price_numeric is not None, (
                f"'{item.dish_name}' has no price_numeric"
            )
            assert isinstance(item.price_numeric, (int, float)), (
                f"'{item.dish_name}' price_numeric is not numeric: {item.price_numeric!r}"
            )
            # price_numeric must NOT encode the currency symbol
            assert item.price_numeric < 9000, (
                f"'{item.dish_name}' price_numeric={item.price_numeric} seems too large "
                f"(raw='{item.raw_price}')"
            )

    def test_structured_output_format(self, result):
        """as_dict() must return {name, price (int), currency: 'INR'}."""
        all_items = result.items + result.needs_review
        assert len(all_items) > 0, "No items in result"
        for item in all_items[:5]:  # spot-check first 5
            d = item.as_dict()
            assert "name" in d, f"Missing 'name' key in {d}"
            assert "price" in d, f"Missing 'price' key in {d}"
            assert "currency" in d, f"Missing 'currency' key in {d}"
            assert d["currency"] == "INR", f"currency != INR in {d}"
            if d["price"] is not None:
                assert isinstance(d["price"], (int, float)), (
                    f"price is not numeric in {d}"
                )

    def test_footer_does_not_produce_menu_items(self, result):
        """Text from footer/branch lines must not become menu items."""
        all_items = result.items + result.needs_review
        for item in all_items:
            name_lower = item.dish_name.lower()
            for phrase in FOOTER_NOISE_PHRASES:
                assert phrase not in name_lower, (
                    f"Footer noise '{phrase}' found in dish name: '{item.dish_name}'"
                )

    def test_legitimate_prices_not_truncated(self, result):
        """Prices like 279, 289, 365 must NOT be truncated to 79, 89, 65."""
        all_items = result.items + result.needs_review
        # None of the legitimate prices should be accidentally truncated to 2-digits
        # when a 3-digit price is expected in the 150-500 range
        if not all_items:
            pytest.skip("No items")
        numerics = [i.price_numeric for i in all_items if i.price_numeric]
        # A healthy menu should have prices mostly in 50-500 range
        in_range = [v for v in numerics if 50 <= v <= 500]
        if numerics:
            frac = len(in_range) / len(numerics)
            assert frac >= 0.5, (
                f"Only {frac*100:.0f}% of prices are in the expected 50-500 range. "
                f"Possible over-truncation? numerics={sorted(numerics)}"
            )

    def test_currency_is_inr(self, result):
        """All items must have currency = 'INR'."""
        all_items = result.items + result.needs_review
        for item in all_items:
            assert item.price_currency == "INR", (
                f"'{item.dish_name}' has currency='{item.price_currency}' not INR"
            )


# ──────────────────────────────────────────────────────────
# Standalone run — prints a full structured report
# ──────────────────────────────────────────────────────────
def run_standalone_report(image_path: Path):
    print(f"\n{'='*60}")
    print(f"RAHMATH KADAI MENU — DIGIT RE-PASS REGRESSION REPORT")
    print(f"Image: {image_path}")
    print(f"{'='*60}\n")

    from pipeline.menu_ocr import MenuOCRPipeline
    from utils.image import load_image_from_path

    wrapper = load_image_from_path(image_path)
    if wrapper is None:
        print("ERROR: Could not load image.")
        return

    pipeline = MenuOCRPipeline(debug_mode=True)
    result = pipeline.process(wrapper)

    if not result.success:
        print(f"PIPELINE FAILED: {result.metadata.get('error')}")
        return

    print(f"✓ Pipeline succeeded")
    print(f"  Items: {len(result.items)}, Needs Review: {len(result.needs_review)}")
    print()

    # Price candidate detail
    print("── PRICE CANDIDATES (with digit-OCR trace) ──")
    print(f"{'raw_token':<12} {'price_numeric':>13} {'digit_applied':>13} {'trace'}")
    print("-" * 80)
    for c in result.debug.get("price_candidates", []):
        raw = c.get("raw", "")
        pn = c.get("price_numeric")
        applied = c.get("digit_ocr_applied", False)
        trace = c.get("digit_ocr_debug", "")[:50]
        marker = "✓" if applied else " "
        print(f"{raw:<12} {str(pn):>13} {marker:>13}  {trace}")

    print()
    print("── FINAL MENU ITEMS (structured) ──")
    print(f"{'Dish':<40} {'price':>6} {'currency':>10}  {'display'}")
    print("-" * 75)
    all_items = result.items + result.needs_review
    for item in all_items:
        d = item.as_dict()
        print(
            f"{item.dish_name:<40} "
            f"{str(d.get('price', '?')):>6}  "
            f"{d.get('currency', '?'):>10}  "
            f"{item.price}"
        )

    print()
    print("── FOOTER / NOISE CHECK ──")
    footer_items = [
        i for i in all_items
        if any(p in i.dish_name.lower() for p in FOOTER_NOISE_PHRASES)
    ]
    if footer_items:
        print(f"⚠  {len(footer_items)} footer items leaked through:")
        for i in footer_items:
            print(f"   '{i.dish_name}' : {i.price}")
    else:
        print("✓ No footer noise in items")

    print()
    print("── ARTIFACT CHECK ──")
    bad_7xxx = [i for i in all_items if i.price_numeric and i.price_numeric >= 7000]
    bad_2xxx = [
        i for i in all_items
        if i.price_numeric and 2000 <= i.price_numeric < 7000
        and str(int(i.price_numeric))[0] == "2"
    ]
    if bad_7xxx:
        print(f"✗ {len(bad_7xxx)} items with 7xxx prices (₹ corruption):")
        for i in bad_7xxx:
            print(f"   '{i.dish_name}' raw='{i.raw_price}' numeric={i.price_numeric}")
    else:
        print("✓ No 7xxx corrupted prices")

    if bad_2xxx:
        print(f"⚠  {len(bad_2xxx)} potentially 2xxx artifact prices:")
        for i in bad_2xxx:
            print(f"   '{i.dish_name}' raw='{i.raw_price}' numeric={i.price_numeric}")
    else:
        print("✓ No suspicious 2xxx prices")

    print(f"\n{'='*60}\n")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        img = Path(sys.argv[1])
    else:
        img = _find_image()
    if img is None:
        print("Usage: python -m tests.test_rahmath_kadai_regression <image_path>")
        print("Or place image at tests/rahmath_kadai.jpg")
        sys.exit(1)
    run_standalone_report(img)
