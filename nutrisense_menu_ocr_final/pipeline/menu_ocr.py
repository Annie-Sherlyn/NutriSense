"""
pipeline/menu_ocr.py
The main MenuOCRPipeline — the entry point for all OCR processing.

Usage:
    from pipeline.menu_ocr import MenuOCRPipeline
    pipeline = MenuOCRPipeline()
    result = pipeline.process(image_wrapper)

This module orchestrates all stages in order:
  1. Image validation
  2. Preprocessing
  3. Tesseract OCR (multiple PSM × preprocessing variants)
  4. Run selection (quality-based, not "most tokens")
  5. Token extraction / filtering
  6. Line reconstruction
  7. Price detection
  8. Dish detection
  9. Dish-price pairing
 10. Post-processing
 11. Annotation
"""

from __future__ import annotations
import time
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import numpy as np

from config.settings import (
    PSM_MODES,
    PREPROCESSING_VARIANTS,
    DEBUG_DIR,
    ENABLE_COLUMN_SPLIT,
)
from models.schemas import (
    OCRToken,
    VisualLine,
    PriceCandidate,
    DishCandidate,
    MenuItem,
    PipelineResult,
    OCRRunMetadata,
)
from ocr.engine import configure_tesseract, get_tesseract_version, run_ocr_on_image, select_best_ocr_run
from ocr.layout import run_column_split_ocr
from ocr.preprocessing import create_preprocessing_variants
from ocr.token_extraction import filter_and_tag_tokens
from ocr.line_reconstruction import reconstruct_lines
from ocr.price_detection import detect_price_candidates, validate_price_candidate
from ocr.dish_detection import detect_dish_candidates
from ocr.pairing import pair_dishes_and_prices
from ocr.postprocessing import build_menu_items
from ocr.annotation import (
    annotate_final,
    annotate_ocr_tokens,
    annotate_price_candidates,
    annotate_dish_candidates,
    save_debug_image,
)
from utils.image import ImageWrapper, validate_image
from utils.logging_utils import get_logger

log = get_logger("pipeline.menu_ocr")


