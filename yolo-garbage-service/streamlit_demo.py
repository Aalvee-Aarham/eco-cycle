"""
Minimal Streamlit UI for garbage YOLO + EcoCycle-style labels.
Run: streamlit run streamlit_demo.py
Weights: YOLO_WEIGHTS env, or weights/best.pt (train on garbage-classification-3); yolov8n.pt = quick COCO test only.
"""
import os

import streamlit as st
from PIL import Image
from ultralytics import YOLO

_BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.environ.get("YOLO_WEIGHTS", os.path.join(_BASE, "weights", "best.pt"))
DEVICE = os.environ.get("YOLO_DEVICE", "cpu")

# Roboflow "garbage-classification-3" material streams → EcoCycle DB categories (same spirit as server YOLOAdapter).
# Keys are lowercased detector names. Unmatched labels fall back to "organic" (mixed / unknown waste)
# — COCO demo classes (keyboard, tv, …) are not garbage names, so we add common e-waste hints below.
CLASS_TO_ECOCYCLE = {
    "paper": "recyclable",
    "plastic": "recyclable",
    "glass": "recyclable",
    "metal": "recyclable",
    "cardboard": "recyclable",
    "cloth": "recyclable",
    "clothes": "recyclable",
    "textile": "recyclable",
    "trash": "organic",
    "garbage": "organic",
    "organic": "organic",
    "biodegradable": "organic",
    "food": "organic",
    "battery": "e-waste",
    "electronics": "e-waste",
    # COCO-style names when using yolov8n.pt for smoke tests
    "keyboard": "e-waste",
    "mouse": "e-waste",
    "laptop": "e-waste",
    "tv": "e-waste",
    "cell_phone": "e-waste",
    "remote": "e-waste",
    "microwave": "e-waste",
    "toaster": "e-waste",
    "oven": "e-waste",
    "refrigerator": "e-waste",
    "hair_drier": "e-waste",
    "chemical": "hazardous",
    "hazardous": "hazardous",
}


def normalize(name: str) -> str:
    return str(name).strip().lower().replace(" ", "_").replace("-", "_")


# Substrings for labels not in CLASS_TO_ECOCYCLE (covers COCO + typos). Order: e-waste before recyclable.
_EWASTE_HINTS = (
    "keyboard",
    "laptop",
    "mouse",
    "cell",
    "monitor",
    "tv",
    "remote",
    "microwave",
    "toaster",
    "oven",
    "refrigerator",
    "washer",
    "dryer",
    "hair_drier",
    "hair drier",
    "printer",
    "router",
    "camera",
    "tablet",
    "clock",
    "headphone",
    "charger",
    "circuit",
    "battery",
)


def to_ecocycle(detector_label: str) -> str:
    key = normalize(detector_label)
    if key in CLASS_TO_ECOCYCLE:
        return CLASS_TO_ECOCYCLE[key]
    for hint in _EWASTE_HINTS:
        if normalize(hint) in key or hint.replace(" ", "_") in key:
            return "e-waste"
    # Use "cardboard" not "card" — avoids bogus matches on unrelated words.
    for part in ("plastic", "paper", "metal", "glass", "cardboard", "bottle", "can"):
        if part in key:
            return "recyclable"
    return "organic"


@st.cache_resource
def load_model():
    try:
        return YOLO(MODEL_PATH)
    except Exception as e:
        raise RuntimeError(
            f"Cannot load `{MODEL_PATH}`. Put best.pt in weights/ or set YOLO_WEIGHTS=yolov8n.pt for a quick test."
        ) from e


st.set_page_config(page_title="Garbage YOLO demo", layout="centered")

st.title("Garbage classification (YOLO demo)")

with st.expander("What the algorithm does", expanded=True):
    st.markdown(
        """
        1. **YOLO** finds objects in the image (bounding boxes + class + score).
        2. **Threshold** — you choose a minimum score; weaker boxes are ignored (fewer false alarms, but you can miss objects if it is too high).
        3. **Categories** — each kept box has a **detector class** (from your training data). This demo maps those names to **EcoCycle** streams: recyclable, organic, e-waste, hazardous.
        """
    )

st.subheader("garbage-classification → EcoCycle")
st.table(
    [
        {"Detector class (example dataset)": "PAPER, PLASTIC, GLASS, METAL, CARDBOARD, CLOTH", "EcoCycle stream": "recyclable"},
        {"Detector class (example dataset)": "TRASH, ORGANIC, BIODEGRADABLE, …", "EcoCycle stream": "organic"},
        {"Detector class (example dataset)": "BATTERY, ELECTRONICS, …", "EcoCycle stream": "e-waste"},
        {"Detector class (example dataset)": "CHEMICAL, HAZARDOUS, …", "EcoCycle stream": "hazardous"},
    ]
)

min_conf = st.slider(
    "Confidence threshold",
    min_value=0.05,
    max_value=0.95,
    value=float(os.environ.get("YOLO_CONF", "0.25")),
    step=0.05,
    help="Keep only detections with score ≥ this value (model output is 0–1).",
)

st.caption(f"Weights: `{MODEL_PATH}`  ·  device: `{DEVICE}`")

uploaded = st.file_uploader("Upload one image", type=["jpg", "jpeg", "png", "webp", "bmp"])

if uploaded is not None:
    img = Image.open(uploaded).convert("RGB")
    st.image(img, caption="Input", use_container_width=True)

if st.button("Run detection", disabled=uploaded is None):
    model = load_model()
    results = model(img, conf=min_conf, device=DEVICE, verbose=False)
    r0 = results[0]
    boxes = r0.boxes

    st.image(r0.plot()[:, :, ::-1], caption=f"Boxes (conf ≥ {min_conf})", use_container_width=True)

    if boxes is None or len(boxes) == 0:
        st.warning("No detections above the threshold. Lower the threshold or use a clearer photo.")
    else:
        rows = []
        for box in boxes:
            cid = int(box.cls[0].item())
            score = float(box.conf[0].item())
            raw = model.names[cid] if isinstance(model.names, dict) else model.names[cid]
            rows.append(
                {
                    "Detected class": str(raw),
                    "Confidence": round(score, 3),
                    "EcoCycle stream": to_ecocycle(raw),
                }
            )
        st.dataframe(rows, use_container_width=True)
        top = max(rows, key=lambda x: x["Confidence"])
        st.success(f"Strongest detection: **{top['Detected class']}** → **{top['EcoCycle stream']}** (score {top['Confidence']})")

st.divider()
st.caption(
    "Train on [garbage-classification-3](https://universe.roboflow.com/material-identification/garbage-classification-3) "
    "and save weights as `weights/best.pt`. Using `yolov8n.pt` shows **COCO** classes (person, car, …), not garbage names — only for testing that the app runs."
)
