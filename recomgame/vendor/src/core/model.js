/**
 * Game model.
 *
 * Raw JSON is normalised once, here, into frozen records that the rest of the
 * engine can trust completely: no optional-chaining in the scorer, no
 * `?? 0` in the renderer, no "did the author write weights?" in the UI. The
 * validator decides whether the document is playable; this module decides
 * what it MEANS.
 *
 * Everything here is pure: same document in, structurally identical game out.
 * No DOM, no clock, no randomness unless a seed is explicitly supplied — which
 * is what lets a trace from last year be re-verified today.
 *
 * FROZEN. See src/core/freeze.js.
 */

import { createRng, shuffle } from './prng.js';
import { contentHash } from './hash.js';
import { validateGame } from './validate.js';
import { MAX_QUESTIONS, SCHEMA_VERSION } from './version.js';

/**
 * @typedef {object} Item
 * @property {string} id
 * @property {string} label
 * @property {string} summary
 * @property {string[]} bullets
 * @property {string} url
 * @property {string} sku      The code this item came from, in its original case (compiled catalogs).
 * @property {string} skuMba   The supplier's reference, when the catalog has one.
 * @property {number} order   Position in the document; the third tie-break input.
 *
 * @typedef {object} Option
 * @property {string} id
 * @property {string} label
 * @property {string} detail
 * @property {Readonly<Record<string, number>>} weights  itemId -> points
 * @property {number} order
 *
 * @typedef {object} Question
 * @property {string} id
 * @property {string} text
 * @property {string} help
 * @property {boolean} skippable
 * @property {readonly Option[]} options
 * @property {number} order
 *
 * @typedef {object} Game
 * @property {string} schemaVersion
 * @property {string} engineSchemaVersion
 * @property {string} gameId
 * @property {string} version
 * @property {string} title
 * @property {string} intro
 * @property {string} outro
 * @property {string} lang
 * @property {number} maxQuestions
 * @property {number} marginThreshold
 * @property {readonly Item[]} items
 * @property {readonly Question[]} questions
 * @property {Readonly<Record<string, Item>>} itemsById
 * @property {Readonly<Record<string, Question>>} questionsById
 * @property {string} contentHash  Fingerprint of the CONTENT, independent of any session seed.
 * @property {boolean} frozen
 *
 * @typedef {object} PrepareOptions
 * @property {string|number} [seed]  When given, option order is shuffled
 *   deterministically and the seed is expected to be recorded in the trace.
 * @property {number} [maxQuestions]
 */

/**
 * A normalised game, or the reasons it could not be prepared.
 *
 * `prepareGame` deliberately does not throw: authoring mistakes are normal
 * during development, and the caller (console, dialog, CLI) wants to show a
 * message rather than catch an exception.
 *
 * @param {unknown} raw
 * @param {PrepareOptions} [options]
 * @returns {{ ok: true, game: Game, warnings: string[] } | { ok: false, report: import('./validate.js').ValidationReport }}
 */
