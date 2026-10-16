/**
 * The widget's stylesheet, as a string.
 *
 * It is a string rather than a `.css` file because the shadow root needs a
 * single constructable `CSSStyleSheet` (or one `<style>`), and because a `.css`
 * file would need a fetch, a URL, and therefore a module to import CSS. One
 * self-contained module keeps the widget to a single script tag.
 *
 * House rules visible in this file:
 *   - every colour comes from a `--rg-*` token, so re-theming is one property
 *   - no style depends on the HOST's stylesheet; a host cannot break the layout
 *     by writing `button { ... }`, and the widget cannot break the host's
 *   - `::part()` exposes the handful of elements a host may legitimately want
 *     to restyle
 *   - touch targets are at least `--rg-hit-target` tall, including the button
 *     that only has an icon
 *   - focus is always visible: `:focus-visible` gets a ring, never an outline
 *     of `none`
 *   - motion is disabled wholesale under `prefers-reduced-motion`
 *   - the shell works with no JavaScript-driven layout: portrait and landscape
 *     are expressed in CSS, and `data-mode` only selects between them
 */

import { themeCss } from './theme.css.js';
import { metrics } from './tokens.js';

/**
 * Refuse to hand back CSS that the template literal mangled.
 *
 * A backtick inside a CSS COMMENT terminates the surrounding template literal,
 * and the result is a module that fails to parse — which in a browser looks
 * exactly like a script that never loaded. It happened three times while this
 * file was written, so the guard is cheaper than the lesson.
 *
 * @param {string} css
 * @returns {string}
 */
function assertSaneCss(css) {
  // After interpolation the string is complete; a stray backtick would have
  // broken tokenisation before this point, so the useful check is the shape of
  // the output rather than the delimiter.
  if (!css.includes('--rg-') || !css.includes('.shell') || !css.includes('@media')) {
    throw new Error(
      'shellCss() produced something that is not the widget stylesheet: a template literal was probably terminated early by a backtick in a comment.'
    );
  }
  if (/undefined/.test(css)) {
    throw new Error('shellCss() interpolated an undefined value into the stylesheet.');
  }
  return css;
}

/**
 * @returns {string}
 */
export function shellCss() {
  return assertSaneCss(buildCss());
}

/**
 * @returns {string}
 */
