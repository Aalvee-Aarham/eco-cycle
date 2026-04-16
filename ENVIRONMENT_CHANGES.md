# Environment Files Changed - Deployment Update

## Summary
Updated codebase for production deployment with:
- Client (Vercel) - Already deployed ✅
- Server (Railway) - Already deployed ✅
- YOLO Inference API (Hugging Face Spaces) - Ready for deployment 🆕

---

## Files Created/Modified

### 1. YOLO Service - New Environment Files

#### `.env.hf` (NEW)
- **Purpose**: Hugging Face Spaces configuration
- **Port**: 7860 (HF Spaces default)
- **Backend**: `torch` (PyTorch with Ultralytics)
- **Weights**: `best.pt`
- **CORS**: Allow all origins

```env
PORT=7860
ALLOWED_ORIGINS=*
INFERENCE_BACKEND=torch
YOLO_WEIGHTS=weights/best.pt
YOLO_CLASS_NAMES=paper,plastic,glass,metal,cardboard,cloth
```

#### `.env.railway` (NEW)
- **Purpose**: Railway deployment (reference only)
- **Port**: 8000
- **Backend**: `onnx` (optimized for production)
- **Weights**: `best.onnx`

```env
PORT=8000
ALLOWED_ORIGINS=*
INFERENCE_BACKEND=onnx
YOLO_WEIGHTS=weights/best.onnx
YOLO_CLASS_NAMES=paper,plastic,glass,metal,cardboard,cloth
```

#### `.env.local` (NEW)
- **Purpose**: Local development
- **Port**: 8000
- **Backend**: `torch`
- **CORS**: Localhost only

```env
PORT=8000
INFERENCE_BACKEND=torch
YOLO_WEIGHTS=weights/best.pt
YOLO_CLASS_NAMES=paper,plastic,glass,metal,cardboard,cloth
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5001,http://localhost:3000
```

---

### 2. Server - New Environment Files

#### `.env.local` (NEW)
- **Purpose**: Local development reference
- **Database**: Shared MongoDB (same as production)
- **YOLO_API_URL**: `http://localhost:8000/detect`

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
YOLO_API_URL=http://localhost:8000/detect
```

#### `.env.production` (NEW)
- **Purpose**: Production/Railway configuration template
- **Database**: Production MongoDB
- **YOLO_API_URL**: Hugging Face Spaces placeholder (UPDATE THIS)
- **CLIENT_URL**: Vercel deployment

```env
PORT=5001
NODE_ENV=production
CLIENT_URL=https://eco-cycle-client-red.vercel.app
YOLO_API_URL=https://your-username-ecocycle-yolo.hf.space/detect
```

#### `.env` (EXISTING - UNCHANGED)
- Still used for local development
- ⚠️ **ACTION**: After HF Spaces deployment, update `YOLO_API_URL` in Railway dashboard directly

---

### 3. Code Changes

#### `inference_api.py`
- **Modified**: CORS configuration
- **Change**: Now reads from `ALLOWED_ORIGINS` environment variable
- **Backward compatible**: Defaults to "*" if not set

```python
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else ["*"]
```

#### `Dockerfile`
- **Fixed**: Typo in requirements filename
- **Before**: `requirements_api.txt` (underscore)
- **After**: `requirements-api.txt` (hyphen)

#### `app.py` (NEW)
- **Purpose**: Alternative entrypoint for HF Spaces
- **Optional**: Dockerfile already handles startup correctly
- **Use case**: HF Spaces auto-detection if Dockerfile not recognized

---

### 4. Documentation

#### `DEPLOYMENT.md` (NEW)
- Comprehensive deployment guide
- Step-by-step HF Spaces setup
- Troubleshooting guide
- Environment configuration reference

#### `yolo-garbage-service/README.md`
- **Modified**: Added HF Spaces deployment section
- **Content**: Setup, configuration, testing instructions

---

## What You Need to Do

### Before Deploying to Hugging Face Spaces

1. **Ensure `best.pt` exists** in `yolo-garbage-service/weights/`
   ```bash
   ls -la yolo-garbage-service/weights/best.pt
   ```

2. **Test locally** with `.env.local`:
   ```bash
   cd yolo-garbage-service
   cp .env.local .env
   pip install -r requirements-api.txt
   python -m uvicorn inference_api:app --host 0.0.0.0 --port 8000
   ```

### Deploy to Hugging Face Spaces

1. Create new Space at https://huggingface.co/spaces/create
2. Choose Docker SDK
3. Link this repository OR upload files
4. Add environment variables from `.env.hf` to Space secrets
5. Trigger deployment

### After HF Spaces Deployment

1. Get your Space URL: `https://<username>-<space-name>.hf.space`
2. Update Railway server:
   - Go to Railway Dashboard
   - Select EcoCycle server + app
   - Go to Variables
   - Update `YOLO_API_URL=https://<username>-<space-name>.hf.space/detect`
   - Click Deploy

---

## Environment Variable Reference

| Location | Variable | Local Dev | Production |
|----------|----------|-----------|-----------|
| **YOLO Service** | `PORT` | 8000 | 7860 (HF) |
| | `INFERENCE_BACKEND` | torch | torch (HF) |
| | `YOLO_WEIGHTS` | weights/best.pt | weights/best.pt |
| | `ALLOWED_ORIGINS` | localhost:* | * |
| **Server** | `PORT` | 5001 | 5001 |
| | `NODE_ENV` | development | production |
| | `CLIENT_URL` | localhost:5173 | vercel.app |
| | `YOLO_API_URL` | localhost:8000 | hf.space/detect |
| **Client** | — | localhost:5173 | vercel.app |

---

## Files Not Changed (Already Configured)

✅ `server/.env` - Still works for local dev (keep as is)
✅ `client/.env` - Already configured
✅ `yolo-garbage-service/requirements-api.txt` - Correct
✅ All other source code files - Production ready

---

## Quick Summary

**Modified**: 2 files (`inference_api.py`, `Dockerfile`)
**Created**: 7 new files (`.env.hf`, `.env.local`, `.env.railway`, `.env.local`, `.env.production`, `app.py`, `DEPLOYMENT.md`)
**Updated**: 1 documentation file (`README.md`)

**Total**: 3 modified + 7 created + 1 updated = 11 files touched

