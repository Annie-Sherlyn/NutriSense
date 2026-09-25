import os
import sys
import unittest
import json
import logging
from pathlib import Path
from PIL import Image
import numpy as np

# Add dl_service to import path
DL_SERVICE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(DL_SERVICE_DIR))

from config import (
    CONFIDENCE_HIGH,
    CONFIDENCE_MEDIUM,
    CONFIDENCE_LOW,
    IOU_NMS_THRESHOLD,
    is_discrete_class,
    NON_FOOD_CLASS_NAME
)
from labels import LabelRegistry, labels_registry
from region_proposal import RegionProposer, default_proposer, compute_iou_xyxy
from classifier import CropClassifier
from postprocessor import DetectionPostprocessor
from detector import FoodPlateDetector

logging.basicConfig(level=logging.INFO)

class TestNutriSenseVisionPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.detector = FoodPlateDetector()
        cls.eval_suite_path = Path("scratch/eval_suite/eval_suite.json")
        if cls.eval_suite_path.exists():
            with open(cls.eval_suite_path, "r", encoding="utf-8") as f:
                cls.eval_suite = json.load(f)
        else:
            cls.eval_suite = []

    def test_output_json_schema(self):
        """Verifies strict adherence to target confirmation-payload JSON schema."""
        # Create a synthetic image
        img = Image.new("RGB", (300, 300), (230, 230, 230))
        result = self.detector.detect(img)

        # 1. Primary required schema keys
        self.assertIn("success", result)
        self.assertIsInstance(result["success"], bool)
        self.assertIn("source", result)
        self.assertEqual(result["source"], "dish_photo")
        self.assertIn("items", result)
        self.assertIsInstance(result["items"], list)
        self.assertIn("needs_confirmation", result)
        self.assertIsInstance(result["needs_confirmation"], bool)

        # 2. Structure of each detected item
        for itm in result["items"]:
            self.assertIn("dish_name", itm)
            self.assertIsInstance(itm["dish_name"], str)
            self.assertIn("confidence", itm)
            self.assertIsInstance(itm["confidence"], (float, int))
            self.assertIn("quantity", itm)
            self.assertTrue(itm["quantity"] is None or isinstance(itm["quantity"], int))
            self.assertIn("bbox", itm)
            self.assertEqual(len(itm["bbox"]), 4)
            for coord in itm["bbox"]:
                self.assertGreaterEqual(coord, 0.0)
                self.assertLessEqual(coord, 1.0)
            self.assertIn("needs_confirmation", itm)
            self.assertIsInstance(itm["needs_confirmation"], bool)

    def test_existing_api_regression(self):
        """Ensures backward compatibility with NutriSense UI fields."""
        img = Image.new("RGB", (300, 300), (220, 220, 220))
        result = self.detector.detect(img)

        self.assertIn("isMultiItem", result)
        self.assertIn("mode", result)
        self.assertIn(result["mode"], ["single", "multi"])
        self.assertIn("plateMessage", result)
        self.assertIn("detectedItems", result)
        self.assertIn("candidates", result)
        self.assertIn("annotatedImage", result)

    def test_single_food_image(self):
        """Tests end-to-end detection on a single-dish image."""
        # Find a real image from dataset
        dosa_images = list(Path("Dataset/breakfast/dosa").glob("*.jpg"))
        if not dosa_images:
            self.skipTest("No dataset sample found for dosa")

        img_path = str(dosa_images[0])
        result = self.detector.detect(img_path)

        self.assertTrue(result["success"])
        self.assertGreaterEqual(len(result["items"]), 1)
        top_item = result["items"][0]
        self.assertGreater(top_item["confidence"], 0.20)
        self.assertEqual(len(top_item["bbox"]), 4)

    def test_multi_food_image(self):
        """Tests multi-food plate detection on composite/multi-dish plate."""
        if not self.eval_suite:
            self.skipTest("No evaluation suite found")

        # Use case 2 (four-item combo)
        case_2 = next((c for c in self.eval_suite if c["id"] == "case_2_four_item_combo"), self.eval_suite[0])
        result = self.detector.detect(case_2["image_path"])

        self.assertTrue(result["success"])
        # Should detect multiple food items
        self.assertGreaterEqual(len(result["items"]), 2)
        self.assertTrue(result["isMultiItem"])
        self.assertEqual(result["mode"], "multi")

    def test_no_food_background(self):
        """Tests that a flat empty background or non-food plate does not yield high-confidence food."""
        empty_plate = Image.new("RGB", (400, 400), (240, 240, 240))
        result = self.detector.detect(empty_plate)

        # Either no high-confidence items or all flagged with needs_confirmation: True
        for itm in result["items"]:
            if itm.get("confidence", 0) >= CONFIDENCE_HIGH:
                self.fail(f"Empty plate produced false positive high confidence detection: {itm}")
        self.assertTrue(result["needs_confirmation"])

    def test_duplicate_overlapping_regions(self):
        """Tests that IoU NMS consolidates redundant overlapping boxes for the same food."""
        postprocessor = DetectionPostprocessor()
        # Create two overlapping boxes pointing to same dish (IoU > 0.60)
        raw_dets = [
            {
                "box": [0.10, 0.10, 0.50, 0.50],
                "dish_name": "idli",
                "raw_class": "idly",
                "confidence": 0.94,
                "is_non_food": False
            },
            {
                "box": [0.12, 0.11, 0.52, 0.51],
                "dish_name": "idli",
                "raw_class": "idly",
                "confidence": 0.82,
                "is_non_food": False
            }
        ]

        processed = postprocessor.process(raw_dets, img_w=600, img_h=600)
        # Should merge into 1 item
        self.assertEqual(len(processed["items"]), 1)
        self.assertEqual(processed["items"][0]["dish_name"], "idli")
        self.assertEqual(processed["items"][0]["confidence"], 0.94)

    def test_low_confidence_region(self):
        """Tests that an uncertain candidate (0.50 <= conf < 0.80) is flagged for user confirmation."""
        postprocessor = DetectionPostprocessor()
        raw_dets = [
            {
                "box": [0.20, 0.20, 0.60, 0.60],
                "dish_name": "sambar",
                "raw_class": "sambar",
                "confidence": 0.65,  # Medium confidence
                "is_non_food": False
            }
        ]
        processed = postprocessor.process(raw_dets, img_w=600, img_h=600)
        self.assertEqual(len(processed["items"]), 1)
        self.assertTrue(processed["items"][0]["needs_confirmation"])
        self.assertTrue(processed["needs_confirmation"])

    def test_multiple_instances_discrete_counting(self):
        """Tests discrete counting: 3 separate non-overlapping idlis -> quantity: 3."""
        postprocessor = DetectionPostprocessor()
        # 3 spatially separated idlis
        raw_dets = [
            {"box": [0.05, 0.05, 0.35, 0.35], "dish_name": "idli", "raw_class": "idly", "confidence": 0.92, "is_non_food": False},
            {"box": [0.05, 0.55, 0.35, 0.85], "dish_name": "idli", "raw_class": "idly", "confidence": 0.89, "is_non_food": False},
            {"box": [0.55, 0.05, 0.85, 0.35], "dish_name": "idli", "raw_class": "idly", "confidence": 0.95, "is_non_food": False},
        ]
        processed = postprocessor.process(raw_dets, img_w=600, img_h=600)
        self.assertEqual(len(processed["items"]), 1)
        idli_item = processed["items"][0]
        self.assertEqual(idli_item["dish_name"], "idli")
        self.assertEqual(idli_item["quantity"], 3)

    def test_non_discrete_portion_handling(self):
        """Tests non-discrete portion: gravy/rice -> quantity is None."""
        postprocessor = DetectionPostprocessor()
        raw_dets = [
            {"box": [0.10, 0.10, 0.60, 0.60], "dish_name": "rice", "raw_class": "sadham", "confidence": 0.91, "is_non_food": False}
        ]
        processed = postprocessor.process(raw_dets, img_w=600, img_h=600)
        self.assertEqual(len(processed["items"]), 1)
        rice_item = processed["items"][0]
        self.assertIsNone(rice_item["quantity"])

    def test_invalid_image(self):
        """Tests that invalid inputs raise appropriate errors gracefully."""
        with self.assertRaises((TypeError, ValueError)):
            self.detector.detect(12345)

    def test_new_class_added_generalization(self):
        """
        GENERALIZATION TEST:
        Adds a new unseen class to registry at runtime,
        confirms the pipeline normalizes its canonical name,
        and defaults discrete counting (with warning) WITHOUT ANY CODE CHANGES.
        """
        registry = LabelRegistry()
        new_folder = "mango_kulfi"
        new_id = "food-mango-kulfi"
        new_display = "Authentic Mango Kulfi"

        # Dynamically register the new class
        registry.add_temporary_class_for_testing(new_folder, new_display, new_id)

        canonical = registry.get_canonical_name(new_folder)
        self.assertEqual(canonical, "mango_kulfi")

        # Test discrete checking defaults to non-discrete with warning
        is_discrete = is_discrete_class(new_folder)
        self.assertFalse(is_discrete)

        # Test postprocessing on the new class
        postprocessor = DetectionPostprocessor(registry=registry)
        raw_dets = [
            {
                "box": [0.1, 0.1, 0.5, 0.5],
                "dish_name": canonical,
                "raw_class": new_folder,
                "confidence": 0.88,
                "is_non_food": False
            }
        ]
        res = postprocessor.process(raw_dets, img_w=500, img_h=500)
        self.assertEqual(len(res["items"]), 1)
        self.assertEqual(res["items"][0]["dish_name"], "mango_kulfi")
        self.assertIsNone(res["items"][0]["quantity"])  # Defaulted to non-discrete

if __name__ == "__main__":
    unittest.main()
