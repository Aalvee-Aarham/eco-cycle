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
 * Includes Roboflow "garbage-classification-3" streams (paper, plastic, glass, metal, cardboard, cloth).
 */
const LABEL_MAP = {
  // garbage-classification-3 (Material Identification)
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
    const url = process.env.YOLO_API_URL;
    if (!url) {
      throw new Error('YOLO_API_URL is not set');
    }

    const form = new FormData();
    form.append('image', imageBuffer, { contentType: mimeType, filename: 'image.jpg' });

    const { data } = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: DEFAULT_TIMEOUT_MS,
    });

    const predictions = Array.isArray(data?.predictions) ? data.predictions : [];
    if (predictions.length === 0) {
      return {
        category: 'organic',
        subcategory: 'no_detection',
        confidence: 0.05,
        rawResponse: { ...data, noDetections: true },
      };
    }

    const best = [...predictions].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
    const label = best.label ?? 'unknown';
    const confidence = typeof best.confidence === 'number' ? best.confidence : 0;

    return {
      category: mapLabelToCategory(label),
      subcategory: label,
      confidence,
      rawResponse: data,
    };
  }
}
