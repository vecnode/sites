/**
 * The session state machine.
 *
 * This is the "game" part of the engine, and it is pure: there is no DOM, no
 * clock, no `Date.now()` in the trace. Every operation takes a state and
 * returns a NEW state, so the UI can offer "back" without any risk of an
 * answer being counted twice, and so a whole run can be replayed from a
 * recorded list of answers (that is exactly how `verifyTrace` works).
 *
 * State is a plain, JSON-serialisable object. That is a deliberate choice:
 * a bug report can be a copied state, and a test fixture can be a literal.
 *
 * Status transitions:
 *
 *        createSession
 *              |
 *              v
 *         [ 'asking' ] --answer(final question)--> [ 'complete' ]
 *              |  ^                                      |
 *              |  +----------------- back ----------------+ (only via 'asking')
 *              v
 *         [ 'cancelled' ]                     reset() returns any state to 'asking'
 *
 * FROZEN. See src/core/freeze.js.
 */

/**
 * @typedef {object} Answer
 * @property {string} questionId
 * @property {string} optionId
 * @property {Readonly<Record<string, number>>} weights  Copied from the option, frozen.
 * @property {boolean} skipped
 * @property {number} index  Position of the question in the session's order.
 *
 * @typedef {'asking'|'complete'|'cancelled'} SessionStatus
 *
 * @typedef {object} SessionState
 * @property {import('./model.js').Game} game
 * @property {string} seed            The seed used for this session, '' when unseeded.
 * @property {readonly import('./model.js').Question[]} order  The questions this session asks, in order.
 * @property {number} index           Index into `order` of the question awaiting an answer.
 * @property {readonly Answer[]} answers  Answers recorded so far, in question order.
 * @property {SessionStatus} status
 */

import { createRng, shuffle } from './prng.js';
import { MAX_QUESTIONS } from './version.js';
import { validateGame } from './validate.js';
import { prepareGame } from './model.js';

/**
 * @typedef {object} CreateSessionOptions
 * @property {string|number} [seed]  Seed for question/option order. Recorded in state and trace.
 * @property {number} [maxQuestions] Override the game's own cap (still capped at MAX_QUESTIONS).
 * @property {boolean} [shuffleQuestions] Shuffle the question order (requires `seed`).
 * @property {readonly string[]} [questionIds] Ask only these questions, in this order.
 */

/**
 * Start a session. Accepts either a raw document or an already-normalised game.
 *
 * @param {unknown} gameOrDocument
 * @param {CreateSessionOptions} [options]
 * @returns {{ ok: true, state: SessionState } | { ok: false, report: import('./validate.js').ValidationReport }}
 */
export function createSession(gameOrDocument, options = {}) {
  const prepared = isGame(gameOrDocument)
    ? { ok: /** @type {const} */ (true), game: /** @type {import('./model.js').Game} */ (gameOrDocument), warnings: [] }
    : prepareGame(gameOrDocument, options);

  if (!prepared.ok) return { ok: false, report: prepared.report };
  const game = prepared.game;

  const seed = options.seed === undefined || options.seed === null ? '' : String(options.seed);
  const hasSeed = seed !== '';

  /** @type {import('./model.js').Question[]} */
  let order = [...game.questions];

  if (Array.isArray(options.questionIds) && options.questionIds.length > 0) {
    /** @type {import('./model.js').Question[]} */
    const chosen = [];
    const seen = new Set();
    for (const id of options.questionIds) {
      const question = game.questionsById[id];
      if (question && !seen.has(id)) {
        chosen.push(question);
        seen.add(id);
      }
    }
    order = chosen;
  }

  if (options.shuffleQuestions === true && hasSeed) {
    order = shuffle(order, createRng(`${seed}::questions`));
  }

  const cap = Math.max(
    1,
    Math.min(MAX_QUESTIONS, Math.floor(Number(options.maxQuestions) || game.maxQuestions))
  );
  if (order.length > cap) order = order.slice(0, cap);

  if (order.length === 0) {
    // Reachable only via an explicit `questionIds` that matched nothing; the
    // document validator already guarantees a well-formed game has questions.
    const report = validateGame(gameOrDocument);
    return { ok: false, report };
  }

  /** @type {SessionState} */
  const state = {
    game,
    seed,
    order: Object.freeze(order),
    index: 0,
    answers: Object.freeze([]),
    status: 'asking'
  };

  return { ok: true, state };
}

/**
 * The question the player is being asked right now, or `undefined` when the
 * session is not asking.
 *
 * @param {SessionState} state
 * @returns {import('./model.js').Question|undefined}
 */
export function currentQuestion(state) {
  if (state.status !== 'asking') return undefined;
  return state.order[state.index];
}

/**
 * How many questions have been answered (skips count: the player moved on).
 *
 * @param {SessionState} state
 * @returns {number}
 */
export function answeredCount(state) {
  return state.answers.length;
}

/**
 * 1-based question number for display ("Question 3 of 10").
 *
 * @param {SessionState} state
 * @returns {{ number: number, total: number }}
 */
