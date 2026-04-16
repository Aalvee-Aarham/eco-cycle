"""
EcoCycle – Garbage Classification (Streamlit)
Runs exclusively on weights/best.pt — no network, no COCO fallback.
Deploy to Streamlit Cloud: push this file + weights/best.pt + requirements.txt.
"""
import os
import sys

import streamlit as st
from PIL import Image
from ultralytics import YOLO

# ── Paths ────────────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(_BASE, "weights", "best.pt")

# ── Inference config (override via env vars if needed) ───────────────────────
DEVICE = os.environ.get("YOLO_DEVICE", "cpu")
_IMGSZ = int(os.environ.get("YOLO_IMGSZ", "640"))
_IOU   = float(os.environ.get("YOLO_IOU", "0.7"))
_DEFAULT_CONF = float(os.environ.get("YOLO_CONF", "0.25"))

# ── Label → EcoCycle stream mapping ─────────────────────────────────────────
CLASS_TO_ECOCYCLE: dict[str, str] = {
    "paper":        "recyclable",
    "plastic":      "recyclable",
    "glass":        "recyclable",
    "metal":        "recyclable",
    "cardboard":    "recyclable",
    "cloth":        "recyclable",
    "clothes":      "recyclable",
    "textile":      "recyclable",
    "trash":        "organic",
    "garbage":      "organic",
    "organic":      "organic",
    "biodegradable":"organic",
    "food":         "organic",
    "battery":      "e-waste",
    "electronics":  "e-waste",
    "chemical":     "hazardous",
    "hazardous":    "hazardous",
}

_EWASTE_HINTS = (
    "battery", "keyboard", "laptop", "mouse", "cell", "monitor", "tv",
    "remote", "microwave", "toaster", "oven", "refrigerator", "washer",
    "dryer", "hair_drier", "printer", "router", "camera", "tablet",
    "clock", "headphone", "charger", "circuit",
)

_RECYCLABLE_PARTS = ("plastic", "paper", "metal", "glass", "cardboard", "bottle", "can")

STREAM_COLORS = {
    "recyclable": "#2ecc71",
    "organic":    "#e67e22",
    "e-waste":    "#3498db",
    "hazardous":  "#e74c3c",
}

STREAM_ICONS = {
    "recyclable": "♻️",
    "organic":    "🌿",
    "e-waste":    "🔋",
    "hazardous":  "⚠️",
}


def _normalize(name: str) -> str:
    return str(name).strip().lower().replace(" ", "_").replace("-", "_")


def to_ecocycle(detector_label: str) -> str:
    key = _normalize(detector_label)
    if key in CLASS_TO_ECOCYCLE:
        return CLASS_TO_ECOCYCLE[key]
    for hint in _EWASTE_HINTS:
        if _normalize(hint) in key:
            return "e-waste"
    for part in _RECYCLABLE_PARTS:
        if part in key:
            return "recyclable"
    return "organic"


# ── Model loader (cached across reruns) ─────────────────────────────────────
@st.cache_resource(show_spinner="Loading model…")
def load_model() -> YOLO:
    if not os.path.isfile(MODEL_PATH):
        st.error(
            f"**Model weights not found.**\n\n"
            f"Expected: `{MODEL_PATH}`\n\n"
            "Place `best.pt` inside a `weights/` folder next to this file and redeploy."
        )
        st.stop()
    try:
        return YOLO(MODEL_PATH)
    except Exception as exc:
        st.error(f"Failed to load model: {exc}")
        st.stop()


# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="EcoCycle – Garbage Classifier",
    page_icon="♻️",
    layout="centered",
    menu_items={"Get help": None, "Report a bug": None, "About": None},
)

st.markdown(
    "<style>"
    "[data-testid='stAppDeployButton']{display:none!important}"
    "footer{visibility:hidden}"
    "</style>",
    unsafe_allow_html=True,
)

# ── Header ───────────────────────────────────────────────────────────────────
st.title("♻️ EcoCycle Garbage Classifier")
st.markdown(
    "Upload a photo of waste. The model detects objects and maps each one to an "
    "**EcoCycle disposal stream**: recyclable, organic, e-waste, or hazardous."
)

# ── Stream legend ────────────────────────────────────────────────────────────
with st.expander("Disposal stream reference", expanded=False):
    cols = st.columns(4)
    for col, (stream, color) in zip(cols, STREAM_COLORS.items()):
        col.markdown(
            f"<div style='padding:10px;border-radius:8px;background:{color}22;"
            f"border-left:4px solid {color};'>"
            f"<b>{STREAM_ICONS[stream]} {stream.capitalize()}</b></div>",
            unsafe_allow_html=True,
        )

st.divider()

# ── Controls ─────────────────────────────────────────────────────────────────
col_upload, col_conf = st.columns([3, 1])

with col_upload:
    uploaded = st.file_uploader(
        "Upload image", type=["jpg", "jpeg", "png", "webp", "bmp"], label_visibility="collapsed"
    )

with col_conf:
    min_conf = st.slider(
        "Confidence threshold",
        min_value=0.05,
        max_value=0.95,
        value=_DEFAULT_CONF,
        step=0.05,
        help="Detections below this score are discarded. Lower = more boxes (higher recall).",
    )

# ── Inference ────────────────────────────────────────────────────────────────
if uploaded is not None:
    img = Image.open(uploaded).convert("RGB")
    st.image(img, caption="Input image", use_container_width=True)

    if st.button("🔍 Classify", type="primary", use_container_width=True):
        model = load_model()

        with st.spinner("Running detection…"):
            results = model(
                img,
                conf=min_conf,
                iou=_IOU,
                imgsz=_IMGSZ,
                device=DEVICE,
                max_det=300,
                half=False,
                verbose=False,
            )

        r0 = results[0]
        boxes = r0.boxes

        st.image(
            r0.plot()[:, :, ::-1],
            caption=f"Detections (confidence ≥ {min_conf})",
            use_container_width=True,
        )

        if boxes is None or len(boxes) == 0:
            st.warning(
                "No detections above the threshold. "
                "Try lowering the confidence threshold or using a clearer photo."
            )
        else:
            rows = []
            for box in boxes:
                cid   = int(box.cls[0].item())
                score = float(box.conf[0].item())
                raw   = model.names[cid]
                stream = to_ecocycle(raw)
                rows.append({
                    "Detected class": str(raw),
                    "Confidence":     round(score, 3),
                    "EcoCycle stream": f"{STREAM_ICONS[stream]} {stream}",
                })

            st.dataframe(rows, use_container_width=True, hide_index=True)

            top = max(rows, key=lambda x: x["Confidence"])
            raw_stream = top["EcoCycle stream"].split(" ", 1)[1]  # strip icon
            color = STREAM_COLORS[raw_stream]

            st.markdown(
                f"<div style='padding:16px;border-radius:10px;background:{color}22;"
                f"border-left:5px solid {color};margin-top:12px;'>"
                f"<b>Strongest detection:</b> {top['Detected class'].upper()} — "
                f"{top['EcoCycle stream']} (score {top['Confidence']})</div>",
                unsafe_allow_html=True,
            )
else:
    st.info("Upload an image above to get started.")