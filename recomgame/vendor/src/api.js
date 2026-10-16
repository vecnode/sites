/**
 * `window.RecomGame` — the imperative API.
 *
 * The declarative tag is the preferred way to embed the widget, but a host with
 * an existing button needs something to call, and a host that already has the
 * recommendations in its own data needs somewhere to put them. This module is
 * that surface, and it is intentionally tiny:
 *
 *   RecomGame.open(game)          show a game in a modal, resolve with the result
 *   RecomGame.define(games)       register one or more game documents
 *   RecomGame.list()              ids currently registered
 *   RecomGame.play(game, answers) score a whole game with no UI at all
 *   RecomGame.verify(trace, game) check a stored trace in the page
 *   RecomGame.catalog(csv, plan)  compile a catalog export into a game document
 *   RecomGame.register()          define the element (idempotent)
 *
 * Everything is attached to ONE namespaced global. Nothing else is touched: no
 * prototype is extended, no jQuery-style `$` is claimed, and no stylesheet is
 * injected into the host's document outside the shadow root.
 *
 * The pure engine is re-exported here too, so a host that wants only the
 * scoring — a server-rendered decision, a build step — does not have to know
 * where the files live.
 */

import {
  RecomGameElement,
  TAG,
  defineGame,
  getGame,
  listGames,
  registerElement
} from './ui/recom-game.js';
import { ENGINE_VERSION, SCHEMA_VERSION, TRACE_VERSION, MAX_QUESTIONS } from './core/version.js';
import { createSession, play as playSession } from './core/session.js';
import { buildTrace, verifyTrace, formatTrace } from './core/audit.js';
import { prepareGame } from './core/model.js';
import { validateGame, formatReport } from './core/validate.js';
import { rankAnswers } from './core/scoring.js';
import { catalogToGame } from './core/catalog.js';
import { parseCsv } from './core/csv.js';

/**
 * A game document or a registered id.
 * @typedef {Record<string, unknown>|string} GameRef
 */

/**
 * Resolve a `GameRef` to a document.
 *
 * @param {GameRef} reference
 * @returns {Record<string, unknown>|null}
 */
function resolveGame(reference) {
  if (typeof reference === 'string') return getGame(reference);
  if (reference && typeof reference === 'object') {
    // A document passed straight in is registered under its own id, so a later
    // `<recom-game game="...">` in the same page can find it.
    if (typeof reference.gameId === 'string') defineGame(reference);
    return reference;
  }
  return null;
}

/**
 * A dialog element created on demand, reused between opens.
 *
 * Created lazily and appended to `document.body` rather than to whatever
 * container the caller happens to have, because a modal must not be trapped
 * inside an ancestor with `overflow: hidden` or a transform.
 *
 * @type {RecomGameElement|null}
 */
let shared = null;

/** @returns {RecomGameElement} */
function sharedElement() {
  if (shared && shared.isConnected) return shared;
  const element = document.createElement(TAG);
  element.setAttribute('placement', 'modal');
  element.setAttribute('hidden', '');
  document.body.appendChild(element);
  shared = /** @type {RecomGameElement} */ (element);
  return shared;
}

/**
 * Play a game with no UI: give the answers, get the trace.
 *
 * Used by the tests, and genuinely useful to a host — a server-rendered page
 * that already knows the answers can produce the same recommendation the widget
 * would, with the same verifiable trace.
 *
 * @param {GameRef} game
 * @param {string[]} optionIds One per question, in order. `'__skip__'` skips.
 * @param {{ seed?: string, maxQuestions?: number }} [options]
 * @returns {{ ok: true, winner: string, item: unknown, trace: unknown, text: string } | { ok: false, code: string, message: string }}
 */
