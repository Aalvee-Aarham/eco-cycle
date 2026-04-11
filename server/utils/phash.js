import sharp from 'sharp';

/**
 * Compute a simple perceptual hash (average hash) of an image buffer.
 * Returns a 64-bit hash as a hex string.
 */
export async function computePHash(imageBuffer) {
  try {
    const { data } = await sharp(imageBuffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = Array.from(data);
    const avg = pixels.reduce((s, p) => s + p, 0) / pixels.length;
    const bits = pixels.map((p) => (p >= avg ? 1 : 0));
    const hex = [];
    for (let i = 0; i < 64; i += 4) {
      hex.push((bits[i] * 8 + bits[i + 1] * 4 + bits[i + 2] * 2 + bits[i + 3]).toString(16));
    }
    return hex.join('');
  } catch {
    // If sharp fails (e.g. non-image), return random hash to avoid blocking
    return Math.random().toString(16).substring(2, 18);
  }
}

/**
 * Hamming distance between two hex hash strings.
 */
export function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    const b1 = parseInt(hash1[i], 16);
    const b2 = parseInt(hash2[i], 16);
    let xor = b1 ^ b2;
    while (xor) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}
