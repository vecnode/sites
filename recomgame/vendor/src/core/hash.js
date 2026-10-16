/**
 * Content hashing, for reproducibility.
 *
 * Every audit trace records `contentHash`: the fingerprint of the exact game
 * data that produced the result. Two people comparing traces can tell whether
 * they played the same content — and a trace whose hash no longer matches the
 * shipped content is a red flag that the game changed after the fact.
 *
 * FNV-1a 64-bit (implemented over two 32-bit halves, because JS has no
 * BigInt-free 64-bit multiply). Non-cryptographic on purpose: this is an
 * integrity/identity check for data the page already trusts, not a signature.
 *
 * FROZEN. See src/core/freeze.js.
 */

const FNV_OFFSET_32 = 0x811c9dc5;
const FNV_PRIME_32 = 0x01000193;

/**
 * FNV-1a extended to 64 bits by running the same hash with a different
 * initial state and concatenating. 16 hex characters collides far too rarely
 * for content identification at this scale.
 *
 * There is deliberately no separate 32-bit export: it existed, nothing but its
 * own test called it, and `hash64` runs the same loop rather than delegating.
 *
 * @param {string} input
 * @returns {string} 16 lowercase hex characters.
 */
export function hash64(input) {
  let a = FNV_OFFSET_32;
  let b = 0xcbf29ce4; // second stream, distinct seed
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    a ^= c;
    a = Math.imul(a, FNV_PRIME_32);
    b ^= (c + ((i & 0xff) << 8)) & 0xffff;
    b = Math.imul(b, FNV_PRIME_32);
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

/**
 * Stable JSON serialisation: like `JSON.stringify`, but object keys are
 * sorted, so logically identical documents hash identically even if the
 * author reordered the keys. Arrays keep their order (order is meaningful in
 * content: it feeds the documented tie-break ladder).
 *
 * @param {unknown} value
 * @returns {string}
 */
export function stableStringify(value) {
  return stringify(value);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function stringify(value) {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value) ?? 'null';
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'undefined') return 'null';
  if (Array.isArray(value)) {
    return `[${value.map((entry) => (entry === undefined ? 'null' : stringify(entry))).join(',')}]`;
  }
  if (typeof value === 'object') {
    const record = /** @type {Record<string, unknown>} */ (value);
    const keys = Object.keys(record).sort();
    const parts = [];
    for (const key of keys) {
      const entry = record[key];
      if (entry === undefined) continue;
      parts.push(`${JSON.stringify(key)}:${stringify(entry)}`);
    }
    return `{${parts.join(',')}}`;
  }
  return 'null';
}

/**
 * Fingerprint a game document (or any content object).
 *
 * @param {unknown} content
 * @returns {string} 16 hex characters.
 */
export function contentHash(content) {
  return hash64(stableStringify(content));
}
