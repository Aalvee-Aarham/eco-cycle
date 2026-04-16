#!/bin/bash

# EcoCycle Dev Server - Run Client, Server, and YOLO Inference API simultaneously
# This script starts all three services in parallel for macOS/Linux

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$ROOT_DIR/client"
SERVER_DIR="$ROOT_DIR/server"
YOLO_DIR="$ROOT_DIR/yolo-garbage-service"

echo ""
echo "🚀 Starting EcoCycle Development Stack..."
echo ""

# Function to trap interrupt and cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup EXIT INT TERM

# Start YOLO Inference API (Python)
echo "📦 Starting YOLO Inference API in $YOLO_DIR"
(cd "$YOLO_DIR" && python -m pip install -q -r requirements-api.txt && uvicorn inference_api:app --host 0.0.0.0 --port 8000) &

sleep 2

# Start Server
echo "📦 Starting Server in $SERVER_DIR"
(cd "$SERVER_DIR" && npm run dev) &

sleep 1

# Start Client
echo "📦 Starting Client in $CLIENT_DIR"
(cd "$CLIENT_DIR" && npm run dev) &

echo ""
echo "✅ All services started!"
echo ""
echo "📋 Services info:"
echo "  • Client: http://localhost:5173"
echo "  • Server: http://localhost:3000"
echo "  • YOLO API: http://localhost:8000"
echo ""
echo "💡 Press Ctrl+C to stop all services."
echo ""

# Wait for all background jobs
wait