function buildCss() {
  return `${themeCss()}

*, *::before, *::after { box-sizing: border-box; }

:host {
  display: inline-block;
  font-family: var(--rg-family);
  font-size: 1rem;
  line-height: var(--rg-line-normal);
  color: var(--rg-text);
  /*
   * Layout containment is set explicitly. A flex or grid item that becomes a
   * size container can be measured with zero inline size, which turns text into
   * a column of single characters — a failure that no DOM assertion catches,
   * and that only a screenshot reveals. Declaring the value here means an
   * inherited container-type cannot change it.
   */
  container-type: normal;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/*
 * visibility, not display: none. A modal element lives in a <dialog> that is
 * not open yet; hiding the host with display:none would make that dialog
 * un-showable. visibility:hidden keeps the whole subtree out of the
 * accessibility tree and out of sight while leaving the element in the layout
 * tree, which is exactly the state a not-yet-opened modal needs to be in.
 */
:host([hidden]) { visibility: hidden; }

/* ------------------------------------------------------------------ shells */

/*
 * The box itself. Its SIZE is not decided here: the base size comes from the
 * shell-width and shell-height tokens in the placement rules below, and which
 * of those wins is settled in the "how wide" block, so that one property is not
 * being written by three rules that resolve by source order.
 */
.shell {
  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--rg-shell-width);
  height: var(--rg-shell-height);
  max-height: 100%;
  overflow: hidden;
  background: var(--rg-surface);
  border: 1px solid var(--rg-border);
  border-radius: var(--rg-radius-shell);
  box-shadow:
    0 1px 2px rgb(0 0 0 / 6%),
    0 12px 32px rgb(0 0 0 / 10%);
}

/* Inline placement: sits in the page flow at its own size, left-aligned. */
.shell[data-placement="inline"] {
  margin: 0;
}

/* The modal form: the element itself is the top-layer container. */
:host([data-placement="modal"]) {
  display: contents;
}

dialog {
  /* A dialog in the top layer ignores ancestor overflow and stacking, which
     is exactly what "appears over any host page" requires. */
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  max-width: none;
  max-height: none;
  overflow: visible;
}

dialog::backdrop {
  background: rgb(9 11 15 / 55%);
  backdrop-filter: blur(2px);
}

/* A backdrop-filter is a nicety; the dim alone is enough where unsupported. */
@supports not (backdrop-filter: blur(2px)) {
  dialog::backdrop { background: rgb(9 11 15 / 68%); }
}

.shell[data-placement="modal"] {
  width: min(92vw, var(--rg-shell-width));
  height: min(88vh, var(--rg-shell-height));
  max-height: 88vh;
}

/*
 * Landscape: the same shell, wider than it is tall.
 *
 * Only the size RULES live here. Which width actually wins for an inline shell
 * is decided in one place, at the end of this section, because three rules
 * competing over one property and resolving by source order is exactly how the
 * 430px-wide overflow was introduced.
 *
 * The width is the full column rather than 96vw: below 700px this arrangement
 * is one column anyway (see the options block), and a 96vw shell inside a
 * slightly narrower column leaves a strip of background beside it for no reason.
 */
.shell[data-mode="landscape"] {
  height: min(88vh, var(--rg-landscape-height));
}

/*
 * HOW WIDE A SHELL ACTUALLY ENDS UP — decided here, once, and last.
 *
 * A custom element is an inline-block containing the shell, and an inline-block
 * whose child is wider than the available space does not shrink: the shell kept
 * its 400px portrait width inside a 398px column and scrolled the HOST PAGE
 * sideways (measured: a 464px shell at a 430px viewport). A percentage WIDTH
 * does shrink, so each placement states its ceiling as a width rather than as a
 * max-width on the host — a max-width there would be un-overridable by a host
 * page, which is not a trade this widget gets to make.
 */
.shell[data-placement="inline"] {
  width: min(100%, var(--rg-shell-width));
}

.shell[data-mode="landscape"][data-placement="inline"] {
  width: min(100%, var(--rg-landscape-width));
}

/* A narrow viewport fills the screen: a floating card on a phone wastes the
   only space there is, and risks the question scrolling out of sight. The
   inline form fills whatever its host gave it rather than overflowing it. */
@media (max-width: ${metrics.compactBreakpoint}) {
  .shell[data-placement="inline"],
  .shell[data-mode="landscape"][data-placement="inline"] {
    width: 100%;
  }

  .shell[data-placement="modal"],
  .shell[data-mode="landscape"][data-placement="modal"] {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    border: 0;
  }
}

/* ---------------------------------------------------------------- structure */

/*
 * The chrome row: title, progress, layout, close.
 *
 * It WRAPS, and that is the whole of the narrow-viewport story: the title is
 * given the row to itself and the progress moves to a line underneath, rather
 * than four controls and a heading sharing 350px. The failure this prevents is
 * not theoretical — with the row unable to wrap, the heading was squeezed to
 * its 7.5rem floor and the intro line beside the ring set one word per line,
 * which reads as a broken page rather than a narrow one.
 */
.chrome {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  flex: 0 0 auto;
  padding: 14px var(--rg-shell-padding) 10px;
}

/*
 * The heading must never be squeezed to nothing.
 *
 * The progress group sizes to its content — a 40px ring, the counter, and one
 * pip per question — and with ten questions that is over 300px. Without a floor
 * here, flexbox satisfied the inflexible items first and gave the heading the
 * remainder, which was ZERO: every character of the title wrapped onto its own
 * line. Text cannot defend itself against a zero width, which is why the
 * wrapping chrome above AND this floor both exist.
 */
.heading {
  flex: 1 1 auto;
  min-width: 9rem;
  writing-mode: horizontal-tb;
  word-break: normal;
  overflow-wrap: break-word;
}

/*
 * The heading takes the line rather than sharing it with the buttons.
 *
 * At 390px the row is about 350px wide: a 9rem floor for the title, a 44px
 * close button and the layout switch. Three items cannot share that without the
 * title winning a ribbon-shaped column, so the buttons are put on their own line
 * below the title — the order property moves them without changing the DOM, so
 * the close button keeps its place in the tab order.
 */
@media (max-width: 560px) {
  .heading {
    flex: 1 1 100%;
    order: 1;
  }

  .btn-close,
  .btn-mode { order: 3; }
}

.title {
  margin: 0;
  font-size: var(--rg-title);
  font-weight: var(--rg-weight-bold);
  line-height: var(--rg-line-tight);
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.subtitle {
  margin: 2px 0 0;
  font-size: var(--rg-small);
  color: var(--rg-text-muted);
}

.body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0 var(--rg-shell-padding) var(--rg-shell-padding);
}

/* Landscape puts the progress beside the question rather than above it, so a
   short viewport does not have to fit chrome + question + four options. */
.scroller {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  /*
   * Reserve the scrollbar's lane whenever the answers can overflow, so a long
   * question shows a scrollbar rather than hiding one until the pointer is over
   * it. On the eleven-option question a reader who cannot see that there is more
   * below has no reason to try to scroll, and "the card cut the answers" is
   * exactly what that looks like. Where the property is unsupported it is
   * ignored, and overflow-y: auto still scrolls.
   *
   * No backticks in this comment: the stylesheet is a template literal, and one
   * here ends it early. That happened twice while this was written.
   */
  scrollbar-gutter: stable;
}

/* The header slot the progress block occupies in portrait. It claims a line of
   its own before it will squeeze the title, which is the order of importance:
   the title is what the player is reading. */
.progress-rail {
  display: flex;
  align-items: center;
  flex: 1 1 100%;
  order: 2;
  min-width: 0;
}

/* The side column exists only in landscape. */
.aside { display: none; }

/*
 * The two-column arrangement, and the row height is load-bearing.
 *
 * The row height looks redundant next to align-items: stretch and it is not: the
 * row of a grid is sized auto by default, which means it grows to fit its
 * content. With a tall question — the catalogue's eleven-option first question is
 * the worst case — the row became 1430px inside a 420px shell, the scroller was
 * stretched to the ROW rather than to the space left in the shell, and the
 * shell's own overflow: hidden then cut the answers off with no scrollbar and no
 * way to reach them. Measured, not reasoned: 1430px of scroller in a 420px box,
 * and it reported canScroll: false.
 *
 * A flex container does not do this, because flex: 1 1 auto with min-height: 0 on
 * the scroller already caps it at the space available. The grid needs the same
 * ceiling stated, so this line is what makes switching mode leave the answers
 * reachable. minmax(0, ...) rather than a bare 1fr because 1fr alone still
 * refuses to shrink below the content's minimum.
 *
 * Backticks are avoided in this comment deliberately: this file is a template
 * literal, and one inside it ends the stylesheet early. tools/preflight.mjs names
 * that mistake when it happens, which is how this note came to be written.
 */
.shell[data-mode="landscape"] .body {
  display: grid;
  grid-template-columns: minmax(0, 30%) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 0 18px;
  align-items: stretch;
}

/*
 * In landscape the progress block moves into the side column and the header's
 * slot collapses, so the chrome row gives its width to the title instead of
 * reserving a gap for a block that is no longer there.
 */
.shell[data-mode="landscape"] .progress-rail { display: none; }

.shell[data-mode="landscape"] .aside {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 2px;
}

/* The pips stack into a narrow grid beside the counter. */
.shell[data-mode="landscape"] .steps {
  max-width: 96px;
}

/* ---------------------------------------------------------------- progress */

/*
 * The progress group may SHRINK, but it must not clip the counter. The sequence
 * "ring, counter, pips" is deliberate: flex shrinks items in order, so the ring
 * never gives up size, the counter is the last thing to give way, and the pips —
 * which are decoration, and are hidden entirely on a narrow shell — absorb the
 * squeeze. An earlier version clipped the counter to "Quest", which is how this
 * ordering was arrived at.
 */
.progress {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 1 auto;
  min-width: 0;
}

.ring {
  flex: 0 0 auto;
  width: var(--rg-progress-ring-size);
  height: var(--rg-progress-ring-size);
  display: block;
}

.counter {
  /*
   * The counter is deliberately the smallest readable step of the type scale
   * and never wraps: it is chrome beside the ring, not a heading. The pips are
   * what gives up width when the row is tight — the counter states the same
   * fact in words and was being clipped to "Quest…" to keep ten of them.
   */
  flex: 0 1 auto;
  min-width: 0;
  font-family: var(--rg-family-numeric);
  font-size: var(--rg-counter);
  font-variant-numeric: tabular-nums;
  color: var(--rg-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin: 0;
  padding: 0;
  list-style: none;
  /* Squeezed first, and hidden altogether on a narrow shell. */
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
}

.steps li {
  width: 16px;
  height: 4px;
  border-radius: var(--rg-radius-chip);
  background: var(--rg-surface-sunken);
}

.steps li[data-state="done"] { background: var(--rg-accent); }
.steps li[data-state="current"] { background: var(--rg-border-strong); }

.steps[hidden] { display: none; }

/*
 * On a narrow shell the step pips are the first thing to go. They are pure
 * decoration: the counter beside them states the same fact in words, and a
 * layout that clips the counter to "Que…" to keep ten 16px pips is strictly
 * worse. 640px is measured rather than guessed — a 400px shell shown in a 92vw
 * dialog is about 420px, and below roughly 640px of viewport the pips no longer
 * fit alongside a heading, a ring and a full "Question 1 of 10".
 */
@media (max-width: 640px) {
  .steps { display: none; }
  /* With the pips gone the counter has room; give the heading a floor that
     keeps a three-word title on at most two lines. */
  .heading { min-width: 7.5rem; }
}

/* --------------------------------------------------------------- questions */

.question {
  margin: 12px 0 0;
  font-size: var(--rg-question);
  font-weight: var(--rg-weight-medium);
  line-height: var(--rg-line-tight);
  overflow-wrap: anywhere;
}

.help {
  margin: 6px 0 0;
  font-size: var(--rg-small);
  color: var(--rg-text-muted);
}

.intro {
  margin: 12px 0 0;
  font-size: var(--rg-body);
  color: var(--rg-text-muted);
  max-width: 46ch;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 14px 0 0;
  padding: 0;
  border: 0;
}

/* Two columns only where there is width AND height for it. */
.shell[data-mode="landscape"] .options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

/*
 * Two columns need room for two columns.
 *
 * This block MUST come after every landscape rule it overrides: a media query
 * adds no specificity, so source order decides. Placed earlier in the file it
 * silently lost to the rules below, and the result was a 10px-wide answer column
 * on a 390px phone — the measured-because-it-happened threshold is 700px of
 * viewport, and the answers return to a single column while the shell keeps its
 * short, wide landscape shape.
 */
@media (max-width: 700px) {
  .shell[data-mode="landscape"] .body {
    display: flex;
    flex-direction: column;
  }

  .shell[data-mode="landscape"] .options {
    display: flex;
    flex-direction: column;
  }
}

.option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: var(--rg-hit-target);
  padding: 10px 12px;
  text-align: left;
  font: inherit;
  font-size: var(--rg-option);
  color: var(--rg-text);
  background: var(--rg-surface-raised);
  border: 1px solid var(--rg-border);
  border-radius: var(--rg-radius-card);
  cursor: pointer;
  transition:
    background-color var(--rg-fast) var(--rg-easing),
    border-color var(--rg-fast) var(--rg-easing);
  -webkit-tap-highlight-color: transparent;
}

/*
 * The radio itself is present and focusable but visually replaced by the label.
 *
 * The selector is .option-row > input, NOT .option input. The input is a
 * SIBLING of the label (the label points at it with its for attribute), so
 * scoping the rule to .option matched nothing and the native radio painted
 * itself beside every card. A selector that quietly matches no elements is the
 * whole failure mode here, so it is written against the actual structure.
 *
 * appearance:none is what removes the control's box; opacity alone would still
 * leave the native circle in the layout.
 */
.option-row > input[type="radio"],
.option-row > input[type="checkbox"] {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  appearance: none;
  -webkit-appearance: none;
  opacity: 0;
  pointer-events: none;
}

.option:hover { border-color: var(--rg-border-strong); }

.option:has(input:checked) {
  background: var(--rg-accent-soft);
  border-color: var(--rg-accent);
}

.option:has(input[data-skipped]) { color: var(--rg-text-muted); }

/* The focus ring belongs on the label, because the input is invisible. */
.option:has(input:focus-visible) {
  outline: 2px solid var(--rg-focus);
  outline-offset: 2px;
}

.option-key {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-family: var(--rg-family-numeric);
  font-size: var(--rg-tiny);
  color: var(--rg-text-muted);
  background: var(--rg-surface-sunken);
  border-radius: 6px;
}

.option:has(input:checked) .option-key {
  color: var(--rg-on-accent);
  background: var(--rg-accent);
}

.option-text { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }

.option-detail {
  display: block;
  margin-top: 2px;
  font-size: var(--rg-small);
  color: var(--rg-text-muted);
}

/* ----------------------------------------------------------------- actions */

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  margin-top: auto;
  padding-top: 14px;
}

.spacer { flex: 1 1 auto; }

button {
  font: inherit;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: var(--rg-hit-target);
  min-width: var(--rg-hit-target);
  padding: 0 14px;
  font-size: var(--rg-body);
  font-weight: var(--rg-weight-medium);
  color: var(--rg-text);
  background: var(--rg-surface-raised);
  border: 1px solid var(--rg-border);
  border-radius: var(--rg-radius-card);
  cursor: pointer;
  transition: background-color var(--rg-fast) var(--rg-easing), border-color var(--rg-fast) var(--rg-easing);
}

.btn:hover { border-color: var(--rg-border-strong); }

.btn-primary {
  color: var(--rg-on-accent);
  background: var(--rg-accent);
  border-color: var(--rg-accent);
}

.btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--rg-text-muted);
}

.btn-ghost:hover { background: var(--rg-surface-sunken); color: var(--rg-text); }

.btn[disabled] { opacity: 0.45; cursor: default; }

.btn-close { padding: 0 10px; }

/*
 * The layout switch in the chrome.
 *
 * It is a text button rather than an icon because a word is unambiguous in a
 * screenshot and an icon is not, and it carries an aria-label naming the current
 * state rather than relying on the visible word, which reads as a claim about the
 * present.
 */
.btn-mode {
  padding: 0 8px;
  font-size: var(--rg-small);
  letter-spacing: 0.01em;
  white-space: nowrap;
}

/* ------------------------------------------------------------------ result */

.result-hero {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  font-size: var(--rg-tiny);
  font-weight: var(--rg-weight-medium);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--rg-text-muted);
  background: var(--rg-surface-sunken);
  border-radius: var(--rg-radius-chip);
}

.badge[data-tone="match"] { color: var(--rg-success); background: color-mix(in srgb, var(--rg-success) 12%, transparent); }
.badge[data-tone="strong"] { color: var(--rg-on-accent); background: var(--rg-accent); }
.badge[data-tone="caveat"] { color: var(--rg-warning); background: color-mix(in srgb, var(--rg-warning) 14%, transparent); }

/* The category the recommendation answers to, above its name. It is the visible
   result of the first question, so a player can see the narrowing happened. */
.result-category {
  margin: 0;
  font-size: var(--rg-tiny);
  font-weight: var(--rg-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rg-text-muted);
}

.result-name {
  margin: 0;
  font-size: calc(var(--rg-title) * 1.25);
  font-weight: var(--rg-weight-bold);
  line-height: var(--rg-line-tight);
  overflow-wrap: anywhere;
}

.result-summary {
  margin: 0;
  font-size: var(--rg-body);
  color: var(--rg-text-muted);
  max-width: 52ch;
}

/* The product code, for a compiled catalog: small, monospaced, and secondary. */
.result-reference {
  margin: 0;
  font-family: var(--rg-family-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: calc(var(--rg-body) * 0.85);
  letter-spacing: 0.02em;
  color: var(--rg-text-muted);
}

/* -------------------------------------------------------------- references */

/*
 * The two closest alternatives.
 *
 * They sit between the winner and the explanation on purpose: a reader who is
 * comparing wants the shortlist next to the recommendation, not below an
 * argument for it. Two columns on a wide shell, one on a narrow one, and any
 * number of them stack rather than shrink.
 */
.references {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--rg-border);
}

.references-title {
  margin: 0 0 4px;
  font-size: var(--rg-small);
  font-weight: var(--rg-weight-bold);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--rg-text-muted);
}

.references-lead {
  margin: 0 0 8px;
  font-size: var(--rg-small);
  color: var(--rg-text-muted);
}

.references-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.reference {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  background: var(--rg-surface-raised);
  border: 1px solid var(--rg-border);
  border-radius: var(--rg-radius-card);
}

.reference-name {
  font-size: var(--rg-body);
  font-weight: var(--rg-weight-medium);
  line-height: var(--rg-line-tight);
  overflow-wrap: anywhere;
}

.reference-category,
.reference-why {
  font-size: var(--rg-tiny);
  color: var(--rg-text-muted);
}

.reference-code {
  font-family: var(--rg-family-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: var(--rg-tiny);
  letter-spacing: 0.02em;
  color: var(--rg-text-muted);
}

.result-bullets {
  margin: 10px 0 0;
  padding-left: 1.1em;
  font-size: var(--rg-body);
}

.result-bullets li { margin: 2px 0; }

.why {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--rg-border);
}

.why-title {
  margin: 0 0 6px;
  font-size: var(--rg-small);
  font-weight: var(--rg-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--rg-text-muted);
}

.why-list {
  margin: 0;
  padding-left: 1.1em;
  font-size: var(--rg-body);
  color: var(--rg-text);
}

.why-list li { margin: 4px 0; }

/* ------------------------------------------------------------------- audit */

.audit {
  margin-top: 12px;
  background: var(--rg-surface-sunken);
  border: 1px solid var(--rg-border);
  border-radius: var(--rg-radius-card);
  overflow: hidden;
}

.audit > summary {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--rg-hit-target);
  padding: 0 12px;
  font-size: var(--rg-body);
  font-weight: var(--rg-weight-medium);
  cursor: pointer;
  list-style: none;
}

.audit > summary::-webkit-details-marker { display: none; }

.audit > summary::after {
  content: "";
  width: 7px;
  height: 7px;
  margin-left: auto;
  border-right: 2px solid var(--rg-text-muted);
  border-bottom: 2px solid var(--rg-text-muted);
  transform: rotate(45deg);
  transition: transform var(--rg-fast) var(--rg-easing);
}

.audit[open] > summary::after { transform: rotate(-135deg); }

.audit-body {
  padding: 0 12px 12px;
  font-size: var(--rg-small);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--rg-family-numeric);
  font-size: var(--rg-small);
  font-variant-numeric: tabular-nums;
}

.table caption {
  padding: 0 0 6px;
  text-align: left;
  font-family: var(--rg-family);
  color: var(--rg-text-muted);
}

.table th,
.table td {
  padding: 3px 6px;
  text-align: right;
  border-bottom: 1px solid var(--rg-border);
}

.table th:first-child,
.table td:first-child { text-align: left; }

.table tr[data-winner="true"] td { font-weight: var(--rg-weight-bold); color: var(--rg-accent); }

.steps-log {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.steps-log li {
  padding: 6px 0;
  border-bottom: 1px dashed var(--rg-border);
}

.steps-log code {
  font-family: var(--rg-family-numeric);
  font-size: var(--rg-tiny);
  color: var(--rg-text-muted);
}

.steps-log pre {
  margin: 4px 0 0;
  font-family: var(--rg-family-numeric);
  font-size: var(--rg-tiny);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--rg-text);
}

.verify {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

/* The static line above the verify row, and the row itself. The verdict has its own
   class AND a data-state, so it is distinguishable from the decision line — two
   elements sharing one class name is a trap for both CSS and tests. */
.decision-note {
  font-size: var(--rg-small);
  color: var(--rg-text-muted);
}

.verify-verdict[data-state="ok"] { color: var(--rg-success); }
.verify-verdict[data-state="bad"] { color: var(--rg-warning); }

/* ------------------------------------------------------------------ error */

.error {
  margin: 12px 0 0;
  padding: 10px 12px;
  font-size: var(--rg-small);
  background: color-mix(in srgb, var(--rg-warning) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--rg-warning) 40%, var(--rg-border));
  border-radius: var(--rg-radius-card);
}

.error code {
  font-family: var(--rg-family-numeric);
  font-size: var(--rg-tiny);
}

/* -------------------------------------------------------------------- a11y */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

:host(:focus-visible),
.btn:focus-visible,
.option:focus-visible,
.audit > summary:focus-visible {
  outline: 2px solid var(--rg-focus);
  outline-offset: 2px;
}

/* A host that sets tabindex="-1" on the shell for focus management must not
   lose the visible ring when it is focused programmatically by a keyboard
   user, so the ring is on :focus-visible for the host element too. */
.shell:focus-visible { outline: 2px solid var(--rg-focus); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}

/* A host may force reduced motion through an attribute, which is what the
   QA checklist uses to verify the static path on a machine whose OS setting
   cannot be changed during a test run. */
:host([data-reduced-motion="true"]) *,
:host([data-reduced-motion="true"]) *::before,
:host([data-reduced-motion="true"]) *::after {
  animation-duration: 1ms !important;
  transition-duration: 1ms !important;
}

@media (forced-colors: active) {
  .shell, .option, .btn, .audit { border: 1px solid CanvasText; }
  .option[aria-pressed="true"], .btn-primary { border-width: 2px; }
  .badge { border: 1px solid CanvasText; }
}
`;
}
