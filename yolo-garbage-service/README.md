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

## Deploy on Railway

Railway runs the **Dockerfile** and sets **`PORT`**; `entrypoint.sh` starts Uvicorn on that port.

### 1. Create a service from your GitHub repo

1. Open [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Pick [`eco-cycle`](https://github.com/Aalvee-Aarham/eco-cycle) (or your fork).
3. Add / select the service → **Settings** → **Root Directory** → set to: **`yolo-garbage-service`**  
   (so Railway builds this folder, where the `Dockerfile` and `railway.toml` live).

### 2. Variables (Railway → Variables)

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `PORT` | No | Railway injects this automatically — do not override unless you know you need to. |
| `YOLO_WEIGHTS` | One of the weight options below | `/app/weights/best.pt` (default after download) or `yolov8n.pt` for a quick smoke test only. |
| `YOLO_WEIGHTS_URL` | Recommended for real models | HTTPS URL to your **`best.pt`** (presigned S3, GitHub release asset, etc.). On boot, the container downloads it to `/app/weights/best.pt`. |
| `YOLO_CONF` | No | `0.25` |
| `YOLO_DEVICE` | No | `cpu` (GPU is not typical on Railway hobby tiers). |
| `YOLO_WEIGHTS_URL` | Optional | If set, downloads `best.pt` at container start (see **Deploy on Railway**). |

**Weights:** either set **`YOLO_WEIGHTS_URL`** to a downloadable `best.pt`, or for testing set **`YOLO_WEIGHTS=yolov8n.pt`** (COCO, not garbage classes). Do not commit large `.pt` files to git.

### 3. Networking

1. **Generate Domain** (Settings → Networking) so you get `https://your-service.up.railway.app`.
2. Your EcoCycle **Node** server needs:

   `YOLO_API_URL=https://your-service.up.railway.app/predict`

   (path must end with **`/predict`** — same as [`YOLOAdapter.js`](../server/classifiers/YOLOAdapter.js).)

### 4. Health check

`railway.toml` points the healthcheck at **`GET /health`**. The first request may be slow while Ultralytics loads/downloads weights; timeout is set to **300** seconds.

### 5. Cold starts & RAM

YOLO + PyTorch needs enough **RAM** (often **≥ 2 GB**; more if the model is large). If the deploy crashes with OOM, upgrade the plan or use a smaller export (e.g. ONNX elsewhere — out of scope here).

### 6. Verify

```bash
curl -s https://YOUR-RAILWAY-URL/health
curl -s -X POST https://YOUR-RAILWAY-URL/predict -F "image=@sample.jpg"
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `YOLO_WEIGHTS` | `./weights/best.pt` | Local path, or a **hub name** such as `yolov8n.pt` (Ultralytics downloads it on first use — handy for UI smoke tests) |
| `YOLO_CONF` | `0.25` | Minimum confidence for boxes |
| `YOLO_DEVICE` | `cpu` | `cpu` or `cuda:0` etc. |
