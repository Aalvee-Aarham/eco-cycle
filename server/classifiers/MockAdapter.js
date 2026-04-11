import { ClassifierAdapter } from './ClassifierAdapter.js';

const CATEGORIES = ['recyclable', 'organic', 'e-waste', 'hazardous'];
const SUBCATEGORIES = {
  recyclable: ['paper', 'plastic', 'glass', 'metal', 'cardboard'],
  organic: ['food_waste', 'garden_waste'],
  'e-waste': ['battery', 'cable', 'device', 'appliance'],
  hazardous: ['chemical', 'medical', 'paint', 'aerosol'],
};

export class MockAdapter extends ClassifierAdapter {
  async classify(imageBuffer, mimeType) {
    // Deterministic but varied based on buffer size
    const idx = (imageBuffer.length % 4);
    const category = CATEGORIES[idx];
    const subs = SUBCATEGORIES[category];
    const subcategory = subs[imageBuffer.length % subs.length];
    const confidence = 0.75 + (imageBuffer.length % 20) / 100;

    return {
      category,
      subcategory,
      confidence: Math.min(0.99, confidence),
      rawResponse: { mock: true },
    };
  }
}
