# NutriSense Menu OCR

**Final production-ready menu OCR pipeline for the NutriSense hackathon.**

Extracts `Dish Name -- Price` pairs from restaurant menu images using Tesseract OCR.

---

## Quick Start

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Tesseract Setup

### Windows
1. Download from https://github.com/UB-Mannheim/tesseract/wiki
2. Install to `C:\Program Files\Tesseract-OCR\`
3. Either add to PATH **or** set environment variable:
```cmd
set TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### Linux
```bash
sudo apt install tesseract-ocr
```

### macOS
```bash
brew install tesseract
```

---

## Architecture

```
MENU IMAGE
    ↓
Image Validation
    ↓
Preprocessing (original → upscaled → gray → adaptive → otsu)
    ↓
Tesseract OCR (PSM 6/11/12 × preprocessing variants)
    ↓
OCR Run Selection (quality-based, NOT "most tokens")
    ↓
Token Filtering (preserve raw_text, filter noise)
    ↓
Line Reconstruction (geometry-based, not Tesseract line_num)
    ↓
Price Detection (₹80 | Rs 80 | 80/- | standalone 80)
    ↓
Dish Detection (generic, no food database)
    ↓
Pairing Engine (7-signal scoring, prevents cross-column pairing)
    ↓
Post-processing (dedup, confidence, category)
    ↓
Annotation (separate dish box + price box)
    ↓
Streamlit UI
```

## Output Format

```
Masala Dosa -- ₹80
Idli -- ₹40
Vada -- ₹30
Paneer Dosa -- ₹120
```

## Key Design Principles

- **OCR bounding boxes are always preserved** — coordinates drive all pairing decisions
- **raw_text is NEVER modified** — traceability for debugging
- **Prices are never "invented" or "corrected"** — raw OCR value is preserved
- **Standalone numbers are contextually validated** — not every number is a price
- **Quantity conflict protection** — `6 PCS` → 6 is quantity, not price
- **Price column detection** — right-aligned numeric columns detected automatically
- **Two-column menu support** — left dish never paired with right price

## Running Tests

```bash
cd nutrisense_menu_ocr_final
python -m pytest tests/ -v
```

## Project Structure

```
nutrisense_menu_ocr_final/
├── app.py                    # Streamlit entry point
├── requirements.txt
├── config/settings.py        # All tunable parameters
├── models/schemas.py         # Typed data structures
├── ocr/
│   ├── engine.py             # Tesseract wrapper
│   ├── preprocessing.py      # 5 controlled variants
│   ├── token_extraction.py   # Filter & normalize tokens
│   ├── line_reconstruction.py# Geometry-based grouping
│   ├── price_detection.py    # All price formats + column detection
│   ├── dish_detection.py     # Generic dish phrase extraction
│   ├── pairing.py            # 7-signal scoring engine
│   ├── postprocessing.py     # Confidence, dedup, categories
│   └── annotation.py        # Debug + final image drawing
├── pipeline/menu_ocr.py      # Orchestrator
├── ui/streamlit_ui.py        # Frontend
├── tests/                    # Unit + integration tests
├── debug/                    # Debug images (saved when debug_mode=True)
└── sample_images/            # Test images
```
