/**
 * Accessibility plumbing.
 *
 * The widget's accessibility is mostly a consequence of using real HTML: a
 * `<dialog>` gets focus management and the top layer for free, a `<fieldset>`
 * with radios is a native single-choice question, and a `<details>` disclosure
 * is keyboard-operable without help. This module covers the three things that
 * genuinely need JavaScript:
 *
 *   1. announcing step changes to a screen reader, because the widget swaps
 *      content in place rather than navigating, so nothing "happens" audibly
 *   2. moving focus when a view changes, so a keyboard user is not left on a
 *      control that no longer exists
 *   3. number-key shortcuts, because a ten-question game on a desktop is much
 *      faster with `3` than with a mouse
 *
 * The rules it follows:
 *   - one polite live region, never `aria-live="assertive"` (interrupting a
 *     screen reader mid-sentence is hostile)
 *   - the live region is cleared and re-set on the next frame, because
 *     assigning identical text does not announce anything
 *   - focus moves to a MEANINGFUL element, never to the top of the document
 */

import { el } from '../util/dom.js';
import { t, DEFAULT_LANG } from '../core/i18n.js';

/**
 * @typedef {object} Announcer
 * @property {HTMLElement} element  The live region to place in the shadow root.
 * @property {(message: string) => void} say
 */

/**
 * A polite live region.
 *
 * @returns {Announcer}
 */
export function createAnnouncer() {
  const element = el('div', {
    class: 'sr-only',
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true'
  });

  /** @type {number|null} */
  let pending = null;

  return {
    element,
    say(message) {
      if (!message) return;
      if (pending !== null) clearTimeout(pending);
      // Clearing first is what makes a REPEATED message audible: a screen
      // reader only announces a change, and setting the same string twice is
      // not a change.
      element.textContent = '';
      pending = /** @type {unknown} */ (setTimeout(() => {
        element.textContent = message;
        pending = null;
      }, 30)) ?? null;
    }
  };
}

/**
 * Sentence for "you are now on question N of M".
 *
 * @param {number} number
 * @param {number} total
 * @param {string} questionText
 * @param {number} optionCount
 * @param {string} [lang]
 * @returns {string}
 */
export function questionAnnouncement(number, total, questionText, optionCount, lang = DEFAULT_LANG) {
  return t(lang, 'a11y.question', {
    n: optionCount,
    number,
    total,
    text: questionText
  });
}

/**
 * Sentence for a finished game.
 *
 * No percentage, and that is the point rather than an omission: the score is a
 * model, not a fact about the product, and a reader who hears "87 %" believes a
 * precision the five answers do not carry. The announcement names the
 * recommendation and says how many other options were in play.
 *
 * @param {string} label
 * @param {number} alternativeCount
 * @param {string} [lang]
 * @returns {string}
 */
export function resultAnnouncement(label, alternativeCount, lang = DEFAULT_LANG) {
  return t(lang, 'a11y.result', {
    label,
    others: alternativeCount
  });
}

/**
 * Sentence for a step back.
 *
 * @param {number} number
 * @param {number} total
 * @param {string} questionText
 * @param {string} [lang]
 * @returns {string}
 */
export function backAnnouncement(number, total, questionText, lang = DEFAULT_LANG) {
  return t(lang, 'a11y.back', { n: number, total, text: questionText });
}

/**
 * The digit that selects an option, for the shortcut hint. Returns an empty
 * string beyond 9, because `10` would be ambiguous with two single digits.
 *
 * @param {number} index Zero-based.
 * @returns {string}
 */
export function shortcutFor(index) {
  return index < 9 ? String(index + 1) : '';
}

/**
 * Build a keyboard handler for the option list.
 *
 * `1`..`9` activate the matching option. The handler is a no-op when the event
 * is not a plain keypress, when a modifier is held, or when the key names no
 * option, so it can be attached to the whole shell without interfering with
 * anything else.
 *
 * @param {(index: number) => void} onPick
 * @returns {(event: KeyboardEvent) => void}
 */
export function digitShortcuts(onPick) {
  return (event) => {
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;
    const digit = Number(event.key);
    if (!Number.isInteger(digit) || digit < 1 || digit > 9) return;
    onPick(digit - 1);
  };
}

/**
 * Move focus to an element without scrolling the whole page, and without
 * stealing focus from something the user is already using inside the shell.
 *
 * `preventScroll` matters in an embedded widget: focusing the first option of a
 * tall inline shell would otherwise jump the HOST page to it.
 *
 * @param {HTMLElement|null|undefined} element
 */
export function focusQuietly(element) {
  if (!element) return;
  try {
    element.focus({ preventScroll: true });
  } catch {
    // Older engines ignore the options argument; a plain focus is still right.
    element.focus();
  }
}

/**
 * A heading that a screen reader can jump to, with the level chosen by the
 * caller so the widget fits the host page's own heading outline rather than
 * always shouting `h1`.
 *
 * @param {string} tag
 * @param {string} text
 * @param {Record<string, unknown>} [props]
 * @returns {HTMLElement}
 */
export function heading(tag, text, props = {}) {
  const safeTag = /^h[1-6]$/.test(tag) ? tag : 'h2';
  return el(/** @type {'h2'} */ (safeTag), { ...props, text });
}
