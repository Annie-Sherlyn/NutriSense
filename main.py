import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "NutriSense", "dl_service")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from server import app as vision_app
from app.api import app as voice_app

app = FastAPI(title="NutriSense Combined Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

from server import load_model

@app.on_event("startup")
def startup_event():
    load_model()

app.include_router(vision_app.router)
app.include_router(voice_app.router)

if __name__ == "__main__":
    host = os.getenv("NUTRISENSE_HOST", "127.0.0.1")
    port = int(os.getenv("NUTRISENSE_PORT", "8000"))
    print(f"Starting NutriSense combined API on http://{host}:{port} ...")
    uvicorn.run("main:app", host=host, port=port, reload=False)
