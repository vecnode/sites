/**
 * `<recom-game>` — the custom element a host site uses.
 *
 * Two placements, one element:
 *
 *   inline  `<recom-game game="brindes">` renders the shell in the page flow. It
 *           is sized by the tokens (a phone-shaped portrait box or a landscape
 *           one) and is what a host embeds when it wants the game on the page.
 *
 *   modal   `RecomGame.open('brindes')` (or the `open` attribute) puts the same
 *           shell inside a native `<dialog>` and calls `showModal()`. The dialog
 *           gives the top layer, focus trapping, `inert` on the rest of the
 *           page, and `Esc` for free — no portal, no z-index war, no scroll
 *           lock written by hand, and it cannot be broken by a host's CSS.
 *
 * Why a custom element: it is the only mechanism in the platform that gives a
 * component its own style scope, its own lifecycle, and a declarative tag a
 * host can drop into any stack — React, Vue, Rails, a plain `.html` file, or a
 * CMS template — without a build step or a framework adapter. `customElements`
 * and `Shadow DOM` are supported everywhere the widget needs to run.
 *
 * Public surface (kept deliberately small; documented in docs/ARQUITETURA.md):
 *   attributes   game, content-src, plan-src, mode, mode-toggle,
 *                audit, open, placement, scheme, seed, max-questions,
 *                reduced-motion, shuffle (read at bootstrap, not observed:
 *                turning it on later does not restart the session)
 *   properties   game, content, plan, mode, catalogStats
 *   methods      open(), close(), reset(), play(optionIds), verifyTrace(trace),
 *                cycleMode()
 *   events       recom:ready, recom:open, recom:answer, recom:back,
 *                recom:complete, recom:close, recom:error
 *   parts        shell, chrome, title, progress, view
 */

import { shellCss } from './shell.css.js';
import { metrics, lengthPx } from './tokens.js';
import { resolveMode, watchMode } from './mode.js';
import { createController } from './controller.js';
import { el, append, empty, media, onMedia } from '../util/dom.js';
import { EVENTS, emit, CLOSE_REASONS } from '../util/events.js';
import { ENGINE_VERSION } from '../core/version.js';
import { verifyTrace } from '../core/audit.js';
import { catalogToGame } from '../core/catalog.js';
import { formatReport } from '../core/validate.js';
import { t, DEFAULT_LANG } from '../core/i18n.js';

const OBSERVED = [
  'game',
  'content-src',
  'plan-src',
  'mode',
  'mode-toggle',
  'audit',
  'open',
  'placement',
  'scheme',
  'seed',
  'max-questions',
  'reduced-motion'
];

/**
 * The order the layout button steps through.
 *
 * `auto` is in the cycle on purpose. The button exists so somebody looking at
 * the widget can answer "what would this look like in the other arrangement?"
 * without resizing a window or editing the host page — and a control that can
 * only ever leave `auto`, never return to it, would silently disable the
 * responsive behaviour the widget is proudest of.
 */
const MODE_CYCLE = /** @type {const} */ (['auto', 'portrait', 'landscape']);

/**
 * Is this URL a catalog export rather than a game document?
 *
 * By extension, deliberately: the widget has no business fetching a URL and then
 * guessing at its contents. `.csv` is the one thing a plan can compile, and a
 * query string or fragment must not defeat the test (`export.csv?v=2`).
 *
 * @param {string} url
 * @returns {boolean}
 */
