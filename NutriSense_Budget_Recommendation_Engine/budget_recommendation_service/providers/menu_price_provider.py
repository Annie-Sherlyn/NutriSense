"""
Menu Price Provider Abstraction and Future OCR Adapter.
Isolates the Budget Recommendation Engine from OCR internals.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
import json
import re
from pathlib import Path

from ..models import MenuItemInput, MenuInput
from ..config import DEFAULT_MOCK_MENU_PATH

# Canonical Food Name Resolver mapping raw OCR text / dish names to canonical IDs
DISH_NAME_TO_CANONICAL: Dict[str, str] = {
    "dosa": "dosa",
    "plain dosa": "dosa",
    "crispy dosa": "dosa",
    "masala dosa": "dosa",
    "ghee roast dosa": "dosa",
    "idly": "idly",
    "idli": "idly",
    "steamed idli": "idly",
    "ven pongal": "ven_pongal",
    "ghee ven pongal": "ven_pongal",
    "pongal": "ven_pongal",
    "poori": "poori",
    "puri": "poori",
    "poori masala": "poori",
    "medu vada": "medu_vada",
    "medhu vada": "medu_vada",
    "vada": "medu_vada",
    "koozh": "koozh",
    "ragi koozh": "koozh",
    "parupu vadai": "parupu_vadai",
    "paruppu vadai": "parupu_vadai",
    "chana dal vada": "parupu_vadai",
    "boiled egg": "boiled_egg",
    "egg": "boiled_egg",
    "puthina chutney": "puthina_chutney",
    "mint chutney": "puthina_chutney",
    "sambar": "sambar",
    "biriyani": "biriyani",
    "hyderabadi biriyani": "biriyani",
    "beetroot poriyal": "beetroot_poriyal",
    "carrot poriyal": "carrot_poriyal",
    "sambar sadham": "sambar_sadham",
    "sambar rice": "sambar_sadham",
    "sadham": "sadham",
    "plain rice": "sadham",
    "steamed rice": "sadham",
    "paneer masala": "paneer_masala",
    "paneer butter masala": "paneer_masala",
    "chappathi": "chappathi",
    "chapati": "chappathi",
    "roti": "chappathi",
    "noodles": "noodles",
    "veg noodles": "noodles",
    "pizza": "pizza",
    "veg pizza": "pizza",
    "samosa": "samosa",
    "mysore pak": "mysore_pak",
    "jalebi": "jalebi",
    "murukku": "murukku",
    "burger": "burger",
    "veg burger": "burger",
    "fries": "fries",
    "french fries": "fries",
    "apple": "apple",
    "fresh apple": "apple",
    "banana": "banana",
    "fresh banana": "banana",
    "channa masala": "channa_masala",
    "chole": "channa_masala",
}

def resolve_canonical_id(dish_name: str, explicit_id: Optional[str] = None) -> Optional[str]:
    """Resolves an OCR dish name or explicit ID to the canonical food ID."""
    if explicit_id:
        clean = explicit_id.lower().replace("-", "_")
        if clean.startswith("food_"):
            clean = clean[5:]
        return clean

    clean_name = re.sub(r"[^a-zA-Z0-9\s]", "", dish_name).strip().lower()
    if clean_name in DISH_NAME_TO_CANONICAL:
        return DISH_NAME_TO_CANONICAL[clean_name]

    # Partial substring search
    for name_key, can_id in DISH_NAME_TO_CANONICAL.items():
        if name_key in clean_name or clean_name in name_key:
            return can_id

    return None

class MenuPriceProvider(ABC):
    """Abstract interface supplying current menu items and prices."""

    @abstractmethod
    def get_menu_items(self, menu_input: Optional[MenuInput] = None) -> Dict[str, MenuItemInput]:
        """Returns mapping of canonical food_id -> MenuItemInput."""
        pass

class MockMenuPriceProvider(MenuPriceProvider):
    """
    Mock Menu Price Provider.
    Extracts menu items from mock_menu.json or runtime MenuInput.
    """

    def __init__(self, json_path: Path = DEFAULT_MOCK_MENU_PATH):
        self.json_path = json_path

    def get_menu_items(self, menu_input: Optional[MenuInput] = None) -> Dict[str, MenuItemInput]:
        items_map: Dict[str, MenuItemInput] = {}

        # 1. If runtime menu_input was supplied, use it
        if menu_input and menu_input.items:
            for item in menu_input.items:
                can_id = resolve_canonical_id(item.dish_name, item.food_id)
                if can_id:
                    items_map[can_id] = MenuItemInput(
                        dish_name=item.dish_name,
                        food_id=can_id,
                        price=float(item.price),
                        confidence=item.confidence or 1.0
                    )
            return items_map

        # 2. Otherwise load default mock menu file
        if self.json_path.exists():
            with open(self.json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for item_dict in data.get("items", []):
                item = MenuItemInput(**item_dict)
                can_id = resolve_canonical_id(item.dish_name, item.food_id)
                if can_id:
                    items_map[can_id] = MenuItemInput(
                        dish_name=item.dish_name,
                        food_id=can_id,
                        price=float(item.price),
                        confidence=item.confidence or 1.0
                    )

        return items_map

class OCRMenuPriceAdapter(MenuPriceProvider):
    """
    Future OCR Menu Price Adapter.
    Accepts raw unstructured/semi-structured OCR output, normalizes dish names
    via the canonical resolver, and provides standard MenuItemInput records.
    """

    def __init__(self, raw_ocr_data: Optional[Dict[str, Any]] = None):
        self.raw_ocr_data = raw_ocr_data or {}

    def set_ocr_data(self, raw_ocr_data: Dict[str, Any]):
        self.raw_ocr_data = raw_ocr_data

    def get_menu_items(self, menu_input: Optional[MenuInput] = None) -> Dict[str, MenuItemInput]:
        # If standard MenuInput is passed, delegate
        if menu_input and menu_input.items:
            return MockMenuPriceProvider().get_menu_items(menu_input)

        items_map: Dict[str, MenuItemInput] = {}
        raw_items = self.raw_ocr_data.get("items", [])
        for entry in raw_items:
            dish_name = entry.get("dish_name") or entry.get("name") or ""
            price_val = entry.get("price")
            conf = entry.get("confidence", 0.90)

            if not dish_name or price_val is None:
                continue

            can_id = resolve_canonical_id(dish_name)
            if can_id:
                try:
                    price_float = float(price_val)
                    items_map[can_id] = MenuItemInput(
                        dish_name=dish_name,
                        food_id=can_id,
                        price=price_float,
                        confidence=float(conf)
                    )
                except ValueError:
                    continue

        return items_map
