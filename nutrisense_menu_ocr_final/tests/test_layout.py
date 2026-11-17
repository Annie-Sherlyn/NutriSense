import pytest
import numpy as np
import cv2
from utils.image import ImageWrapper
from ocr.layout import find_column_split, split_image_vertical

class TestLayoutSplit:
    def _create_mock_image(self, width: int, height: int, split_x: int = None, noise: bool = False) -> ImageWrapper:
        # Create a white image (black text on white background is typical)
        arr = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        # Add "text" as black blocks
        # Left column
        arr[50:150, 50:split_x-50 if split_x else int(width*0.4)] = 0
        # Right column
        arr[50:150, split_x+50 if split_x else int(width*0.6):width-50] = 0
        
        if split_x and noise:
            # Add some light vertical noise that should be ignored by morphology
            # 1 pixel wide line in the middle of the gap
            arr[:, split_x] = 100
            
        return ImageWrapper(arr, width, height, name="test")

    def test_find_column_split_clear_gap(self):
        """1 & 3: Test finding gap and translating coordinates (concept)."""
        wrapper = self._create_mock_image(800, 200, split_x=400)
        split = find_column_split(wrapper)
        # 400 is the exact middle
        assert split is not None
        assert 350 <= split <= 450

    def test_find_column_split_with_noise(self):
        """Test morphology handles thin vertical noise in the gap."""
        wrapper = self._create_mock_image(800, 200, split_x=400, noise=True)
        split = find_column_split(wrapper)
        assert split is not None
        assert 350 <= split <= 450

    def test_column_split_fallback_no_gap(self):
        """2. Column split fallback when no gap exists."""
        # Create an image completely filled with black "text" across the middle
        arr = np.ones((200, 800, 3), dtype=np.uint8) * 255
        arr[50:150, 100:700] = 0 # Text spans across the middle
        wrapper = ImageWrapper(arr, 800, 200, name="test")
        
        split = find_column_split(wrapper)
        assert split is None

    def test_split_image_vertical(self):
        """Test the actual cropping logic."""
        wrapper = self._create_mock_image(800, 200, split_x=400)
        left, right = split_image_vertical(wrapper, 400)
        
        assert left.original_width == 400
        assert left.original_height == 200
        assert right.original_width == 400
        assert right.original_height == 200
