"""
utils/image.py
Image loading, validation, and scale-tracking utilities.
"""

from __future__ import annotations
from pathlib import Path
from typing import Tuple, Optional
import numpy as np
import cv2
from PIL import Image

from utils.logging_utils import get_logger

log = get_logger("utils.image")


class ImageWrapper:
    """
    Carries an image array together with the original dimensions and
    the scale factors needed to map back to original coordinates.

    This is crucial: every preprocessing variant must know how to map
    its pixel coordinates back to the ORIGINAL image.
    """

    def __init__(
        self,
        array: np.ndarray,
        original_width: int,
        original_height: int,
        name: str = "unknown",
    ):
        self.array = array
        self.original_width = original_width
        self.original_height = original_height
        self.name = name

    @property
    def height(self) -> int:
        return self.array.shape[0]

    @property
    def width(self) -> int:
        return self.array.shape[1]

    @property
    def scale_x(self) -> float:
        return self.original_width / self.width

    @property
    def scale_y(self) -> float:
        return self.original_height / self.height

    def to_original_coords(
        self, x: int, y: int, w: int, h: int
    ) -> Tuple[int, int, int, int]:
        """Map processed image coordinates back to original image coordinates."""
        ox = int(x * self.scale_x)
        oy = int(y * self.scale_y)
        ow = int(w * self.scale_x)
        oh = int(h * self.scale_y)
        return ox, oy, ow, oh


def load_image_from_path(path: Path) -> Optional[ImageWrapper]:
    """Load an image from a file path using PIL then convert to BGR numpy array."""
    try:
        pil_img = Image.open(path).convert("RGB")
        arr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        h, w = arr.shape[:2]
        log.debug(f"Loaded image: {path.name}  {w}×{h}")
        return ImageWrapper(arr, w, h, name=path.stem)
    except Exception as e:
        log.error(f"Failed to load image {path}: {e}")
        return None


def load_image_from_bytes(data: bytes, name: str = "upload") -> Optional[ImageWrapper]:
    """Load an image from raw bytes (e.g., Streamlit upload)."""
    try:
        arr = np.frombuffer(data, np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError("cv2.imdecode returned None")
        h, w = bgr.shape[:2]
        log.debug(f"Loaded image from bytes: {name}  {w}×{h}")
        return ImageWrapper(bgr, w, h, name=name)
    except Exception as e:
        log.error(f"Failed to load image from bytes: {e}")
        return None


def validate_image(wrapper: ImageWrapper) -> Tuple[bool, str]:
    """Basic sanity checks on the loaded image."""
    w, h = wrapper.width, wrapper.height
    if w < 50 or h < 50:
        return False, f"Image too small: {w}×{h}"
    if w > 20000 or h > 20000:
        return False, f"Image suspiciously large: {w}×{h}"
    if wrapper.array is None or wrapper.array.size == 0:
        return False, "Empty image array"
    return True, "OK"


def bgr_to_pil(arr: np.ndarray) -> Image.Image:
    """Convert BGR numpy array to PIL Image."""
    return Image.fromarray(cv2.cvtColor(arr, cv2.COLOR_BGR2RGB))


def pil_to_bgr(img: Image.Image) -> np.ndarray:
    """Convert PIL Image to BGR numpy array."""
    return cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)
