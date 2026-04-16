# Deployment Checklist - EcoCycle Full Stack

## Current Status

### ✅ Completed (Working)

- [x] **Client** - Deployed to Vercel
  - URL: `https://eco-cycle-client-red.vercel.app`
  - Status: Active and serving

- [x] **Server** - Deployed to Railway
  - Status: Active and receiving requests
  - Note: Currently using local YOLO_API_URL, needs update

- [x] **Code Preparation** for YOLO HF Spaces deployment
  - Updated `inference_api.py` with dynamic CORS
  - Fixed `Dockerfile` typo
  - Created environment files
  - Added deployment documentation

---

## 🆕 Next Steps - YOLO API Deployment

### Step 1: Prepare Repository ✅ DONE
- [x] Code changes completed
- [x] Environment files created
- [x] Documentation updated
- [x] Dockerfile fixed

### Step 2: Create Hugging Face Space
- [ ] Go to https://huggingface.co/spaces/create
- [ ] **Space Name**: `ecocycle-yolo` (or your choice)
- [ ] **SDK**: Docker
- [ ] **Visibility**: Public
- [ ] Click Create

### Step 3: Set Space Secrets
- [ ] Go to Space settings → **Secrets**
- [ ] Add from `.env.hf`:
  - [ ] `PORT=7860`
  - [ ] `INFERENCE_BACKEND=torch`
  - [ ] `YOLO_WEIGHTS=weights/best.pt`
  - [ ] `YOLO_CLASS_NAMES=paper,plastic,glass,metal,cardboard,cloth`
  - [ ] `ALLOWED_ORIGINS=*`

### Step 4: Connect Repository
Choose one method:

**Option A: Auto-Sync**
- [ ] Link this GitHub repository
- [ ] HF Spaces auto-builds on push

**Option B: Manual Upload**
- [ ] Upload `Dockerfile`
- [ ] Upload `requirements-api.txt`
- [ ] Upload `inference_api.py`
- [ ] Upload `app.py` (optional)
- [ ] Upload `weights/best.pt`

### Step 5: Deploy
- [ ] Click "Deploy" in HF Space
- [ ] Wait for build (usually 5-10 minutes)
- [ ] Check build logs if it fails
- [ ] Verify health check: `https://<your-space>.hf.space/health`

### Step 6: Get Deployment URL
- [ ] Copy Space URL: `https://<username>-<space-name>.hf.space`
- [ ] Note full API URL: `https://<username>-<space-name>.hf.space/detect`

### Step 7: Update Server Configuration
- [ ] Go to Railway Dashboard
- [ ] Select EcoCycle Server
- [ ] Go to **Variables** section
- [ ] Update `YOLO_API_URL=https://<username>-<space-name>.hf.space/detect`
- [ ] Click **Deploy** to restart server

### Step 8: Test End-to-End
- [ ] Open client: `https://eco-cycle-client-red.vercel.app`
- [ ] Navigate to dashboard
- [ ] Try uploading an image
- [ ] Expected: Image classification completes successfully
- [ ] Upload should show category (recyclable/organic/e-waste/hazardous)

### Step 9: Monitor
- [ ] Check HF Space logs for errors
- [ ] Check Railway server logs for connection errors
- [ ] Monitor first few classifications for accuracy

---

## Reference URLs After Deployment

Once complete, you'll have:

| Component | URL |
|-----------|-----|
| Client | `https://eco-cycle-client-red.vercel.app` |
| Server API | `https://<railway-url>/api` |
| YOLO API | `https://<username>-<space-name>.hf.space` |
| YOLO Health | `https://<username>-<space-name>.hf.space/health` |

---

## Environment Files Summary

### Created for This Deployment:

| File | Purpose | Location |
|------|---------|----------|
| `.env.hf` | HF Spaces config | `yolo-garbage-service/` |
| `.env.local` | Local dev (YOLO) | `yolo-garbage-service/` |
| `.env.railway` | Railway reference | `yolo-garbage-service/` |
| `.env.local` | Local dev (Server) | `server/` |
| `.env.production` | Prod reference (Server) | `server/` |
| `app.py` | HF Spaces entrypoint | `yolo-garbage-service/` |
| `DEPLOYMENT.md` | Full deployment guide | Root |
| `ENVIRONMENT_CHANGES.md` | Changes summary | Root |

---

## If Something Goes Wrong

### YOLO API returns 500 error
1. Check HF Space → Runtime → Logs
2. Verify `best.pt` file exists
3. Check environment variables are set correctly
4. Restart the Space

### Server can't connect to YOLO API
1. Test health: `curl https://<space-url>/health`
2. Verify URL in Railway variables (no typos)
3. Check CORS (should allow all origins)
4. Try curl from command line first

### Classification fails silently
1. Check browser console (F12) for errors
2. Check server logs in Railway
3. Check YOLO logs in HF Space
4. Try manual test: `curl -X POST https://<space>/detect -F "file=@test.jpg"`

---

## Quick Commands Reference

### Test YOLO API Health
```bash
curl https://<username>-<space-name>.hf.space/health
```

### Test YOLO API with Image
```bash
curl -X POST https://<username>-<space-name>.hf.space/detect \
  -F "file=@image.jpg" \
  -F "conf=0.25"
```

### Run YOLO Locally for Testing
```bash
cd yolo-garbage-service
cp .env.local .env
python -m pip install -r requirements-api.txt
python -m uvicorn inference_api:app --host 0.0.0.0 --port 8000
```

---

## Success Criteria ✓

When fully deployed, you should be able to:

- [ ] Visit client app and see dashboard
- [ ] Upload an image
- [ ] Get classification result (category + confidence)
- [ ] See detection working across all deployments
- [ ] View logs without critical errors

---

## Support Resources

- **Hugging Face Docs**: https://huggingface.co/docs/hub/spaces
- **Hugging Face Spaces API**: https://huggingface.co/spaces
- **Railway Dashboard**: https://railway.app/dashboard
- **Project DEPLOYMENT.md**: See `./DEPLOYMENT.md` for detailed guide

---

**Last Updated**: April 16, 2026
**Status**: Ready for HF Spaces Deployment ✨

