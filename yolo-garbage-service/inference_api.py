"""
HTTP inference API for EcoCycle Node (YOLOAdapter).
POST /predict — multipart field "image" (same contract as server/classifiers/YOLOAdapter.js).
"""
from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from ultralytics import YOLO

MODEL_PATH = os.environ.get("YOLO_WEIGHTS", os.path.join(os.path.dirname(__file__), "weights", "best.pt"))
DEFAULT_CONF = float(os.environ.get("YOLO_CONF", "0.25"))
DEVICE = os.environ.get("YOLO_DEVICE", "cpu")

app = FastAPI(title="EcoCycle YOLO Garbage Service", version="1.0.0")

_model: Optional[YOLO] = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        try:
            _model = YOLO(MODEL_PATH)
        except Exception as e:
            raise RuntimeError(
                f"Could not load YOLO weights from {MODEL_PATH}. "
                "Place best.pt in weights/ or set YOLO_WEIGHTS (hub names like yolov8n.pt auto-download)."
            ) from e
    return _model


def _weights_path_ready() -> bool:
    """Hub-style single filename (.pt) may not exist on disk until Ultralytics downloads it."""
    p = Path(MODEL_PATH)
    if len(p.parts) == 1 and MODEL_PATH.lower().endswith(".pt"):
        return True
    return p.is_file()


@app.get("/health")
def health():
    return {"status": "ok" if _weights_path_ready() else "no_weights", "weights_path": MODEL_PATH}


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty image body")

    try:
        model = get_model()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    try:
        pil = Image.open(BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid image: {e}") from e

    results = model(pil, conf=DEFAULT_CONF, device=DEVICE, verbose=False)
    boxes = results[0].boxes
    predictions: list[dict[str, Any]] = []

    if boxes is not None and len(boxes) > 0:
        names = model.names
        for box in boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            label = names[cls_id] if isinstance(names, dict) else names[cls_id]
            predictions.append({"label": str(label), "confidence": conf})

    predictions.sort(key=lambda p: p["confidence"], reverse=True)
    return {"predictions": predictions}
