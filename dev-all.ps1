# EcoCycle Dev Server - Run Client, Server, and YOLO Inference API simultaneously
# This script starts all three services in parallel PowerShell windows

$ErrorActionPreference = "Stop"

# Get the root directory of the project
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$clientDir = Join-Path $rootDir "client"
$serverDir = Join-Path $rootDir "server"
$yoloDir = Join-Path $rootDir "yolo-garbage-service"

Write-Host "🚀 Starting EcoCycle Development Stack..." -ForegroundColor Cyan
Write-Host ""

# Function to start a service in a new window
function Start-ServiceWindow([string]$title, [string]$path, [string]$command) {
    Write-Host "📦 Starting $title in $path" -ForegroundColor Green
    
    $startupScript = @"
Set-Location "$path"
$command
"@
    
    $encodedScript = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($startupScript))
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-EncodedCommand", $encodedScript
    ) -WindowStyle Normal
}

# Start YOLO Inference API (Python)
Start-ServiceWindow -title "YOLO Inference API" -path $yoloDir -command "python -m pip install -q -r requirements-api.txt; uvicorn inference_api:app --host 0.0.0.0 --port 8000"
Start-Sleep -Milliseconds 1000

# Start Server
Start-ServiceWindow -title "Server" -path $serverDir -command "npm run dev"
Start-Sleep -Milliseconds 500

# Start Client
Start-ServiceWindow -title "Client" -path $clientDir -command "npm run dev"

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Services info:" -ForegroundColor Cyan
Write-Host "  • Client: http://localhost:5173" -ForegroundColor Yellow
Write-Host "  • Server: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  • YOLO API: http://localhost:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Tip: Close any window to stop that service. Or run 'npm run dev' instead for better terminal output." -ForegroundColor Gray
