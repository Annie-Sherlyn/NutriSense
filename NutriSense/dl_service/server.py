import os
import sys
from pathlib import Path
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from inference import FoodClassifier, CONFIDENCE_THRESHOLD
from detector import FoodPlateDetector

app = FastAPI(
    title="NutriSense Deep Learning Vision API",
    description="Custom Deep Learning Food Recognition Service trained on Indian Regional Staples",
    version="1.0.0"
)

cors_origins_env = os.getenv("DL_CORS_ORIGINS", "")
if cors_origins_env:
    allow_origins = [origin.strip() for origin in cors_origins_env.split(",")]
else:
    allow_origins = ["*"]

# Enable CORS for Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = None
detector = None

def get_detector_and_classifier():
    global classifier, detector
    if classifier is None:
        try:
            classifier = FoodClassifier()
        except Exception as e:
            print(f"[DL Service Error] Failed to initialize FoodClassifier: {e}")
    if detector is None and classifier is not None:
        try:
            detector = FoodPlateDetector(classifier)
        except Exception as e:
            print(f"[DL Service Error] Failed to initialize FoodPlateDetector: {e}")
    return detector, classifier

@app.on_event("startup")
def load_model():
    get_detector_and_classifier()
    print("[API Startup] FoodClassifier & FoodPlateDetector loaded successfully.")

@app.get("/health")
@app.get("/food/health")
def health_check():
    _, clf = get_detector_and_classifier()
    return {
        "status": "healthy",
        "service": "NutriSense DL Vision API",
        "modelLoaded": clf is not None and clf.model is not None,
        "detectorLoaded": detector is not None,
        "classesCount": len(clf.classes) if clf else 0,
        "confidenceThreshold": CONFIDENCE_THRESHOLD
    }

@app.get("/classes")
def get_classes():
    _, clf = get_detector_and_classifier()
    if clf is None:
        raise HTTPException(status_code=503, detail="Model service not ready")
    return clf.class_meta

@app.post("/food/image/analyze")
async def analyze_dish_image(image: UploadFile = File(...)):
    """
    Accepts dish image captured by camera or selected from gallery.
    Performs Computer Vision multi-object segmentation or single-object classification.
    Returns:
      - isMultiItem: bool (True if thali/plate contains multiple items)
      - mode: "multi" | "single"
      - plateMessage: summary string (e.g. "3 dishes detected on plate")
      - detectedItems: list of detected dishes with positions & confidences
      - candidates: top ranked candidate dishes for the primary item
      - annotatedImage: base64 jpeg with CV bounding boxes
    """
    global detector, classifier
    if detector is None:
        if classifier is not None and classifier.model is not None:
            detector = FoodPlateDetector(classifier)
        else:
            raise HTTPException(
                status_code=503,
                detail="DL model is not loaded. Ensure the model has been trained."
            )

    try:
        contents = await image.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty image received")

        # Run CV multi-object plate detection
        detection_result = detector.detect(contents)
        return detection_result

    except Exception as err:
        print(f"[API Error] Failed to analyze image: {err}")
        raise HTTPException(status_code=500, detail=f"Image inference error: {str(err)}")

if __name__ == "__main__":
    env_port = os.getenv("PORT")
    if env_port:
        host = "0.0.0.0"
        port = int(env_port)
    else:
        host = os.getenv("DL_SERVICE_HOST", "127.0.0.1")
        port = int(os.getenv("DL_SERVICE_PORT", "8001"))
        
    print(f"Starting NutriSense DL Vision Server on http://{host}:{port} ...")
    uvicorn.run("server:app", host=host, port=port, reload=False)
