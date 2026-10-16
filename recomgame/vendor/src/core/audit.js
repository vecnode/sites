/**
 * The audit trace.
 *
 * This is the deliverable that makes the game trustworthy. A trace is a plain,
 * JSON-serialisable record of one completed run containing everything needed
 * to answer, months later and by someone who does not trust this codebase:
 *
 *   - what content was played (gameId, version, contentHash)
 *   - what the player answered, in order
 *   - what each answer added to each item's score
 *   - the final table, the margin, and which tie-break rung decided it
 *   - a plain-language explanation of why the winner won
 *
 * `verifyTrace` closes the loop: given the same content, it re-runs the
 * recorded answers and checks the winner comes out the same. A trace is
 * therefore not a log of what the UI claimed — it is a claim that anyone can
 * independently reproduce.
 *
 * FROZEN. See src/core/freeze.js.
 */

import { ENGINE_VERSION, TRACE_VERSION, SCHEMA_VERSION } from './version.js';
import { buildDeltas, decidingRung, margin, rankAnswers, shouldStopEarly } from './scoring.js';
import { prepareGame } from './model.js';
import { SKIP } from './session.js';
import { describeWinner, describeRunnerUp } from './explain.js';
import { t, DEFAULT_LANG, resolveLang } from './i18n.js';

/**
 * @typedef {object} TraceRankRow
 * @property {number} rank
 * @property {string} itemId
 * @property {string} label
 * @property {number} raw
 * @property {number} maximum
 * @property {number} normalized   Rounded to 6 decimals for stable diffing.
 * @property {number} positiveCount
 *
 * @typedef {object} TraceDecision
 * @property {boolean} stoppedEarly
 * @property {number} questionsAsked
 * @property {number} questionsAvailable
 * @property {string} tieBreakApplied  The rung that decided first place.
 * @property {number} margin           normalized(1st) - normalized(2nd).
 * @property {number} marginThreshold
 * @property {string} marginNote       Why early stopping did or did not apply.
 *
 * @typedef {object} Trace
 * @property {string} traceVersion
 * @property {string} engineVersion
 * @property {string} schemaVersion
 * @property {string} createdAt        ISO timestamp (excluded from verification).
 * @property {string} gameId
 * @property {string} gameVersion
 * @property {string} contentHash  Fingerprint of the content; seed-independent, so anyone can check it.
 * @property {string} lang         The language its reasons and notes were written in.
 * @property {string} seed         '' when the session was unseeded.
 * @property {number} answered
 * @property {boolean} skippedAny
 * @property {string[]} questionOrder  Question ids in the order asked.
 * @property {readonly import('./scoring.js').QuestionDelta[]} steps
 * @property {TraceRankRow[]} ranking
 * @property {{ winnerId: string, winnerLabel: string, reasons: string[] }|null} outcome
 * @property {TraceDecision} decision
 * @property {string[]} notes
 */

/**
 * Build a trace from a finished (or abandoned) session.
 *
 * ALWAYS returns a trace. The engine always answers: even a session with nothing
 * answered produces a ranking (every item on zero) and names a recommendation by
 * the tie-break ladder, with a reason that says plainly that no preference was
 * expressed. A result nobody can interrogate is a problem; a result that refuses
 * to appear is a worse one, and the honesty belongs in the explanation rather
 * than in an empty screen.
 *
 * @param {import('./session.js').SessionState} state
 * @param {{ createdAt?: string, lang?: string }} [options]
 * @returns {Trace}
 */
