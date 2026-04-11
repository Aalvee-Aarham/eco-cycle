FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY inference_api.py .

ENV YOLO_WEIGHTS=/app/weights/best.pt
ENV YOLO_DEVICE=cpu
ENV YOLO_CONF=0.25

EXPOSE 8000

CMD ["uvicorn", "inference_api:app", "--host", "0.0.0.0", "--port", "8000"]