export function play(game, optionIds, options = {}) {
  const document_ = resolveGame(game);
  if (!document_) {
    return { ok: false, code: 'GAME_NOT_FOUND', message: 'No such game is registered.' };
  }

  const created = createSession(document_, options);
  if (!created.ok) {
    return {
      ok: false,
      code: created.report.issues[0]?.code ?? 'CONTENT_INVALID',
      message: created.report.issues[0]?.message ?? 'The game content is not playable.'
    };
  }

  const state = playSession(created.state, optionIds);
  // The engine always answers: this is a trace even when nothing was answered,
  // so a caller never has to handle "no result" as a separate case. There is one
  // language, so the trace carries no language option.
  const trace = buildTrace(state);

  const winnerId = trace.outcome?.winnerId ?? '';
  return {
    ok: true,
    winner: winnerId,
    item: created.state.game.itemsById[winnerId] ?? null,
    trace,
    text: formatTrace(trace)
  };
}

/**
 * Show a game in a modal and resolve with the result.
 *
 * @param {GameRef} [game]
 * @param {{ placement?: 'modal'|'inline', audit?: boolean, seed?: string, labels?: Record<string,string> }} [options]
 * @returns {Promise<{ winner: string, trace: unknown }|null>}
 */
export async function open(game, options = {}) {
  const document_ = game ? resolveGame(game) : null;
  if (game && !document_) {
    return null;
  }

  const element = sharedElement();
  if (document_) element.content = document_;
  if (options.audit === false) element.setAttribute('audit', 'false');
  if (options.seed) element.setAttribute('seed', options.seed);
  if (options.labels) element.labels = options.labels;
  if (options.placement) element.setAttribute('placement', options.placement);

  return element.open();
}

/** Dismiss whatever `open` is currently showing. */
export function close() {
  shared?.close('api');
}

/** Register one or many game documents. @param {Record<string,unknown>|Record<string,unknown>[]} games */
export function define(games) {
  return defineGame(games);
}

/** Register the custom element. Idempotent. @param {string} [tag] */
export function register(tag = TAG) {
  return registerElement(tag);
}

/**
 * Compile a catalog export into a game document, in the page.
 *
 *   const plan = await (await fetch('/content/catalog/brindes.plan.json')).json();
 *   const csv = await (await fetch('/content/catalog/sku-mba-categories.v1.csv')).text();
 *   const { ok, document, report, stats } = RecomGame.catalog(csv, plan);
 *   if (ok) RecomGame.define(document);
 *
 * Nothing here fetches: the host already has both halves, or it wants to compile
 * a file the player just dropped in. `stats.skuById` maps a winner back to the
 * product code it came from.
 *
 * @param {string} csvText
 * @param {Record<string, unknown>} plan
 * @returns {{ ok: boolean, document: Record<string, unknown>|null, report: unknown, stats: unknown }}
 */
export function catalog(csvText, plan) {
  return catalogToGame(csvText, plan);
}

/**
 * The version of the engine and the schema it speaks, for a host's build log.
 * @returns {{ engine: string, schema: string, trace: string, maxQuestions: number }}
 */
export function version() {
  return {
    engine: ENGINE_VERSION,
    schema: SCHEMA_VERSION,
    trace: TRACE_VERSION,
    maxQuestions: MAX_QUESTIONS
  };
}

/**
 * The complete API object.
 */
export const api = {
  // Element
  register,
  define,
  get: getGame,
  list: listGames,
  // Playing
  open,
  close,
  play,
  verify: verifyTrace,
  // Content
  catalog,
  parseCsv,
  // Pure engine, re-exported for hosts that only want the maths
  prepareGame,
  validateGame,
  formatReport,
  rankAnswers,
  buildTrace,
  formatTrace,
  version,
  element: RecomGameElement,
  tag: TAG
};

/**
 * The global name. One object, one namespace, nothing else on `window`.
 */
export const GLOBAL_NAME = 'RecomGame';

/**
 * Attach the API to the global object, without clobbering an existing one from
 * a different version of the widget: the first one loaded wins, and a host that
 * genuinely wants to replace it can assign `window.RecomGame` itself.
 *
 * @returns {typeof api}
 */
export function install() {
  if (typeof window === 'undefined') return api;
  const existing = /** @type {any} */ (window)[GLOBAL_NAME];
  if (existing && typeof existing === 'object' && existing.version) return existing;
  /** @type {any} */ (window)[GLOBAL_NAME] = api;
  return api;
}

export default api;
