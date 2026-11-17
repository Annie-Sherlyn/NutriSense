"""
models/schemas.py
Typed dataclasses for every internal and external data structure.
All pipeline stages exchange these objects — never raw dicts.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


# ─────────────────────────────────────────────
# RAW OCR TOKEN
# ─────────────────────────────────────────────
@dataclass
class OCRToken:
    """One word-level result from pytesseract.image_to_data()."""
    raw_text: str           # Exactly what Tesseract returned
    normalized_text: str    # Cleaned for analysis (preserved separately)
    confidence: float       # 0–100
    x: int
    y: int
    width: int
    height: int
    block_num: int
    par_num: int
    line_num: int
    word_num: int

    # Derived fields populated after reconstruction
    center_x: float = field(init=False)
    center_y: float = field(init=False)

    def __post_init__(self):
        self.center_x = self.x + self.width / 2
        self.center_y = self.y + self.height / 2

    def right(self) -> int:
        return self.x + self.width

    def bottom(self) -> int:
        return self.y + self.height


# ─────────────────────────────────────────────
# RECONSTRUCTED VISUAL LINE
# ─────────────────────────────────────────────
@dataclass
class VisualLine:
    """A group of OCR tokens that lie on the same visual row."""
    tokens: List[OCRToken]
    line_index: int          # Sequential index assigned by line reconstructor

    def left_x(self) -> int:
        if not self.tokens:
            return 0
        return min(t.x for t in self.tokens)

    def right_x(self) -> int:
        if not self.tokens:
            return 0
        return max(t.right() for t in self.tokens)

    def top_y(self) -> int:
        if not self.tokens:
            return 0
        return min(t.y for t in self.tokens)

    def bottom_y(self) -> int:
        if not self.tokens:
            return 0
        return max(t.bottom() for t in self.tokens)

    def center_y(self) -> float:
        if not self.tokens:
            return 0.0
        return sum(t.center_y for t in self.tokens) / len(self.tokens)

    def height(self) -> float:
        if not self.tokens:
            return 0.0
        return self.bottom_y() - self.top_y()

    def full_text(self) -> str:
        return " ".join(t.normalized_text for t in sorted(self.tokens, key=lambda t: t.x))

    def sorted_tokens(self) -> List[OCRToken]:
        return sorted(self.tokens, key=lambda t: t.x)


# ─────────────────────────────────────────────
# BOUNDING BOX
# ─────────────────────────────────────────────
@dataclass
class BBox:
    x: int
    y: int
    width: int
    height: int

    def as_dict(self) -> Dict[str, int]:
        return {"x": self.x, "y": self.y, "width": self.width, "height": self.height}

    def right(self) -> int:
        return self.x + self.width

    def bottom(self) -> int:
        return self.y + self.height

    def center_x(self) -> float:
        return self.x + self.width / 2

    def center_y(self) -> float:
        return self.y + self.height / 2


# ─────────────────────────────────────────────
# PRICE CANDIDATE
# ─────────────────────────────────────────────
@dataclass
class PriceCandidate:
    raw_text: str           # Raw OCR text of the price token(s)
    normalized_text: str    # e.g. "80", "120.00"
    price_type: str         # CURRENCY_ATTACHED | RS_PREFIX | SUFFIX_PRICE | STANDALONE_PRICE | POSSIBLE_RUPEE_ARTIFACT
    numeric_value: float    # Parsed float value
    bbox: BBox
    ocr_confidence: float   # Average OCR confidence of contributing tokens
    price_confidence: float # Our computed confidence that this is actually a price
    source_tokens: List[OCRToken] = field(default_factory=list)
    in_price_column: bool = False
    quantity_conflict: bool = False  # True if adjacent to a unit keyword
    line_index: int = -1
    debug_info: str = ""
    
    # Currency Artifact alternatives
    artifact_alternative: Optional[float] = None
    currency_artifact_score: float = 0.0
    raw_score: float = 0.0
    
    footer_penalty: float = 0.0
    address_penalty: float = 0.0

    # ── Structured price representation ─────────────────────────────────
    # These are populated by the digit-only OCR re-pass.
    # price_numeric: the clean integer/float price WITHOUT any currency symbol
    # price_currency: always "INR" for this pipeline
    # digit_ocr_debug: traceable debug string from the re-pass
    price_numeric: Optional[float] = None   # e.g. 169  (not 7169)
    price_currency: str = "INR"
    digit_ocr_applied: bool = False         # True if digit-only re-pass ran
    digit_ocr_debug: str = ""              # human-readable trace

    def effective_numeric_value(self) -> float:
        """
        Returns price_numeric if the digit-only re-pass ran successfully,
        otherwise falls back to numeric_value.
        This is the value the display layer should use.
        """
        if self.digit_ocr_applied and self.price_numeric is not None:
            return self.price_numeric
        return self.numeric_value

    def as_structured(self) -> dict:
        """
        Target contract:
            { "price": 169, "currency": "INR", "raw_price_text": "₹169" }
        """
        val = self.effective_numeric_value()
        int_val = int(val) if val == int(val) else val
        return {
            "price": int_val,
            "currency": self.price_currency,
            "raw_price_text": self.raw_text,
        }



# ─────────────────────────────────────────────
# DISH CANDIDATE
# ─────────────────────────────────────────────
@dataclass
class DishCandidate:
    raw_text: str           # Raw OCR text (space-joined tokens in original case)
    normalized_text: str    # Cleaned/title-cased version
    bbox: BBox
    ocr_confidence: float
    source_tokens: List[OCRToken] = field(default_factory=list)
    line_index: int = -1
    debug_info: str = ""
    is_section_heading: bool = False


# ─────────────────────────────────────────────
# MENU ITEM (final paired result)
# ─────────────────────────────────────────────
@dataclass
class MenuItem:
    dish_name: str           # Title-cased display name
    price: str               # Display string e.g. "₹80" (for UI only)
    raw_dish_name: str       # Original OCR text
    raw_price: str           # Original OCR price text
    price_type: str
    dish_bbox: BBox
    price_bbox: BBox
    confidence: float        # Pair confidence 0.0–1.0
    category: Optional[str] = None
    # Structured price — the canonical internal representation
    price_numeric: Optional[float] = None   # e.g. 169 (not 7169, not "₹169")
    price_currency: str = "INR"

    def as_dict(self) -> Dict[str, Any]:
        val = self.price_numeric
        if val is not None:
            int_val = int(val) if val == int(val) else val
        else:
            int_val = None
        return {
            # Structured price contract
            "name": self.dish_name,
            "price": int_val,
            "currency": self.price_currency,
            # Legacy / display fields
            "dish_name": self.dish_name,
            "price_display": self.price,
            "raw_dish_name": self.raw_dish_name,
            "raw_price": self.raw_price,
            "price_type": self.price_type,
            "dish_bbox": self.dish_bbox.as_dict(),
            "price_bbox": self.price_bbox.as_dict(),
            "confidence": round(self.confidence, 4),
            "category": self.category,
        }

    def format_text(self) -> str:
        return f"{self.dish_name} -- {self.price}"



# ─────────────────────────────────────────────
# PIPELINE RESULT
# ─────────────────────────────────────────────
@dataclass
class PipelineResult:
    success: bool
    items: List[MenuItem]
    needs_review: List[MenuItem]   # Low-confidence pairs
    metadata: Dict[str, Any]
    debug: Dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "items": [i.as_dict() for i in self.items],
            "needs_review": [i.as_dict() for i in self.needs_review],
            "metadata": self.metadata,
        }

    def format_text(self) -> str:
        lines = [i.format_text() for i in self.items]
        if self.needs_review:
            lines.append("\n--- Needs Review ---")
            lines.extend(i.format_text() for i in self.needs_review)
        return "\n".join(lines)


# ─────────────────────────────────────────────
# OCR RUN METADATA (for scoring which run is best)
# ─────────────────────────────────────────────
@dataclass
class OCRRunMetadata:
    preprocessing_variant: str
    psm_mode: int
    token_count: int
    avg_confidence: float
    valid_price_count: int
    valid_text_density: float   # fraction of tokens with confidence > MIN_TOKEN_CONFIDENCE
    duplicate_rate: float       # fraction of duplicate text tokens
    score: float = 0.0          # computed selection score
