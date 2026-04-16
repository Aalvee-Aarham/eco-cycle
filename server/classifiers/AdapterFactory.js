import { GeminiAdapter } from './GeminiAdapter.js';
import { YOLOAdapter } from './YOLOAdapter.js';

const registry = {
  gemini: GeminiAdapter,
  yolo: YOLOAdapter,
};

export class AdapterFactory {
  static get(name) {
    const Cls = registry[name];
    if (!Cls) throw new Error(`Unknown classifier: ${name}. Valid options: yolo, gemini`);
    return new Cls();
  }
}
