from typing import Optional, List, Tuple
import cv2
import numpy as np

from utils.image import ImageWrapper
from models.schemas import OCRToken, OCRRunMetadata
from ocr.engine import run_ocr_on_image
from utils.logging_utils import get_logger

log = get_logger("ocr.layout")

def find_column_split(wrapper: ImageWrapper) -> Optional[int]:
    """
    Find a vertical split line in the image if it exists.
    Returns the x-coordinate of the split, or None if no reliable split is found.
    """
    arr = wrapper.array
    if len(arr.shape) == 3:
        gray = cv2.cvtColor(arr, cv2.COLOR_BGR2GRAY)
    else:
        gray = arr
        
    # Invert so text is white (255) and background is black (0)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Use morphology to remove thin vertical lines and noise (e.g. watermarks)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    
    # Calculate vertical projection profile (sum of columns)
    proj = np.sum(cleaned, axis=0) / 255.0
    
    # We want a continuous block of 0s near the middle of the image.
    h, w = binary.shape
    start_x = int(w * 0.35)
    end_x = int(w * 0.65)
    
    # Allow some noise (e.g. up to 2 pixels high per column)
    noise_thresh = 2
    gap_cols = np.where(proj[start_x:end_x] <= noise_thresh)[0] + start_x
    
    if len(gap_cols) == 0:
        return None
        
    # Find the largest continuous gap
    from itertools import groupby
    from operator import itemgetter
    
    ranges = []
    for k, g in groupby(enumerate(gap_cols), lambda ix: ix[0] - ix[1]):
        group = list(map(itemgetter(1), g))
        ranges.append((group[0], group[-1]))
        
    if not ranges:
        return None
        
    # Get the widest gap
    best_gap = max(ranges, key=lambda r: r[1] - r[0])
    gap_width = best_gap[1] - best_gap[0]
    
    # If gap is too narrow (e.g. < 2% of image width), ignore it
    if gap_width < w * 0.02:
        return None
        
    split_x = best_gap[0] + gap_width // 2
    log.info(f"Found layout column split at x={split_x} (width={gap_width})")
    return split_x

def split_image_vertical(wrapper: ImageWrapper, split_x: int) -> Tuple[ImageWrapper, ImageWrapper]:
    left_arr = wrapper.array[:, :split_x]
    right_arr = wrapper.array[:, split_x:]
    
    w1, h1 = left_arr.shape[1], left_arr.shape[0]
    w2, h2 = right_arr.shape[1], right_arr.shape[0]
    
    left_wrap = ImageWrapper(left_arr, w1, h1, name=f"{wrapper.name}_left")
    right_wrap = ImageWrapper(right_arr, w2, h2, name=f"{wrapper.name}_right")
    return left_wrap, right_wrap

def run_column_split_ocr(wrapper: ImageWrapper, psm: int) -> Tuple[List[OCRToken], OCRRunMetadata]:
    """
    Attempts to detect a two-column layout. If found, splits the image, runs OCR independently
    on each half, translates the right half's coordinates back, and merges the results.
    If no split is found, runs full-image OCR.
    """
    split_x = find_column_split(wrapper)
    if not split_x:
        log.debug(f"No column split found for {wrapper.name}. Falling back to full image OCR.")
        return run_ocr_on_image(wrapper, psm)
        
    left_wrap, right_wrap = split_image_vertical(wrapper, split_x)
    
    # Run OCR independently
    left_tokens, left_meta = run_ocr_on_image(left_wrap, psm)
    right_tokens, right_meta = run_ocr_on_image(right_wrap, psm)
    
    # Adjust right tokens coordinates
    max_block = max([t.block_num for t in left_tokens] + [0])
    for t in right_tokens:
        t.x += split_x
        t.center_x = t.x + t.width / 2.0
        t.block_num += max_block
        
    merged_tokens = left_tokens + right_tokens
    
    # Merge metadata
    # avg_conf weighted by token count
    tot_tokens = left_meta.token_count + right_meta.token_count
    if tot_tokens > 0:
        avg_conf = (left_meta.avg_confidence * left_meta.token_count + right_meta.avg_confidence * right_meta.token_count) / tot_tokens
    else:
        avg_conf = 0.0
        
    valid_prices = left_meta.valid_price_count + right_meta.valid_price_count
    
    # Simple average for density and dup_rate (good enough for selection)
    valid_density = (left_meta.valid_text_density + right_meta.valid_text_density) / 2.0
    dup_rate = (left_meta.duplicate_rate + right_meta.duplicate_rate) / 2.0
    
    meta = OCRRunMetadata(
        preprocessing_variant=wrapper.name,
        psm_mode=psm,
        token_count=tot_tokens,
        avg_confidence=avg_conf,
        valid_price_count=valid_prices,
        valid_text_density=valid_density,
        duplicate_rate=dup_rate
    )
    
    log.info(f"Merged split OCR: {tot_tokens} tokens, {valid_prices} prices")
    return merged_tokens, meta

