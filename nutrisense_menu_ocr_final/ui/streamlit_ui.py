"""
ui/streamlit_ui.py
NutriSense Menu OCR — Streamlit frontend.

Follows the specification exactly:
- Upload image (PNG/JPG/JPEG/WEBP)
- Analyze Menu button
- Results table: Dish Name | Price | Confidence
- Plain text output: Dish -- ₹Price
- Original image + annotated image side by side
- Expandable debug section
- Download buttons: annotated image, JSON, text
"""

from __future__ import annotations
import io
import json
from pathlib import Path

import numpy as np
import streamlit as st
from PIL import Image

from pipeline.menu_ocr import MenuOCRPipeline
from utils.image import load_image_from_bytes
from utils.logging_utils import get_logger

log = get_logger("ui.streamlit")


def _pipeline() -> MenuOCRPipeline:
    """Cache the pipeline so Tesseract isn't re-configured on every rerun."""
    if "pipeline" not in st.session_state:
        st.session_state["pipeline"] = MenuOCRPipeline(debug_mode=True)
    return st.session_state["pipeline"]


def _bgr_to_pil(arr: np.ndarray) -> Image.Image:
    import cv2
    return Image.fromarray(cv2.cvtColor(arr, cv2.COLOR_BGR2RGB))


def run_ui() -> None:
    # ── Page config ───────────────────────────────────────────────────────
    st.set_page_config(
        page_title="NutriSense | Menu OCR",
        page_icon="🍽️",
        layout="wide",
    )

    # ── Header ────────────────────────────────────────────────────────────
    st.title("🍽️ NutriSense")
    st.subheader("Menu OCR — Dish & Price Extractor")
    st.markdown(
        "Upload a restaurant menu image and extract every dish with its price."
    )
    st.divider()

    pipe = _pipeline()

    if not pipe.tesseract_ok:
        st.error(
            "⚠️ **Tesseract OCR not found.**\n\n"
            "Please install Tesseract and either:\n"
            "- Add it to your system PATH, or\n"
            "- Set the `TESSERACT_CMD` environment variable.\n\n"
            "**Windows example:**\n"
            "```\nset TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe\n```"
        )
        return

    # ── Upload ────────────────────────────────────────────────────────────
    uploaded = st.file_uploader(
        "Upload a restaurant menu image",
        type=["png", "jpg", "jpeg", "webp"],
        help="Supports printed menus, screenshots, and photos.",
    )

    if uploaded is None:
        st.info("👆 Upload a menu image to get started.")
        return

    image_bytes = uploaded.read()
    wrapper = load_image_from_bytes(image_bytes, name=uploaded.name)
    if wrapper is None:
        st.error("Could not load the image. Please try a different file.")
        return

    # ── Analyze button ────────────────────────────────────────────────────
    if st.button("🔍 Analyze Menu", type="primary", use_container_width=True):
        with st.spinner("Running OCR pipeline…"):
            result = pipe.process(wrapper)

        st.session_state["result"] = result
        st.session_state["wrapper"] = wrapper

    # ── Results ───────────────────────────────────────────────────────────
    if "result" not in st.session_state:
        return

    result = st.session_state["result"]
    wrapper = st.session_state["wrapper"]

    if not result.success:
        st.error(f"❌ OCR failed: {result.metadata.get('error', 'Unknown error')}")
        return

    st.success(
        f"✅ Found **{len(result.items)}** items "
        f"({len(result.needs_review)} need review) "
        f"in {result.metadata.get('processing_time_ms', '?')} ms"
    )

    # ── Detected Items Table ──────────────────────────────────────────────
    st.markdown("### 🍛 Detected Menu Items")
    if result.items:
        table_data = {
            "Dish Name": [i.dish_name for i in result.items],
            "Price": [i.price for i in result.items],
            "Confidence": [f"{int(i.confidence * 100)}%" for i in result.items],
            "Category": [i.category or "—" for i in result.items],
        }
        st.dataframe(table_data, use_container_width=True, hide_index=True)
    else:
        st.warning("No high-confidence items found.")

    if result.needs_review:
        with st.expander(f"⚠️ Needs Review ({len(result.needs_review)} items)"):
            review_data = {
                "Dish Name": [i.dish_name for i in result.needs_review],
                "Price": [i.price for i in result.needs_review],
                "Confidence": [f"{int(i.confidence * 100)}%" for i in result.needs_review],
            }
            st.dataframe(review_data, use_container_width=True, hide_index=True)

    # ── Plain text output ─────────────────────────────────────────────────
    st.markdown("### 📋 Text Output")
    text_output = result.format_text()
    st.code(text_output, language=None)

    # ── Image columns ─────────────────────────────────────────────────────
    st.markdown("### 🖼️ Visualisation")
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Original Image**")
        pil_orig = _bgr_to_pil(wrapper.array)
        st.image(pil_orig, use_container_width=True)

    with col2:
        st.markdown("**OCR Annotation** — 🟩 Dish  🟥 Price  — line connects pairs")
        annotated = getattr(result, "annotated_image", None)
        if annotated is not None:
            pil_ann = _bgr_to_pil(annotated)
            st.image(pil_ann, use_container_width=True)
        else:
            st.info("No annotated image available.")

    # ── Downloads ─────────────────────────────────────────────────────────
    st.markdown("### ⬇️ Downloads")
    dl_col1, dl_col2, dl_col3 = st.columns(3)

    with dl_col1:
        if annotated is not None:
            pil_ann_dl = _bgr_to_pil(annotated)
            buf = io.BytesIO()
            pil_ann_dl.save(buf, format="PNG")
            st.download_button(
                "📥 Annotated Image",
                data=buf.getvalue(),
                file_name="nutrisense_annotated.png",
                mime="image/png",
                use_container_width=True,
            )

    with dl_col2:
        json_str = json.dumps(result.as_dict(), indent=2, ensure_ascii=False)
        st.download_button(
            "📥 JSON Results",
            data=json_str.encode("utf-8"),
            file_name="nutrisense_results.json",
            mime="application/json",
            use_container_width=True,
        )

    with dl_col3:
        st.download_button(
            "📥 Text Output",
            data=text_output.encode("utf-8"),
            file_name="nutrisense_menu.txt",
            mime="text/plain",
            use_container_width=True,
        )

    # ── Debug Section ─────────────────────────────────────────────────────
    with st.expander("🔧 Debug Information"):
        dbg = result.debug

        col_a, col_b = st.columns(2)
        with col_a:
            st.markdown("**Pipeline Metadata**")
            meta = result.metadata
            st.json({
                "Tesseract version": meta.get("tesseract_version"),
                "PSM used": meta.get("psm_used"),
                "Preprocessing variant": meta.get("preprocessing_used"),
                "Token count (valid)": meta.get("token_count"),
                "Price candidates": meta.get("price_candidate_count"),
                "Dish candidates": meta.get("dish_candidate_count"),
                "Processing time (ms)": meta.get("processing_time_ms"),
                "Image size": f"{meta.get('image_width')}×{meta.get('image_height')}",
            })

        with col_b:
            st.markdown("**OCR Run Scores**")
            if "ocr_run_metadata" in dbg:
                st.dataframe(dbg["ocr_run_metadata"], use_container_width=True, hide_index=True)

        st.markdown("**Reconstructed Lines**")
        if "lines_text" in dbg:
            for i, line_text in enumerate(dbg["lines_text"]):
                st.text(f"  Line {i:2d}: {line_text}")

        st.markdown("**Price Candidates**")
        if "price_candidates" in dbg:
            st.dataframe(dbg["price_candidates"], use_container_width=True, hide_index=True)

        st.markdown("**Dish Candidates**")
        if "dish_candidates" in dbg:
            st.dataframe(dbg["dish_candidates"], use_container_width=True, hide_index=True)

        st.markdown("**Full JSON**")
        st.json(result.as_dict())
