/**
 * The recommendation model.
 *
 * Design goal, in one sentence: every point in a result must be traceable to
 * exactly one player answer, and the winner must be the item with the most
 * points. Nothing here is heuristic, adaptive, or probabilistic in a way that
 * cannot be printed on one screen.
 *
 *   raw(item)        = Î£ over answered questions of weights[item] given by the chosen option
 *   maximum(item)    = Î£ over ANSWERED, NON-SKIPPED questions of max(weights[item] over ALL options)
 *   normalized(item) = maximum(item) === 0 ? 0 : raw(item) / maximum(item)
 *
 * Why normalise as well as total? A question whose options do not mention an
 * item must not count against that item. Without the denominator, an item that
 * appears in four questions is compared on a different scale from one that
 * appears in six, and the "why" is no longer honest. Normalizing says: of the
 * points that COULD have gone to this item, what share did it get?
 *
 * The winner is chosen by a total, documented order (TIE_BREAK_LADDER), so
 * there is always exactly one result and the reason can always be named.
 *
 * FROZEN. See src/core/freeze.js.
 */

import { maxWeightFor, weightFor } from './model.js';
import { t, DEFAULT_LANG } from './i18n.js';

/**
 * @typedef {object} QuestionDelta
 * @property {string} questionId
 * @property {number} index
 * @property {string} optionId
 * @property {string} optionLabel
 * @property {boolean} skipped
 * @property {Readonly<Record<string, number>>} applied  Only non-zero weights.
 * @property {Readonly<Record<string, number>>} rawBefore
 * @property {Readonly<Record<string, number>>} rawAfter
 *
 * @typedef {object} RankedItem
 * @property {import('./model.js').Item} item
 * @property {number} rank          1-based position.
 * @property {number} raw
 * @property {number} maximum
 * @property {number} normalized
 * @property {number} lastQuestionScore
 * @property {number} positiveCount  How many answered questions gave it points.
 */

/**
 * Score every item in the game given a set of answers.
 *
 * @param {readonly import('./session.js').Answer[]} answers
 * @param {import('./model.js').Game} game
 * @returns {RankedItem[]} Ranked best-first.
 */
export function rankAnswers(answers, game) {
  /** @type {RankedItem[]} */
  const ranked = game.items.map((item) => {
    let raw = 0;
    let maximum = 0;
    let positiveCount = 0;
    let lastQuestionScore = 0;
    const lastIndex = answers.length - 1;

    answers.forEach((answer, position) => {
      const question = game.questionsById[answer.questionId];
      // weightFor, never a bracket read: a computed key walks the prototype
      // chain, so an item id like "constructor" would read an inherited function
      // instead of nothing. See the long explanation in src/core/model.js, and
      // defect D1 in docs/OPERACOES.md.
      const value = weightFor(answer.weights, item.id);
      raw += value;
      if (value > 0) positiveCount += 1;
      // A skipped question contributes to NEITHER side of the ratio. Counting
      // its maximum while contributing no raw points would penalise every item
      // by the same amount and quietly distort every normalized score, so the
      // denominator only ever counts questions the player actually answered.
      if (question && !answer.skipped) maximum += maxWeightFor(question, item.id);
      if (position === lastIndex) lastQuestionScore = value;
    });

    return {
      item,
      rank: 0,
      raw,
      maximum,
      normalized: maximum === 0 ? 0 : raw / maximum,
      lastQuestionScore,
      positiveCount
    };
  });

  ranked.sort(compareRanked);
  ranked.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  return ranked;
}

/**
 * The tie-break ladder, as a comparator. Every step is deterministic and every
 * step is recorded in the trace, so "why did I get X and not Y" always has an
 * answer that does not depend on object iteration order.
 *
 * @param {RankedItem} a
 * @param {RankedItem} b
 * @returns {number} Negative when `a` should be ranked above `b`.
 */
export function compareRanked(a, b) {
  if (a.normalized !== b.normalized) return b.normalized - a.normalized;
  if (a.raw !== b.raw) return b.raw - a.raw;
  if (a.lastQuestionScore !== b.lastQuestionScore) return b.lastQuestionScore - a.lastQuestionScore;
  if (a.item.order !== b.item.order) return a.item.order - b.item.order;
  return a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0;
}

/**
 * Which rung of the ladder actually decided first place.
 *
 * @param {readonly RankedItem[]} ranked
 * @returns {import('./version.js').TieBreakRung | 'none'}
 */
