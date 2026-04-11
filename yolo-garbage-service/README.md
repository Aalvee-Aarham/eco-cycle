# yolo-garbage-service

YOLOv10 (Ultralytics) inference for EcoCycle. Exposes `POST /predict` consumed by `server/classifiers/YOLOAdapter.js`.

## Layout

- `inference_api.py` — FastAPI service (production path for MERN)
- `streamlit_demo.py` — small Streamlit UI: threshold, garbage-class → EcoCycle table, one image + “Run detection”
- `weights/` — place `best.pt` here (not committed)
- `notebooks/` — training notebook (optional)

## Run locally

```bash
cd yolo-garbage-service
pip install -r requirements.txt
# copy your trained weights to weights/best.pt
set YOLO_WEIGHTS=weights\best.pt
uvicorn inference_api:app --host 0.0.0.0 --port 8000
```

In the Node `.env`: `CLASSIFIER=yolo` and `YOLO_API_URL=http://localhost:8000/predict`.

**Streamlit demo:** `streamlit run streamlit_demo.py` — explains threshold + category mapping; use `weights/best.pt` from garbage-classification training. For a smoke test only: `set YOLO_WEIGHTS=yolov8n.pt` (COCO classes, not garbage names).

## Docker

Build with `best.pt` next to the Dockerfile or mount `./weights` at `/app/weights`. The image expects `/app/weights/best.pt` by default.

```bash
docker build -t ecocycle-yolo .
docker run -p 8000:8000 -v %cd%\weights:/app/weights ecocycle-yolo
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `YOLO_WEIGHTS` | `./weights/best.pt` | Local path, or a **hub name** such as `yolov8n.pt` (Ultralytics downloads it on first use — handy for UI smoke tests) |
| `YOLO_CONF` | `0.25` | Minimum confidence for boxes |
| `YOLO_DEVICE` | `cpu` | `cpu` or `cuda:0` etc. |