export function buildTrace(state, options = {}) {
  const { game } = state;
  const lang = resolveLang(options.lang ?? DEFAULT_LANG);

  const ranked = rankAnswers(state.answers, game);
  const steps = buildDeltas(state.answers, game);
  const lead = margin(ranked);
  const rung = decidingRung(ranked);
  const early = shouldStopEarly(ranked, state.answers.length, game.marginThreshold, 3, lang);
  const stoppedEarly = state.status !== 'complete' && state.answers.length < state.order.length && early.stop;

  const winner = ranked[0];
  const runnerUp = ranked[1];

  const info = describeWinner(
    {
      item: winner.item,
      raw: winner.raw,
      maximum: winner.maximum,
      normalized: winner.normalized,
      positiveCount: winner.positiveCount
    },
    state.answers,
    game,
    lang
  );

  const notes = [];
  if (state.answers.length === 0) {
    notes.push(t(lang, 'note.noAnswers'));
  } else if (state.answers.every((entry) => entry.skipped)) {
    notes.push(t(lang, 'note.allSkipped'));
  }
  if (winner.normalized === 0 && state.answers.length > 0) {
    notes.push(t(lang, 'note.zeroPoints'));
  }
  if (ranked.length < 2) {
    notes.push(t(lang, 'note.singleItem'));
  }
  if (stoppedEarly) {
    notes.push(t(lang, 'note.stoppedEarly', { reason: early.reason }));
  }
  if (rung === 'content-order' || rung === 'lexicographic-id') {
    notes.push(t(lang, 'note.arbitrary', { rung }));
  }

  return {
    traceVersion: TRACE_VERSION,
    engineVersion: ENGINE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    createdAt: options.createdAt ?? new Date().toISOString(),
    gameId: game.gameId,
    gameVersion: game.version,
    contentHash: game.contentHash,
    lang,
    seed: state.seed,
    answered: state.answers.length,
    skippedAny: state.answers.some((entry) => entry.skipped),
    questionOrder: state.answers.map((entry) => entry.questionId),
    steps,
    ranking: ranked.map((entry) => ({
      rank: entry.rank,
      itemId: entry.item.id,
      label: entry.item.label,
      raw: entry.raw,
      maximum: entry.maximum,
      normalized: round6(entry.normalized),
      positiveCount: entry.positiveCount
    })),
    outcome: {
      winnerId: winner.item.id,
      winnerLabel: winner.item.label,
      reasons: [
        ...info.reasons,
        ...(runnerUp
          ? describeRunnerUp(
              { item: runnerUp.item, raw: runnerUp.raw, normalized: runnerUp.normalized },
              { item: winner.item, raw: winner.raw, normalized: winner.normalized },
              rung,
              lang
            )
          : [])
      ]
    },
    decision: {
      stoppedEarly,
      questionsAsked: state.answers.length,
      questionsAvailable: state.order.length,
      tieBreakApplied: rung,
      margin: round6(lead),
      marginThreshold: game.marginThreshold,
      marginNote: early.reason
    },
    notes
  };
}

/**
 * Re-compute a trace's result from its own recorded answers.
 *
 * This is the audit primitive. It ignores `createdAt` and every derived field:
 * only the answers, the content and the seed matter. A mismatch means either
 * the content changed or the trace was tampered with — both of which a
 * reviewer needs to be told about explicitly.
 *
 * @param {unknown} trace
 * @param {unknown} document  The game document (or a normalised game).
 * @returns {{ verified: boolean, code?: string, message?: string, expected?: string, actual?: string, trace?: Trace, engineMismatch?: boolean }}
 */
