import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClassifierAdapter } from './ClassifierAdapter.js';

const VALID_CATEGORIES = ['recyclable', 'organic', 'e-waste', 'hazardous'];

const SYSTEM_PROMPT = `You are a waste classification expert for the EcoCycle platform. Your primary task is to identify and classify waste materials within an image. However, your first priority is to determine the main subject of the entire frame.

Step 1: Identify the primary subject of the image (e.g., a person, a landscape, a piece of furniture, or a specific object).
Step 2: Determine if this primary subject falls under the definition of waste (recyclable, organic, e-waste, or hazardous).
Step 3: If the primary subject is NOT a waste item (e.g., it is a person holding a bottle, or a cat sitting near a box), you must still classify the most visible waste item present, but you MUST set the confidence score to below 0.72.
Step 4: If the primary subject IS a waste item, provide a high confidence score (> 0.85).

Categories and subcategories:
- recyclable: paper, plastic, glass, metal, cardboard
- organic: food_waste, garden_waste
- e-waste: battery, cable, device, appliance
- hazardous: chemical, medical, paint, aerosol

Respond ONLY with valid JSON — no markdown, no preamble, no explanation outside JSON:
{ "category": "...", "subcategory": "...", "confidence": 0.0-1.0, "reasoning": "..." }`;

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
