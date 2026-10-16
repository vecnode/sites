/**
 * The result view.
 *
 * Three things a recommendation screen has to do, in this order:
 *
 *   1. Say what it recommends, unambiguously, and what it is.
 *   2. Offer the two closest alternatives, so the answer can be compared rather
 *      than obeyed, and show WHY in the player's own terms ("you chose X") rather
 *      than with a bare number.
 *   3. Show the working, on request, to anyone who wants to check it — and let
 *      them RE-VERIFY it in the page rather than trusting the numbers printed.
 *
 * WHAT THIS VIEW DELIBERATELY DOES NOT SHOW. No percentage, no points column,
 * no "available" column, no margin. The score is a model over a handful of
 * answers, and a number invites the reader to treat it as a measurement of the
 * product. The audit panel keeps the two things that are worth checking — that
 * the result reproduces, and the raw record a reviewer can replay — and drops
 * the arithmetic that only looks like evidence.
 */

import { el, append, empty } from '../util/dom.js';
import { verifyTrace, formatTrace } from '../core/audit.js';
import { t, resolveLang, DEFAULT_LANG } from '../core/i18n.js';
import { isSafeItemUrl } from '../core/validate.js';

/**
 * @typedef {object} ResultReference
 * @property {string} label
 * @property {string} reference  The SKU line, when the content was compiled.
 * @property {string} category   The category the product answers to.
 * @property {string} why        One short line on why it is worth a look.
 *
 * @typedef {object} ResultView
 * @property {string} label
 * @property {string} summary
 * @property {string} reference   Optional product code line, for a compiled catalog.
 * @property {string} category    The category the recommendation belongs to.
 * @property {ReadonlyArray<string>} bullets
 * @property {string} url
 * @property {ReadonlyArray<ResultReference>} references  The two closest alternatives.
 * @property {ReadonlyArray<string>} reasons
 * @property {string} badgeTone      'match' | 'strong' | 'caveat'
 * @property {string} badgeLabel
 * @property {string} retryLabel
 * @property {string} claimLabel
 * @property {boolean} showAudit
 * @property {string} auditSummary
 * @property {string} referencesTitle
 * @property {ReadonlyArray<{ question: string, option: string, applied: string }>} steps
 * @property {ReadonlyArray<{ rank: number, label: string, raw: number, maximum: number, winner: boolean }>} table
 * @property {ReadonlyArray<string>} notes
 * @property {boolean} canGoBack
 * @property {string} backLabel
 *
 * @typedef {object} ResultHandles
 * @property {HTMLElement} element
 * @property {(view: ResultView, context?: { trace: unknown, document: unknown }) => void} update
 * @property {() => void} focus
 * @property {() => void} destroy
 */

/**
 * @param {{
 *   view: ResultView,
 *   onRetry?: () => void,
 *   onBack?: () => void,
 *   onClaim?: (url: string) => void,
 *   trace?: unknown,
 *   document?: unknown,
 *   lang?: string
 * }} options
 * @returns {ResultHandles}
 */