export function verifyTrace(trace, document) {
  if (trace === null || typeof trace !== 'object' || Array.isArray(trace)) {
    return { verified: false, code: 'TRACE_NOT_AN_OBJECT', message: 'The trace is not an object.' };
  }
  const record = /** @type {Record<string, unknown>} */ (trace);
  if (record.traceVersion !== TRACE_VERSION) {
    return {
      verified: false,
      code: 'TRACE_VERSION_UNSUPPORTED',
      message: `This verifier understands trace version ${TRACE_VERSION}; the trace declares "${String(record.traceVersion)}".`,
      expected: TRACE_VERSION,
      actual: String(record.traceVersion)
    };
  }
  if (!Array.isArray(record.steps)) {
    return {
      verified: false,
      code: 'TRACE_MISSING_STEPS',
      message: 'The trace has no steps array, so its answers cannot be replayed.'
    };
  }

  const prepared = prepareGame(document);
  if (!prepared.ok) {
    return {
      verified: false,
      code: 'TRACE_CONTENT_INVALID',
      message: prepared.report.issues[0]?.message ?? 'The supplied content is not a playable game.'
    };
  }
  const game = prepared.game;

  // The check that matters for a third party: is this the CONTENT the trace was
  // produced from? The fingerprint is seed-independent, so a trace from a
  // seeded session verifies against the plain document a host has on disk.
  if (record.contentHash !== game.contentHash) {
    return {
      verified: false,
      code: 'TRACE_CONTENT_MISMATCH',
      message:
        'The content does not match the content the trace was produced with, so the same answers may no longer lead to the same result.',
      expected: String(record.contentHash),
      actual: game.contentHash
    };
  }
  const engineMismatch = record.engineVersion !== ENGINE_VERSION;

  /** @type {import('./session.js').Answer[]} */
  const answers = [];
  for (const [index, step] of record.steps.entries()) {
    if (step === null || typeof step !== 'object') {
      return { verified: false, code: 'TRACE_BAD_STEP', message: `Step ${index} is not an object.` };
    }
    const raw = /** @type {Record<string, unknown>} */ (step);
    const questionId = String(raw.questionId);
    const optionId = String(raw.optionId);
    const question = game.questionsById[questionId];
    if (!question) {
      return {
        verified: false,
        code: 'TRACE_UNKNOWN_QUESTION',
        message: `Step ${index} names question "${questionId}", which the content does not define.`
      };
    }
    if (raw.skipped === true || optionId === SKIP) {
      answers.push(
        Object.freeze({ questionId, optionId: SKIP, weights: Object.freeze({}), skipped: true, index })
      );
      continue;
    }
    const option = question.options.find((entry) => entry.id === optionId);
    if (!option) {
      return {
        verified: false,
        code: 'TRACE_UNKNOWN_OPTION',
        message: `Step ${index} names option "${optionId}" on question "${questionId}", which the content does not define.`
      };
    }
    answers.push(
      Object.freeze({ questionId, optionId, weights: option.weights, skipped: false, index })
    );
  }

  const ranked = rankAnswers(answers, game);
  const winner = ranked[0];
  const expectedWinner = record.outcome && typeof record.outcome === 'object'
    ? String(/** @type {Record<string, unknown>} */ (record.outcome).winnerId ?? '')
    : '';
  const actualWinner = winner ? winner.item.id : '';

  if (expectedWinner !== actualWinner) {
    return {
      verified: false,
      code: 'TRACE_RESULT_MISMATCH',
      message: 'Replaying the recorded answers produced a different winner.',
      expected: expectedWinner,
      actual: actualWinner
    };
  }

  /*
   * The table the trace carries is compared in full, field by field.
   *
   * It used to compare only `itemId` and `normalized`, through a stringly-typed
   * join, and it skipped the whole comparison when the trace's ranking was
   * empty — the join returned null for an empty list and the test was
   * `if (expectedRanking && …)`, so a trace with NO score table at all, or one
   * whose `raw`, `maximum`, `rank`, `label` or `positiveCount` had been
   * rewritten, was reported as verified. That is the guarantee this project
   * sells, so it has to be the strictest comparison here, not the loosest.
   * Reproduced as defect D2 in docs/OPERACOES.md.
   *
   * `reasons`, `notes` and `marginNote` are deliberately NOT compared: they are
   * prose, they are derived from the same numbers, and holding them to a byte
   * comparison would make a stored trace fail to verify after an unrelated
   * wording change — a false accusation, the one thing a verifier must never
   * make.
   */
  if (!Array.isArray(record.ranking)) {
    return {
      verified: false,
      code: 'TRACE_MISSING_RANKING',
      message: 'The trace has no ranking array, so the score table it claims cannot be checked.'
    };
  }
  if (record.ranking.length !== ranked.length) {
    return {
      verified: false,
      code: 'TRACE_RANKING_MISMATCH',
      message: 'The trace lists a different number of scored items than the content produces.',
      expected: String(ranked.length),
      actual: String(record.ranking.length)
    };
  }

  for (const [index, entry] of record.ranking.entries()) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      return {
        verified: false,
        code: 'TRACE_BAD_RANKING_ROW',
        message: `Ranking row ${index} is not an object.`
      };
    }
    const row = /** @type {Record<string, unknown>} */ (entry);
    const truth = ranked[index];
    /** @type {[string, unknown, unknown][]} */
    const pairs = [
      ['itemId', row.itemId, truth.item.id],
      ['rank', row.rank, truth.rank],
      ['raw', row.raw, truth.raw],
      ['maximum', row.maximum, truth.maximum],
      ['positiveCount', row.positiveCount, truth.positiveCount],
      ['normalized', round6(Number(row.normalized)), round6(truth.normalized)],
      ['label', row.label, truth.item.label]
    ];
    for (const [field, claimed, computed] of pairs) {
      if (claimed !== computed) {
        return {
          verified: false,
          code: 'TRACE_RANKING_MISMATCH',
          message: `Replaying the recorded answers produced a different score table: row ${index}'s "${field}" is not what the recorded answers produce.`,
          expected: String(computed),
          actual: String(claimed)
        };
      }
    }
  }

  /*
   * The answer count is checked against the steps, and each step's applied
   * points against the weights the engine actually applies. Both were
   * unverified: `answered` could say 999 next to ten steps, and `applied` could
   * claim points that no recorded answer awards.
   */
  if (record.answered !== undefined && record.answered !== record.steps.length) {
    return {
      verified: false,
      code: 'TRACE_ANSWER_COUNT_MISMATCH',
      message: 'The trace says it recorded a different number of answers than it has steps.',
      expected: String(record.steps.length),
      actual: String(record.answered)
    };
  }

  const recomputedSteps = buildDeltas(answers, game);
  for (const [index, step] of record.steps.entries()) {
    const raw = /** @type {Record<string, unknown>} */ (step);
    const truth = recomputedSteps[index];
    if (!truth) {
      return {
        verified: false,
        code: 'TRACE_BAD_STEP',
        message: `Step ${index} has no counterpart in the replay.`
      };
    }
    const claimed = raw.applied;
    if (claimed !== null && typeof claimed === 'object' && !Array.isArray(claimed)) {
      const recordClaimed = /** @type {Record<string, unknown>} */ (claimed);
      const claimedKeys = Object.keys(recordClaimed).sort();
      const truthKeys = Object.keys(truth.applied).sort();
      if (claimedKeys.join(',') !== truthKeys.join(',')) {
        return {
          verified: false,
          code: 'TRACE_STEP_MISMATCH',
          message: `Step ${index} claims different points than the recorded answer awards.`,
          expected: truthKeys.join(','),
          actual: claimedKeys.join(',')
        };
      }
      for (const key of truthKeys) {
        const value = /** @type {Record<string, number>} */ (truth.applied)[key];
        if (recordClaimed[key] !== value) {
          return {
            verified: false,
            code: 'TRACE_STEP_MISMATCH',
            message: `Step ${index} claims ${String(recordClaimed[key])} points for "${key}"; the recorded answer awards ${String(value)}.`,
            expected: String(value),
            actual: String(recordClaimed[key])
          };
        }
      }
    }
  }

  return { verified: true, trace: /** @type {Trace} */ (trace), engineMismatch };
}
/**
 * Render a trace as plain text — the format a human actually reads in a
 * console, a support ticket, or the audit panel. Tables are aligned by hand
 * because the output must be legible in a monospace box with no CSS.
 *
 * The language comes from the trace's own `lang` unless one is passed, so a
 * stored trace keeps reading in the language it was produced in — which matters
 * because its reasons and notes are prose that was fixed when it was built.
 *
 * @param {Trace|null} trace
 * @param {string} [lang]
 * @returns {string}
 */
