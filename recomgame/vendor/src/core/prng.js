/**
 * Deterministic pseudo-random numbers.
 *
 * The recommendation result must never depend on `Math.random()`. If a run is
 * ever randomised (option order, extra light shuffling of questions), the
 * seed becomes part of the audit trace and the same seed reproduces the same
 * game exactly — on the player's device, on a reviewer's device, and in a
 * test years later.
 *
 * This is mulberry32: 32 bits of state, one multiply-free avalanche per draw,
 * good enough for shuffling and utterly trivial to reason about. It is NOT a
 * cryptographic generator and must never be used for anything security-shaped.
 *
 * FROZEN. See src/core/freeze.js.
 */

/** @typedef {() => number} Rng */

/**
 * Create a seeded random number generator.
 *
 * @param {number|string} seed A number, or any string (hashed to 32 bits).
 * @returns {Rng} A function returning floats in [0, 1).
 */
export function createRng(seed) {
  let state = typeof seed === 'number' ? seed >>> 0 : hashSeed(String(seed));

  // A zero state is a fixed point of some xor-shift steps; mulberry32 survives
  // it, but starting from a non-zero constant keeps the first draws well mixed.
  if (state === 0) state = 0x9e3779b9;

  return function rng() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash an arbitrary string to a 32-bit unsigned integer (FNV-1a).
 * Kept here as well as in hash.js so prng.js has no intra-project imports and
 * stays trivially copy-pasteable.
 *
 * @param {string} input
 * @returns {number}
 */
export function hashSeed(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Fisher–Yates shuffle, returning a NEW array.
 *
 * The sort-based "shuffle" (`arr.sort(() => rng() - 0.5)`) is not a shuffle:
 * it is biased and its result depends on the engine's sort algorithm. This
 * one is uniform and reproducible.
 *
 * @template T
 * @param {readonly T[]} items
 * @param {Rng} rng
 * @returns {T[]}
 */
export function shuffle(items, rng) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i];
    const b = out[j];
    out[i] = /** @type {T} */ (b);
    out[j] = /** @type {T} */ (a);
  }
  return out;
}

/**
 * Pick one element, uniformly.
 *
 * @template T
 * @param {readonly T[]} items
 * @param {Rng} rng
 * @returns {T | undefined}
 */
export function pick(items, rng) {
  if (items.length === 0) return undefined;
  return items[Math.floor(rng() * items.length)];
}
