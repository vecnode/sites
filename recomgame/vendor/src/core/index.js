/**
 * The engine, as one import.
 *
 * This is the entry point for anyone who wants the maths and not the widget: a
 * Node server that must produce the same result the browser would, a build step,
 * a test harness, or a port. It is a barrel over `src/core/` and nothing else —
 * it contains no logic and decides nothing, which is why it can be added without
 * touching the maths.
 *
 *   import { prepareGame, createSession, play, buildTrace } from 'nobrinde-recomgame/core';
 *
 *   const prepared = prepareGame(document);
 *   if (!prepared.ok) throw new Error(formatReport(prepared.report));
 *   const state = play(createSession(prepared.game).state, ['q1-a', 'q2-b']);
 *   const trace = buildTrace(state);
 *
 * Every module re-exported here is DOM-free, clock-free, network-free and
 * randomness-free, so the same file runs in Node and in a page and produces the
 * same `contentHash` and the same trace. That property is the whole reason a
 * server-side reimplementation is unnecessary: run this, do not re-derive it.
 *
 * The UI is deliberately absent, as is `src/api.js` (which imports the custom
 * element and therefore cannot load in Node). For a complete list of what is
 * stable, see the API section of docs/ARQUITETURA.md.
 *
 * FROZEN. See src/core/freeze.js.
 */

/* Content: validate, normalise, and serialise back. */
export { validateGame, formatReport, isSafeItemUrl } from './validate.js';
export { prepareGame, gameToDocument, weightFor, maxWeightFor } from './model.js';

/* Playing: the state machine, and the deterministic session order. */
export {
  createSession,
  currentQuestion,
  answeredCount,
  progress,
  answer,
  back,
  play,
  reset,
  cancel,
  isSessionState,
  describeSession,
  SKIP
} from './session.js';

/* Scoring: the model, the ordering, and the tie-break ladder. */
export {
  rankAnswers,
  compareRanked,
  decidingRung,
  margin,
  shouldStopEarly,
  buildDeltas,
  score
} from './scoring.js';

/* The audit record, and the verifier that closes the loop. */
export { buildTrace, verifyTrace, formatTrace } from './audit.js';

/* Plain-language reasons, and every sentence the engine writes. */
export { describeWinner, describeRunnerUp, rungLabel, summariseResult } from './explain.js';
export { t, resolveLang, DEFAULT_LANG, SUPPORTED_LANGS } from './i18n.js';

/* Content compilation: a product export plus a plan becomes a game document. */
export { catalogToGame, LABEL_MAX } from './catalog.js';
export { parseCsv, toRecords } from './csv.js';

/* Fingerprints, and the seeded generator that makes a run reproducible. */
export { hash64, stableStringify, contentHash } from './hash.js';
export { createRng, hashSeed, shuffle, pick } from './prng.js';

/* Versions and limits, so a host can record and check them. */
export {
  ENGINE_VERSION,
  SCHEMA_VERSION,
  TRACE_VERSION,
  MAX_QUESTIONS,
  MIN_ITEMS,
  MIN_QUESTIONS,
  MAX_ITEMS,
  TIE_BREAK_LADDER
} from './version.js';
