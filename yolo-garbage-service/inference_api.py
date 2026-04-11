"""
HTTP inference API for EcoCycle Node (YOLOAdapter).
POST /predict — multipart field "image" (same contract as server/classifiers/YOLOAdapter.js).

Production Docker uses INFERENCE_BACKEND=onnx (small image, no PyTorch).
Local / full stack: INFERENCE_BACKEND=torch + Ultralytics + .pt
"""
from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image

MODEL_PATH = os.environ.get("YOLO_WEIGHTS", os.path.join(os.path.dirname(__file__), "weights", "best.onnx"))
DEFAULT_CONF = float(os.environ.get("YOLO_CONF", "0.25"))
DEVICE = os.environ.get("YOLO_DEVICE", "cpu")
YOLO_IOU = float(os.environ.get("YOLO_IOU", "0.7"))
YOLO_IMGSZ = int(os.environ.get("YOLO_IMGSZ", "640"))

def _backend() -> str:
    b = os.environ.get("INFERENCE_BACKEND", "").strip().lower()
    if b in ("onnx", "torch"):
        return b
    if MODEL_PATH.lower().endswith(".onnx"):
        return "onnx"
    if MODEL_PATH.lower().endswith(".pt"):
        return "torch"
    return "onnx"


app = FastAPI(title="EcoCycle YOLO Garbage Service", version="1.0.0")

_model_torch: Any = None


def get_model_torch():
    global _model_torch
    if _model_torch is None:
        from ultralytics import YOLO

        try:
            _model_torch = YOLO(MODEL_PATH)
        except Exception as e:
            raise RuntimeError(
                f"Could not load YOLO weights from {MODEL_PATH}. "
                "Use a .pt file or set YOLO_WEIGHTS (hub names like yolov8n.pt for tests)."
            ) from e
    return _model_torch


def _weights_path_ready() -> bool:
    p = Path(MODEL_PATH)
    if _backend() == "onnx":
        return p.is_file()
    # torch: hub single filename
    if len(p.parts) == 1 and MODEL_PATH.lower().endswith(".pt"):
        return True
    return p.is_file()


@app.get("/health")
def health():
    return {"status": "ok" if _weights_path_ready() else "no_weights", "weights_path": MODEL_PATH, "backend": _backend()}


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty image body")

    try:
        pil = Image.open(BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid image: {e}") from e

    backend = _backend()
    predictions: list[dict[str, Any]] = []

    try:
        if backend == "onnx":
            from onnx_backend import get_onnx_session

            if not Path(MODEL_PATH).is_file():
                raise RuntimeError(
                    f"ONNX model not found at {MODEL_PATH}. "
                    "Export: yolo export model=best.pt format=onnx simplify=True imgsz=640 "
                    "Upload best.onnx (YOLO_WEIGHTS_URL) or mount under /app/weights/best.onnx."
                )
            session = get_onnx_session(MODEL_PATH)
            predictions = session.predict(pil, DEFAULT_CONF)
        else:
            model = get_model_torch()
            results = model(
                pil,
                conf=DEFAULT_CONF,
                iou=YOLO_IOU,
                imgsz=YOLO_IMGSZ,
                device=DEVICE,
                max_det=300,
                half=False,
                verbose=False,
            )
            boxes = results[0].boxes
            if boxes is not None and len(boxes) > 0:
                names = model.names
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    label = names[cls_id] if isinstance(names, dict) else names[cls_id]
                    predictions.append({"label": str(label), "confidence": conf})
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    predictions.sort(key=lambda p: p["confidence"], reverse=True)
    return {"predictions": predictions}
