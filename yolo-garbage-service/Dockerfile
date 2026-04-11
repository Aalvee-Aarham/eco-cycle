# Slim + fast on CPU: ONNX Runtime only (typical image ~1.2–2.5 GB, well under 4 GB).
# Do not install PyTorch here — that pushes images past ~4 GB.
FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt

COPY inference_api.py onnx_backend.py .
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

RUN mkdir -p /app/weights

ENV INFERENCE_BACKEND=onnx
ENV YOLO_WEIGHTS=/app/weights/best.onnx
ENV YOLO_DEVICE=cpu
ENV YOLO_CONF=0.25
ENV PORT=8000
# Sensible default for 2 vCPU Railway boxes; override with Variables
ENV ORT_NUM_THREADS=2
ENV OMP_NUM_THREADS=2

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
