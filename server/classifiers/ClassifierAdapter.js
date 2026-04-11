export class ClassifierAdapter {
  /**
   * @param {Buffer} imageBuffer
   * @param {string} mimeType
   * @returns {Promise<ClassificationResult>}
   */
  async classify(imageBuffer, mimeType) {
    throw new Error('classify() not implemented');
  }
}

/**
 * @typedef {Object} ClassificationResult
 * @property {'recyclable'|'organic'|'e-waste'|'hazardous'} category
 * @property {string|null} subcategory
 * @property {number} confidence
 * @property {any} rawResponse
 */