export function formatTrace(trace, lang) {
  if (!trace) return t(lang ?? DEFAULT_LANG, 'trace.empty');
  const lang_ = resolveLang(lang ?? trace.lang ?? DEFAULT_LANG);

  const lines = [];
  const push = (line = '') => lines.push(line);

  push(t(lang_, 'trace.title', { traceVersion: trace.traceVersion, engineVersion: trace.engineVersion }));
  push(
    t(lang_, 'trace.gameLine', {
      gameId: trace.gameId,
      gameVersion: trace.gameVersion,
      contentHash: trace.contentHash
    })
  );
  push(t(lang_, 'trace.seedLine', { seed: trace.seed || t(lang_, 'trace.seedNone') }));
  push(t(lang_, 'trace.createdLine', { createdAt: trace.createdAt }));
  push('');
  push(
    t(lang_, 'trace.asked', {
      asked: trace.decision.questionsAsked,
      available: trace.decision.questionsAvailable
    })
  );
  push('');

  const idWidth = Math.max(4, ...trace.ranking.map((row) => row.itemId.length));
  const labelWidth = Math.min(28, Math.max(5, ...trace.ranking.map((row) => row.label.length)));
  const tail = t(lang_, 'trace.cols');

  push('  #  item'.padEnd(6 + idWidth) + '  ' + 'label'.padEnd(labelWidth) + tail);
  push('  ' + '-'.repeat(6 + idWidth + labelWidth + tail.length));
  for (const row of trace.ranking) {
    push(
      `  ${String(row.rank).padStart(2)}  ${row.itemId.padEnd(idWidth)}  ` +
        `${clip(row.label, labelWidth).padEnd(labelWidth)}  ` +
        `${String(row.raw).padStart(4)} ${String(row.maximum).padStart(4)}  ` +
        `${row.normalized.toFixed(3)}  ${row.positiveCount}`
    );
  }
  push('');
  // A label column that fits the longest label in either language ("Decidido
  // por" is 12 characters), plus a space, so the values line up and switching
  // language does not shift them.
  const field = (label) => `${label} `.padEnd(13);
  push(`${field(t(lang_, 'trace.winner'))}${trace.outcome?.winnerLabel ?? t(lang_, 'trace.none')}`);
  push(
    `${field(t(lang_, 'trace.margin'))}${(trace.decision.margin * 100).toFixed(1)}% ` +
      t(lang_, 'trace.threshold', { percent: (trace.decision.marginThreshold * 100).toFixed(0) })
  );
  // The rung CODE, not its description: this block is the machine-readable audit
  // record, and a grep for "content-order" has to find it.
  push(`${field(t(lang_, 'trace.decidedBy'))}${trace.decision.tieBreakApplied}`);
  push('');

  push(t(lang_, 'trace.why'));
  for (const reason of trace.outcome?.reasons ?? [t(lang_, 'trace.noReason')]) {
    push(`  - ${reason}`);
  }
  if (trace.notes.length > 0) {
    push('');
    push(t(lang_, 'trace.notes'));
    for (const note of trace.notes) push(`  - ${note}`);
  }

  push('');
  push(t(lang_, 'trace.stepByStep'));
  for (const [index, step] of trace.steps.entries()) {
    const applied = Object.entries(step.applied)
      .sort((a, b) => b[1] - a[1])
      .map(([id, value]) => `${id} ${value > 0 ? '+' : ''}${value}`)
      .join(', ');
    push(
      `  ${String(index + 1).padStart(2)}. ${step.questionId} -> ${step.optionId}${
        step.skipped ? ` ${t(lang_, 'trace.skipped')}` : ''
      }`
    );
    push(`      ${applied || t(lang_, 'trace.noPoints')}`);
  }

  return lines.join('\n');
}

/**
 * @param {number} value
 * @returns {number}
 */
function round6(value) {
  return Math.round(value * 1e6) / 1e6;
}

/*
 * `roundRanking` used to live here: it joined the table into a
 * "id=score|id=score" string for comparison, and returned null for an empty
 * list — which is how an empty ranking slipped past verification (defect D2).
 * The comparison is now a field-by-field walk over the rows, so the stringly
 * -typed version and its null-returning edge case are both gone rather than
 * left behind for someone to call again.
 */

/**
 * @param {string} text
 * @param {number} width
 * @returns {string}
 */
function clip(text, width) {
  return text.length <= width ? text : `${text.slice(0, width - 1)}…`;
}