export function prepareGame(raw, options = {}) {
  const report = validateGame(raw);
  if (!report.valid) return { ok: false, report };

  const game = /** @type {import('./validate.js').RawGame} */ (raw);
  const seed = options.seed;

  const items = (game.items ?? []).map((item, index) =>
    Object.freeze({
      id: item.id,
      label: item.label,
      summary: typeof item.summary === 'string' ? item.summary : '',
      bullets: Object.freeze(
        Array.isArray(item.bullets) ? item.bullets.filter((b) => typeof b === 'string') : []
      ),
      url: typeof item.url === 'string' ? item.url : '',
      sku: typeof item.sku === 'string' ? item.sku : '',
      skuMba: typeof item.skuMba === 'string' ? item.skuMba : '',
      order: index
    })
  );

  /** @type {Record<string, Item>} */
  const itemsById = {};
  for (const item of items) itemsById[item.id] = item;

  const questions = (game.questions ?? []).map((question, index) => {
    /** @type {Option[]} */
    let optionList = (question.options ?? []).map((option, optionIndex) =>
      Object.freeze({
        id: option.id,
        label: option.label,
        detail: typeof option.detail === 'string' ? option.detail : '',
        weights: Object.freeze({ ...(option.weights ?? {}) }),
        order: optionIndex
      })
    );

    // A seeded game shuffles the answer order so a player cannot learn
    // "always tap the second one". The shuffle is deterministic, and the seed
    // travels in the trace, so the run stays reproducible. Without a seed the
    // document order is kept: the default game looks the same for everyone.
    if (seed !== undefined && seed !== null && seed !== '') {
      const rng = createRng(`${String(seed)}::${question.id}`);
      optionList = shuffle(optionList, rng).map((option, position) => ({ ...option, order: position }));
    }

    return Object.freeze({
      id: question.id,
      text: question.text,
      help: typeof question.help === 'string' ? question.help : '',
      skippable: question.skippable === true,
      options: Object.freeze(optionList),
      order: index
    });
  });

  /** @type {Record<string, Question>} */
  const questionsById = {};
  for (const question of questions) questionsById[question.id] = question;

  // The content fingerprint is SEED-INDEPENDENT on purpose.
  //
  // Item order is meaningful (it is a rung of the tie-break ladder) so it is
  // included in document order. Option order is presentation only — the seed
  // decides it, and the seed is recorded separately in the trace — so options
  // are included sorted by id. That way one fingerprint identifies one set of
  // recommendations, a seeded run and an unseeded run of the same content
  // agree, and a third party can verify a stored trace from the document alone
  // without knowing whether the session was seeded.
  const contentFingerprint = contentHash({
    gameId: game.gameId,
    version: typeof game.version === 'string' ? game.version : '0',
    items: items.map((item) => [item.id, item.label]),
    questions: questions.map((question) => [
      question.id,
      [...question.options]
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        .map((option) => [option.id, option.weights])
    ])
  });

  // The document's own cap has already been validated; an override comes from
  // the embedder and is clamped rather than rejected. Note the explicit NaN
  // check: `Number(0) || MAX` would silently read an intentional 0 as "unset".
  const rawMax = options.maxQuestions ?? game.maxQuestions;
  const numericMax = Number(rawMax);
  const maxQuestions = Number.isFinite(numericMax)
    ? Math.max(1, Math.min(MAX_QUESTIONS, Math.floor(numericMax)))
    : Math.min(MAX_QUESTIONS, game.questions.length || MAX_QUESTIONS);

  const marginThreshold =
    typeof game.marginThreshold === 'number' && game.marginThreshold >= 0 && game.marginThreshold <= 1
      ? game.marginThreshold
      : 0.34;

  /** @type {Game} */
  const model = {
    schemaVersion: typeof game.schemaVersion === 'string' ? game.schemaVersion : SCHEMA_VERSION,
    engineSchemaVersion: SCHEMA_VERSION,
    gameId: game.gameId,
    version: typeof game.version === 'string' ? game.version : '0',
    title: typeof game.title === 'string' ? game.title : game.gameId,
    intro: typeof game.intro === 'string' ? game.intro : '',
    outro: typeof game.outro === 'string' ? game.outro : '',
    /* The content's own language, or the product's: the prose the trace records is
       Portuguese either way, and there is no second dictionary to fall back to. */
    lang: typeof game.lang === 'string' ? game.lang : 'pt-PT',
    maxQuestions,
    marginThreshold,
    items: Object.freeze(items),
    questions: Object.freeze(questions),
    itemsById: Object.freeze(itemsById),
    questionsById: Object.freeze(questionsById),
    contentHash: contentFingerprint,
    frozen: true
  };

  return { ok: true, game: Object.freeze(model), warnings: report.issues.map((i) => i.message) };
}

