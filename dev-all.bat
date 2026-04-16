@echo off
REM EcoCycle Dev Server - Run Client, Server, and YOLO Inference API simultaneously
REM This batch file starts all three services in parallel windows

setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0
set CLIENT_DIR=%ROOT_DIR%client
set SERVER_DIR=%ROOT_DIR%server
set YOLO_DIR=%ROOT_DIR%yolo-garbage-service

echo.
echo Starting EcoCycle Development Stack...
echo.

REM Start YOLO Inference API (Python)
echo [YOLO API] Starting in %YOLO_DIR%
start "YOLO Inference API" cmd /k "cd /d %YOLO_DIR% && python -m pip install -q -r requirements-api.txt && uvicorn inference_api:app --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak

REM Start Server
echo [SERVER] Starting in %SERVER_DIR%
start "Server" cmd /k "cd /d %SERVER_DIR% && npm run dev"
timeout /t 1 /nobreak

REM Start Client
echo [CLIENT] Starting in %CLIENT_DIR%
start "Client" cmd /k "cd /d %CLIENT_DIR% && npm run dev"

echo.
echo All services started!
echo.
echo Services info:
echo   - Client (React): http://localhost:5173
echo   - Server (Node): http://localhost:3000
echo   - YOLO API (Python): http://localhost:8000
echo.
echo Tip: Close any window to stop that service.
echo.
