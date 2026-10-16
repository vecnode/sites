/**
 * The question view.
 *
 * A single-choice question is a native `<fieldset>` of `<input type="radio">`
 * elements whose labels are the visible answer buttons. That is not a stylistic
 * preference — it is the accessibility decision that makes the rest of the code
 * smaller:
 *
 *   - arrow keys move and select within the group, natively
 *   - the group announces "2 of 4" natively
 *   - a screen reader reads the question as the group's legend, once
 *   - the widget needs no roving-tabindex bookkeeping of its own
 *
 * The view owns no state. It renders a view-model and reports a choice through
 * a callback; the controller decides what that means for the session.
 */

import { el, append, empty, focusFirst } from '../util/dom.js';
import { shortcutFor } from './a11y.js';
import { SKIP } from '../core/session.js';

/**
 * @typedef {object} OptionView
 * @property {string} id
 * @property {string} label
 * @property {string} detail
 * @property {boolean} selected
 *
 * @typedef {object} QuestionView
 * @property {string} id
 * @property {string} text
 * @property {string} help
 * @property {ReadonlyArray<OptionView>} options
 * @property {boolean} skippable
 * @property {string} skipLabel
 * @property {number} number
 * @property {number} total
 * @property {boolean} canGoBack
 * @property {string} backLabel
 * @property {boolean} showShortcuts
 *
 * @typedef {object} QuestionViewHandles
 * @property {HTMLElement} element
 * @property {(view: QuestionView) => void} update
 * @property {() => void} focus
 * @property {() => void} destroy
 */

/**
 * Build the question view.
 *
 * @param {{
 *   view: QuestionView,
 *   onChoose: (optionId: string) => void,
 *   onBack?: () => void
 * }} options
 * @returns {QuestionViewHandles}
 */
export function createQuestionView({ view, onChoose, onBack }) {
  const element = el('div', { class: 'view view-question' });

  /** @type {HTMLElement|null} */
  let legend = null;
  /** @type {HTMLElement|null} */
  let help = null;
  /** @type {HTMLElement|null} */
  let group = null;
  /** @type {HTMLElement|null} */
  let actions = null;
  /** @type {HTMLButtonElement|null} */
  let backButton = null;
  /** @type {HTMLButtonElement|null} */
  let skipButton = null;

  /** Group name must be unique per question so two games on one page cannot collide. */
  const groupName = `rg-${Math.random().toString(36).slice(2, 9)}-${view.id}`;

  build(view);

  /**
   * @param {QuestionView} next
   */
  function build(next) {
    empty(element);

    legend = el('p', { class: 'question', id: `q-${next.id}` });
    help = next.help ? el('p', { class: 'help' }) : null;
    group = el('fieldset', { class: 'options' });
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-labelledby', `q-${next.id}`);

    actions = el('div', { class: 'actions' });

    append(element, [legend, help, group, actions]);
    update(next);
  }

  /**
   * @param {QuestionView} next
   */
  function update(next) {
    if (legend) legend.textContent = next.text;
    if (help) help.textContent = next.help;
    if (!group || !actions) return;

    empty(group);
    next.options.forEach((option, index) => {
      group?.appendChild(optionRow(option, index, next));
    });

    empty(actions);
    backButton = next.canGoBack
      ? el('button', {
          class: 'btn btn-ghost btn-back',
          type: 'button',
          text: next.backLabel,
          onclick: () => onBack?.()
        })
      : null;

    skipButton = next.skippable
      ? el('button', {
          class: 'btn btn-ghost btn-skip',
          type: 'button',
          text: next.skipLabel,
          onclick: () => onChoose(SKIP)
        })
      : null;

    append(actions, [backButton, el('span', { class: 'spacer' }), skipButton]);
    if (actions.childElementCount === 0) actions.hidden = true;
  }

  /**
   * @param {OptionView} option
   * @param {number} index
   * @param {QuestionView} view
   * @returns {HTMLElement}
   */
  function optionRow(option, index, view) {
    const input = el('input', {
      type: 'radio',
      name: groupName,
      value: option.id,
      id: `${groupName}-${option.id}`
    });
    if (option.selected) input.setAttribute('checked', '');
    if (option.id === SKIP) input.dataset.skipped = 'true';
    input.addEventListener('change', () => {
      if (input.checked) onChoose(option.id);
    });

    const key = shortcutFor(index);
    const label = el('label', { class: 'option', for: `${groupName}-${option.id}` });
    append(label, [
      key && view.showShortcuts
        ? el('span', { class: 'option-key', 'aria-hidden': 'true', text: key })
        : null,
      el('span', { class: 'option-text' }, [
        document.createTextNode(option.label),
        option.detail ? el('span', { class: 'option-detail', text: option.detail }) : null
      ])
    ]);

    return el('div', { class: 'option-row' }, [input, label]);
  }

  return {
    element,
    update,
    focus() {
      // Focus the checked option when returning to a question, so a keyboard
      // user lands where they left off rather than at the top of the list.
      const checked = /** @type {HTMLInputElement|null} */ (group?.querySelector('input:checked'));
      if (checked) {
        try {
          checked.focus({ preventScroll: true });
          return;
        } catch {
          checked.focus();
          return;
        }
      }
      focusFirst(group);
    },
    destroy() {
      empty(element);
    }
  };
}
