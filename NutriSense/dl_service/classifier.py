import os
import sys
import logging
from pathlib import Path
from typing import List, Dict, Any, Union, Optional
import numpy as np
from PIL import Image
import keras

from config import (
    MODEL_CHECKPOINT_PATH,
    FINE_TUNED_MODEL_PATH,
    INPUT_IMAGE_SIZE,
    CONFIDENCE_LOW,
    CONFIDENCE_HIGH,
    NON_FOOD_CLASS_NAME
)
from labels import labels_registry, LabelRegistry

logger = logging.getLogger("NutriSense.Vision.Classifier")

class CropClassifier:
    """
    Per-crop Food Classifier wrapping the pretrained MobileNetV2 architecture.
    Classifies cropped candidate food regions against the dynamically loaded class list.
    """
    def __init__(
        self,
        model_path: Optional[Path] = None,
        registry: Optional[LabelRegistry] = None
    ):
        self.registry = registry or labels_registry
        self.model_path = model_path or (
            FINE_TUNED_MODEL_PATH if FINE_TUNED_MODEL_PATH.exists() else MODEL_CHECKPOINT_PATH
        )
        self.model = None
        self.load_model()

    def load_model(self):
        """Loads Keras model checkpoint into memory."""
        if self.model_path and self.model_path.exists():
            logger.info(f"Loading FoodClassifier model from: {self.model_path}")
            self.model = keras.models.load_model(str(self.model_path))
            logger.info("Classifier model loaded successfully.")

            # Dynamically adapt registry to model output dimension if non_food class is present
            if hasattr(self.model, "output_shape") and len(self.model.output_shape) > 1:
                out_classes = self.model.output_shape[-1]
                if out_classes > len(self.registry.classes):
                    self.registry.include_non_food = True
                    self.registry.reload()
        else:
            logger.warning(f"No checkpoint found at: {self.model_path}. Model remains uninitialized.")

    def preprocess_crop(self, crop: Union[Image.Image, np.ndarray]) -> np.ndarray:
        """
        Preprocesses a single image crop:
        Converts to RGB, resizes to (224, 224), normalizes to [-1, 1].
        """
        if isinstance(crop, np.ndarray):
            if crop.dtype != np.uint8:
                crop = (crop * 255).astype(np.uint8)
            crop_pil = Image.fromarray(crop)
        elif isinstance(crop, Image.Image):
            crop_pil = crop
        else:
            raise TypeError("Unsupported crop type")

        crop_pil = crop_pil.convert("RGB")
        crop_pil = crop_pil.resize(INPUT_IMAGE_SIZE, Image.Resampling.BILINEAR)
        arr = np.array(crop_pil, dtype=np.float32)
        # MobileNetV2 normalization [-1, 1]
        arr = (arr / 127.5) - 1.0
        return arr

    def predict_crops(
        self,
        crops: List[Union[Image.Image, np.ndarray]],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Batch prediction over a list of image crops.
        """
        if not crops:
            return []

        if self.model is None:
            raise RuntimeError("Model is not loaded. Train or provide a valid checkpoint.")

        batch_tensors = np.array([self.preprocess_crop(c) for c in crops])
        preds_batch = self.model.predict(batch_tensors, verbose=0)

        results = []
        for preds in preds_batch:
            top_indices = np.argsort(preds)[::-1]
            top_idx = int(top_indices[0])
            top_conf = float(preds[top_idx])

            meta = self.registry.get_meta(top_idx)
            if meta:
                raw_folder = meta["folderName"]
            elif 0 <= top_idx < len(self.registry.classes):
                raw_folder = self.registry.classes[top_idx]
            else:
                raw_folder = NON_FOOD_CLASS_NAME

            canonical_name = self.registry.get_canonical_name(raw_folder)
            is_non_food = (raw_folder == NON_FOOD_CLASS_NAME) or (top_conf < CONFIDENCE_LOW)

            top_candidates = []
            for rank_idx in top_indices[:top_k]:
                idx_int = int(rank_idx)
                c_meta = self.registry.get_meta(idx_int)
                if c_meta:
                    c_folder = c_meta["folderName"]
                elif 0 <= idx_int < len(self.registry.classes):
                    c_folder = self.registry.classes[idx_int]
                else:
                    c_folder = NON_FOOD_CLASS_NAME

                top_candidates.append({
                    "dish_name": self.registry.get_canonical_name(c_folder),
                    "folderName": c_folder,
                    "name": c_meta.get("name", c_folder) if c_meta else c_folder,
                    "confidence": round(float(preds[idx_int]), 4),
                    "id": c_meta.get("id", f"food-{c_folder}") if c_meta else f"food-{c_folder}",
                    "estimatedKcal": c_meta.get("estimatedKcal", "") if c_meta else "",
                    "image": c_meta.get("image", "/images/food/curry.svg") if c_meta else "/images/food/curry.svg"
                })

            results.append({
                "dish_name": canonical_name,
                "raw_class": raw_folder,
                "confidence": round(top_conf, 4),
                "is_non_food": is_non_food,
                "meta": meta,
                "candidates": top_candidates
            })

        return results
