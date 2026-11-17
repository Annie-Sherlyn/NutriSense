"""
tests/create_test_images.py
Creates synthetic menu test images programmatically using PIL.
These images are used by the test suite when real menu images are not available.
"""

from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import os


# Try to get a monospace font; fall back to default
def _get_font(size: int = 24):
    font_candidates = [
        "consola.ttf",       # Windows Consolas
        "cour.ttf",          # Windows Courier
        "DejaVuSansMono.ttf",
        "LiberationMono-Regular.ttf",
        "FreeMono.ttf",
    ]
    for name in font_candidates:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            pass
    try:
        return ImageFont.load_default()
    except Exception:
        return None


def _make_menu_image(lines: list[str], filename: str, output_dir: Path) -> Path:
    """Create a white-background menu image from text lines."""
    font_size = 28
    font = _get_font(font_size)
    padding = 30
    line_height = font_size + 16

    # Measure image size
    max_len = max(len(l) for l in lines) if lines else 40
    width = max(600, max_len * (font_size // 2 + 2) + padding * 2)
    height = len(lines) * line_height + padding * 2

    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    y = padding
    for line in lines:
        draw.text((padding, y), line, fill=(0, 0, 0), font=font)
        y += line_height

    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / filename
    img.save(str(path))
    print(f"Created: {path}")
    return path


def create_test_a(output_dir: Path) -> Path:
    """TEST A: Basic standalone numbers."""
    return _make_menu_image([
        "IDLI                                    40",
        "VADA                                    30",
        "MASALA DOSA                             80",
    ], "test_a_basic.png", output_dir)


def create_test_b(output_dir: Path) -> Path:
    """TEST B: Various currency formats."""
    return _make_menu_image([
        "IDLI                                   Rs40",
        "VADA                                   Rs 30",
        "DOSA                                    70/-",
    ], "test_b_currency.png", output_dir)


def create_test_c(output_dir: Path) -> Path:
    """TEST C: Dotted leaders."""
    return _make_menu_image([
        "MASALA DOSA ........................   Rs80",
        "PANEER DOSA ........................  Rs120",
        "GHEE ROAST .........................   Rs90",
    ], "test_c_dots.png", output_dir)


def create_test_d(output_dir: Path) -> Path:
    """TEST D: Multi-word dishes."""
    return _make_menu_image([
        "GHEE ROAST MASALA DOSA                 120",
        "PANEER BUTTER MASALA                   180",
        "CHICKEN HYDERABADI BIRYANI             220",
        "MUSHROOM PEPPER FRY                    150",
    ], "test_d_multiword.png", output_dir)


def create_test_e(output_dir: Path) -> Path:
    """TEST E: Quantity protection."""
    return _make_menu_image([
        "CHICKEN WINGS          6 PCS           180",
        "SPRING ROLLS           4 PCS            80",
        "PANEER TIKKA           8 PCS           160",
    ], "test_e_quantity.png", output_dir)


def create_test_f(output_dir: Path) -> Path:
    """TEST F: Two columns."""
    return _make_menu_image([
        "IDLI              40       VEG BIRYANI           120",
        "VADA              30       PANEER RICE           100",
        "DOSA              70       CHICKEN BIRYANI       180",
    ], "test_f_twocol.png", output_dir)


def create_test_g(output_dir: Path) -> Path:
    """TEST G: Same price for different dishes."""
    return _make_menu_image([
        "IDLI                                    40",
        "VADA                                    40",
        "MINI IDLI                               40",
    ], "test_g_sameprice.png", output_dir)


def create_test_h(output_dir: Path) -> Path:
    """TEST H: Three-digit prices — must not be truncated."""
    return _make_menu_image([
        "PANEER DOSA                            120",
        "SPECIAL THALI                          180",
        "CHICKEN BIRYANI                        220",
        "FAMILY COMBO                           499",
    ], "test_h_threedigit.png", output_dir)


def create_all(output_dir: Path) -> list[Path]:
    """Create all synthetic test images."""
    return [
        create_test_a(output_dir),
        create_test_b(output_dir),
        create_test_c(output_dir),
        create_test_d(output_dir),
        create_test_e(output_dir),
        create_test_f(output_dir),
        create_test_g(output_dir),
        create_test_h(output_dir),
    ]


if __name__ == "__main__":
    out = Path("sample_images")
    paths = create_all(out)
    print(f"\nCreated {len(paths)} test images in {out}/")
