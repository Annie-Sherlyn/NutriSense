"""
config/settings.py
Central configuration for NutriSense Menu OCR pipeline.
All thresholds, paths, and tunable parameters live here.
"""

import os
import sys
from pathlib import Path

# ─────────────────────────────────────────────
# TESSERACT PATH
# ─────────────────────────────────────────────
# Honour environment variable first.
# On Windows, install Tesseract from:
#   https://github.com/UB-Mannheim/tesseract/wiki
# Then either add it to PATH or set TESSERACT_CMD:
#   TESSERACT_CMD="C:\Program Files\Tesseract-OCR\tesseract.exe"
TESSERACT_CMD = os.environ.get("TESSERACT_CMD", None)

# ─────────────────────────────────────────────
# OCR ENGINE SETTINGS
# ─────────────────────────────────────────────
# Page segmentation modes to try:
#   6  = Assume a single uniform block of text.
#  11  = Sparse text. Find as much text as possible in no particular order.
#  12  = Sparse text with OSD.
PSM_MODES = [4, 6, 11, 12]

# Enable geometry-aware column splitting
ENABLE_COLUMN_SPLIT = True

# OCR engine mode (0=Legacy, 1=LSTM, 3=Both)
OEM_MODE = 3

# Minimum OCR word confidence to keep a token (0-100 scale from Tesseract)
MIN_TOKEN_CONFIDENCE = 20

# ─────────────────────────────────────────────
# PREPROCESSING VARIANTS
# ─────────────────────────────────────────────
PREPROCESSING_VARIANTS = ["original", "upscaled", "gray", "adaptive", "otsu"]

# Upscale factor for the "upscaled" variant
UPSCALE_FACTOR = 2.0

# Adaptive threshold block size (must be odd)
ADAPTIVE_BLOCK_SIZE = 31

# Adaptive threshold C constant (subtracted from mean)
ADAPTIVE_C = 10

# ─────────────────────────────────────────────
# LINE RECONSTRUCTION
# ─────────────────────────────────────────────
# Two tokens are on the same visual line when:
#   |center_y_A - center_y_B| / median_token_height  <  LINE_OVERLAP_RATIO
LINE_OVERLAP_RATIO = 0.6

# Minimum number of tokens to attempt line reconstruction
MIN_TOKENS_FOR_RECONSTRUCTION = 2

# ─────────────────────────────────────────────
# PRICE DETECTION
# ─────────────────────────────────────────────
# Valid price range (in rupees) — used for scoring only, NOT for hard rejection
PRICE_MIN = 1
PRICE_MAX = 9999

# Minimum digit characters in a price token
PRICE_MIN_DIGITS = 1

# Max digit characters (e.g., reject phone numbers with 10+ digits)
PRICE_MAX_DIGITS = 4

# Price types (for transparency)
PRICE_TYPE_CURRENCY = "CURRENCY_ATTACHED"
PRICE_TYPE_CURRENCY_SEPARATE = "CURRENCY_SEPARATE"
PRICE_TYPE_RS = "RS_PREFIX"
PRICE_TYPE_SUFFIX = "SUFFIX_PRICE"
PRICE_TYPE_STANDALONE = "STANDALONE_PRICE"
PRICE_TYPE_NON_PRICE = "NON_PRICE_NUMBER"
PRICE_TYPE_POSSIBLE_ARTIFACT = "POSSIBLE_RUPEE_ARTIFACT"

# ─────────────────────────────────────────────
# PRICE COLUMN DETECTION
# ─────────────────────────────────────────────
# If N or more price candidates share a similar x-coordinate, declare a price column.
PRICE_COLUMN_MIN_COUNT = 3

# Two x-coordinates are "similar" if they differ by at most this fraction of image width
PRICE_COLUMN_X_TOLERANCE_FRAC = 0.04

# ─────────────────────────────────────────────
# QUANTITY / UNIT PROTECTION
# ─────────────────────────────────────────────
QUANTITY_UNITS = {
    "pcs", "pc", "piece", "pieces",
    "ml", "l", "ltr", "litre", "liter", "litres", "liters",
    "kg", "g", "gm", "gram", "grams",
    "oz", "lb",
    "nos", "no",
    "servings", "serving",
    "portion", "portions",
}

# ─────────────────────────────────────────────
# DISH DETECTION
# ─────────────────────────────────────────────
# Minimum number of alphabetic characters for a token to be a dish word
DISH_MIN_ALPHA_CHARS = 2

# Section heading keywords — not dish names
SECTION_HEADINGS = {
    "breakfast", "lunch", "dinner", "brunch",
    "starters", "starter", "appetizer", "appetizers",
    "main", "mains", "maincourse", "main course",
    "sides", "side",
    "beverages", "beverage", "drinks", "drink",
    "desserts", "dessert", "sweets",
    "specials", "special", "chef's special",
    "veg", "non-veg", "nonveg",
    "soup", "soups",
    "salad", "salads",
    "rice", "breads", "bread",
    "menu", "welcome", "contact", "address",
    "dal", "curries", "curry",
}

# Header / footer keywords — not dish names
HEADER_FOOTER_KEYWORDS = {
    "hotel", "restaurant", "welcome", "menu",
    "special", "contact", "phone", "tel",
    "address", "email", "website", "www",
    "gst", "cgst", "sgst", "tax",
    "thank", "thanks", "visit", "again",
    "open", "closed", "timing", "timings",
    "takeaway", "delivery", "dine",
}

# Dotted / dashed leader pattern (these are NOT dish content)
LEADER_PATTERN = r'^[.\-_\s]+$'

# ─────────────────────────────────────────────
# PAIRING ENGINE
# ─────────────────────────────────────────────
# Scoring weights for dish-price pairing
PAIR_WEIGHT_SAME_LINE        = 2.0
PAIR_WEIGHT_DISH_LEFT_PRICE  = 1.5
PAIR_WEIGHT_PRICE_COLUMN     = 3.0
PAIR_WEIGHT_VERTICAL_ALIGN   = 3.5
PAIR_WEIGHT_SAME_BLOCK       = 1.0
PAIR_WEIGHT_ROW_CONSISTENCY  = 1.0
PAIR_WEIGHT_PROXIMITY        = 2.0   # normalized; decays with distance

# Minimum pair score to accept a pairing
MIN_PAIR_SCORE = 1.0

# Maximum vertical distance (as fraction of image height) to pair across rows
MAX_VERTICAL_DIST_FRAC = 0.08

# ─────────────────────────────────────────────
# CONFIDENCE THRESHOLDS
# ─────────────────────────────────────────────
HIGH_CONFIDENCE = 0.75
MEDIUM_CONFIDENCE = 0.50
LOW_CONFIDENCE = 0.0   # anything below MEDIUM goes to "Needs Review"

# ─────────────────────────────────────────────
# DEBUG
# ─────────────────────────────────────────────
DEBUG_DIR = Path("debug")

# ─────────────────────────────────────────────
# ANNOTATION COLOURS  (BGR for OpenCV)
# ─────────────────────────────────────────────
ANNOTATION_DISH_COLOR  = (0, 200, 50)    # green
ANNOTATION_PRICE_COLOR = (50, 50, 255)   # red
ANNOTATION_LINE_COLOR  = (200, 140, 0)   # teal/blue
ANNOTATION_THICKNESS   = 2
ANNOTATION_FONT_SCALE  = 0.5
