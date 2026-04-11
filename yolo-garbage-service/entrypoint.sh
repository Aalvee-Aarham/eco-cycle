#!/bin/sh
set -e

PORT="${PORT:-8000}"

# Optional: download trained weights at boot (set in Railway Variables).
# Example: a presigned S3 URL or any HTTPS URL to your best.pt file.
if [ -n "$YOLO_WEIGHTS_URL" ]; then
  mkdir -p /app/weights
  echo "Downloading weights from YOLO_WEIGHTS_URL..."
  curl -fSL -o /app/weights/best.pt "$YOLO_WEIGHTS_URL"
  export YOLO_WEIGHTS=/app/weights/best.pt
fi

exec uvicorn inference_api:app --host 0.0.0.0 --port "$PORT"