export function createResultView({ view, onRetry, onBack, onClaim, trace, document: gameDocument, lang = DEFAULT_LANG }) {
  const copy = resolveLang(lang);
  const element = el('div', { class: 'view view-result' });
  /** @type {HTMLElement|null} */
  let body = null;

  /**
   * @param {ResultView} next
   * @param {{ trace?: unknown, document?: unknown }} [context]
   */
  function update(next, context = {}) {
    empty(element);
    body = el('div', { class: 'result-body' });
    append(element, [body]);

    const hero = el('div', { class: 'result-hero' });
    append(hero, [
      el('span', {
        class: 'badge',
        'data-tone': next.badgeTone,
        text: next.badgeLabel
      }),
      next.category ? el('p', { class: 'result-category', text: next.category }) : null,
      el('h3', { class: 'result-name', text: next.label }),
      next.reference ? el('p', { class: 'result-reference', text: next.reference }) : null,
      next.summary ? el('p', { class: 'result-summary', text: next.summary }) : null
    ]);

    append(body, [hero]);

    if (next.bullets.length > 0) {
      const list = el('ul', { class: 'result-bullets' });
      for (const bullet of next.bullets) list.appendChild(el('li', { text: bullet }));
      append(body, [list]);
    }

    // The two closest alternatives, before the "why": a reader who is comparing
    // wants the shortlist next to the winner, not below an explanation.
    if (next.references.length > 0) {
      const section = el('section', { class: 'references' });
      append(section, [
        el('h4', { class: 'references-title', text: next.referencesTitle }),
        el('p', { class: 'references-lead', text: t(copy, 'result.references.lead') })
      ]);
      const list = el('ul', { class: 'references-list' });
      for (const reference of next.references) {
        const item = el('li', { class: 'reference' });
        append(item, [
          el('span', { class: 'reference-name', text: reference.label }),
          reference.category ? el('span', { class: 'reference-category', text: reference.category }) : null,
          reference.reference ? el('span', { class: 'reference-code', text: reference.reference }) : null,
          el('span', { class: 'reference-why', text: reference.why })
        ]);
        list.appendChild(item);
      }
      append(section, [list]);
      append(body, [section]);
    }

    // Why.
    const why = el('section', { class: 'why' });
    append(why, [el('h4', { class: 'why-title', text: t(copy, 'result.why') })]);
    const reasons = el('ul', { class: 'why-list' });
    for (const reason of next.reasons) reasons.appendChild(el('li', { text: reason }));
    append(why, [reasons]);
    append(body, [why]);

    // The audit panel: optional, and interactive.
    if (next.showAudit) {
      append(body, [auditPanel(next, context.trace ?? trace, context.document ?? gameDocument, copy)]);
    }

    // Actions.
    const actions = el('div', { class: 'actions' });
    append(actions, [
      next.url
        ? el('button', {
            class: 'btn btn-primary btn-claim',
            type: 'button',
            text: next.claimLabel,
            onclick: () => {
              if (typeof onClaim === 'function') onClaim(next.url);
              // Second line of defence: `validateGame` refuses a bad scheme, but
              // a host may hand the controller a prepared game that never went
              // through it. `noopener` protects the opened page, not this one.
              else if (isSafeItemUrl(next.url)) window.open(next.url, '_blank', 'noopener');
            }
          })
        : null,
      el('button', {
        class: 'btn btn-retry',
        type: 'button',
        text: next.retryLabel,
        onclick: () => onRetry?.()
      }),
      next.canGoBack
        ? el('button', {
            class: 'btn btn-ghost btn-back',
            type: 'button',
            text: next.backLabel,
            onclick: () => onBack?.()
          })
        : null
    ]);
    append(body, [actions]);
  }

  update(view);

  return {
    element,
    update,
    focus() {
      const heading = element.querySelector('.result-name');
      if (heading instanceof HTMLElement) {
        // Make the heading programmatically focusable so a screen reader starts
        // reading the result from its title rather than its last button.
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    },
    destroy() {
      empty(element);
    }
  };
}

/**
 * The collapsible audit panel.
 *
 * WHAT IS IN IT, and what is deliberately not. It keeps the two things a reader
 * can act on: the plain-language reason each answer mattered, and a button that
 * recomputes the result in this page and reports whether it reproduces. It no
 * longer prints the points table, the available-points column, the share, or
 * the margin line — those are the model's internals, and a player reading them
 * takes them for evidence about the product rather than about the arithmetic.
 * The full record is still one disclosure away, and it is still the same bytes
 * a reviewer would replay.
 *
 * @param {ResultView} view
 * @param {unknown} trace
 * @param {unknown} gameDocument
 * @param {string} [lang]
 * @returns {HTMLElement}
 */
function auditPanel(view, trace, gameDocument, lang = DEFAULT_LANG) {
  const details = el('details', { class: 'audit' });
  details.appendChild(el('summary', { text: view.auditSummary }));

  const body = el('div', { class: 'audit-body' });

  // The step log: what each answer did, in words rather than in points.
  const log = el('ol', { class: 'steps-log' });
  for (const step of view.steps) {
    const item = el('li');
    append(item, [
      el('div', { text: step.option }),
      el('code', { text: step.question }),
      el('pre', { text: step.applied })
    ]);
    log.appendChild(item);
  }
  append(body, [log]);

  if (view.notes.length > 0) {
    const notes = el('ul', { class: 'why-list' });
    for (const note of view.notes) notes.appendChild(el('li', { text: note }));
    append(body, [notes]);
  }

  // Verify in the page. The verdict carries its own class AND a data-state, so
  // it is distinguishable from the static decision line above it — two
  // elements sharing one class name is a trap for both CSS and tests.
  const verifyRow = el('div', { class: 'verify' });
  const verdict = el('span', {
    class: 'verify-verdict',
    role: 'status',
    'aria-live': 'polite'
  });
  const button = el('button', {
    class: 'btn btn-verify',
    type: 'button',
    text: t(lang, 'result.verify'),
    onclick: () => {
      if (!trace) {
        verdict.dataset.state = 'bad';
        verdict.textContent = t(lang, 'result.verify.none');
        return;
      }
      const outcome = verifyTrace(trace, gameDocument);
      verdict.dataset.state = outcome.verified ? 'ok' : 'bad';
      verdict.textContent = outcome.verified
        ? t(lang, 'result.verify.ok')
        : t(lang, 'result.verify.bad', { code: outcome.code, message: outcome.message });
    }
  });
  append(verifyRow, [button, verdict]);
  append(body, [verifyRow]);

  // The raw trace, for anyone who wants to keep it.
  //
  // FILLED ON FIRST OPEN, not on render. `formatTrace` writes a line per item,
  // so the thousand-item catalogue would build an 80 KB text node into the DOM
  // on every result render, for a disclosure the player has not opened and
  // usually will not. A line per row is the point of the format, so the fix is
  // to pay for it when it is asked for rather than to shorten it.
  if (trace) {
    const raw = el('details', { class: 'audit' });
    raw.appendChild(el('summary', { text: t(lang, 'result.raw') }));
    const pre = el('pre', { class: 'raw-trace' });
    let filled = false;
    raw.addEventListener('toggle', () => {
      if (!raw.open || filled) return;
      filled = true;
      pre.textContent = formatTrace(/** @type {any} */ (trace), lang);
    });
    raw.appendChild(pre);
    append(body, [raw]);
  }

  append(details, [body]);
  return details;
}

/**
 * Render a trace as the human-readable audit text. Re-exported so the view, the
 * console and the docs demonstrably use ONE formatter rather than three.
 */
export { formatTrace };