/**
 * The points one option awards one item. THE ONLY PLACE WEIGHTS ARE READ.
 *
 * Two defects met in the one line this replaces, `option.weights[itemId] ?? 0`,
 * and this function exists so that neither can come back:
 *
 *   1. A bracket read with a computed key WALKS THE PROTOTYPE CHAIN. The weights
 *      object is built by spreading `option.weights`, so its prototype is
 *      `Object.prototype` — not null. An item whose id is `constructor`,
 *      `toString`, `hasOwnProperty`, `valueOf`, `isPrototypeOf`,
 *      `propertyIsEnumerable` or `toLocaleString` therefore did not read
 *      `undefined` on an option that did not mention it: it read the inherited
 *      FUNCTION. `?? 0` does not catch a function. `raw` became the string
 *      "0function Object() { [native code] }", `normalized` became null, and
 *      that item won. Reproduced in docs/OPERACOES.md, defect D1.
 *      `Object.hasOwn` is the fix: an inherited member is not a weight.
 *
 *   2. A non-numeric weight was summed anyway. `raw += value` with a string
 *      gives string concatenation, and the corruption then spreads into the
 *      ranking, the trace and the audit report. `Number.isFinite` is the fix:
 *      a documented, reachable fallback beats a propagated mistake.
 *
 * The `Object.hasOwn` test is the whole fix: an inherited member is not a
 * weight. `Object.hasOwn` is on every browser this project targets (Chrome 93,
 * Firefox 92, Safari 15.4) and on Node 16.9+, which is below the Node 20 the
 * project already requires.
 *
 * @param {Readonly<Record<string, number>>} weights
 * @param {string} itemId
 * @returns {number} The weight, or 0 when this option says nothing about it.
 */
export function weightFor(weights, itemId) {
  if (!Object.hasOwn(weights, itemId)) return 0;
  const value = weights[itemId];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * The denominator of the normalized score for one item on one question: the
 * best result that item could possibly have got from this question.
 *
 *   - If any option rewards the item, the best reward is the denominator, and
 *     `raw / maximum` says "what share of the available points did it get".
 *   - If the item is only ever penalised, the best achievable result is a
 *     penalty of zero, so the denominator is the size of the WORST penalty.
 *     The item then scores 1.0 when the player avoided the penalties entirely
 *     and drops below 1 as they accumulate. Without this, an item whose every
 *     weight is negative would divide by zero and its penalties would silently
 *     disappear from the ranking — the score table would show -3 raw next to a
 *     0.00 normalized score and look like a bug.
 *
 * Returns 0 only when no option mentions the item at all, which the scorer
 * reads as "this question says nothing about that item".
 *
 * @param {Question} question
 * @param {string} itemId
 * @returns {number} A non-negative number.
 */
export function maxWeightFor(question, itemId) {
  let best = 0;
  let worst = 0;
  for (const option of question.options) {
    const value = weightFor(option.weights, itemId);
    if (value > best) best = value;
    if (value < worst) worst = value;
  }
  return best > 0 ? best : Math.abs(worst);
}

/**
 * Serialise a normalised game back to the portable document shape.
 * Round-tripping a game through `prepareGame` -> `gameToDocument` must
 * preserve `contentHash`; a unit test asserts exactly that.
 *
 * @param {Game} game
 * @returns {import('./validate.js').RawGame}
 */
export function gameToDocument(game) {
  return {
    schemaVersion: game.schemaVersion,
    gameId: game.gameId,
    version: game.version,
    title: game.title,
    intro: game.intro,
    outro: game.outro,
    lang: game.lang,
    maxQuestions: game.maxQuestions,
    marginThreshold: game.marginThreshold,
    items: game.items.map((item) => ({
      id: item.id,
      label: item.label,
      ...(item.summary ? { summary: item.summary } : {}),
      ...(item.bullets.length ? { bullets: [...item.bullets] } : {}),
      ...(item.url ? { url: item.url } : {}),
      ...(item.sku ? { sku: item.sku } : {}),
      ...(item.skuMba ? { skuMba: item.skuMba } : {})
    })),
    questions: game.questions.map((question) => ({
      id: question.id,
      text: question.text,
      ...(question.help ? { help: question.help } : {}),
      ...(question.skippable ? { skippable: true } : {}),
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        ...(option.detail ? { detail: option.detail } : {}),
        weights: { ...option.weights }
      }))
    }))
  };
}
