"""
app.py — NutriSense Menu OCR
Entry point. Run with: streamlit run app.py
"""

import sys
from pathlib import Path

# Ensure project root is on path when running via streamlit
sys.path.insert(0, str(Path(__file__).parent))

from ui.streamlit_ui import run_ui

if __name__ == "__main__" or True:
    run_ui()
