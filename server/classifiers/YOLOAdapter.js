import FormData from 'form-data';
import axios from 'axios';
import { ClassifierAdapter } from './ClassifierAdapter.js';

/** Normalize YOLO class names from various datasets (Roboflow, custom). */
function normalizeLabel(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

/**
 * Maps detector class names → EcoCycle submission categories.
 */
const LABEL_MAP = {
  // Material identification
  paper: 'recyclable',
  plastic: 'recyclable',
  glass: 'recyclable',
  metal: 'recyclable',
  cardboard: 'recyclable',
  cloth: 'recyclable',
  clothes: 'recyclable',
  textile: 'recyclable',
  palstic: 'recyclable',
  carboard: 'recyclable',
  trash: 'organic',
  garbage: 'organic',
  organic: 'organic',
  food: 'organic',
  food_waste: 'organic',
  vegetable: 'organic',
  fruit_peel: 'organic',
  compost: 'organic',
  plastic_bottle: 'recyclable',
  glass_bottle: 'recyclable',
  metal_can: 'recyclable',
  battery: 'e-waste',
  phone: 'e-waste',
  cable: 'e-waste',
  laptop: 'e-waste',
  tv: 'e-waste',
  electronics: 'e-waste',
  e_waste: 'e-waste',
  paint_can: 'hazardous',
  chemical_bottle: 'hazardous',
  aerosol: 'hazardous',
  syringe: 'hazardous',
  hazardous: 'hazardous',
};

function mapLabelToCategory(label) {
  const key = normalizeLabel(label);
  if (LABEL_MAP[key]) return LABEL_MAP[key];
  if (LABEL_MAP[label]) return LABEL_MAP[label];
  const k = key.replace(/_/g, '');
  if (
    k.includes('keyboard')
    || k.includes('laptop')
    || k.includes('mouse')
    || k.includes('monitor')
    || k.includes('remote')
    || k.includes('microwave')
    || k.includes('toaster')
    || k.includes('refrigerator')
    || k.includes('battery')
    || k.includes('electronic')
    || k.includes('cell')
    || (k.includes('phone') && !k.includes('microphone'))
  ) {
    return 'e-waste';
  }
  if (k.includes('chemical') || k.includes('hazard') || k.includes('syringe') || k.includes('paint')) {
    return 'hazardous';
  }
  if (k.includes('food') || k.includes('organic') || k.includes('trash') || k.includes('garbage')) {
    return 'organic';
  }
  if (k.includes('plastic') || k.includes('paper') || k.includes('metal') || k.includes('glass') || k.includes('cardboard')) {
    return 'recyclable';
  }
  return 'organic';
}

const DEFAULT_TIMEOUT_MS = Number(process.env.YOLO_HTTP_TIMEOUT_MS || 30000);

export class YOLOAdapter extends ClassifierAdapter {
  async classify(imageBuffer, mimeType) {
    console.log('[YOLOAdapter] Sending image to local inference API...');
    const url = process.env.YOLO_API_URL;
    if (!url) {
      throw new Error('YOLO_API_URL is not set');
    }

    // inference_api.py /detect expects multipart field named "file"
    const form = new FormData();
    form.append('file', imageBuffer, { contentType: mimeType, filename: 'image.jpg' });

    const { data } = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: DEFAULT_TIMEOUT_MS,
    });

    // Response shape from inference_api.py:
    // { success, detections: [{class_name, class_id, confidence, ecocycle_stream, bounding_box}],
    //   detected_image: "<base64_jpeg>", detection_count, inference_ms, ... }
    const detections = Array.isArray(data?.detections) ? data.detections : [];

    if (detections.length === 0) {
      return {
        category: 'organic',
        subcategory: 'no_detection',
        confidence: 0.05,
        rawResponse: { ...data, noDetections: true },
      };
    }

    // Best detection is first (inference_api sorts by confidence desc)
    const best = detections[0];
    const label = best.class_name ?? 'unknown';
    const confidence = typeof best.confidence === 'number' ? best.confidence : 0;

    // Build predictions array compatible with the Classify UI
    const predictions = detections.map((d) => ({
      label: d.class_name,
      confidence: d.confidence,
      ecocycle_stream: d.ecocycle_stream,
      bounding_box: d.bounding_box,
    }));

    return {
      category: best.ecocycle_stream ?? mapLabelToCategory(label),
      subcategory: label,
      confidence,
      rawResponse: {
        ...data,
        predictions,
        detected_image: data.detected_image ?? null,
      },
    };
  }
}