class MenuOCRPipeline:
    """
    End-to-end menu OCR pipeline.

    Attributes:
        debug_mode   — when True, saves debug images and includes full debug data
        tesseract_ok — set after configure() is called
    """

    def __init__(self, debug_mode: bool = False):
        self.debug_mode = debug_mode
        self.tesseract_ok = False
        self._configure()

    def _configure(self) -> None:
        self.tesseract_ok = configure_tesseract()
        if not self.tesseract_ok:
            log.error(
                "Tesseract not found! Set TESSERACT_CMD environment variable or add Tesseract to PATH.\n"
                "Windows example: set TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
            )

    def process(
        self,
        wrapper: ImageWrapper,
        debug_dir: Optional[Path] = None,
        """
        Run the full OCR pipeline on an ImageWrapper.

        Args:
            wrapper    — loaded image (use utils.image.load_image_from_*)
            debug_dir  — if provided, debug images are saved here

        Returns:
            PipelineResult with items, needs_review, metadata, and optional debug data.
        """
        start_time = time.time()
        dbg: Dict[str, Any] = {}

        if not self.tesseract_ok:
            return PipelineResult(
                success=False,
                items=[],
                needs_review=[],
                metadata={"error": "Tesseract not available"},
            )

        # ── STAGE 1: Image Validation ─────────────────────────────────────
        ok, msg = validate_image(wrapper)
        if not ok:
            return PipelineResult(
                success=False,
                items=[],
                needs_review=[],
                metadata={"error": msg},
            )
        log.info(f"Image validated: {wrapper.original_width}×{wrapper.original_height}")

        # ── STAGE 2: Preprocessing ────────────────────────────────────────
        variants = create_preprocessing_variants(wrapper)
        log.info(f"Preprocessing variants: {list(variants.keys())}")

        if self.debug_mode:
            _ddir = debug_dir or DEBUG_DIR
            for name, var in variants.items():
                save_debug_image(var.array, f"02_prep_{name}", _ddir)

        # ── STAGE 3: Tesseract OCR (all PSM × 2 primary variants) ─────────
        # We run the most useful variants first:
        # - original + upscaled for primary runs
        # - gray / adaptive / otsu as fallbacks if primary runs are weak
        primary_variants = ["original", "upscaled"]
        fallback_variants = ["gray", "adaptive", "otsu"]

        all_runs: List[Tuple[List[OCRToken], OCRRunMetadata]] = []

        for variant_name in primary_variants:
            var = variants[variant_name]
            for psm in PSM_MODES:
                if ENABLE_COLUMN_SPLIT:
                    tokens, meta = run_column_split_ocr(var, psm)
                else:
                    tokens, meta = run_ocr_on_image(var, psm)
                all_runs.append((tokens, meta))

        # Run fallbacks only if primary runs found < 5 price candidates combined
        primary_prices = sum(r[1].valid_price_count for r in all_runs)
        if primary_prices < 5:
            log.info("Primary runs found few prices — trying fallback variants")
            for variant_name in fallback_variants:
                var = variants[variant_name]
                for psm in PSM_MODES[:2]:  # PSM 4 and 6 only for fallbacks
                    if ENABLE_COLUMN_SPLIT:
                        tokens, meta = run_column_split_ocr(var, psm)
                    else:
                        tokens, meta = run_ocr_on_image(var, psm)
                    all_runs.append((tokens, meta))

        # ── STAGE 4: Run Selection ────────────────────────────────────────
        best_tokens, best_meta = select_best_ocr_run(all_runs)
        best_variant = variants[best_meta.preprocessing_variant]

        dbg["ocr_run_metadata"] = [
            {
                "variant": m.preprocessing_variant,
                "psm": m.psm_mode,
                "tokens": m.token_count,
                "avg_conf": round(m.avg_confidence, 1),
                "prices": m.valid_price_count,
                "score": round(m.score, 2),
            }
            for _, m in all_runs
        ]
        dbg["selected_variant"] = best_meta.preprocessing_variant
        dbg["selected_psm"] = best_meta.psm_mode

        if self.debug_mode:
            _ddir = debug_dir or DEBUG_DIR
            raw_vis = annotate_ocr_tokens(wrapper, best_tokens, best_variant)
            save_debug_image(raw_vis, "05_ocr_tokens", _ddir)

        # ── STAGE 5: Token Extraction / Filtering ─────────────────────────
        valid_tokens, noise_tokens = filter_and_tag_tokens(best_tokens)
        log.info(f"Tokens: {len(best_tokens)} raw → {len(valid_tokens)} valid, {len(noise_tokens)} noise")
        dbg["token_count_raw"] = len(best_tokens)
        dbg["token_count_valid"] = len(valid_tokens)

        if not valid_tokens:
            return PipelineResult(
                success=False,
                items=[],
                needs_review=[],
                metadata={
                    "error": "No valid OCR tokens found",
                    "image_width": wrapper.original_width,
                    "image_height": wrapper.original_height,
                },
                debug=dbg,
            )

        # ── STAGE 6: Line Reconstruction ──────────────────────────────────
        lines = reconstruct_lines(valid_tokens)
        log.info(f"Line reconstruction: {len(valid_tokens)} tokens → {len(lines)} lines")
        dbg["line_count"] = len(lines)
        dbg["lines_text"] = [line.full_text() for line in lines]

        # ── STAGE 7: Price Detection ───────────────────────────────────────
        price_candidates = detect_price_candidates(
            lines,
            best_variant.width,
            source_image=best_variant.array,  # enables digit-only OCR re-pass
        )
        dbg["price_candidates"] = [
            {
                "raw": pc.raw_text,
                "norm": pc.normalized_text,
                "type": pc.price_type,
                "val": pc.numeric_value,
                "price_numeric": pc.price_numeric,
                "digit_ocr_applied": pc.digit_ocr_applied,
                "digit_ocr_debug": pc.digit_ocr_debug,
                "conf": round(pc.price_confidence, 3),
                "in_column": pc.in_price_column,
                "qty_conflict": pc.quantity_conflict,
                "line": pc.line_index,
                "artifact_alt": pc.artifact_alternative,
                "raw_score": pc.raw_score,
                "artifact_score": pc.currency_artifact_score,
                "debug_info": pc.debug_info,
                "structured": pc.as_structured(),
            }
            for pc in price_candidates
        ]

        if self.debug_mode:
            _ddir = debug_dir or DEBUG_DIR
            pc_vis = annotate_price_candidates(wrapper, price_candidates, best_variant)
            save_debug_image(pc_vis, "06_price_candidates", _ddir)

        # ── STAGE 8: Dish Detection ────────────────────────────────────────
        dish_candidates = detect_dish_candidates(lines, price_candidates)
        dbg["dish_candidates"] = [
            {
                "raw": dc.raw_text,
                "display": dc.normalized_text,
                "heading": dc.is_section_heading,
                "line": dc.line_index,
            }
            for dc in dish_candidates
        ]

        if self.debug_mode:
            _ddir = debug_dir or DEBUG_DIR
            dc_vis = annotate_dish_candidates(wrapper, dish_candidates, best_variant)
            save_debug_image(dc_vis, "07_dish_candidates", _ddir)

        # ── STAGE 9: Dish-Price Pairing ────────────────────────────────────
        pairs = pair_dishes_and_prices(
            dish_candidates,
            price_candidates,
            lines,
            best_variant.width,
            best_variant.height,
        )
        dbg["pair_count"] = len(pairs)

        # ── STAGE 10: Post-processing ──────────────────────────────────────
        items, needs_review = build_menu_items(pairs, price_candidates, dish_candidates)

        # ── STAGE 11: Annotation ───────────────────────────────────────────
        annotated_img = annotate_final(wrapper, items, needs_review, best_variant)
        if self.debug_mode:
            _ddir = debug_dir or DEBUG_DIR
            save_debug_image(annotated_img, "09_final", _ddir)

        elapsed_ms = int((time.time() - start_time) * 1000)

        metadata = {
            "image_width": wrapper.original_width,
            "image_height": wrapper.original_height,
            "processing_time_ms": elapsed_ms,
            "preprocessing_used": best_meta.preprocessing_variant,
            "psm_used": best_meta.psm_mode,
            "tesseract_version": get_tesseract_version(),
            "token_count": len(valid_tokens),
            "price_candidate_count": len(price_candidates),
            "dish_candidate_count": len(dish_candidates),
        }

        log.info(
            f"Pipeline complete: {len(items)} items, {len(needs_review)} needs review "
            f"({elapsed_ms}ms)"
        )

        result = PipelineResult(
            success=True,
            items=items,
            needs_review=needs_review,
            metadata=metadata,
            debug=dbg,
        )
        result.annotated_image = annotated_img  # type: ignore[attr-defined]
        return result