export function progress(state) {
  return { number: Math.min(state.index + 1, state.order.length), total: state.order.length };
}

/**
 * Record an answer to the current question and advance.
 *
 * Re-answering a question the player already answered replaces that answer
 * rather than appending a second one — the single most likely source of a
 * double-counted score.
 *
 * @param {SessionState} state
 * @param {string} optionId
 * @param {{ skipped?: boolean }} [flags]
 * @returns {SessionState}
 */
export function answer(state, optionId, flags = {}) {
  if (state.status !== 'asking') return state;
  const question = state.order[state.index];
  if (!question) return state;

  const skipped = flags.skipped === true || optionId === SKIP;
  const option = skipped ? undefined : question.options.find((entry) => entry.id === optionId);

  // An unknown option id is a programming error, not player input: the UI can
  // only offer ids that exist. Fail loudly rather than silently scoring zero,
  // because a silent zero would corrupt the audit trail.
  if (!skipped && !option) {
    throw new RangeError(
      `Unknown option "${optionId}" for question "${question.id}". Known: ${question.options
        .map((entry) => entry.id)
        .join(', ')}`
    );
  }

  /** @type {Answer} */
  const recorded = Object.freeze({
    questionId: question.id,
    optionId: skipped ? SKIP : /** @type {import('./model.js').Option} */ (option).id,
    weights: Object.freeze(skipped ? {} : { .../** @type {import('./model.js').Option} */ (option).weights }),
    skipped,
    index: state.index
  });

  /** @type {Answer[]} */
  const answers = state.answers.filter((entry) => entry.index !== state.index);
  answers.push(recorded);
  answers.sort((a, b) => a.index - b.index);

  const isLast = state.index >= state.order.length - 1;

  return {
    ...state,
    answers: Object.freeze(answers),
    index: isLast ? state.index : state.index + 1,
    status: isLast ? 'complete' : 'asking'
  };
}

/**
 * The reserved option id that means "no preference". Answering with it adds
 * nothing to any score. Kept as a constant so content authors and the UI agree.
 */
export const SKIP = '__skip__';

/**
 * Step back one question, keeping the previous answer available so the view
 * can highlight what was chosen before.
 *
 * @param {SessionState} state
 * @returns {SessionState}
 */
export function back(state) {
  if (state.status === 'complete') {
    return { ...state, status: 'asking', index: state.order.length - 1 };
  }
  if (state.status !== 'asking' || state.index === 0) return state;
  return { ...state, index: state.index - 1 };
}

/**
 * Replay a list of answers from the start.
 *
 * `index` and `status` are recomputed, so the resulting state is identical to
 * one built by clicking through the same answers. This is the function that
 * makes an audit trace verifiable: a reviewer re-runs the recorded answers.
 *
 * @param {SessionState} state
 * @param {readonly string[]} optionIds One entry per question, in order.
 * @returns {SessionState}
 */
export function play(state, optionIds) {
  let next = reset(state);
  for (const optionId of optionIds) {
    if (next.status !== 'asking') break;
    next = answer(next, optionId);
  }
  return next;
}

/**
 * Back to question one with no answers. The seed and order are kept (a reset
 * should not silently re-shuffle a seeded game).
 *
 * @param {SessionState} state
 * @returns {SessionState}
 */
export function reset(state) {
  return { ...state, index: 0, answers: Object.freeze([]), status: 'asking' };
}

/**
 * Mark the session abandoned (dialog dismissed). Answers are kept so a
 * partial result can still be shown or logged if the host asks for it.
 *
 * @param {SessionState} state
 * @returns {SessionState}
 */
export function cancel(state) {
  if (state.status === 'complete') return state;
  return { ...state, status: 'cancelled' };
}

/**
 * True when the state already carries a normalised game (so it need not be
 * revalidated). Structural check rather than `instanceof`, because a game may
 * come back from `structuredClone`, JSON, or another realm (an iframe).
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isGame(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'itemsById' in value &&
    'questionsById' in value &&
    'contentHash' in value &&
    'frozen' in value
  );
}

/**
 * Structural check for a session state — used by the UI to reject a stale or
 * foreign object instead of half-working with it.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isSessionState(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    isGame(/** @type {Record<string, unknown>} */ (value).game) &&
    Array.isArray(/** @type {Record<string, unknown>} */ (value).order) &&
    typeof /** @type {Record<string, unknown>} */ (value).index === 'number' &&
    Array.isArray(/** @type {Record<string, unknown>} */ (value).answers)
  );
}

/**
 * A compact, human-readable one-line summary of where a session stands.
 *
 * @param {SessionState} state
 * @returns {string}
 */
export function describeSession(state) {
  const { number, total } = progress(state);
  const done = state.answers.length;
  switch (state.status) {
    case 'complete':
      return `${state.game.gameId}: complete after ${done}/${total} questions`;
    case 'cancelled':
      return `${state.game.gameId}: cancelled at ${done}/${total} questions`;
    default:
      return `${state.game.gameId}: asking ${number}/${total} (${done} answered)`;
  }
}
