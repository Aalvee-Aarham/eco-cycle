import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClassifierAdapter } from './ClassifierAdapter.js';

const VALID_CATEGORIES = ['recyclable', 'organic', 'e-waste', 'hazardous'];

const SYSTEM_PROMPT = `You are a precise waste classifier for the EcoCycle platform.

Categories:
- recyclable: paper, plastic, glass, metal, cardboard, bottles, cans, cloth
- organic: food waste, garden waste, biodegradable material
- e-waste: batteries, cables, phones, laptops, TVs, appliances, electronics
- hazardous: chemicals, paint, aerosols, syringes, medical waste

Rules:
1. If the primary subject is NOT waste (person, animal, scenery), classify any visible waste but set confidence below 0.20.
2. If the primary subject IS clearly waste, set confidence above 0.85.
3. For ambiguous or mixed waste, set confidence between 0.20 and 0.72.
4. Always include a brief reasoning explaining your classification decision.

Output ONLY valid JSON (no markdown fences):
{"category":"...","subcategory":"...","confidence":0.0,"reasoning":"..."}`;

/** Default matches Google Generative Language API "Flash" family (override with GEMINI_MODEL). */
const DEFAULT_MODEL = 'gemini-2.0-flash';

export class GeminiAdapter extends ClassifierAdapter {
  constructor() {
    super();
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required when using the Gemini classifier');
    }
    this.genai = new GoogleGenerativeAI(key);
    const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    this.model = this.genai.getGenerativeModel({ model: modelName });
  }

  async classify(imageBuffer, mimeType) {
    console.log('[GeminiAdapter] Classifying image...');
    const result = await this.model.generateContent([
      { text: SYSTEM_PROMPT },
      { inlineData: { mimeType, data: imageBuffer.toString('base64') } },
    ]);
    const text = result.response.text();
    // Strip any accidental markdown fences
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const category = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'recyclable';

    return {
      category,
      subcategory: parsed.subcategory || null,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence))),
      rawResponse: {
        ...parsed,
        reasoning: parsed.reasoning || '',
      },
    };
  }
}
