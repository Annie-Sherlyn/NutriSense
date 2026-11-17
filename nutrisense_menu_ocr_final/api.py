import io
import time
import base64
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pathlib import Path

from pipeline.menu_ocr import MenuOCRPipeline
from utils.image import ImageWrapper

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def draw_debug_image(img, result):
    # Colors
    COLOR_ACCEPTED = (0, 255, 0) # Green
    COLOR_REVIEW = (0, 165, 255) # Orange
    COLOR_REJECTED = (0, 0, 255) # Red
    COLOR_ROW = (255, 255, 0) # Cyan for row bounds
    
    candidates = result.debug.get("price_candidates", [])
    accepted_prices = {item.raw_price for item in result.items + result.needs_review}
    
    lines = {}
    for item in result.items + result.needs_review:
        debug = getattr(item, 'debug_info', {})
        dline = debug.get('dish_line')
        pline = debug.get('price_line')
        dy = debug.get('dish_bbox', {}).get('y', 0) + debug.get('dish_bbox', {}).get('h', 0)/2
        py = debug.get('price_bbox', {}).get('y', 0) + debug.get('price_bbox', {}).get('h', 0)/2
        
        if dline is not None:
            lines.setdefault(dline, []).append(dy)
        if pline is not None:
            lines.setdefault(pline, []).append(py)
            
    for l_idx, centers in lines.items():
        if not centers:
            continue
        avg_y = int(sum(centers) / len(centers))
        cv2.line(img, (0, avg_y), (img.shape[1], avg_y), COLOR_ROW, 1)
        cv2.putText(img, f"Row {l_idx}", (10, avg_y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, COLOR_ROW, 1)
        
    for item in result.items:
        _draw_item(img, item, COLOR_ACCEPTED)
        
    for item in result.needs_review:
        _draw_item(img, item, COLOR_REVIEW)
        
    rejected_prices = [p for p in candidates if p.get("raw") not in accepted_prices]
    for p in rejected_prices:
        bbox = p.get('bbox', {})
        x, y, w, h = bbox.get('x', 0), bbox.get('y', 0), bbox.get('w', 0), bbox.get('h', 0)
        cv2.rectangle(img, (x, y), (x+w, y+h), COLOR_REJECTED, 2)
        cv2.putText(img, "REJECTED", (x, max(0, y-5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, COLOR_REJECTED, 1)
        
    return img

def _draw_item(img, item, color):
    debug = getattr(item, 'debug_info', {})
    dbbox = debug.get('dish_bbox', {})
    pbbox = debug.get('price_bbox', {})
    
    dx, dy, dw, dh = dbbox.get('x', 0), dbbox.get('y', 0), dbbox.get('w', 0), dbbox.get('h', 0)
    px, py, pw, ph = pbbox.get('x', 0), pbbox.get('y', 0), pbbox.get('w', 0), pbbox.get('h', 0)
    
    cv2.rectangle(img, (dx, dy), (dx+dw, dy+dh), color, 2)
    cv2.rectangle(img, (px, py), (px+pw, py+ph), color, 2)
    
    dcx, dcy = dx + dw//2, dy + dh//2
    pcx, pcy = px + pw//2, py + ph//2
    cv2.line(img, (dcx, dcy), (pcx, pcy), color, 1)
    
    label = "ACCEPTED" if color == (0, 255, 0) else "REVIEW"
    cv2.putText(img, label, (dx, max(0, dy-5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

from utils.image import load_image_from_bytes

@app.post("/api/menu-ocr")
async def process_menu_ocr(image: UploadFile = File(...)):
    contents = await image.read()
    wrapper = load_image_from_bytes(contents, name=image.filename)
    
    if wrapper is None:
        return {"error": "Invalid image format"}
        
    pipeline = MenuOCRPipeline(debug_mode=True)
    
    try:
        result = pipeline.process(wrapper)
    except Exception as e:
        return {"error": str(e)}
        
    accepted_items = []
    for item in result.items:
        debug = getattr(item, 'debug_info', {})
        accepted_items.append({
            "dish": item.dish_name,
            "price": item.raw_price, # user asked for OCR Price
            "confidence": round(item.confidence * 100),
            "reason": debug.get("decision_reason", "accepted"),
            "debug_info": debug
        })
        
    needs_review = []
    for item in result.needs_review:
        debug = getattr(item, 'debug_info', {})
        needs_review.append({
            "dish": item.dish_name,
            "price": item.raw_price,
            "confidence": round(item.confidence * 100),
            "reason": debug.get("decision_reason", "needs_review"),
            "debug_info": debug
        })
        
    candidates = result.debug.get("price_candidates", [])
    accepted_prices = {item.raw_price for item in result.items + result.needs_review}
    
    rejected_prices = []
    for p in candidates:
        if p.get("raw") not in accepted_prices:
            rejected_prices.append({
                "price": p.get("raw"),
                "reason": "Unpaired or rejected geometry",
                "debug_info": p
            })
            
    # Generate debug image
    debug_img = wrapper.array.copy()
    debug_img = draw_debug_image(debug_img, result)
    _, buffer = cv2.imencode('.jpg', debug_img)
    debug_img_b64 = base64.b64encode(buffer).decode('utf-8')
    
    return {
        "accepted_items": accepted_items,
        "needs_review": needs_review,
        "rejected_prices": rejected_prices,
        "stats": {
            "accepted": len(accepted_items),
            "needs_review": len(needs_review),
            "rejected_prices": len(rejected_prices)
        },
        "debug_image": f"data:image/jpeg;base64,{debug_img_b64}"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
