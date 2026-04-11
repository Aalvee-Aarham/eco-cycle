# yolo-garbage-service

Inference API for EcoCycle: `POST /predict` (same JSON as [`server/classifiers/YOLOAdapter.js`](../server/classifiers/YOLOAdapter.js)).

**Production Docker / Railway** uses **ONNX Runtime only** — typical **compressed image ~1.2–2.5 GB** (well **under a 4 GB** cap). **No PyTorch** in that image (PyTorch + Ultralytics usually exceeds 4 GB).

**Local** Streamlit + optional **`.pt`** API still use **`requirements-dev.txt`** (Ultralytics + torch).

**Accuracy / speed:** The **slim Docker** path uses **ONNX** (no PyTorch). Small differences vs running **`best.pt` in Ultralytics** are normal (export, NMS, letterbox). For **closest match to training**, run the API with **`INFERENCE_BACKEND=torch`**, **`best.pt`**, and **`pip install -r requirements-dev.txt`** (full PyTorch + Ultralytics — larger image than ONNX). ONNX defaults now use **NMS IoU `0.7`** and **`imgsz=640`** to align with Ultralytics `predict()`.

## Layout

- `inference_api.py` — FastAPI (`INFERENCE_BACKEND=onnx` or `torch`)
- `onnx_backend.py` — ONNX-only inference (used in Docker)
- `streamlit_demo.py` — local UI (needs `.pt` + `requirements.txt`)
- `weights/` — `best.onnx` (Docker) or `best.pt` (local / torch API)
- `requirements-api.txt` — slim deps for Docker
- `requirements.txt` — full stack + Streamlit

## Export ONNX (required for Docker / Railway)

From a machine with Ultralytics installed (after training):

```bash
yolo export model=weights/best.pt format=onnx simplify=True imgsz=640
# produces weights/best.onnx
```

**Faster inference:** use a **smaller checkpoint** when training (e.g. `yolov8n`, `yolov10n`) — smaller `.onnx` runs faster on CPU. **`imgsz=640`** is a good speed/accuracy balance; lower `imgsz` (e.g. 416) is faster but less accurate.

Class names in JSON must match your dataset **class order** in `data.yaml`. Set for the API:

```bash
set YOLO_CLASS_NAMES=paper,plastic,glass,metal,cardboard,cloth
```

(or use `YOLO_CLASSES_FILE=/path/to/classes.txt` with one name per line).

## Run API locally

### ONNX (matches Docker)

```bash
pip install -r requirements-api.txt
set YOLO_WEIGHTS=weights\best.onnx
set INFERENCE_BACKEND=onnx
set YOLO_CLASS_NAMES=paper,plastic,glass,metal,cardboard,cloth
uvicorn inference_api:app --host 0.0.0.0 --port 8000
```

### PyTorch `.pt` (no ONNX)

```bash
pip install -r requirements.txt
set YOLO_WEIGHTS=weights\best.pt
set INFERENCE_BACKEND=torch
uvicorn inference_api:app --host 0.0.0.0 --port 8000
```

EcoCycle server: `CLASSIFIER=yolo`, `YOLO_API_URL=http://localhost:8000/predict`.

**Streamlit:** `streamlit run streamlit_demo.py` — uses `.pt`; smoke test: `YOLO_WEIGHTS=yolov8n.pt`.

## Docker (slim)

Expect **`best.onnx`** at `/app/weights/best.onnx` (default). Image size is dominated by **`onnxruntime` + base Debian** (~1–2 GB total), not ~6 GB.

```bash
docker build -t ecocycle-yolo .
docker run -p 8000:8000 -v %cd%\weights:/app/weights -e YOLO_CLASS_NAMES=paper,plastic,glass,metal,cardboard,cloth ecocycle-yolo
```

Place **`best.onnx`** in `./weights/` (or set `YOLO_WEIGHTS` / download via `YOLO_WEIGHTS_URL`).

## Deploy on Railway

Root directory: **`yolo-garbage-service`**.

### Variables

| Variable | Notes |
|----------|--------|
| `YOLO_WEIGHTS_URL` | HTTPS URL to **`best.onnx`** (recommended). Optional: `YOLO_WEIGHTS_FILENAME=best.onnx` if the URL has no clear filename. |
| `YOLO_CLASS_NAMES` | Comma-separated, **same order as training** (e.g. `paper,plastic,glass,metal,cardboard,cloth`). |
| `YOLO_CONF` | Optional, default `0.25`. |
| `YOLO_IOU` / `YOLO_IOU_THRESHOLD` | NMS IoU — default **`0.7`** (matches Ultralytics `predict()`; we previously used `0.45` in ONNX only, which suppressed more boxes). |
| `YOLO_IMGSZ` | Inference size, default **`640`** (must match export / training). |
| `PORT` | Set by Railway — do not override. |
| `ORT_NUM_THREADS` / `OMP_NUM_THREADS` | Set to your plan’s **vCPU count** (e.g. `2` or `4`) for best CPU speed. Defaults to **`2`** in the image. |
| `OPENBLAS_NUM_THREADS` / `MKL_NUM_THREADS` | Default **`1`** in `entrypoint.sh` so BLAS does not fight ONNX Runtime threads. |

`INFERENCE_BACKEND` defaults to **`onnx`** in the Dockerfile. Do **not** use `.pt` + torch on this slim image.

**Process model:** the container runs **one Uvicorn worker** so the ONNX model is not loaded twice into RAM (important on 512 MB–2 GB plans).

**Build time:** first build is often **~2–5 minutes**. **Image size:** usually **under ~2.5 GB**; verify locally with `docker images`.

**RAM:** allocate **≥ 1 GB** for stable inference; **2 GB** is comfortable for `onnxruntime` + model + FastAPI.

### Networking

Generate a domain, then on the Node server:

`YOLO_API_URL=https://your-service.up.railway.app/predict`

### Verify

```bash
curl -s https://YOUR-RAILWAY-URL/health
curl -s -X POST https://YOUR-RAILWAY-URL/predict -F "image=@sample.jpg"
```

## Environment reference

| Variable | Default (Docker) | Description |
|----------|------------------|-------------|
| `INFERENCE_BACKEND` | `onnx` in image | `onnx` or `torch` |
| `YOLO_WEIGHTS` | `/app/weights/best.onnx` | Path to `.onnx` or `.pt` |
| `YOLO_CLASS_NAMES` | — | Comma-separated labels (ONNX) |
| `YOLO_CLASSES_FILE` | — | One class per line |
| `YOLO_CONF` | `0.25` | Confidence threshold |
| `YOLO_IOU` | `0.7` | NMS IoU (torch + ONNX; Ultralytics default) |
| `YOLO_IOU_THRESHOLD` | (alias) | Same as `YOLO_IOU` for ONNX-only legacy env |
| `YOLO_IMGSZ` | `640` | Inference image size |
| `YOLO_DEVICE` | `cpu` | Only used for `torch` backend |
