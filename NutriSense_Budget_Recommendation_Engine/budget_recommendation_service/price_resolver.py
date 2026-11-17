from typing import Dict, Optional, List
from .models import ResolvedPrice, MenuItemInput, PastOrderRecord
from .repositories.price_repository import PriceBandRepository

class PriceResolver:
    """
    Resolves the effective price and price provenance for candidate foods:
    1. If food exists in current menu -> uses current menu price (source: 'current_menu')
    2. Else if user has previously scanned order/menu history in database -> uses average price (source: 'user_history_avg')
    3. Else (new user / no history) -> uses price_typical from seed price bands (source: 'local_price_band')
    4. Else -> returns effective_price=None (source: 'unknown')
    """

    def __init__(self, price_repo: PriceBandRepository):
        self.price_repo = price_repo

    def resolve_price(
        self,
        food_id: str,
        current_menu_items: Optional[Dict[str, MenuItemInput]] = None,
        user_id: Optional[str] = None,
        order_history: Optional[List[PastOrderRecord]] = None
    ) -> ResolvedPrice:
        clean_id = food_id.lower().replace("-", "_")
        if clean_id.startswith("food_"):
            clean_id = clean_id[5:]

        # 1. Check current menu prices first (active session menu override)
        if current_menu_items:
            menu_item = current_menu_items.get(clean_id) or current_menu_items.get(food_id)
            if menu_item:
                conf_str = f"{menu_item.confidence:.2f}" if menu_item.confidence is not None else "high"
                return ResolvedPrice(
                    effective_price=menu_item.price,
                    source="current_menu",
                    confidence=conf_str
                )

        # 2. Check user's previous order / menu screenshot OCR history
        # Direct order_history in request payload
        if order_history:
            past_prices = [
                h.price for h in order_history
                if (h.food_id.lower().replace("-", "_") == clean_id or h.food_id == food_id) and h.price > 0
            ]
            if past_prices:
                avg_price = round(sum(past_prices) / len(past_prices), 2)
                return ResolvedPrice(
                    effective_price=avg_price,
                    source="user_history_avg",
                    confidence="high"
                )

        # Or database stored history via user_id
        if user_id:
            db_avg = self.price_repo.get_user_historical_average_price(user_id, clean_id)
            if db_avg is not None and db_avg > 0:
                return ResolvedPrice(
                    effective_price=db_avg,
                    source="user_history_avg",
                    confidence="high"
                )

        # 3. New User Cold Start / Fallback to local seed price bands
        band = self.price_repo.get_price_band(clean_id) or self.price_repo.get_price_band(food_id)
        if band and band.price_typical is not None:
            return ResolvedPrice(
                effective_price=band.price_typical,
                source="local_price_band",
                confidence=band.confidence or "medium"
            )

        # 4. Price unknown
        return ResolvedPrice(
            effective_price=None,
            source="unknown",
            confidence="none"
        )
