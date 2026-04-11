import FormData from 'form-data';
import axios from 'axios';
import { ClassifierAdapter } from './ClassifierAdapter.js';

const LABEL_MAP = {
  plastic_bottle: 'recyclable',
  cardboard: 'recyclable',
  paper: 'recyclable',
  glass_bottle: 'recyclable',
  metal_can: 'recyclable',
  food_waste: 'organic',
  vegetable: 'organic',
  fruit_peel: 'organic',
  battery: 'e-waste',
  phone: 'e-waste',
  cable: 'e-waste',
  laptop: 'e-waste',
  tv: 'e-waste',
  paint_can: 'hazardous',
  chemical_bottle: 'hazardous',
  aerosol: 'hazardous',
  syringe: 'hazardous',
};

export class YOLOAdapter extends ClassifierAdapter {
  async classify(imageBuffer, mimeType) {
    const form = new FormData();
    form.append('image', imageBuffer, { contentType: mimeType, filename: 'image.jpg' });

    const { data } = await axios.post(process.env.YOLO_API_URL, form, {
      headers: form.getHeaders(),
      timeout: 4000,
    });

    const best = data.predictions.sort((a, b) => b.confidence - a.confidence)[0];
    return {
      category: LABEL_MAP[best.label] ?? 'recyclable',
      subcategory: best.label,
      confidence: best.confidence,
      rawResponse: data,
    };
  }
}
