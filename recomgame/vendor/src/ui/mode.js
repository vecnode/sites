/**
 * Layout mode: portrait or landscape.
 *
 * The widget needs one decision — which of two arrangements to render — and
 * that decision must be testable, overridable, and never depend on a browser
 * API that only some webviews have.
 *
 * What it deliberately does NOT use:
 *   - `screen.orientation`: unavailable on desktop browsers, and it reports the
 *     DEVICE orientation rather than the space the widget actually has. A phone
 *     held upright with a landscape game embedded would report portrait and be
 *     wrong.
 *   - `@container` queries: genuinely the right tool for component-level
 *     layout, and it is used in the stylesheet, but the widget also needs to
 *     know the mode in JavaScript (the canvas layer and the two-column
 *     arrangement), so one source of truth in JS drives a `data-mode`
 *     attribute that the CSS reads.
 *
 * The rule is about available SPACE, not device kind: a wide, short viewport is
 * landscape whether it is a phone turned sideways or a desktop window the host
 * gave us.
 */

import { metrics, lengthPx } from './tokens.js';
import { onMedia } from '../util/dom.js';

/** The compact breakpoint as a number, for the media-query watch below. */
const COMPACT_BREAKPOINT = lengthPx(metrics.compactBreakpoint);

/** @typedef {'portrait'|'landscape'|'auto'} Mode */

/**
 * The minimum width at which the landscape arrangement is more useful than
 * portrait. Below this, two columns would each be too narrow to read.
 *
 * The height half matters more than it looks: landscape exists so a SHORT
 * viewport can fit question and answers side by side. Applying it to a tall
 * window would produce a cramped column for no benefit.
 */
const LANDSCAPE_MIN_WIDTH = 700;
const LANDSCAPE_MAX_HEIGHT = 620;

/**
 * Decide the mode from a viewport size.
 *
 * Internal: `resolveMode` is the module's one public entry point, and nothing
 * else imported this. Keeping the breakpoint in one function is the point —
 * three callers reading two constants is what this avoids.
 *
 * @param {number} width
 * @param {number} height
 * @returns {'portrait'|'landscape'}
 */
function modeForSize(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return 'portrait';
  if (width >= LANDSCAPE_MIN_WIDTH && height <= LANDSCAPE_MAX_HEIGHT) return 'landscape';
  return 'portrait';
}

/**
 * Resolve an explicit request into a concrete mode.
 *
 * `forced` wins over everything, including a nonsensical forced value, which
 * falls back to the measured mode rather than rendering nothing.
 *
 * @param {Mode|string|undefined} forced
 * @param {number} width
 * @param {number} height
 * @returns {'portrait'|'landscape'}
 */
export function resolveMode(forced, width, height) {
  if (forced === 'portrait' || forced === 'landscape') return forced;
  return modeForSize(width, height);
}

/**
 * Watch the viewport and report the mode whenever it changes.
 *
 * Uses `ResizeObserver` on the document element where available — it catches
 * changes that do not fire `resize`, such as a host expanding a container — and
 * falls back to the `resize` event. The callback is invoked once immediately,
 * so the caller does not have to duplicate the first calculation.
 *
 * @param {{
 *   forced?: Mode|string|undefined,
 *   onChange: (mode: 'portrait'|'landscape', width: number, height: number) => void,
 *   target?: Element|null
 * }} options
 * @returns {() => void} stop watching
 */
export function watchMode({ forced, onChange, target = null }) {
  let last = '';

  const measure = () => {
    const width = typeof window === 'undefined' ? 0 : window.innerWidth || 0;
    const height = typeof window === 'undefined' ? 0 : window.innerHeight || 0;
    const next = resolveMode(forced, width, height);
    if (next === last) return;
    last = next;
    onChange(next, width, height);
  };

  measure();

  const observerTarget =
    target ?? (typeof document !== 'undefined' ? document.documentElement : null);
  /** @type {(() => void)[]} */
  const teardowns = [];

  try {
    if (observerTarget && typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(measure);
      observer.observe(observerTarget);
      teardowns.push(() => observer.disconnect());
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', measure);
      teardowns.push(() => window.removeEventListener('resize', measure));
    }
  } catch {
    // A webview that exposes ResizeObserver but refuses to observe is not a
    // reason to render nothing: fall back to the resize event.
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', measure);
      teardowns.push(() => window.removeEventListener('resize', measure));
    }
  }

  // Belt and braces: a rotation can change the mode without a resize event on
  // some mobile browsers, and the media query catches it.
  teardowns.push(onMedia(`(max-width: ${COMPACT_BREAKPOINT}px)`, measure));
  teardowns.push(onMedia('(orientation: landscape)', measure));

  return () => {
    for (const teardown of teardowns) teardown();
  };
}