function isCatalogUrl(url) {
  return /\.csv([?#].*)?$/i.test(url);
}

/**
 * How long to leave a live region empty between messages.
 *
 * A screen reader announces a CHANGE. Setting the same sentence twice is not a
 * change, so the region is cleared and re-filled on the next tick.
 */
const ANNOUNCE_GAP_MS = 30;

/** Tag name, exported so a host can register it under its own name if it must. */
export const TAG = 'recom-game';

export class RecomGameElement extends HTMLElement {
  static get observedAttributes() {
    return OBSERVED;
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    /** @type {ShadowRoot} */
    this._root = root;
    this._applyStyles();

    /** @type {import('./controller.js').Controller|null} */
    this._controller = null;
    /** A game document supplied directly (property, registry or fetch). */
    /** @type {Record<string, unknown>|null} */
    this._document = null;
    /** A catalog plan, for compiling a CSV export in the page. */
    /** @type {Record<string, unknown>|null} */
    this._plan = null;
    /** What the last catalog compile produced, for a host that needs the SKUs. */
    /** @type {import('../core/catalog.js').CatalogStats|null} */
    this._catalogStats = null;
    /** @type {string} */
    this._gameId = '';
    /** Copy overrides supplied through the `labels` property. */
    /** @type {Record<string, string>|undefined} */
    this._labels = undefined;
    /** @type {'portrait'|'landscape'} */
    this._resolvedMode = 'portrait';
    /** @type {(() => void)|null} */
    this._stopWatchingMode = null;
    /** @type {(() => void)[]} */
    this._teardowns = [];
    /** @type {Element|null} */
    this._lastFocused = null;
    /** @type {HTMLDialogElement|null} */
    this._dialog = null;
    /** @type {((event: KeyboardEvent) => void)|null} */
    this._keyHandler = null;
    /** Pending registration-grace timer, or null. */
    /** @type {any} */
    this._wakeTimer = null;
    /** @type {Promise<{ winner: string, trace: unknown }>|null} */
    this._resultPromise = null;
    /** The resolver of `_resultPromise`, so a dismissal can settle it. */
    /** @type {((value: { winner: string, trace: unknown }|null) => void)|null} */
    this._resultResolve = null;

    /** True once the shadow tree has been built, so a rebuild can clear it. */
    this._built = false;

    this._buildShell();
    this._watchScheme();
  }

  /* ------------------------------------------------------------- lifecycle */

  connectedCallback() {
    this._applyMode();
    this._stopWatchingMode ??= watchMode({
      forced: this.mode,
      onChange: (next) => this._setModeAttribute(next)
    });

    // Both of these set attributes, so they belong here rather than in the
    // constructor: the custom element specification forbids a constructor from
    // setting attributes on its own element ("the result must not have
    // attributes"), and a violation makes createElement throw outright.
    this._syncSchemeAttribute();
    if (this.isModal && !this.hasAttribute('open')) this.setAttribute('hidden', '');

    // Content resolution is lazy and starts at most once. A host may instead
    // set the `content` property at any time, which reboots the controller.
    if (this._controller === null && this._document === null) {
      const source = this.getAttribute('content-src');
      const inlineJson = this.querySelector(':scope > script[type="application/json"]');
      if (source) {
        // content-src is the one case that performs a request, and only
        // because the host explicitly asked for a URL.
        void this.load(source);
      } else if (inlineJson || this.hasAttribute('game')) {
        this._bootstrap();
      }
      // With none of those, the element waits: it may be configured later.
    }

    if (this.hasAttribute('open')) {
      this.removeAttribute('hidden');
    }
  }

  disconnectedCallback() {
    waiting.delete(this);
    if (this._wakeTimer) {
      clearTimeout(this._wakeTimer);
      this._wakeTimer = null;
    }
    this._stopWatchingMode?.();
    this._stopWatchingMode = null;
    for (const teardown of this._teardowns) teardown();
    this._teardowns = [];
    this._controller?.destroy();
    this._controller = null;
  }

  /** @param {string} name @param {string|null} _old @param {string|null} value */
  attributeChangedCallback(name, _old, value) {
    if (name === 'mode') {
      this._applyMode();
      return;
    }
    if (name === 'mode-toggle') {
      this._refreshModeButton();
      return;
    }
    if (name === 'scheme') {
      // The scheme changed, so the canvas layer has to repaint with the other
      // palette; CSS handles itself.
      this._controller?.ring.resize();
      return;
    }
    if (name === 'open') {
      if (value !== null && !this._dialog?.open) void this.open({ silent: true });
      if (value === null && this._dialog?.open) this.close(CLOSE_REASONS.api);
      return;
    }
    if (name === 'game' && value) {
      // The attribute names a game ID — it is not a URL. Resolution goes
      // through the registry (set by RecomGame.define) or an inline JSON child.
      // Fetching here was a real bug: it turned every game id into a 404.
      if (this.isConnected) this._bootstrap();
      return;
    }
    if (name === 'placement' && this._built) {
      // Placement decides whether the shell lives inside a <dialog>, which is a
      // structural difference rather than a styling one, so the shell is
      // rebuilt. Without this, setting placement after construction did nothing
      // and a modal request silently rendered inline.
      this._rebuildShell();
    }
  }

  /* -------------------------------------------------------------- public API */

  /** The game id currently configured. */
  get game() {
    return this._gameId || this.getAttribute('game') || '';
  }

  set game(value) {
    if (typeof value === 'string' && value) this.setAttribute('game', value);
  }

  /** A game document supplied directly, bypassing any fetch. */
  get content() {
    return this._document ?? null;
  }

  set content(value) {
    this._document = value;
    this._gameId = typeof value?.gameId === 'string' ? value.gameId : '';
    this._bootstrap();
  }

  /**
   * The requested layout: `'auto'` (the default), `'portrait'` or `'landscape'`.
   *
   * `auto` is the absence of the attribute, not the string "auto" in it, so a
   * host that removes the attribute gets the responsive behaviour back and the
   * markup stays clean. Writing `'auto'` therefore removes it, which is also
   * what makes `element.mode = 'auto'` a useful thing to say rather than a
   * silent way to break the layout button.
   */
  get mode() {
    return this.getAttribute('mode') ?? 'auto';
  }

  set mode(value) {
    if (!value || value === 'auto') this.removeAttribute('mode');
    else this.setAttribute('mode', value);
  }

  /**
   * Step to the next layout: auto -> portrait -> landscape -> auto.
   *
   * This is what the chrome's own button does. It is a public method rather
   * than a private one because a host's own control ("show me both layouts")
   * should not have to reimplement the cycle to stay in step with the widget.
   */
  cycleMode() {
    const index = MODE_CYCLE.indexOf(/** @type {any} */ (this.mode));
    const next = MODE_CYCLE[(index + 1) % MODE_CYCLE.length];
    this.mode = next;
    return next;
  }

  /**
   * The plan used to compile a catalog export (`content-src="….csv"`).
   *
   * It is a property rather than a registry on purpose: the module keeps exactly
   * two module-level scopes (see docs/ARQUITETURA.md), and a plan belongs to the
   * element that will use it, not to the page.
   */
  get plan() {
    return this._plan;
  }

  set plan(value) {
    this._plan = value && typeof value === 'object' ? value : null;
  }

  /**
   * What the last catalog compile produced: item counts, the traits in play, and
   * `skuById`, which is how a winner becomes an order line.
   *
   * Null unless this element compiled a CSV itself, because a game document
   * loaded as JSON carries no compile statistics.
   */
  get catalogStats() {
    return this._catalogStats;
  }

  /** True when the game is showing in a modal rather than inline. */
  get isModal() {
    return this.getAttribute('placement') === 'modal';
  }

  /**
   * Show the game, loading a game by id first when asked.
   *
   * Resolves with `{ winner, trace }` once it has been played to the end, so a
   * host can `const result = await RecomGame.open('brindes')` without wiring any
   * listeners at all. It never rejects: a content problem resolves to `null`
   * and surfaces through the `recom:error` event.
   *
   * @param {{ game?: string, silent?: boolean }} [options]
   * @returns {Promise<{ winner: string, trace: unknown }|null>}
   */
  async open(options = {}) {
    if (options.game && this.getAttribute('game') !== options.game) {
      this.setAttribute('game', options.game);
    }

    if (this._controller === null) {
      const source = this.getAttribute('content-src');
      const wanted = this.getAttribute('game');
      if (source && this._document === null) {
        // An explicit content-src is honoured only here, when a host has asked
        // to open something. Merely registering the element performs no fetch.
        await this.load(source);
      } else if (wanted && registry.has(wanted)) {
        this._bootstrap();
      } else if (this._document) {
        this._bootstrap();
      }
    }

    if (this._controller === null) {
      // Nothing playable could be resolved. Report once, and resolve honestly.
      if (this.getAttribute('game') && !registry.has(this.getAttribute('game') ?? '')) {
        const id = this.getAttribute('game') ?? '';
        this._fail(
          'CONTENT_NOT_REGISTERED',
          `No game is registered as "${id}". Register it with RecomGame.define(game), or give the element a content-src and load it explicitly.`
        );
      }
      return null;
    }

    this.removeAttribute('hidden');
    this._lastFocused = document.activeElement;

    if (this.isModal && this._dialog && !this._dialog.open) {
      try {
        this._dialog.showModal();
      } catch {
        // A dialog cannot be shown while another modal dialog is open, or from
        // inside an inert subtree. An inline shell is far better than nothing.
        this.setAttribute('placement', 'inline');
      }
    }

    this._controller.render();

    if (!options.silent) {
      emit(this, EVENTS.open, { gameId: this.game, mode: this._resolvedMode });
    }

    if (!this._resultPromise) {
      this._resultPromise = new Promise((resolve) => {
        // Kept so that a dismissal can resolve it. Without that, a host that
        // awaits `open()` hangs forever when the player closes the dialog, and
        // the promise's own declared type (`| null`) is a lie — the null branch
        // could never be reached from the modal path.
        this._resultResolve = resolve;
        this.addEventListener(
          EVENTS.complete,
          (event) => {
            const detail = /** @type {CustomEvent} */ (event).detail ?? {};
            resolve({ winner: detail.winner ?? '', trace: detail.trace ?? null });
          },
          { once: true }
        );
      });
    }

    return this._resultPromise;
  }

  /**
   * Dismiss the shell.
   *
   * @param {string} [reason]
   */
  close(reason = CLOSE_REASONS.api) {
    const completed = this._controller?.state.status === 'complete';
    const trace = this._controller?.trace ?? null;

    // One close, one event. The dialog's own `close` event fires for both a
    // scripted `dialog.close()` and an Escape dismissal and carries no reason,
    // so it is not listened to at all; `cancel` (Escape, above) and this method
    // (everything else) are the two paths, and each emits exactly once.
    if (this._dialog?.open) this._dialog.close();

    // `hidden` maps to `visibility: hidden`, not `display: none`, so a modal
    // dialog that is not open yet remains showable.
    this.setAttribute('hidden', '');
    this.removeAttribute('open');

    // Resolve the pending result, and clear it so the NEXT open() builds a fresh
    // promise. Without the clear, opening the game a second time returned the
    // first run's already-resolved promise, so a host's `.then` fired before the
    // player had answered anything. A host sees that as "the second click does
    // nothing", and it is why `test/browser/widget.test.js` opens the same
    // element twice and checks that the second result is its own.
    if (this._resultResolve) {
      if (!completed) this._resultResolve(null);
      this._resultResolve = null;
    }
    this._resultPromise = null;

    emit(this, EVENTS.close, { reason, completed, trace });

    // Restore focus to whatever the host had focused before, which is what
    // makes a modal usable with a keyboard.
    const target = this._lastFocused;
    if (target instanceof HTMLElement && document.contains(target)) {
      try {
        target.focus({ preventScroll: true });
      } catch {
        /* the host's element may have gone away; nothing to restore */
      }
    }
    this._lastFocused = null;
  }

  /** Back to the first question with no answers. */
  reset() {
    this._controller?.startOver();
    return this;
  }

  /**
   * Play a whole game programmatically, with no UI interaction.
   *
   * This is the entry point for a host that wants a recommendation from data it
   * already has (an A/B test, a saved profile, a server-rendered decision), and
   * it is what the tests drive.
   *
   * @param {string[]} optionIds One per question, in order. Use `__skip__` to skip.
   * @returns {{ winner: string, trace: unknown }|null}
   */
  play(optionIds) {
    if (this._controller === null) {
      this._bootstrap();
      if (this._controller === null) return null;
    }
    const controller = this._controller;
    for (const optionId of optionIds) {
      if (controller.state.status !== 'asking') break;
      controller.choose(optionId);
    }
    const trace = controller.trace;
    if (!trace) return null;
    return { winner: /** @type {any} */ (trace).outcome?.winnerId ?? '', trace };
  }

  /**
   * Check a trace against this element's content, in the page, for anyone who
   * wants to audit a result without trusting the widget's own display.
   *
   * @param {unknown} trace
   */
  verifyTrace(trace) {
    if (!this._controller) return { verified: false, code: 'NO_GAME', message: 'No game is loaded.' };
    return verifyTrace(trace, this._controller.game);
  }

  /**
   * Load a game document by URL, or compile one from a catalog export.
   *
   * A fetch happens ONLY when a host asks for one by URL. Nothing is requested
   * implicitly, so a widget with its content bundled makes no network call at
   * all — which is what lets a host with a strict Content-Security-Policy drop
   * it in without an exception.
   *
   * A URL ending in `.csv` is a catalog export: it is downloaded as TEXT and
   * compiled in the page against a plan (the `plan` property, or the `plan-src`
   * attribute, which is fetched when — and only when — a CSV is loaded). That
   * path exists so a new export can be seen without a rebuild; the compiled
   * `content/brindes.v1.json` is what ships, because a frozen artefact has one
   * hash and can be reviewed in a diff.
   *
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async load(url) {
    if (typeof url !== 'string' || url === '') return false;
    try {
      if (isCatalogUrl(url)) {
        const response = await fetch(url, { credentials: 'omit', mode: 'cors' });
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        const plan = await this._resolvePlan();
        if (!plan) {
          this._fail(
            'CONTENT_PLAN_REQUIRED',
            `"${url}" is a catalog export, so it needs a plan to say which questions to ask and what the answers mean. Set the "plan" property, or point "plan-src" at the plan JSON.`
          );
          return false;
        }

        const compiled = catalogToGame(await response.text(), plan);
        if (!compiled.ok || !compiled.document) {
          this._fail(
            'CONTENT_CATALOG_INVALID',
            `"${url}" could not be compiled against the plan.`,
            formatReport(compiled.report, 'catalog')
          );
          return false;
        }

        this._document = compiled.document;
        this._gameId = typeof compiled.document.gameId === 'string' ? compiled.document.gameId : url;
        /** Item id -> SKU, so a host can turn the winner into an order line. */
        this._catalogStats = compiled.stats;
        this._bootstrap();
        return this._controller !== null;
      }

      const response = await fetch(url, { credentials: 'omit', mode: 'cors' });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const gameDocument = await response.json();
      this._document = gameDocument;
      this._gameId = typeof gameDocument.gameId === 'string' ? gameDocument.gameId : url;
      this._bootstrap();
      return this._controller !== null;
    } catch (error) {
      this._fail(
        'CONTENT_FETCH_FAILED',
        `Could not load "${url}": ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * The plan for a catalog export: the property if a host set one, otherwise the
   * `plan-src` URL. A fetched plan is remembered, so opening the game twice does
   * not download it twice.
   *
   * @returns {Promise<Record<string, unknown>|null>}
   */
  async _resolvePlan() {
    if (this._plan) return this._plan;
    const source = this.getAttribute('plan-src');
    if (!source) return null;
    const response = await fetch(source, { credentials: 'omit', mode: 'cors' });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} for the plan at "${source}"`);
    }
    const plan = await response.json();
    this._plan = plan;
    return plan;
  }

  /**
   * Switch language. There is one, so this exists only so a host written against the
   * old API keeps working; it re-renders the chrome and returns the element.
   *
   * @param {string} [_next]
   */
  setLanguage(_next) {
    this._refreshModeButton();
    this._updateCounter();
    return this;
  }

  /** The language currently in use: always `pt-PT`. */
  get language() {
    return DEFAULT_LANG;
  }

  /**
   * The mode a tap on the layout button would give.
   *
   * Derived from `mode` every time and stored nowhere, so no second copy of the
   * truth can drift from the attribute a host reads. It is what makes the cycle
   * total: every value in `MODE_CYCLE` has a next.
   *
   * @returns {'auto'|'portrait'|'landscape'}
   */
  _nextMode() {
    const index = MODE_CYCLE.indexOf(/** @type {any} */ (this.mode));
    return MODE_CYCLE[(index + 1) % MODE_CYCLE.length];
  }

  /**
   * Keep the layout button's word and accessible name in step.
   *
   * The visible word is the REQUEST (`Auto`, `Vertical`, `Horizontal`), while
   * the accessible name also says what is ON SCREEN — after a tap the two differ
   * by one step, and a screen-reader user cannot see that the shell changed
   * shape.
   */
  _refreshModeButton() {
    if (!this._modeButton) return;
    const lang = DEFAULT_LANG;
    const requested = this.mode;
    const state = MODE_CYCLE.includes(/** @type {any} */ (requested)) ? requested : 'auto';
    this._modeButton.hidden = this.getAttribute('mode-toggle') === 'false';
    this._modeButton.textContent = t(lang, `shell.layout.${state}`);
    this._modeButton.title = t(lang, 'shell.layout.switch', {
      current: t(lang, `shell.layout.current.${this._resolvedMode}`)
    });
    this._modeButton.setAttribute('aria-label', this._modeButton.title);
  }

  /** Copy overrides: `{ back, retry, claim, skip, audit, close }`. */
  get labels() {
    return this._labels ? { ...this._labels } : undefined;
  }

  set labels(value) {
    this._labels = value && typeof value === 'object' ? { ...value } : undefined;
  }

  /** The seed for a reproducible option/question order, or null. */
  get seed() {
    return this.getAttribute('seed');
  }

  set seed(value) {
    if (value === null || value === undefined || value === '') this.removeAttribute('seed');
    else this.setAttribute('seed', String(value));
  }

  /** The registered controller's game model, for a host that needs the data. */
  get model() {
    return this._controller?.game ?? null;
  }

  /** The engine version, so a host can log which build produced a result. */
  get version() {
    return ENGINE_VERSION;
  }

  /* ----------------------------------------------------------------- shell */

  _applyStyles() {
    const css = shellCss();
    try {
      if ('adoptedStyleSheets' in this._root && typeof CSSStyleSheet === 'function') {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(css);
        this._root.adoptedStyleSheets = [sheet];
        return;
      }
    } catch {
      // Constructable stylesheets are supported everywhere the widget targets,
      // but a webview that exposes the API and refuses it must still get a
      // styled widget.
    }
    const style = document.createElement('style');
    style.textContent = css;
    this._root.appendChild(style);
  }

  _buildShell() {
    // Clear whatever a previous build left behind. `adoptedStyleSheets` is not
    // a child node, so the stylesheet survives this untouched.
    //
    // `replaceChildren()` rather than `empty()` here, because this runs again on
    // a `placement` change: the old `<dialog>` carried `close` and `click`
    // listeners, and detaching a node keeps its listeners alive as long as the
    // element is still referenced. Each rebuild used to leave a listener that
    // still emitted `recom:close`, so a `placement` switch made one close report
    // several times. Detaching every child before building is what drops them.
    if (this._built) {
      empty(this._root);
      this._root.replaceChildren();
    }
    this._dialog = null;

    this._shell = el('div', {
      class: 'shell',
      'data-placement': this.getAttribute('placement') === 'modal' ? 'modal' : 'inline',
      'data-mode': 'portrait'
    });
    this._shell.setAttribute('part', 'shell');

    // Chrome: title, subtitle, progress, close.
    const chrome = el('div', { class: 'chrome' });
    chrome.setAttribute('part', 'chrome');

    const heading = el('div', { class: 'heading' });
    this._title = el(/** @type {'h2'} */ ('h2'), { class: 'title' });
    this._subtitle = el('p', { class: 'subtitle' });
    append(heading, [this._title, this._subtitle]);

    // Where the progress block sits in the header. It is an empty container in
    // landscape, so the chrome row does not reserve space for a block that has
    // moved into the side column.
    this._progressRail = el('div', { class: 'progress-rail' });

    this._closeButton = el('button', {
      class: 'btn btn-ghost btn-close',
      type: 'button',
      title: 'Close',
      'aria-label': 'Close the recommendation game',
      onclick: () => this.close(CLOSE_REASONS.button)
    });
    this._closeButton.textContent = '\u00d7';

    /*
     * The layout switch.
     *
     * It steps auto -> portrait -> landscape -> auto and shows the state it is
     * in: it names the ARRANGEMENT, because a player looking at a two-column shell
     * needs to know whether that is a decision they made or one the widget made for
     * them. The host can hide it with `mode-toggle="false"`.
     */
    this._modeButton = el('button', {
      class: 'btn btn-ghost btn-mode',
      type: 'button',
      onclick: () => this.cycleMode()
    });

    append(chrome, [heading, this._progressRail, this._modeButton, this._closeButton]);

    // Body: the side column (landscape only) and the scrolling viewport.
    const body = el('div', { class: 'body' });
    this._aside = el('div', { class: 'aside' });

    /*
     * The progress block, built ONCE and moved between two places:
     *   - portrait: in the header (`.progress-rail` in the chrome row)
     *   - landscape: in the side column, where a short wide shell has vertical
     *     space beside the long scroller and none to spare above it
     *
     * Built once and moved with `append`, rather than duplicated with CSS,
     * because a duplicated live region or counter would be announced twice.
     * The step pips stay in the header in landscape: a wrapped row of ten is
     * wider than the side column, which is why the counter was being clipped to
     * a single character when the whole block was moved there.
     */
    this._progress = el('div', { class: 'progress' });
    this._progress.setAttribute('part', 'progress');
    this._ringHost = el('span', { class: 'ring-host' });
    this._counter = el('span', { class: 'counter' });
    this._steps = el('ul', { class: 'steps', 'aria-hidden': 'true' });
    append(this._progress, [this._ringHost, this._counter]);

    const scroller = el('div', { class: 'scroller' });
    this._viewport = el('div', { class: 'viewport' });
    this._viewport.setAttribute('part', 'view');
    append(scroller, [this._viewport]);

    // The live region lives outside the rail so it is present in both modes.
    this._live = el('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });

    append(body, [this._aside, scroller, this._live]);

    append(this._shell, [chrome, body]);
    this._placeProgress();

    if (this.getAttribute('placement') === 'modal') {
      const dialog = el('dialog', { 'aria-label': 'Recommendation game' });
      dialog.appendChild(this._shell);
      append(this._root, [dialog]);
      this._dialog = dialog;
      // The `hidden` attribute is applied on connection, not here: a
      // constructor must not set attributes on its own element.
      // Escape, and only Escape. `cancel` fires when the dialog is dismissed by
      // the user (the Escape key); it does NOT fire when script calls
      // `dialog.close()`, which is exactly the distinction this needs. An earlier
      // version listened for `close` instead, which fires for BOTH and carries no
      // reason — so one close emitted two `recom:close` events and the second
      // always claimed `escape`. Defect D5 in docs/OPERACOES.md.
      this._dialog.addEventListener('cancel', () => {
        emit(this, EVENTS.close, {
          reason: CLOSE_REASONS.escape,
          completed: this._controller?.state.status === 'complete',
          trace: this._controller?.trace ?? null
        });
      });
      // Clicking the backdrop dismisses. The dialog element is the only
      // element that receives a click on the backdrop, so comparing the target
      // to the dialog itself is the reliable test.
      this._dialog.addEventListener('click', (event) => {
        if (event.target === this._dialog) this.close(CLOSE_REASONS.backdrop);
      });
    } else {
      append(this._root, [this._shell]);
      this._dialog = null;
    }

    this._built = true;
  }

  /**
   * Rebuild the shell after a structural attribute changed.
   *
   * Only `placement` needs this: whether the shell sits inside a <dialog> is a
   * difference in tree shape, not in styling. The controller, the game state
   * and the answers all survive, because none of them live in the DOM.
   */
  _rebuildShell() {
    this._buildShell();
    this._applyMode();
    if (this._controller) {
      this._controller.attach(this._viewport).attachSteps(this._steps);
      this._attachRing();
      this._controller.render();
      this._updateCounter();
      if (this._keyHandler && this._shell) this._shell.addEventListener('keydown', this._keyHandler);
    }
    if (this.isModal && !this.hasAttribute('open')) this.setAttribute('hidden', '');
    else this.removeAttribute('hidden');
  }

  /**
   * Announce a message through this element's own live region.
   *
   * The region is a real node in the shadow root, which is the only way a
   * screen reader hears it: a detached element announces nothing.
   *
   * @param {string} message
   */
  _say(message) {
    if (!message || !this._live) return;
    if (this._announceTimer) clearTimeout(this._announceTimer);
    this._live.textContent = '';
    this._announceTimer = /** @type {any} */ (
      setTimeout(() => {
        if (this._live) this._live.textContent = message;
        this._announceTimer = null;
      }, ANNOUNCE_GAP_MS)
    );
  }

  _attachRing() {
    if (!this._controller || this._ringHost.childElementCount > 0) return;
    const ring = this._controller.ring;
    append(this._ringHost, [ring.element]);
    // The token carries its unit; the canvas needs a number.
    const size = lengthPx(metrics.progressRingSize);
    ring.element.style.width = metrics.progressRingSize;
    ring.element.style.height = metrics.progressRingSize;
    ring.draw({ value: 0, size });
  }

  _applyMode() {
    const width = typeof window === 'undefined' ? lengthPx(metrics.portraitWidth) : window.innerWidth;
    const height =
      typeof window === 'undefined' ? lengthPx(metrics.portraitHeight) : window.innerHeight;
    const resolved = resolveMode(this.mode, width, height);
    this._setModeAttribute(resolved);
  }

  /** @param {'portrait'|'landscape'} mode */
  _setModeAttribute(mode) {
    this._resolvedMode = mode;
    this._shell.setAttribute('data-mode', mode);
    this.setAttribute('data-resolved-mode', mode);
    this._placeProgress();
    this._controller?.ring.resize();
    // The layout button names both the request and what is on screen, and this
    // is the one place either can change — a resize, a forced mode, a tap.
    this._refreshModeButton();
  }

  /**
   * Put the progress block where the current mode wants it.
   *
   * Moving one element, rather than having two copies that CSS shows and hides,
   * is deliberate: a duplicated live region or counter would be announced twice
   * by a screen reader, and a `display: none` copy is still in the DOM for
   * anything that queries it.
   */
  _placeProgress() {
    if (!this._progress || !this._progressRail || !this._aside) return;

    if (this._resolvedMode === 'landscape') {
      // Side column, and the step pips join it above: a column of pips is
      // narrower than the wrapped row, so the counter keeps its full width.
      append(this._aside, [this._progress, this._steps]);
    } else {
      append(this._progressRail, [this._progress, this._steps]);
    }
  }

  /**
   * Follow the OS colour scheme through an attribute, so the stylesheet's
   * `data-system-scheme` selectors and the canvas layer agree.
   *
   * Nothing is set here: the attribute is applied on connection and on every
   * later change. Setting it in the constructor would violate the custom
   * element specification.
   */
  _watchScheme() {
    // Only wire the listeners here; the first read happens on connection.
    this._teardowns.push(
      onMedia('(prefers-color-scheme: dark)', () => {
        this._syncSchemeAttribute();
        this._controller?.ring.resize();
      })
    );
    this._teardowns.push(onMedia('(forced-colors: active)', () => this._controller?.ring.resize()));
    this._teardowns.push(
      onMedia('(prefers-reduced-motion: reduce)', () => this._controller?.ring.resize())
    );
  }

  /** Apply the current OS colour scheme as an attribute. Safe to call any time. */
  _syncSchemeAttribute() {
    this.setAttribute(
      'data-system-scheme',
      media('(prefers-color-scheme: dark)') ? 'dark' : 'light'
    );
  }

  /* --------------------------------------------------------------- content */

  /**
   * Build the controller from whatever content is available.
   *
   * Resolution order, so a host can be as explicit or as lazy as it likes:
   *   1. a document set through the `content` property
   *   2. a `<script type="application/json">` child of the element, which lets
   *      a server-rendered page carry its content inline with no extra request
   *   3. the `game` attribute, looked up in the registry (RecomGame.define)
   *   4. the `content-src` URL, which is fetched only when a host asks
   */
  _getContent() {
    if (this._document) return { kind: 'document', value: this._document };

    const inline = this.querySelector(':scope > script[type="application/json"]');
    if (inline && inline.textContent) {
      try {
        const parsed = JSON.parse(inline.textContent);
        this._document = parsed;
        this._gameId = typeof parsed?.gameId === 'string' ? parsed.gameId : '';
        return { kind: 'document', value: parsed };
      } catch (error) {
        return { kind: 'broken-inline', error };
      }
    }

    const id = this.getAttribute('game');
    if (!id) return { kind: 'none' };
    const registered = registry.get(id);
    if (registered) return { kind: 'document', value: registered };
    return { kind: 'missing', id };
  }

  _bootstrap() {
    const source = this._getContent();

    if (source.kind === 'none') return;
    if (source.kind === 'broken-inline') {
      this._fail(
        'CONTENT_INVALID_JSON',
        `The <script type="application/json"> inside this element is not valid JSON: ${
          source.error instanceof Error ? source.error.message : String(source.error)
        }`
      );
      return;
    }
    if (source.kind === 'missing') {
      // A registered game may not be registered YET.
      //
      // The element upgrades during parsing, so `<recom-game game="x">` runs its
      // connectedCallback before the host's own module — the one that calls
      // RecomGame.define() — has necessarily finished loading. That is ordinary
      // and extremely likely, and an error box on a page that is about to be
      // perfectly fine is the worst possible response to it.
      //
      // The fix is event-driven rather than polled: this element joins a waiting
      // set, and `defineGame` wakes everything in that set the moment the game
      // it was waiting for appears. `queueMicrotask` alone was not enough,
      // because whether the host's registration has run by then depends on how
      // its module graph resolved.
      //
      // The wait is also BOUNDED, so a genuinely mistyped id is reported rather
      // than leaving an empty box a person keeps waiting on.
      waiting.add(this);
      if (this._wakeTimer) clearTimeout(this._wakeTimer);
      this._wakeTimer = /** @type {any} */ (
        setTimeout(() => {
          this._wakeTimer = null;
          if (this._controller !== null || !this.isConnected) return;
          const id = this.getAttribute('game') ?? '';
          if (registry.has(id)) return;
          waiting.delete(this);
          this._fail(
            'CONTENT_NOT_REGISTERED',
            `No game is registered as "${id}". Register it with RecomGame.define(game), declare it in a <script type="application/json"> child, or give the element a content-src.`
          );
        }, REGISTRATION_GRACE_MS)
      );
      return;
    }

    waiting.delete(this);
    if (this._wakeTimer) {
      clearTimeout(this._wakeTimer);
      this._wakeTimer = null;
    }

    const result = createController({
      game: source.value,
      seed: this.getAttribute('seed') ?? undefined,
      maxQuestions: this.hasAttribute('max-questions') ? Number(this.getAttribute('max-questions')) : undefined,
      shuffleQuestions: this.hasAttribute('shuffle'),
      audit: this.getAttribute('audit') !== 'false',
      labels: this._labels,
      // One language: the controller takes it from the product, not from an attribute.
      lang: DEFAULT_LANG,
      // The live region must exist in the tree, so it belongs to the element
      // and is handed down rather than created inside the controller.
      onAnnounce: (message) => this._say(message),
      onEvent: (name, detail) => emit(this, name, detail)
    });

    if (!result.ok) {
      this._fail(result.code, result.message, result.text);
      return;
    }

    this._controller?.destroy();
    this._controller = result.controller
      .attach(this._viewport)
      .attachSteps(this._steps)
      .onDismiss((reason) => this.close(reason));

    this._attachRing();
    this._keyHandler = result.controller.keyboardHandler();
    this._shell.addEventListener('keydown', this._keyHandler);

    // Title and counter copy.
    this._title.textContent = result.controller.game.title;
    this._title.setAttribute('part', 'title');
    this._subtitle.textContent = result.controller.game.intro;
    // The shell's own `lang` is what a screen reader uses to pick a voice, so it
    // follows the resolved language rather than the raw attribute.
    this._shell.setAttribute('lang', DEFAULT_LANG);
    this._refreshModeButton();

    this._updateCounter();
    // The counter needs to follow every answer, so it is refreshed from the
    // same event the host receives rather than by reaching into the controller.
    this.addEventListener(EVENTS.answer, () => this._updateCounter());
    this.addEventListener(EVENTS.back, () => this._updateCounter());

    // Mount the first view. Without this the shell renders its chrome and its
    // counter but nothing else, which looks exactly like "no content".
    this._controller.render();

    // Announce the opening, so a screen-reader user knows the game appeared and
    // what it is. The announcement goes through the element's own region.
    this._say(`${result.controller.game.title}. ${result.controller.game.intro}`);
    emit(this, EVENTS.ready, {
      gameId: result.controller.game.gameId,
      title: result.controller.game.title,
      questions: result.controller.game.questions.length,
      contentHash: result.controller.game.contentHash
    });
  }

  _updateCounter() {
    const state = this._controller?.state;
    if (!state) return;
    const total = state.order.length;
    const lang = DEFAULT_LANG;
    if (state.status !== 'asking') {
      this._counter.textContent = t(lang, 'shell.result');
      this._steps.hidden = true;
      return;
    }
    this._counter.textContent = t(lang, 'shell.counter', {
      n: Math.min(state.index + 1, total),
      total
    });
  }

  /** @param {string} code @param {string} message @param {string} [text] */
  _fail(code, message, text = '') {
    const lang = DEFAULT_LANG;
    const box = el('div', { class: 'error' });
    append(box, [
      el('strong', { text: t(lang, 'shell.startError') }),
      el('p', { text: message }),
      text ? el('pre', { class: 'raw-trace', text }) : null
    ]);
    empty(this._viewport);
    append(this._viewport, [box]);
    this._title.textContent = t(lang, 'shell.unavailable');
    this._subtitle.textContent = '';
    this._counter.textContent = '';
    this._closeButton.hidden = false;
    emit(this, EVENTS.error, { code, message });
    // A host with its own error reporting can listen for recom:error; the
    // widget does not log to the console on a host's behalf.
  }
}

