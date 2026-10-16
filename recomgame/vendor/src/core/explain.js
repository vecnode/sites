/**
 * Plain-language explanations.
 *
 * The trace holds the numbers; this module turns them into sentences a person
 * can read without knowing what "normalized" means. The wording is part of the
 * product: a recommendation game whose result cannot be explained in a normal
 * voice is not auditable, it is just unexplained.
 *
 * Every sentence comes from `i18n.js`, in the language the trace is being built
 * in — the default is European Portuguese. Rules the wording follows:
 *
 *   1. Always name the recommendation. The engine always answers, so there is
 *      never a "no result" branch to write.
 *   2. When the winner got no points, say plainly that the tie-break decided it.
 *      The result is still given; the honesty lives in the reason, not in a
 *      refusal to answer.
 *   3. Always name at least one answer that counted, so the explanation is tied
 *      to something the player remembers doing.
 *
 * FROZEN. See src/core/freeze.js.
 */

import { t, DEFAULT_LANG } from './i18n.js';

/** How many supporting answers to name before summarising the rest. */
const TOP_REASONS = 3;

/**
 * Why the winner won.
 *
 * @param {{ item: import('./model.js').Item, raw: number, maximum: number, normalized: number, positiveCount: number }} winner
 * @param {readonly import('./session.js').Answer[]} answers
 * @param {import('./model.js').Game} game
 * @param {string} [lang]
 * @returns {{ reasons: string[] }}
 */
export function describeWinner(winner, answers, game, lang = DEFAULT_LANG) {
  /** @type {string[]} */
  const reasons = [];

  const percent = Math.round(winner.normalized * 100);

  if (winner.maximum === 0) {
    reasons.push(t(lang, 'explain.zero', { label: winner.item.label }));
    return { reasons };
  }

  reasons.push(
    t(lang, 'explain.best', {
      label: winner.item.label,
      raw: winner.raw,
      maximum: winner.maximum,
      percent
    })
  );

  // Name the answers that actually moved the needle, largest contribution first.
  const contributions = [];
  for (const answer of answers) {
    const value = answer.weights[winner.item.id] ?? 0;
    if (value <= 0) continue;
    const question = game.questionsById[answer.questionId];
    const option = question?.options.find((entry) => entry.id === answer.optionId);
    contributions.push({
      value,
      questionText: question?.text ?? answer.questionId,
      optionLabel: option?.label ?? (answer.skipped ? t(lang, 'explain.skippedOption') : answer.optionId)
    });
  }
  contributions.sort((a, b) => b.value - a.value);

  for (const entry of contributions.slice(0, TOP_REASONS)) {
    reasons.push(
      t(lang, 'explain.chose', {
        option: entry.optionLabel,
        question: entry.questionText,
        n: entry.value
      })
    );
  }
  if (contributions.length > TOP_REASONS) {
    reasons.push(t(lang, 'explain.more', { n: contributions.length - TOP_REASONS }));
  }

  const skipped = answers.filter((entry) => entry.skipped).length;
  if (skipped > 0) {
    reasons.push(t(lang, 'explain.skipped', { n: skipped }));
  }

  return { reasons };
}

/**
 * Why the runner-up did not win. Always comparative: "X scored lower" is only
 * informative if it says by how much and on what basis.
 *
 * @param {{ item: import('./model.js').Item, raw: number, normalized: number }} runnerUp
 * @param {{ item: import('./model.js').Item, raw: number, normalized: number }} winner
 * @param {string} rung
 * @param {string} [lang]
 * @returns {string[]}
 */
export function describeRunnerUp(runnerUp, winner, rung, lang = DEFAULT_LANG) {
  const lines = [];
  const gap = Math.round((winner.normalized - runnerUp.normalized) * 100);
  const label = rungLabel(rung, lang);

  if (runnerUp.normalized === winner.normalized && runnerUp.raw === winner.raw) {
    lines.push(
      t(lang, 'explain.runnerLevel', {
        runner: runnerUp.item.label,
        winner: winner.item.label,
        rung: label
      })
    );
    return lines;
  }

  lines.push(
    t(lang, 'explain.runnerBehind', {
      runner: runnerUp.item.label,
      n: runnerUp.raw,
      gap
    })
  );
  return lines;
}

/**
 * A sentence describing one ladder rung, for the audit panel.
 *
 * @param {string} rung
 * @param {string} [lang]
 * @returns {string}
 */
export function rungLabel(rung, lang = DEFAULT_LANG) {
  const known = [
    'normalized-score',
    'raw-score',
    'last-question-score',
    'content-order',
    'lexicographic-id',
    'none'
  ];
  if (known.includes(rung)) return t(lang, `rung.${rung}`);
  return t(lang, 'rung.unknown', { rung });
}

/**
 * One-line summary of a result, for the host page's own callback or log.
 *
 * @param {import('./audit.js').Trace} trace
 * @param {string} [lang]
 * @returns {string}
 */
export function summariseResult(trace, lang = DEFAULT_LANG) {
  if (!trace.outcome) return t(lang, 'explain.noResult');
  const percent = Math.round((trace.ranking[0]?.normalized ?? 0) * 100);
  return t(lang, 'explain.summary', {
    label: trace.outcome.winnerLabel,
    percent,
    n: trace.answered
  });
}
