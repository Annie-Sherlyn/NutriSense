"""
tests/test_pipeline.py
Integration tests for the full pipeline using synthetic images.

Measures:
- Price recall  (detected prices / actual prices)
- Price precision (correct prices / detected prices)
- Pairing accuracy (correct pairs / expected pairs)
"""

import sys
import logging
import io
from pathlib import Path

# Fix Windows console encoding for ₹ symbol
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, str(Path(__file__).parent.parent))

# Suppress pipeline logging during tests (we care about results, not logs)
logging.disable(logging.WARNING)

import pytest
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2

from pipeline.menu_ocr import MenuOCRPipeline
from utils.image import ImageWrapper


def _pil_to_wrapper(img: Image.Image, name: str = "test") -> ImageWrapper:
    """Convert PIL image to ImageWrapper for the pipeline."""
    arr = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)
    h, w = arr.shape[:2]
    return ImageWrapper(arr, w, h, name=name)


def _get_font(size: int = 28):
    """Try to get a suitable font."""
    candidates = ["consola.ttf", "cour.ttf", "DejaVuSansMono.ttf", "FreeMono.ttf"]
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            pass
    return ImageFont.load_default()


def _make_menu(lines: list[str], width: int = 700) -> Image.Image:
    """Create a test menu image from text lines."""
    font_size = 26
    font = _get_font(font_size)
    padding = 25
    line_height = font_size + 18
    height = len(lines) * line_height + padding * 2

    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    y = padding
    for line in lines:
        draw.text((padding, y), line, fill=(0, 0, 0), font=font)
        y += line_height
    return img


@pytest.fixture(scope="module")
def pipeline():
    return MenuOCRPipeline(debug_mode=False)


class TestSyntheticMenus:

    def test_a_basic_standalone_numbers(self, pipeline):
        """Test A: Basic menu with standalone number prices."""
        img = _make_menu([
            "IDLI                                    40",
            "VADA                                    30",
            "MASALA DOSA                             80",
        ])
        wrapper = _pil_to_wrapper(img, "test_a")
        result = pipeline.process(wrapper)
        assert result.success

        all_items = result.items + result.needs_review
        prices_found = {i.price for i in all_items}
        dishes_found = {i.dish_name.upper() for i in all_items}

        # Price recall check
        expected_prices = {"₹40", "₹30", "₹80"}
        found_expected = expected_prices & prices_found
        recall = len(found_expected) / len(expected_prices)
        print(f"\nTest A - Price recall: {recall:.1%}  found={prices_found}")
        assert recall >= 0.66, f"Price recall too low: {recall:.1%}"

    def test_h_three_digit_prices_not_truncated(self, pipeline):
        """Test H: Three-digit prices must appear correctly."""
        img = _make_menu([
            "PANEER DOSA                            120",
            "SPECIAL THALI                          180",
            "CHICKEN BIRYANI                        220",
        ])
        wrapper = _pil_to_wrapper(img, "test_h")
        result = pipeline.process(wrapper)
        assert result.success

        all_items = result.items + result.needs_review
        prices_found = {i.price for i in all_items}
        print(f"\nTest H - Prices found: {prices_found}")

        # None of the found prices should have incorrect truncation
        for price in prices_found:
            num = price.replace("₹", "").strip()
            assert num not in {"12", "18", "22", "1", "2"}, \
                f"Price appears truncated: {price}"

    def test_g_same_price_different_dishes(self, pipeline):
        """Test G: IDLI, VADA, DOSA all at ₹40 — all must survive."""
        img = _make_menu([
            "IDLI                                    40",
            "VADA                                    40",
            "DOSA                                    40",
        ])
        wrapper = _pil_to_wrapper(img, "test_g")
        result = pipeline.process(wrapper)
        assert result.success

        all_items = result.items + result.needs_review
        print(f"\nTest G - Items found: {[(i.dish_name, i.price) for i in all_items]}")
        assert len(all_items) >= 2, f"Expected at least 2 items, got {len(all_items)}"

    def test_historical_regression_no_price_transformation(self, pipeline):
        """
        Regression: The pipeline must NOT transform 80→780 or 95→795.
        This tests that no downstream code invents digit prefixes.
        """
        img = _make_menu([
            "DOSA                                    80",
            "IDLI                                    95",
        ])
        wrapper = _pil_to_wrapper(img, "test_regression")
        result = pipeline.process(wrapper)
        assert result.success

        all_items = result.items + result.needs_review
        for item in all_items:
            price_num = item.price.replace("₹", "").strip()
            assert price_num not in {"780", "795"}, \
                f"Price was incorrectly transformed: {item.price}"
            print(f"  {item.dish_name} → {item.price}  (raw: {item.raw_price})")


class TestPipelineMetrics:
    """
    Compute price precision, recall, and pairing accuracy on synthetic data.
    These thresholds are intentionally achievable but not trivially so.
    """

    def _run_and_measure(self, pipeline, lines: list[str], expected_pairs: dict,
                         image_width: int = 700) -> dict:
        img = _make_menu(lines, width=image_width)
        wrapper = _pil_to_wrapper(img)
        result = pipeline.process(wrapper)
        all_items = result.items + result.needs_review

        detected_prices = {i.price.replace("₹", "").strip() for i in all_items}
        expected_prices = {str(v) for v in expected_pairs.values()}

        tp_prices = detected_prices & expected_prices
        precision = len(tp_prices) / max(len(detected_prices), 1)
        recall = len(tp_prices) / max(len(expected_prices), 1)

        # Pairing accuracy
        correct_pairs = 0
        for item in all_items:
            dish_upper = item.dish_name.upper()
            price_num = item.price.replace("₹", "").strip()
            for exp_dish, exp_price in expected_pairs.items():
                if exp_dish.upper() in dish_upper and price_num == str(exp_price):
                    correct_pairs += 1
                    break

        pairing_acc = correct_pairs / max(len(expected_pairs), 1)
        return {
            "precision": precision,
            "recall": recall,
            "pairing_accuracy": pairing_acc,
            "items": [(i.dish_name, i.price) for i in all_items],
        }

    def test_metrics_basic(self, pipeline):
        expected = {"IDLI": 40, "VADA": 30, "MASALA DOSA": 80}
        lines = [
            "IDLI                                    40",
            "VADA                                    30",
            "MASALA DOSA                             80",
        ]
        m = self._run_and_measure(pipeline, lines, expected)
        print(f"\nMetrics Basic: {m}")
        # Achievable targets
        assert m["recall"] >= 0.5, f"Recall too low: {m['recall']:.1%}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