/**
 * How long an element waits for a game to be registered before giving up.
 *
 * The wait exists because `<recom-game game="x">` is upgraded during parsing,
 * before the host's own module (which calls `RecomGame.define`) has necessarily
 * loaded. But a wait must be BOUNDED: a mistyped game id should not leave an
 * empty box on the page forever with nothing to say. Three seconds is long
 * enough for any realistic module graph and short enough that a wrong id is
 * reported while the person is still looking at it.
 */
const REGISTRATION_GRACE_MS = 3000;

/**
 * The registry of game documents a host has supplied, keyed by gameId.
 *
 * Module-level state is unavoidable for a declarative tag (`<recom-game
 * game="brindes">` cannot carry a document), but it is confined to this one Map
 * and to the waiting set below; every other piece of state lives on the element
 * instance, so two widgets on one page cannot interfere.
 *
 * @type {Map<string, Record<string, unknown>>}
 */
const registry = new Map();

/**
 * Elements whose `game` attribute named a document that is not registered yet.
 *
 * This is what makes `<recom-game game="x">` work whichever order the host's
 * scripts happen to resolve in. The set is module-level like the registry, and
 * every entry is removed the moment the element has content or disconnects.
 *
 * @type {Set<RecomGameElement>}
 */
const waiting = new Set();

