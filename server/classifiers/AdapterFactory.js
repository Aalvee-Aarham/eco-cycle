import { GeminiAdapter } from './GeminiAdapter.js';
import { YOLOAdapter } from './YOLOAdapter.js';
import { MockAdapter } from './MockAdapter.js';

const registry = {
  gemini: GeminiAdapter,
  yolo: YOLOAdapter,
  mock: MockAdapter,
};

export class AdapterFactory {
  static get(name) {
    const Cls = registry[name];
    if (!Cls) throw new Error(`Unknown classifier: ${name}`);
    return new Cls();
  }
}
