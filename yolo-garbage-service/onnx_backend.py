"""
YOLOv8-style ONNX inference (output from: yolo export model=best.pt format=onnx simplify=True).
No PyTorch — keeps Docker image small (~1–2 GB vs ~6 GB).
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
from PIL import Image


def _ort_thread_count() -> int:
    """Match Railway vCPU count via env to avoid oversubscription (slow)."""
    raw = (os.environ.get("ORT_NUM_THREADS") or os.environ.get("OMP_NUM_THREADS") or "").strip()
    if raw.isdigit():
        return max(1, int(raw))
    n = os.cpu_count() or 2
    return max(1, min(n, 8))

# Optional env: comma-separated class names matching ONNX output channel order (nc)
def _load_names(nc: int) -> dict[int, str]:
    raw = os.environ.get("YOLO_CLASS_NAMES", "").strip()
    if raw:
        parts = [p.strip() for p in raw.split(",") if p.strip()]
        if len(parts) >= nc:
            return {i: parts[i] for i in range(nc)}
    path = os.environ.get("YOLO_CLASSES_FILE", "")
    if path and Path(path).is_file():
        lines = [ln.strip() for ln in Path(path).read_text(encoding="utf-8").splitlines() if ln.strip()]
        if len(lines) >= nc:
            return {i: lines[i] for i in range(nc)}
    return {i: f"class_{i}" for i in range(nc)}


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(x, -50, 50)))


def _xywh2xyxy(x: np.ndarray) -> np.ndarray:
    y = np.empty_like(x)
    y[:, 0] = x[:, 0] - x[:, 2] / 2
    y[:, 1] = x[:, 1] - x[:, 3] / 2
    y[:, 2] = x[:, 0] + x[:, 2] / 2
    y[:, 3] = x[:, 1] + x[:, 3] / 2
    return y


def _box_iou_xyxy(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    tl = np.maximum(a[:, None, :2], b[None, :, :2])
    br = np.minimum(a[:, None, 2:], b[None, :, 2:])
    wh = np.clip(br - tl, 0, None)
    inter = wh[:, :, 0] * wh[:, :, 1]
    area_a = (a[:, 2] - a[:, 0]) * (a[:, 3] - a[:, 1])
    area_b = (b[:, 2] - b[:, 0]) * (b[:, 3] - b[:, 1])
    return inter / (area_a[:, None] + area_b[None, :] - inter + 1e-7)


def _nms_xyxy(boxes: np.ndarray, scores: np.ndarray, iou_thres: float, max_det: int = 300) -> list[int]:
    if len(boxes) == 0:
        return []
    order = scores.argsort()[::-1]
    keep: list[int] = []
    while order.size > 0 and len(keep) < max_det:
        i = int(order[0])
        keep.append(i)
        if order.size == 1:
            break
        rest = order[1:]
        ious = _box_iou_xyxy(boxes[i : i + 1], boxes[rest])[0]
        order = rest[ious < iou_thres]
    return keep


def _letterbox_pil(im: Image.Image, new_size: tuple[int, int], color: tuple[int, int, int] = (114, 114, 114)):
    w, h = im.size
    nw, nh = new_size
    r = min(nw / w, nh / h)
    rw, rh = int(round(w * r)), int(round(h * r))
    resized = im.resize((rw, rh), Image.Resampling.BILINEAR)
    canvas = Image.new("RGB", new_size, color)
    left = (nw - rw) // 2
    top = (nh - rh) // 2
    canvas.paste(resized, (left, top))
    return canvas, r, left, top


class OnnxYoloSession:
    def __init__(self, model_path: str):
        self.model_path = model_path
        so = ort.SessionOptions()
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        so.execution_mode = ort.ExecutionMode.ORT_PARALLEL
        n = _ort_thread_count()
        so.intra_op_num_threads = n
        so.inter_op_num_threads = 1
        self.session = ort.InferenceSession(
            model_path, so, providers=["CPUExecutionProvider"]
        )
        self.inp = self.session.get_inputs()[0]
        self.in_name = self.inp.name
        shape = self.inp.shape
        # NCHW
        if len(shape) == 4:
            self.in_h = int(shape[2]) if shape[2] not in (None, "batch") else 640
            self.in_w = int(shape[3]) if shape[3] not in (None, "batch") else 640
        else:
            self.in_h, self.in_w = 640, 640
        # Match Ultralytics `predict()` default NMS IoU (0.45 suppressed more boxes).
        _iou = os.environ.get("YOLO_IOU") or os.environ.get("YOLO_IOU_THRESHOLD") or "0.7"
        self.iou_thres = float(_iou)

    def preprocess(self, pil: Image.Image) -> tuple[np.ndarray, tuple[float, int, int]]:
        im, _r, pad_x, pad_y = _letterbox_pil(pil, (self.in_w, self.in_h))
        arr = np.asarray(im, dtype=np.float32) / 255.0
        arr = arr.transpose(2, 0, 1)[None, ...]  # 1x3xHxW
        return arr, (_r, pad_x, pad_y)

    def postprocess_raw(self, pred: np.ndarray, conf_thres: float) -> list[dict[str, Any]]:
        """
        pred: (1, 4+nc, N) or (1, N, 4+nc) — standard Ultralytics YOLOv8 ONNX detect head.
        """
        if pred.ndim != 3:
            return []
        b, d1, d2 = pred.shape
        if d1 < d2:
            # (1, 4+nc, anchors)
            p = pred[0].T  # (N, 4+nc)
            nc = p.shape[1] - 4
        else:
            # (1, anchors, 4+nc)
            p = pred[0]
            nc = p.shape[1] - 4
        if nc < 1:
            return []
        names = _load_names(nc)
        xywh = p[:, :4]
        cls_logits = p[:, 4:]
        if cls_logits.max() <= 1.0 + 1e-3 and cls_logits.min() >= -1e-3:
            cls_prob = cls_logits
        else:
            cls_prob = _sigmoid(cls_logits)
        scores = cls_prob.max(axis=1)
        cls_ids = cls_prob.argmax(axis=1)
        mask = scores >= conf_thres
        if not mask.any():
            return []
        xywh = xywh[mask]
        scores = scores[mask]
        cls_ids = cls_ids[mask]
        xyxy = _xywh2xyxy(xywh)
        keep = _nms_xyxy(xyxy, scores, self.iou_thres)
        out: list[dict[str, Any]] = []
        for i in keep:
            cid = int(cls_ids[i])
            out.append(
                {
                    "label": names.get(cid, f"class_{cid}"),
                    "confidence": float(scores[i]),
                }
            )
        return out

    def postprocess_end2end(self, pred: np.ndarray, conf_thres: float) -> list[dict[str, Any]]:
        """Some exports: (1, n, 6+) with x1,y1,x2,y2,conf,cls,..."""
        if pred.ndim != 3:
            return []
        x = pred[0]
        if x.shape[-1] < 6:
            return []
        boxes = x[:, :4]
        scores = x[:, 4]
        cls_ids = x[:, 5].astype(np.int32)
        mask = scores >= conf_thres
        if not mask.any():
            return []
        boxes, scores, cls_ids = boxes[mask], scores[mask], cls_ids[mask]
        nc = int(cls_ids.max()) + 1 if cls_ids.size else 1
        names = _load_names(max(nc, 1))
        keep = _nms_xyxy(boxes, scores, self.iou_thres)
        return [
            {"label": names.get(int(cls_ids[i]), f"class_{int(cls_ids[i])}"), "confidence": float(scores[i])}
            for i in keep
        ]

    def predict(self, pil: Image.Image, conf_thres: float) -> list[dict[str, Any]]:
        blob, _ = self.preprocess(pil)
        outs = self.session.run(None, {self.in_name: blob})
        pred = outs[0] if isinstance(outs, (list, tuple)) else outs
        if pred.ndim != 3:
            return []
        _, a, b = pred.shape
        # (1, 4+nc, N_anchors) e.g. (1, 84, 8400)
        if a < b and a <= 200 and b >= 500:
            return self.postprocess_raw(pred, conf_thres)
        # (1, N_anchors, 4+nc)
        if a > b and b <= 200 and a >= 500:
            return self.postprocess_raw(pred, conf_thres)
        # End-to-end NMS export e.g. (1, 300, 6)
        if b <= 16 and 1 <= a <= 20000:
            return self.postprocess_end2end(pred, conf_thres)
        return self.postprocess_raw(pred, conf_thres)


_session: OnnxYoloSession | None = None


def get_onnx_session(model_path: str) -> OnnxYoloSession:
    global _session
    if _session is None:
        _session = OnnxYoloSession(model_path)
    return _session


def onnx_weights_ready(model_path: str) -> bool:
    return Path(model_path).is_file()