export function decidingRung(ranked) {
  if (ranked.length < 2) return 'none';
  const [first, second] = /** @type {[RankedItem, RankedItem]} */ ([ranked[0], ranked[1]]);
  if (first.normalized !== second.normalized) return 'normalized-score';
  if (first.raw !== second.raw) return 'raw-score';
  if (first.lastQuestionScore !== second.lastQuestionScore) return 'last-question-score';
  if (first.item.order !== second.item.order) return 'content-order';
  return 'lexicographic-id';
}

/**
 * The lead the winner has over the runner-up, on the normalized scale.
 * Used for the early-stop decision and reported in the trace so a "narrow
 * win" is visible rather than buried.
 *
 * @param {readonly RankedItem[]} ranked
 * @returns {number} 1 when there is no runner-up.
 */
export function margin(ranked) {
  if (ranked.length === 0) return 0;
  const first = ranked[0];
  const second = ranked[1];
  if (!first || !second) return 1;
  return first.normalized - second.normalized;
}

/**
 * Should the game stop early?
 *
 * Only ever consulted when the winner is unambiguous AND the player has
 * answered enough questions for the lead to mean something. A two-question
 * landslide is not a recommendation; it is a coincidence.
 *
 * The reason is prose that lands in the trace, so it is written in the same
 * language as the rest of the explanation.
 *
 * @param {readonly RankedItem[]} ranked
 * @param {number} answered
 * @param {number} threshold
 * @param {number} [minimumAnswered]
 * @param {string} [lang]
 * @returns {{ stop: boolean, reason: string }}
 */
export function shouldStopEarly(ranked, answered, threshold, minimumAnswered = 3, lang = DEFAULT_LANG) {
  if (ranked.length < 2) {
    return { stop: true, reason: t(lang, 'stop.oneItem') };
  }
  if (answered < minimumAnswered) {
    return { stop: false, reason: t(lang, 'stop.tooFew', { minimum: minimumAnswered }) };
  }
  const lead = margin(ranked);
  if (lead > threshold) {
    return {
      stop: true,
      reason: t(lang, 'stop.ahead', {
        lead: (lead * 100).toFixed(1),
        threshold: (threshold * 100).toFixed(0)
      })
    };
  }
  return { stop: false, reason: t(lang, 'stop.notAhead', { lead: (lead * 100).toFixed(1) }) };
}

/**
 * Build the per-question delta list, so the trace can show the score table
 * before and after each answer instead of only the final numbers.
 *
 * @param {readonly import('./session.js').Answer[]} answers
 * @param {import('./model.js').Game} game
 * @returns {QuestionDelta[]}
 */
export function buildDeltas(answers, game) {
  /** @type {Record<string, number>} */
  const running = {};
  for (const item of game.items) running[item.id] = 0;

  /** @type {QuestionDelta[]} */
  const deltas = [];

  answers.forEach((answer, index) => {
    const question = game.questionsById[answer.questionId];
    const option = question?.options.find((entry) => entry.id === answer.optionId);
    const rawBefore = { ...running };

    /** @type {Record<string, number>} */
    const applied = {};
    // Object.keys is own-enumerable only, and weightFor then refuses anything
    // that is not a finite number. Both halves matter: this loop feeds
    // rawBefore/rawAfter in the trace, so a non-numeric weight reaching it would
    // put a string into the audit record as surely as it would into `raw`.
    for (const itemId of Object.keys(answer.weights)) {
      const value = weightFor(answer.weights, itemId);
      if (value === 0) continue;
      if (!(itemId in running)) continue; // validator already guarantees this
      applied[itemId] = value;
      running[itemId] += value;
    }

    deltas.push({
      questionId: answer.questionId,
      index,
      optionId: answer.optionId,
      optionLabel: answer.skipped ? 'no preference' : option?.label ?? answer.optionId,
      skipped: answer.skipped,
      applied: Object.freeze(applied),
      rawBefore: Object.freeze(rawBefore),
      rawAfter: Object.freeze({ ...running })
    });
  });

  return deltas;
}

/**
 * Score a session's answers. Returns the ranking plus the deltas, and refuses
 * to invent a result from an empty answer list — a "recommendation" from zero
 * information would be a lie with a confident face on it.
 *
 * @param {readonly import('./session.js').Answer[]} answers
 * @param {import('./model.js').Game} game
 * @returns {{ ranked: RankedItem[], deltas: QuestionDelta[] }}
 */
export function score(answers, game) {
  return { ranked: rankAnswers(answers, game), deltas: buildDeltas(answers, game) };
}

