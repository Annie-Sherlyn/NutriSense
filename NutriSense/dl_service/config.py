import os
import logging
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger("NutriSense.Vision.Config")

# Base Paths
WORKSPACE_ROOT = Path(__file__).parent.parent.resolve()
DL_SERVICE_ROOT = Path(__file__).parent.resolve()
DATASET_ROOT = WORKSPACE_ROOT / "Dataset"
CLASSES_JSON_PATH = DL_SERVICE_ROOT / "classes.json"
CHECKPOINT_DIR = DL_SERVICE_ROOT / "checkpoints"
CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_CHECKPOINT_PATH = CHECKPOINT_DIR / "best_food_model.keras"
FINE_TUNED_MODEL_PATH = CHECKPOINT_DIR / "finetuned_food_model.keras"

# Input Dimensions
INPUT_IMAGE_SIZE = (224, 224)
INPUT_CHANNELS = 3

# Confidence Thresholds
CONFIDENCE_HIGH = 0.80     # >= 0.80 -> Accepted, needs_confirmation = False
CONFIDENCE_MEDIUM = 0.50   # 0.50 <= conf < 0.80 -> Uncertain, needs_confirmation = True
CONFIDENCE_LOW = 0.50      # < 0.50 -> Rejected / treated as background

# Region Proposal Parameters (Class-Agnostic OpenCV)
MIN_PROPOSAL_AREA_FRAC = 0.02   # Min 2% of total image area
MAX_PROPOSAL_AREA_FRAC = 0.85   # Max 85% of total image area
MIN_ASPECT_RATIO = 0.30         # Min width / height
MAX_ASPECT_RATIO = 3.20         # Max width / height
PROPOSAL_NMS_IOU = 0.55         # IoU threshold for raw candidate proposal deduplication
MAX_PROPOSALS = 24              # Maximum candidate crops passed to classifier
MIN_CROP_PIXELS = 32            # Discard crops smaller than 32x32 pixels

# Postprocessing & Duplicate Removal
IOU_NMS_THRESHOLD = 0.30        # Overlap threshold to merge duplicate detections of same dish
CONTAINMENT_THRESHOLD = 0.45    # Sub-crop / nested box suppression threshold

# Non-food / Background Handling
NON_FOOD_CLASS_NAME = "non_food"
NON_FOOD_CLASS_ID = "food-non-food"

# Config-driven Discrete vs. Non-Discrete Food Configuration
# Discrete items: distinct individual countable units (quantity = integer count)
# Non-discrete items: mounds, gravies, curries, bowls, portion servings (quantity = null)
DISCRETE_CLASSES: Dict[str, bool] = {
    # Discrete (Countable items)
    "boiled egg": True,
    "idly": True,
    "medu vada": True,
    "parupu vadai": True,
    "poori": True,
    "chappathi": True,
    "samosa": True,
    "burger": True,
    "apple": True,
    "banana": True,

    # Non-Discrete (Portion / serving based)
    "dosa": False,
    "sambar": False,
    "puthina chutney": False,
    "sadham": False,
    "sambar sadham": False,
    "biriyani": False,
    "ven pongal": False,
    "koozh": False,
    "beetroot poriyal": False,
    "carrot poriyal": False,
    "channa masala": False,
    "panneer masal": False,
    "noodles": False,
    "pizza": False,
    "fires": False,
    "murukku": False,
    "mysore pak": False,
    "Jalebi": False,
    "non_food": False
}

def is_discrete_class(class_name: str) -> bool:
    """
    Determines whether a food item is discrete (countable) or non-discrete.
    GENERALIZATION: If a class is not present in DISCRETE_CLASSES, it defaults
    to non-discrete (False) and logs a warning so it gets configured deliberately.
    """
    key = class_name.lower().strip()
    if key in DISCRETE_CLASSES:
        return DISCRETE_CLASSES[key]

    # Try matching without underscores / dashes
    cleaned_key = key.replace("_", " ").replace("-", " ")
    for k, v in DISCRETE_CLASSES.items():
        if k.lower() == cleaned_key:
            return v

    logger.warning(
        f"[Config Generalization Warning]: Class '{class_name}' is not explicitly defined in "
        f"DISCRETE_CLASSES. Defaulting to non-discrete (quantity: null). "
        f"Please update config.DISCRETE_CLASSES deliberately."
    )
    return False
