"""
Hugging Face Spaces entrypoint wrapper for EcoCycle YOLO Inference API.
This file is optional but helps HF Spaces detect the application properly.

Import and re-export the FastAPI app from inference_api.py
"""

from inference_api import app

if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(
        "__main__:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload in production
        log_level="info",
    )
