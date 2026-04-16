# Configured for Hugging Face Spaces:
#   1. Non-root user (uid 1000)
#   2. Port 7860
#   3. Write access only to /tmp

FROM python:3.11-slim

# System deps for OpenCV / Pillow / PyTorch
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (HF Spaces requirement)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Install Python dependencies from the subfolder
COPY --chown=user yolo-garbage-service/requirements-api.txt .
RUN pip install --no-cache-dir --upgrade -r requirements-api.txt

# Copy API implementation and weights from the subfolder
COPY --chown=user yolo-garbage-service/inference_api.py .
COPY --chown=user yolo-garbage-service/weights/ weights/

# HF Spaces always uses port 7860
EXPOSE 7860

CMD ["uvicorn", "inference_api:app", "--host", "0.0.0.0", "--port", "7860"]
