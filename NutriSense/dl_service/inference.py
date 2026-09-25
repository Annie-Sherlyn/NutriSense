import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any, Union, Optional
import numpy as np
from PIL import Image
import keras

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from config import (
    CLASSES_JSON_PATH,
    MODEL_CHECKPOINT_PATH,
    FINE_TUNED_MODEL_PATH,
    CONFIDENCE_LOW,
    CONFIDENCE_HIGH,
    INPUT_IMAGE_SIZE,
    NON_FOOD_CLASS_NAME
)
from labels import labels_registry, LabelRegistry

CONFIDENCE_THRESHOLD = 0.20

class FoodClassifier:
    """
    Food Classifier for single-image and batch-crop classification.
    Supports both base trained model and fine-tuned model with non-food rejection.
    """
    def __init__(self, model_path: Optional[Path] = None, registry: Optional[LabelRegistry] = None):
        self.registry = registry or labels_registry
        if model_path is not None:
            self.model_path = Path(model_path)
        elif FINE_TUNED_MODEL_PATH.exists():
            self.model_path = FINE_TUNED_MODEL_PATH
        else:
            self.model_path = MODEL_CHECKPOINT_PATH

        self.model = None

        if self.model_path.exists():
            print(f"[DL Service] Loading trained model from {self.model_path}...")
            self.model = keras.models.load_model(str(self.model_path))
            print("[DL Service] Model loaded successfully.")
            if hasattr(self.model, "output_shape") and len(self.model.output_shape) > 1:
                out_classes = self.model.output_shape[-1]
                if out_classes > len(self.registry.classes):
                    self.registry.include_non_food = True
                    self.registry.reload()
        else:
            print(f"[DL Service] Warning: Checkpoint not found at {self.model_path}. Please train first.")

        self.class_meta = self.registry.class_meta
        self.classes = self.registry.classes
        self.num_classes = len(self.classes)

    def preprocess(self, image: Union[str, bytes, Image.Image]) -> np.ndarray:
        if isinstance(image, str):
            img = Image.open(image)
        elif isinstance(image, bytes):
            import io
            img = Image.open(io.BytesIO(image))
        elif isinstance(image, Image.Image):
            img = image
        else:
            raise ValueError("Unsupported image type")

        img = img.convert("RGB")
        img = img.resize(INPUT_IMAGE_SIZE, Image.Resampling.BILINEAR)
        arr = np.array(img, dtype=np.float32)
        # Scale to [-1, 1] for MobileNetV2
        arr = (arr / 127.5) - 1.0
        return np.expand_dims(arr, axis=0)

    def predict(self, image: Union[str, bytes, Image.Image], top_k: int = 3) -> Dict[str, Any]:
        if self.model is None:
            raise RuntimeError("Model is not loaded. Train the model before running inference.")

        tensor = self.preprocess(image)
        preds = self.model.predict(tensor, verbose=0)[0]

        top_indices = np.argsort(preds)[::-1][:top_k]

        candidates: List[Dict[str, Any]] = []
        for idx in top_indices:
            idx_int = int(idx)
            meta = self.registry.get_meta(idx_int)
            conf = float(preds[idx])
            if meta:
                candidates.append({
                    "id": meta["id"],
                    "name": meta["name"],
                    "regionalName": meta.get("regionalName", ""),
                    "confidence": round(conf, 4),
                    "image": meta.get("image", "/images/food/curry.svg"),
                    "estimatedKcal": meta.get("estimatedKcal", ""),
                    "datasetFolder": meta["folderName"]
                })
            elif 0 <= idx_int < len(self.registry.classes):
                c_name = self.registry.classes[idx_int]
                candidates.append({
                    "id": f"food-{c_name}",
                    "name": c_name.title(),
                    "regionalName": "",
                    "confidence": round(conf, 4),
                    "image": "/images/food/curry.svg",
                    "estimatedKcal": "",
                    "datasetFolder": c_name
                })

        top_conf = candidates[0]["confidence"] if candidates else 0.0
        is_known = top_conf >= CONFIDENCE_THRESHOLD

        if not is_known:
            candidates.append({
                "id": "food-unknown",
                "name": "Uncertain / Other Food Dish",
                "regionalName": "பிற உணவு வகைகள்",
                "confidence": round(1.0 - top_conf, 4),
                "image": "/images/food/curry.svg",
                "estimatedKcal": "Variable",
                "datasetFolder": "unknown"
            })

        return {
            "isKnownHackathonFood": is_known,
            "topPrediction": candidates[0]["name"] if candidates else "Unknown",
            "topConfidence": top_conf,
            "candidates": candidates
        }

    def predict_crops(
        self,
        crops: List[Union[Image.Image, np.ndarray]],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Batch crop classification for region proposal integration."""
        if not crops or self.model is None:
            return []

        tensors = []
        for c in crops:
            if isinstance(c, np.ndarray):
                c_pil = Image.fromarray(c)
            else:
                c_pil = c
            c_pil = c_pil.convert("RGB").resize(INPUT_IMAGE_SIZE, Image.Resampling.BILINEAR)
            arr = np.array(c_pil, dtype=np.float32)
            arr = (arr / 127.5) - 1.0
            tensors.append(arr)

        preds_batch = self.model.predict(np.array(tensors), verbose=0)
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
                    "id": c_meta.get("id", f"food-{c_folder}") if c_meta else f"food-{c_folder}"
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

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test DL inference on a dish image")
    parser.add_argument("--image", type=str, required=True, help="Path to dish image")
    args = parser.parse_args()

    classifier = FoodClassifier()
    result = classifier.predict(args.image)
    print("\n" + "=" * 50)
    print("NutriSense Vision Prediction Result:")
    print("=" * 50)
    try:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except UnicodeEncodeError:
        print(json.dumps(result, indent=2, ensure_ascii=True))
