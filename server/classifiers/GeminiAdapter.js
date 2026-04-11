import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClassifierAdapter } from './ClassifierAdapter.js';

const VALID_CATEGORIES = ['recyclable', 'organic', 'e-waste', 'hazardous'];

const SYSTEM_PROMPT = `Fast waste classifier. 
1. If primary subject is NOT waste (e.g. person, animal, scenery), classify any visible waste but force confidence < 0.72.
2. If primary subject IS waste, set confidence > 0.85.

Categories: recyclable (paper, plastic, glass, metal, cardboard), organic (food_waste, garden_waste), e-waste (battery, cable, device, appliance), hazardous (chemical, medical, paint, aerosol)

Output ONLY valid JSON: {"category":"...","subcategory":"...","confidence":0.0}`;

/** Default matches Google Generative Language API "Flash" family (override with GEMINI_MODEL). */
const DEFAULT_MODEL = 'gemini-2.0-flash';

export class GeminiAdapter extends ClassifierAdapter {
  constructor() {
    super();
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required when CLASSIFIER=gemini');
    }
    this.genai = new GoogleGenerativeAI(key);
    const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    this.model = this.genai.getGenerativeModel({ model: modelName });
  }

  async classify(imageBuffer, mimeType) {
    const result = await this.model.generateContent([
      { text: SYSTEM_PROMPT },
      { inlineData: { mimeType, data: imageBuffer.toString('base64') } },
    ]);
    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const category = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'recyclable';

    return {
      category,
      subcategory: parsed.subcategory || null,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence))),
      rawResponse: parsed,
    };
  }
}