/**
 * Register a game document so it can be selected by id.
 *
 * Registering the same id twice REPLACES the previous document rather than
 * throwing, so a hot reload or a re-render of a host component is harmless.
 *
 * Any element that was waiting for this id is woken immediately — that is the
 * only correct moment, because it is the moment the content exists.
 *
 * @param {Record<string, unknown>|Record<string, unknown>[]} game
 * @returns {string[]} the ids registered
 */
export function defineGame(game) {
  const documents = Array.isArray(game) ? game : [game];
  /** @type {string[]} */
  const ids = [];
  for (const document_ of documents) {
    const id = document_?.gameId;
    if (typeof id !== 'string' || id === '') continue;
    registry.set(id, document_);
    ids.push(id);
  }

  // Wake every waiting element whose game has just arrived. Iterating a copy is
  // deliberate: an element removes itself from the set as it bootstraps.
  for (const element of [...waiting]) {
    if (!element.isConnected) {
      waiting.delete(element);
      continue;
    }
    const wanted = element.getAttribute('game');
    if (wanted && registry.has(wanted)) element._bootstrap();
  }

  return ids;
}

/**
 * Read back a registered game.
 *
 * @param {string} id
 */
export function getGame(id) {
  return registry.get(id) ?? null;
}

/**
 * Every registered game id.
 * @returns {string[]}
 */
export function listGames() {
  return [...registry.keys()];
}

/**
 * Define the element, once, tolerating a double definition.
 *
 * `customElements.define` throws on a duplicate name, and a page that includes
 * the widget twice (two versions, a CMS plus a hand-written tag) must not break
 * because of it. The first definition wins, which is the safe outcome: the
 * later script cannot silently replace an element the page is already using.
 *
 * @param {string} [tag]
 * @returns {string} the tag name in use
 */
export function registerElement(tag = TAG) {
  if (typeof customElements === 'undefined') return tag;
  if (customElements.get(tag)) return tag;
  customElements.define(tag, RecomGameElement);
  return tag;
}
