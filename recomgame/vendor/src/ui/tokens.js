/**
 * Design tokens — the single source of truth for the widget's appearance.
 *
 * Colours live here as plain hex, not as a stylesheet string, because they are
 * needed in three places that would otherwise drift apart:
 *
 *   1. the Shadow DOM stylesheet (src/ui/shell.css.js)
 *   2. the `<canvas>` layer, which needs real colour values, not CSS variables
 *      (canvas cannot read `var(--rg-*)`)
 *   3. the tests, which check every text/background pair for WCAG contrast
 *
 * Every colour is a solid value rather than a `light-dark()` or `color-mix()`
 * expression so that a host can read it, a test can compute with it, and an old
 * embedded webview cannot fail to parse it. `color-mix()` is used only as an
 * ADDITIONAL convenience layer inside the stylesheet, where a browser that does
 * not support it still has the plain token underneath.
 *
 * Naming: `--rg-` prefix everywhere, so nothing can collide with a host's own
 * custom properties.
 */

/**
 * Colours, in light and dark variants.
 *
 * Contrast is not a matter of taste here: `test/unit/tokens.test.js` computes
 * the WCAG ratio of every `text`/`textMuted` against every surface and refuses
 * a combination below 4.5:1.
 *
 * @typedef {object} Palette
 * @property {string} canvas        Page background behind the shell.
 * @property {string} surface       The shell's own background.
 * @property {string} surfaceRaised A card or option button resting on the surface.
 * @property {string} surfaceSunken A track, or a well behind content.
 * @property {string} text          Primary text.
 * @property {string} textMuted     Secondary text (help, counters).
 * @property {string} accent        The single accent used for the progress and the primary action.
 * @property {string} accentSoft    A tinted wash of the accent (selected state).
 * @property {string} onAccent      Text on top of `accent`.
 * @property {string} border        Hairlines.
 * @property {string} borderStrong  Emphasised hairline and focus edge.
 * @property {string} focus         Focus ring colour.
 * @property {string} success       Positive accent (a verified trace, a strong match).
 * @property {string} warning       Warning accent (the audit panel's caveats).
 */

/** @type {Palette} */
export const light = {
  canvas: '#f4f5f7',
  surface: '#ffffff',
  surfaceRaised: '#fbfcfd',
  surfaceSunken: '#eceef2',
  text: '#14161a',
  textMuted: '#5b636e',
  accent: '#1d5fd0',
  accentSoft: '#e8f0fd',
  onAccent: '#ffffff',
  border: '#dfe3e9',
  borderStrong: '#c3cad4',
  focus: '#1d5fd0',
  success: '#1a7f4b',
  warning: '#9a5b06'
};

/** @type {Palette} */
export const dark = {
  canvas: '#0f1115',
  surface: '#181b21',
  surfaceRaised: '#1f232b',
  surfaceSunken: '#111318',
  text: '#f2f4f7',
  textMuted: '#a2acba',
  accent: '#7aa7ff',
  accentSoft: '#1b2740',
  onAccent: '#0c1220',
  border: '#2b313b',
  borderStrong: '#3d4553',
  focus: '#9dc0ff',
  success: '#5ed39b',
  warning: '#e0a94a'
};

/**
 * The `:root` values the widget uses. Both palettes are exposed so a host can
 * pick one explicitly (`--rg-scheme: dark`) instead of following the OS.
 *
 * @type {Record<string, Palette>}
 */
export const palettes = { light, dark };

/**
 * Geometry and control sizes.
 *
 * Every length carries its unit, and that is not cosmetic. These values are
 * emitted verbatim as CSS custom properties, so `radiusShell: 24` produced
 * `--rg-radius-shell: 24`, which is not a valid length: the declaration was
 * dropped and every corner silently fell back to 0px. A token that is only ever
 * used as CSS must BE CSS.
 *
 * The JavaScript side reads these through `lengthPx()` rather than parsing them
 * by hand, so there is exactly one conversion in the project.
 */
export const metrics = {
  /**
   * Shell corner radius.
   *
   * Five pixels, and the size is a decision rather than a taste: the widget is
   * embedded in somebody else's page, and a 24px radius read as a consumer app
   * dropped into a professional site. Five to six is the radius a card, a modal
   * and a form control share in that setting — enough to look deliberate, small
   * enough to look like a system component rather than a toy.
   */
  radiusShell: '6px',
  /** Card and option-button corner radius: one step inside the shell. */
  radiusCard: '5px',
  /** Small radius: chips, badges, the audit's summary. */
  radiusChip: '5px',
  /** Padding inside the shell. */
  shellPadding: '20px',
  /** Minimum hit target. WCAG 2.2 asks for 24x24 CSS px; a phone needs more. */
  hitTarget: '44px',
  /** Width of the progress ring stroke, used by the canvas layer. */
  progressRing: '6px',
  /** The progress ring's box. */
  progressRingSize: '40px',
  /** Portrait shell: a phone-ish box, deliberately narrower than a laptop. */
  portraitWidth: '400px',
  portraitHeight: '780px',
  /** Landscape shell: wide and short, the shape of a landscape phone. */
  landscapeWidth: '860px',
  landscapeHeight: '420px',
  /** The breakpoint below which the shell fills the viewport instead of floating. */
  compactBreakpoint: '520px'
};

/**
 * Read a length token as a number of CSS pixels.
 *
 * One conversion, in one place: everything in `src/ui` that needs a number for
 * a calculation (a canvas backing store, a timer-free measurement) goes through
 * here rather than slicing a string with a regex of its own.
 *
 * @param {string} value A token such as '24px', or a bare number.
 * @returns {number}
 */
export function lengthPx(value) {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Type scale. Sizes are in `rem` so a host's root font size participates, with
 * a `clamp()` expression for the title so it shrinks on a narrow phone rather
 * than wrapping mid-word.
 */
export const typography = {
  family:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  familyNumeric: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  title: 'clamp(1.05rem, 4.2vw, 1.4rem)',
  question: 'clamp(1rem, 3.8vw, 1.25rem)',
  option: '0.975rem',
  body: '0.9rem',
  small: '0.8rem',
  /**
   * The progress counter ("Question 1 of 10").
   *
   * A step of its own below `small`, and that is the point: it is the one line
   * of shell chrome that sits beside the ring rather than in the reading flow,
   * so it should read as metadata. At `small` it competed with the title for
   * attention, and in landscape it competed with the ten step pips for width.
   * The player's eye should land on the question, not on the counter.
   */
  counter: '0.7rem',
  /** The smallest labels: a badge, a key hint, a code fragment. */
  tiny: '0.66rem',
  weightRegular: 400,
  weightMedium: 500,
  weightBold: 650,
  lineTight: 1.25,
  lineNormal: 1.5,
  lineRelaxed: 1.65
};

/**
 * Motion. Durations are short and every one is disabled when the player asks
 * for reduced motion (`prefers-reduced-motion`), which the stylesheet handles
 * globally rather than per rule.
 */
export const motion = {
  fast: '120ms',
  normal: '200ms',
  slow: '320ms',
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  easingOut: 'cubic-bezier(0.16, 1, 0.3, 1)'
};

