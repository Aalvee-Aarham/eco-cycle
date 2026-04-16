# Deployment Guide - EcoCycle

This guide covers deployment of all three components: Client, Server, and YOLO Inference API.

## Architecture Overview

```
Client (Vercel)
    ↓
Server (Railway)
    ↓
YOLO API (Hugging Face Spaces)
```

---

## 1. Client Deployment (Vercel) ✅

**Status**: Already deployed to `https://eco-cycle-client-red.vercel.app`

### Setup
- Connected to this GitHub repository
- Auto-deploys on push to main branch
- Environment: Uses production API endpoint

---

## 2. Server Deployment (Railway) ✅

**Status**: Already deployed and working

### Environment Variables
The server uses `.env.production` for Railway deployment:
- `CLASSIFIER=yolo` — Uses YOLO for classification
- `YOLO_API_URL=https://your-username-ecocycle-yolo.hf.space/detect` — Update after HF deployment
- `GEMINI_API_KEY` — Fallback classifier
- `MONGO_URI` — Production MongoDB
- `REDIS_URL` — Redis cache

### Update After HF Deployment
1. Get your Hugging Face Spaces URL after deployment
2. Update `YOLO_API_URL` in Railway environment variables
3. Restart the server

---

## 3. YOLO Inference API Deployment (Hugging Face Spaces) 🆕

### Steps to Deploy:

#### 3.1 Create Hugging Face Space

1. Go to https://huggingface.co/spaces/create
2. Fill in:
   - **Owner**: Your organization
   - **Space name**: `ecocycle-yolo` (or similar)
   - **License**: MIT
   - **Space SDK**: Docker
   - **Visibility**: Public (for API access)

#### 3.2 Connect to Your Repository

Use **Dockerfile** from this project. HF Spaces will:
1. Clone your repo
2. Build from `Dockerfile`
3. Run the app

#### 3.3 Set Environment Variables

In HF Spaces settings → Secrets, add:

```env
PORT=7860
ALLOWED_ORIGINS=*
INFERENCE_BACKEND=torch
YOLO_WEIGHTS=weights/best.pt
```

#### 3.4 Deploy

Push to the HF Spaces repository or manually trigger deployment.

#### 3.5 Get API URL

Once deployed, your API will be available at:
```
https://<username>-ecocycle-yolo.hf.space/detect
```

### Health Check
Test the API:
```bash
curl https://<username>-ecocycle-yolo.hf.space/health
```

Expected response:
```json
{"status": "ok", "model": "weights/best.pt", "device": "cpu"}
```

---

## 4. Update Server to Use HF Spaces

### Via Railway Dashboard

1. Go to **Railway Dashboard** → Your project → **Variables**
2. Update:
   ```
   YOLO_API_URL=https://<username>-ecocycle-yolo.hf.space/detect
   ```
3. Click **Deploy** to restart

### Verify Connection

Test that server connects to Hugging Face API:
```bash
curl -X POST https://your-server.railway.app/api/submissions \
  -F "file=@image.jpg" \
  -H "Authorization: Bearer your_jwt_token"
```

---

## Environment Files Reference

### Local Development
- **Server**: `.env.local` → `http://localhost:5001`
- **Inference API**: `.env.local` → `http://localhost:8000`
- **Client**: `http://localhost:5173`

### Production
- **Server**: `.env.production` → Railway deployment
- **Inference API**: `.env.hf` → Hugging Face Spaces
- **Client**: Vercel deployment

### Copy Environment Files

For different environments:
```bash
# Local dev
cp .env.local .env

# Production (Server) - NOT NEEDED (Railway uses web UI)
# cp .env.production .env

# Hugging Face - Keep in repo, HF uses it automatically
```

---

## File Structure

```
yolo-garbage-service/
├── .env.hf              # ← HF Spaces environment
├── .env.railway         # ← Railway environment (reference only)
├── .env.local           # ← Local development
├── inference_api.py     # ← Updated with configurable CORS
├── Dockerfile
├── requirements-api.txt
└── weights/
    └── best.pt

server/
├── .env                    # ← Local development
├── .env.local              # ← Local development reference
├── .env.production         # ← Production reference
└── ... (rest of server code)
```

---

## Troubleshooting

### YOLO API Returns 500 Error

1. Check HF Spaces logs:
   - Go to Space → Runtime
   - View application logs

2. Verify weights file exists:
   ```bash
   ls -la weights/best.pt
   ```

3. Check dependencies installed:
   ```
   pip list | grep torch
   pip list | grep ultralytics
   ```

### Server Can't Connect to YOLO API

1. Verify URL format:
   - Should be: `https://<username>-<space>.hf.space/detect`
   - Check for typos

2. Test connectivity:
   ```bash
   curl https://<username>-ecocycle-yolo.hf.space/health
   ```

3. Check CORS:
   - CORS is set to allow all origins (`"*"`)
   - If still failing, check browser console for CORS errors

### Model Takes Too Long to Load

- `.pt` format (PyTorch) is slower
- For faster inference, export to ONNX and use `.env.railway` settings
- Or use smaller model: `yolov8n` instead of full model

---

## Deployment Checklist

- [ ] Client deployed to Vercel ✅
- [ ] Server deployed to Railway ✅
- [ ] Created Hugging Face Spaces account
- [ ] Created new Space with Docker
- [ ] Set environment variables in HF Spaces
- [ ] Triggered deployment
- [ ] Got HF Spaces URL
- [ ] Updated `YOLO_API_URL` in Railway
- [ ] Restarted Railway server
- [ ] Tested API connectivity
- [ ] Tested end-to-end classification

---

## Quick Reference: Post-Deployment

After deploying to HF Spaces:

1. **Get URL**: `https://<username>-ecocycle-yolo.hf.space`
2. **Update Railway**:
   ```
   YOLO_API_URL=https://<username>-ecocycle-yolo.hf.space/detect
   ```
3. **Restart Server**: Click Deploy in Railway Dashboard
4. **Test**: Upload image to client → Should classify successfully

---

## Support

For issues, check:
- HF Spaces logs: Space → Runtime
- Railway logs: Dashboard → Logs
- Server logs (errors shown in browser console)

