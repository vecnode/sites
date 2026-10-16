/**
 * A tiny test harness shared by every test file.
 *
 * Why not a test framework? The project's whole reason to exist is that it has
 * no dependencies; pulling in a large assertion library to check a scorer would
 * undercut that. `src/util/assert.js` does the hard part in plain JavaScript,
 * and it runs in Node and in the browser alike — which is what lets
 * test/browser/index.html report through exactly the same interface as
 * `npm test`.
 *
 * What this adds on top of the assertions:
 *   - `suite(label, fn)` groups them and prints one line per group
 *   - a count per group, so "0 assertions ran" cannot masquerade as success
 *
 * Convention: a test file calls `suite()` at module top level. In Node the
 * runner imports the file and any thrown error fails that file; in the browser
 * the same thrown error is caught and rendered in the page.
 */

/*
 * The assertion primitives are imported under `assert*` aliases so that the
 * exported wrappers below can reuse the public names (`ok`, `equal`, ...)
 * without shadowing themselves into infinite recursion.
 */
import {
  deepEqual as assertDeepEqual,
  ok as assertOk,
  strictEqual as assertStrictEqual,
  throws as assertThrows
} from './assert.js';

/**
 * @typedef {{ label: string, failure: Error|null, assertions: number }} Result
 */

/** @type {Result[]} */
const results = [];

/** Counts every assertion made by this process. */
let assertionCount = 0;

/**
 * Run a group of assertions.
 *
 * @param {string} label
 * @param {() => void | Promise<void>} body
 */
export async function suite(label, body) {
  const before = assertionCount;
  try {
    await body();
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    results.push({ label, failure, assertions: assertionCount - before });
    // eslint-disable-next-line no-console
    console.log(`        FAIL  ${label}\n              ${failure.message.split('\n').join('\n              ')}`);
    throw failure;
  }

  const count = assertionCount - before;
  results.push({ label, failure: null, assertions: count });
  // eslint-disable-next-line no-console
  console.log(`        ok    ${label}  (${count})`);

  if (count === 0) {
    const failure = new Error(`Suite "${label}" made no assertions, so it proves nothing.`);
    results[results.length - 1].failure = failure;
    throw failure;
  }
}

/**
 * Assert a value is truthy.
 *
 * @param {unknown} condition
 * @param {string} [message]
 */
export function ok(condition, message) {
  assertionCount += 1;
  assertOk(condition, message);
}

/**
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} [message]
 */
export function equal(actual, expected, message) {
  assertionCount += 1;
  assertDeepEqual(actual, expected, message);
}

/**
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} [message]
 */
export function strictEqual(actual, expected, message) {
  assertionCount += 1;
  assertStrictEqual(actual, expected, message);
}

/**
 * Assert that a call throws, optionally that the error's MESSAGE matches.
 *
 * @param {() => unknown} fn
 * @param {string|RegExp} [expected]
 * @param {string} [message]
 */
export function throws(fn, expected, message) {
  assertionCount += 1;
  assertThrows(
    fn,
    (error) => {
      if (!expected) return true;
      const text = error instanceof Error ? error.message : String(error);
      return typeof expected === 'string' ? text.includes(expected) : expected.test(text);
    },
    message
  );
}
