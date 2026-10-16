/**
 * The event vocabulary.
 *
 * Events are how a host reacts to the game without reaching into it. The names
 * and payloads are public API, so they are defined once here and documented in
 * docs/ARQUITETURA.md.
 *
 * Every event is a `CustomEvent` that bubbles and is `composed`, so it crosses
 * the shadow boundary and reaches a listener on the host page.
 */

/** Prefix for every event, so a host can filter one namespace. */
const PREFIX = 'recom:';

/**
 * @typedef {object} RecomEventMap
 * @property {object} 'recom:ready'      Playable. detail: { gameId, title, questions, contentHash }
 * @property {object} 'recom:open'       Visible. detail: { gameId, mode }
 * @property {object} 'recom:answer'     Answered. detail: { questionId, optionId, skipped, index, answered, total }
 * @property {object} 'recom:back'       Stepped back. detail: { questionId, index, total }
 * @property {object} 'recom:complete'   A result exists. detail: { winner, winnerLabel, trace, summary }
 * @property {object} 'recom:close'      Dismissed. detail: { reason, completed, trace }
 * @property {object} 'recom:error'      Unusable content or configuration. detail: { code, message }
 */

/**
 * Event names, as a constant object so no name is ever typed twice.
 * @type {Record<string, string>}
 */
export const EVENTS = {
  ready: `${PREFIX}ready`,
  open: `${PREFIX}open`,
  answer: `${PREFIX}answer`,
  back: `${PREFIX}back`,
  complete: `${PREFIX}complete`,
  close: `${PREFIX}close`,
  error: `${PREFIX}error`
};

/**
 * Dispatch a namespaced CustomEvent from an element.
 *
 * `complete` is cancelable so a host can decline to act on a result; nothing
 * else is, because nothing else has a decision to make.
 *
 * @param {EventTarget} target
 * @param {string} name
 * @param {Record<string, unknown>} [detail]
 * @returns {boolean} False when a listener called preventDefault.
 */
export function emit(target, name, detail = {}) {
  return target.dispatchEvent(
    new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: name === EVENTS.complete
    })
  );
}

/**
 * Why a shell was closed, recorded in the close event so a host can tell
 * "finished and dismissed" from "abandoned halfway".
 *
 * @type {Record<string, string>}
 */
export const CLOSE_REASONS = {
  button: 'button',
  escape: 'escape',
  backdrop: 'backdrop',
  api: 'api',
  complete: 'complete',
  reset: 'reset'
};
