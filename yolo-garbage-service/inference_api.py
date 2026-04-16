"""
EcoCycle – YOLO Garbage Detection API
FastAPI server that accepts an image and returns detected garbage with
bounding boxes, confidence scores, and EcoCycle stream classification.

Run locally:
    uvicorn inference_api:app --host 0.0.0.0 --port 8000 --reload

Docker:
    docker build -t ecocycle-api .
    docker run -p 8000:8000 ecocycle-api

POST /detect
    Body : multipart/form-data  →  file: <image>
    Query: conf  (float, default 0.25)  confidence threshold
    Returns: JSON  (see DetectionResponse schema below)
"""

import base64
import io
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from pydantic import BaseModel, Field
from ultralytics import YOLO

# ── Config ────────────────────────────────────────────────────────────────────
_BASE       = Path(__file__).parent
MODEL_PATH  = _BASE / "weights" / "best.pt"
DEVICE      = "cpu"
_IMGSZ      = 640
_IOU        = 0.7
_DEFAULT_CONF = 0.1

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_IMAGE_BYTES = 20 * 1024 * 1024  # 20 MB

# ── Label → EcoCycle stream ───────────────────────────────────────────────────
CLASS_TO_ECOCYCLE: dict[str, str] = {
    "paper": "recyclable", "plastic": "recyclable", "glass": "recyclable",
    "metal": "recyclable", "cardboard": "recyclable", "cloth": "recyclable",
    "clothes": "recyclable", "textile": "recyclable",
    "trash": "organic", "garbage": "organic", "organic": "organic",
    "biodegradable": "organic", "food": "organic",
    "battery": "e-waste", "electronics": "e-waste",
    "chemical": "hazardous", "hazardous": "hazardous",
}
_EWASTE_HINTS    = ("battery","keyboard","laptop","mouse","cell","monitor","tv",
                    "remote","microwave","toaster","oven","refrigerator","washer",
                    "dryer","hair_drier","printer","router","camera","tablet",
                    "clock","headphone","charger","circuit")
_RECYC_PARTS     = ("plastic","paper","metal","glass","cardboard","bottle","can")

def _norm(s: str) -> str:
    return str(s).strip().lower().replace(" ", "_").replace("-", "_")

def to_ecocycle(label: str) -> str:
    key = _norm(label)
    if key in CLASS_TO_ECOCYCLE:
        return CLASS_TO_ECOCYCLE[key]
    for h in _EWASTE_HINTS:
        if _norm(h) in key:
            return "e-waste"
    for p in _RECYC_PARTS:
        if p in key:
            return "recyclable"
    return "organic"

# ── Pydantic schemas ──────────────────────────────────────────────────────────
class BoundingBox(BaseModel):
    x1: float = Field(..., description="Left edge (pixels)")
    y1: float = Field(..., description="Top edge (pixels)")
    x2: float = Field(..., description="Right edge (pixels)")
    y2: float = Field(..., description="Bottom edge (pixels)")
    width:  float = Field(..., description="Box width  (pixels)")
    height: float = Field(..., description="Box height (pixels)")

class Detection(BaseModel):
    class_id:      int        = Field(..., description="Model class index")
    class_name:    str        = Field(..., description="Raw detector label")
    ecocycle_stream: str      = Field(..., description="recyclable | organic | e-waste | hazardous")
    confidence:    float      = Field(..., description="Detection confidence 0–1")
    bounding_box:  BoundingBox

class DetectionResponse(BaseModel):
    success:        bool
    image_width:    int
    image_height:   int
    inference_ms:   float      = Field(..., description="Model inference time in milliseconds")
    detection_count: int
    detections:     List[Detection]
    detected_image: Optional[str] = Field(None, description="Base64-encoded JPEG with bounding boxes drawn")

