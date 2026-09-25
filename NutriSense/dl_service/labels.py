import os
import sys
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

from config import CLASSES_JSON_PATH, NON_FOOD_CLASS_NAME, NON_FOOD_CLASS_ID

logger = logging.getLogger("NutriSense.Vision.Labels")

class LabelRegistry:
    """
    Class Registry and Canonical Dish Name Normalizer.
    Reads all class metadata and mappings dynamically at runtime from classes.json.
    NEVER hardcodes dish names.
    """
    def __init__(self, json_path: Path = CLASSES_JSON_PATH, include_non_food: bool = False):
        self.json_path = json_path
        self.include_non_food = include_non_food
        self.classes: List[str] = []
        self.class_meta: List[Dict[str, Any]] = []
        self.folder_to_index: Dict[str, int] = {}
        self.folder_to_canonical: Dict[str, str] = {}
        self.canonical_to_folder: Dict[str, str] = {}
        self.folder_to_meta: Dict[str, Dict[str, Any]] = {}
        self.reload()

    def reload(self):
        """Loads and parses classes metadata from disk."""
        if not self.json_path.exists():
            raise FileNotFoundError(f"Classes JSON file not found at: {self.json_path}")

        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        raw_classes = data.get("classes", [])
        self.classes = []
        self.class_meta = []
        self.folder_to_index = {}
        self.folder_to_canonical = {}
        self.canonical_to_folder = {}
        self.folder_to_meta = {}

        for idx, item in enumerate(raw_classes):
            folder = item["folderName"]
            self.classes.append(folder)
            self.class_meta.append(item)
            self.folder_to_index[folder] = idx
            self.folder_to_meta[folder] = item

            # Canonical naming derived from existing project food id schema:
            # e.g. "food-chapati" -> "chapati"
            # e.g. "food-french-fries" -> "french_fries"
            # e.g. "food-boiled-egg" -> "boiled_egg"
            # e.g. "food-paneer-curry" -> "paneer_curry"
            raw_id = item.get("id", "")
            if raw_id.startswith("food-"):
                canonical_slug = raw_id[5:].replace("-", "_").lower().strip()
            else:
                canonical_slug = folder.replace(" ", "_").replace("-", "_").lower().strip()

            self.folder_to_canonical[folder] = canonical_slug
            self.canonical_to_folder[canonical_slug] = folder

        if self.include_non_food:
            non_food_idx = len(self.classes)
            self.classes.append(NON_FOOD_CLASS_NAME)
            non_food_meta = {
                "index": non_food_idx,
                "folderName": NON_FOOD_CLASS_NAME,
                "id": NON_FOOD_CLASS_ID,
                "name": "Non Food / Background",
                "regionalName": "உணவு அல்லாத பகுதி",
                "category": "background",
                "estimatedKcal": "0 kcal",
                "image": "/images/food/curry.svg"
            }
            self.class_meta.append(non_food_meta)
            self.folder_to_index[NON_FOOD_CLASS_NAME] = non_food_idx
            self.folder_to_meta[NON_FOOD_CLASS_NAME] = non_food_meta
            self.folder_to_canonical[NON_FOOD_CLASS_NAME] = NON_FOOD_CLASS_NAME
            self.canonical_to_folder[NON_FOOD_CLASS_NAME] = NON_FOOD_CLASS_NAME

        logger.info(f"Loaded {len(self.classes)} classes from {self.json_path}")

    @property
    def num_classes(self) -> int:
        return len(self.classes)

    def get_canonical_name(self, folder_or_name: str) -> str:
        """
        Normalizes any dataset class or dish name to its canonical identifier.
        e.g. 'chappathi' -> 'chapati'
             'fires' -> 'french_fries'
             'panneer masal' -> 'paneer_curry'
        """
        key = folder_or_name.strip()
        if key in self.folder_to_canonical:
            return self.folder_to_canonical[key]

        # Case-insensitive lookup
        key_lower = key.lower()
        for f, c in self.folder_to_canonical.items():
            if f.lower() == key_lower:
                return c

        # If unknown, produce a standardized snake_case slug
        slug = key_lower.replace(" ", "_").replace("-", "_")
        return slug

    def get_meta(self, folder_or_idx: Any) -> Optional[Dict[str, Any]]:
        """Returns the full metadata dictionary for a class."""
        if isinstance(folder_or_idx, int):
            if 0 <= folder_or_idx < len(self.class_meta):
                return self.class_meta[folder_or_idx]
            return None
        return self.folder_to_meta.get(str(folder_or_idx))

    def add_temporary_class_for_testing(self, folder_name: str, display_name: str, food_id: str):
        """Used by test suite to verify dynamic generalization when a new class is added at runtime."""
        idx = len(self.classes)
        meta = {
            "index": idx,
            "folderName": folder_name,
            "id": food_id,
            "name": display_name,
            "regionalName": display_name,
            "category": "custom",
            "estimatedKcal": "100–150 kcal",
            "image": "/images/food/snack.svg"
        }
        self.classes.append(folder_name)
        self.class_meta.append(meta)
        self.folder_to_index[folder_name] = idx
        self.folder_to_meta[folder_name] = meta
        raw_id = food_id[5:] if food_id.startswith("food-") else food_id
        canonical_slug = raw_id.replace("-", "_").lower().strip()
        self.folder_to_canonical[folder_name] = canonical_slug
        self.canonical_to_folder[canonical_slug] = folder_name

# Global default instance
labels_registry = LabelRegistry()
