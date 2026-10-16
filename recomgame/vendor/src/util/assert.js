/**
 * The few assertion primitives the test harness needs, in plain JavaScript.
 *
 * The harness must run in Node (`npm test`) and in a browser
 * (test/browser/index.html) from the same source. `node:assert` exists only in
 * one of those, so the handful of operations actually used are implemented
 * here — deliberately small, deliberately boring, and with the same semantics
 * as their `node:assert/strict` counterparts for the cases this project uses.
 */

/**
 * @param {unknown} value
 * @param {string} [message]
 */
export function ok(value, message = 'expected a truthy value') {
  if (!value) throw new AssertionError(`${message}\n  received: ${inspect(value)}`);
}

/**
 * Strict (SameValue) equality — no coercion, no `==`.
 *
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} [message]
 */
export function strictEqual(actual, expected, message = 'values are not strictly equal') {
  if (!Object.is(actual, expected)) {
    throw new AssertionError(
      `${message}\n  expected: ${inspect(expected)}\n  actual:   ${inspect(actual)}`
    );
  }
}

/**
 * Deep structural equality for JSON-shaped data.
 *
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} [message]
 */
export function deepEqual(actual, expected, message = 'values are not deeply equal') {
  const diff = describeDifference(actual, expected);
  if (diff) throw new AssertionError(`${message}\n${diff}`);
}

/**
 * @param {() => unknown} fn
 * @param {(error: unknown) => boolean} [validator]
 * @param {string} [message]
 */
export function throws(fn, validator, message = 'expected the call to throw') {
  let thrown = false;
  let caught;
  try {
    fn();
  } catch (error) {
    thrown = true;
    caught = error;
  }
  if (!thrown) throw new AssertionError(`${message}\n  nothing was thrown`);
  if (validator && !validator(caught)) {
    const text = caught instanceof Error ? caught.message : String(caught);
    throw new AssertionError(`${message}\n  the thrown error did not match: ${text}`);
  }
}

class AssertionError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

/**
 * A printable, bounded representation. Bounded on purpose: a failing deep
 * comparison of a 10-item score table must not print 4 kB into a terminal.
 *
 * @param {unknown} value
 * @param {number} [depth]
 * @returns {string}
 */
function inspect(value, depth = 0) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    case 'function':
      return `[function ${value.name || 'anonymous'}]`;
    case 'symbol':
      return value.toString();
    default:
      break;
  }
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (depth > 3) return Array.isArray(value) ? '[…]' : '{…}';
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length > 8) {
      const head = value.slice(0, 8).map((entry) => inspect(entry, depth + 1));
      return `[${head.join(', ')}, … ${value.length - 8} more]`;
    }
    return `[${value.map((entry) => inspect(entry, depth + 1)).join(', ')}]`;
  }
  const entries = Object.entries(/** @type {Record<string, unknown>} */ (value));
  if (entries.length === 0) return '{}';
  if (entries.length > 10) {
    const head = entries
      .slice(0, 10)
      .map(([key, entry]) => `${key}: ${inspect(entry, depth + 1)}`);
    return `{${head.join(', ')}, … ${entries.length - 10} more}`;
  }
  return `{${entries.map(([key, entry]) => `${key}: ${inspect(entry, depth + 1)}`).join(', ')}}`;
}

/**
 * Walk two structures together and describe the first divergence found.
 * Returns null when they are equal.
 *
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} [path]
 * @returns {string|null}
 */
function describeDifference(actual, expected, path = '$') {
  if (Object.is(actual, expected)) return null;

  const actualType = typeof actual;
  const expectedType = typeof expected;
  if (actualType !== expectedType) {
    return `  at ${path}: type ${actualType} vs expected ${expectedType}\n  expected: ${inspect(expected)}\n  actual:   ${inspect(actual)}`;
  }

  if (actual === null || expected === null || actualType !== 'object') {
    return `  at ${path}\n  expected: ${inspect(expected)}\n  actual:   ${inspect(actual)}`;
  }

  const a = /** @type {Record<string, unknown>} */ (actual);
  const b = /** @type {Record<string, unknown>} */ (expected);
  const aIsArray = Array.isArray(actual);
  const bIsArray = Array.isArray(expected);
  if (aIsArray !== bIsArray) {
    return `  at ${path}: ${aIsArray ? 'an array' : 'an object'} vs ${
      bIsArray ? 'an array' : 'an object'
    }`;
  }

  if (aIsArray) {
    const av = /** @type {unknown[]} */ (actual);
    const bv = /** @type {unknown[]} */ (expected);
    if (av.length !== bv.length) {
      return `  at ${path}.length: ${av.length} vs expected ${bv.length}`;
    }
    for (let i = 0; i < av.length; i += 1) {
      const diff = describeDifference(av[i], bv[i], `${path}[${i}]`);
      if (diff) return diff;
    }
    return null;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  for (const key of bKeys) {
    if (!(key in a)) return `  at ${path}.${key}: missing (expected ${inspect(b[key])})`;
  }
  for (const key of aKeys) {
    if (!(key in b)) return `  at ${path}.${key}: unexpected key (value ${inspect(a[key])})`;
  }
  for (const key of aKeys) {
    const diff = describeDifference(a[key], b[key], `${path}.${key}`);
    if (diff) return diff;
  }
  return null;
}