# ── Lifespan: load model once at startup ─────────────────────────────────────
_model: Optional[YOLO] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model
    if not MODEL_PATH.is_file():
        raise RuntimeError(
            f"Model weights not found at '{MODEL_PATH}'. "
            "Place best.pt inside the weights/ directory."
        )
    _model = YOLO(str(MODEL_PATH))
    # Warm-up: single forward pass avoids slow first request
    dummy = Image.new("RGB", (64, 64), color=0)
    _model(dummy, imgsz=64, verbose=False)
    print(f"✅  Model loaded: {MODEL_PATH}")
    yield
    _model = None

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="EcoCycle Garbage Detection API",
    description=(
        "Upload an image and receive bounding boxes, confidence scores, "
        "and EcoCycle disposal stream for each detected object."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for Hugging Face Spaces and Railway
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else [
    "*",  # Allow all origins (Hugging Face Spaces: requests come from various hosts)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Utility"])
def health():
    return {"status": "ok", "model": str(MODEL_PATH), "device": DEVICE}

# ── Main detection endpoint ───────────────────────────────────────────────────
@app.post(
    "/detect",
    response_model=DetectionResponse,
    summary="Detect garbage in an uploaded image",
    tags=["Detection"],
)
async def detect(
    file: UploadFile = File(..., description="Image file (JPEG / PNG / WebP / BMP)"),
    conf: float = Query(
        default=_DEFAULT_CONF,
        ge=0.01, le=0.99,
        description="Confidence threshold — detections below this are discarded",
    ),
):
    # ── Validate file ──────────────────────────────────────────────────────
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. "
                   f"Accepted: {sorted(ALLOWED_MIME)}",
        )

    raw = await file.read()
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(raw)//1024} KB). Max is {MAX_IMAGE_BYTES//1024//1024} MB.",
        )

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=422, detail="Cannot decode image. Upload a valid image file.")

    img_w, img_h = img.size

    # ── Run YOLO ───────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    results = _model(
        img,
        conf=conf,
        iou=_IOU,
        imgsz=_IMGSZ,
        device=DEVICE,
        max_det=300,
        half=False,
        verbose=False,
    )
    inference_ms = (time.perf_counter() - t0) * 1000

    # ── Parse boxes ────────────────────────────────────────────────────────
    detections: List[Detection] = []
    r0    = results[0]
    boxes = r0.boxes

    if boxes is not None and len(boxes):
        for box in boxes:
            cid    = int(box.cls[0].item())
            score  = round(float(box.conf[0].item()), 4)
            xyxy   = box.xyxy[0].tolist()          # [x1, y1, x2, y2]
            x1, y1, x2, y2 = xyxy
            label  = _model.names[cid]

            detections.append(Detection(
                class_id=cid,
                class_name=label,
                ecocycle_stream=to_ecocycle(label),
                confidence=score,
                bounding_box=BoundingBox(
                    x1=round(x1, 2),
                    y1=round(y1, 2),
                    x2=round(x2, 2),
                    y2=round(y2, 2),
                    width=round(x2 - x1, 2),
                    height=round(y2 - y1, 2),
                ),
            ))

    # Sort by confidence descending
    detections.sort(key=lambda d: d.confidence, reverse=True)

    # Encode annotated image (bounding boxes) as base64 JPEG
    detected_image_b64: Optional[str] = None
    try:
        annotated_bgr = results[0].plot()          # numpy BGR uint8
        annotated_rgb = annotated_bgr[:, :, ::-1]  # BGR → RGB
        pil_out = Image.fromarray(annotated_rgb)
        buf = io.BytesIO()
        pil_out.save(buf, format="JPEG", quality=85)
        detected_image_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception as _e:
        pass  # Non-fatal — client falls back to the original image

    return DetectionResponse(
        success=True,
        image_width=img_w,
        image_height=img_h,
        inference_ms=round(inference_ms, 2),
        detection_count=len(detections),
        detections=detections,
        detected_image=detected_image_b64,
    )


# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("inference_api:app", host="0.0.0.0", port=port, reload=True)