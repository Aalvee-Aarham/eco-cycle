#!/bin/sh
set -e

PORT="${PORT:-8000}"

# CPU perf on Railway: one BLAS/OpenMP pool + ORT threads (set ORT_NUM_THREADS ≈ vCPU count in Variables)
ORT_N="${ORT_NUM_THREADS:-${OMP_NUM_THREADS:-2}}"
export OMP_NUM_THREADS="$ORT_N"
export ORT_NUM_THREADS="$ORT_N"
export OPENBLAS_NUM_THREADS="${OPENBLAS_NUM_THREADS:-1}"
export MKL_NUM_THREADS="${MKL_NUM_THREADS:-1}"
export NUMEXPR_NUM_THREADS="${NUMEXPR_NUM_THREADS:-1}"

# Download weights if URL set (.onnx recommended for slim image)
if [ -n "$YOLO_WEIGHTS_URL" ]; then
  mkdir -p /app/weights
  OUT="${YOLO_WEIGHTS_FILENAME:-}"
  if [ -z "$OUT" ]; then
    OUT="${YOLO_WEIGHTS_URL##*/}"
    OUT="${OUT%%\?*}"
  fi
  if [ -z "$OUT" ] || [ "$OUT" = "/" ]; then
    OUT="best.onnx"
  fi
  echo "Downloading weights to /app/weights/$OUT ..."
  curl -fSL -o "/app/weights/$OUT" "$YOLO_WEIGHTS_URL"
  export YOLO_WEIGHTS="/app/weights/$OUT"
fi

# Single worker: each worker loads the ONNX model into RAM (avoid 2× memory on small plans)
exec uvicorn inference_api:app --host 0.0.0.0 --port "$PORT" --workers 1
