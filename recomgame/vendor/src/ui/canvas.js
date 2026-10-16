/**
 * The canvas layer.
 *
 * The user asked for "a main canvas" that changes shape between a phone-sized
 * portrait box and a landscape one. This module is that canvas, and it is
 * deliberately NOT where the questions and answers live.
 *
 * Why the split: text drawn into a canvas is invisible to a screen reader,
 * cannot be selected or translated, cannot be zoomed by the browser, and breaks
 * at the wrong width in another language. Real DOM gives all of that for free.
 * So the canvas carries what only a canvas can do well and what carries no
 * meaning on its own — the progress arc and the result flourish. If the canvas
 * never draws at all, nothing is lost: the counter beside it says the same
 * thing in words, and the result screen is entirely DOM.
 *
 * Requirements this file takes seriously:
 *   - device pixel ratio, capped so a 4x display does not allocate a huge
 *     backing store for a 40px ring
 *   - a zero-sized element: an inline shell hidden at load time reports 0x0,
 *     and drawing to a 0-sized backing store is pointless at best
 *   - `prefers-reduced-motion`: the ring snaps instead of animating, and the
 *     flourish is not drawn at all
 *   - a theme change: colours come from the resolved token palette, and the
 *     caller re-draws when the scheme changes
 *   - an unavailable or disabled canvas: every entry point returns quietly, and
 *     the DOM beside it still conveys the same information
 */

import { metrics, lengthPx } from './tokens.js';
import { resolvedPalette } from './theme.css.js';
import { media } from '../util/dom.js';

/** Never allocate a backing store larger than this multiple of CSS pixels. */
const MAX_DPR = 3;

/** Ring geometry, resolved from the length tokens once. */
const RING_SIZE = lengthPx(metrics.progressRingSize);
const RING_STROKE = lengthPx(metrics.progressRing);

/**
 * @typedef {object} RingState
 * @property {number} value   0..1 progress.
 * @property {number} size    CSS pixels; the ring is square.
 * @property {boolean} [animate] Animate from the previous value (default false).
 *
 * @typedef {object} CanvasLayer
 * @property {HTMLCanvasElement} element
 * @property {(next: RingState) => void} draw
 * @property {() => void} resize
 * @property {() => void} destroy
 */

/**
 * Read the scheme the widget is actually rendering in: an explicit
 * `data-scheme` on the element (or its shadow host) wins over the OS setting,
 * which mirrors exactly what the stylesheet does.
 *
 * @param {Element} element
 * @returns {'light'|'dark'}
 */
function currentScheme(element) {
  const root = element.getRootNode();
  const host = root instanceof ShadowRoot ? root.host : null;
  const forced =
    element.getAttribute('data-scheme') ?? host?.getAttribute('data-scheme') ?? '';
  if (forced === 'dark') return 'dark';
  if (forced === 'light') return 'light';
  return media('(prefers-color-scheme: dark)') ? 'dark' : 'light';
}

/**
 * Whether motion should be suppressed, from the OS or from an explicit flag.
 *
 * @param {Element} element
 * @returns {boolean}
 */
function prefersReducedMotion(element) {
  if (element.getAttribute('data-reduced-motion') === 'true') return true;
  const root = element.getRootNode();
  if (root instanceof ShadowRoot && root.host.getAttribute('data-reduced-motion') === 'true') {
    return true;
  }
  return media('(prefers-reduced-motion: reduce)');
}

/**
 * @param {Element} element
 * @returns {number}
 */
function pixelRatio() {
  if (typeof window === 'undefined') return 1;
  const dpr = Number(window.devicePixelRatio) || 1;
  return Math.max(1, Math.min(dpr, MAX_DPR));
}

/**
 * Create the progress ring canvas.
 *
 * The element is `aria-hidden`: the text counter next to it already says
 * "Question 3 of 10", so exposing the picture too would read the same fact
 * twice.
 *
 * @returns {CanvasLayer}
 */
export function createProgressRing() {
  const element = document.createElement('canvas');
  element.className = 'ring';
  element.setAttribute('aria-hidden', 'true');
  element.width = 1;
  element.height = 1;

  /** @type {RingState} */
  let state = { value: 0, size: RING_SIZE, animate: false };
  /** The value actually painted, which differs from `state.value` mid-animation. */
  let painted = 0;
  /** @type {number|null} */
  let frame = null;

  const paint = () => {
    const size = state.size;
    if (!Number.isFinite(size) || size <= 0) return;

    const dpr = pixelRatio();
    const pixels = Math.round(size * dpr);
    if (element.width !== pixels || element.height !== pixels) {
      element.width = pixels;
      element.height = pixels;
    }

    const context = element.getContext('2d');
    if (!context) return;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, pixels, pixels);
    context.scale(dpr, dpr);

    const palette = resolvedPalette(currentScheme(element));
    const trackColour = palette['--rg-surface-sunken'];
    const accentColour = palette['--rg-accent'];
    if (!trackColour || !accentColour) return;

    const stroke = RING_STROKE;
    const radius = (size - stroke) / 2;
    const centre = size / 2;
    if (radius <= 0) return;

    context.beginPath();
    context.arc(centre, centre, radius, 0, Math.PI * 2);
    context.strokeStyle = trackColour;
    context.lineWidth = stroke;
    context.stroke();

    const value = Math.max(0, Math.min(1, painted));
    if (value <= 0) return;

    context.beginPath();
    // Start at twelve o'clock so the arc grows clockwise from the top.
    context.arc(centre, centre, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * value);
    context.strokeStyle = accentColour;
    context.lineWidth = stroke;
    context.lineCap = 'round';
    context.stroke();
  };

  const cancelFrame = () => {
    if (frame === null) return;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
    frame = null;
  };

  const animateTo = (/** @type {number} */ target) => {
    cancelFrame();

    // No animation when motion is unwelcome, when there is nothing to move
    // FROM, or when the frame scheduler is unavailable.
    if (
      prefersReducedMotion(element) ||
      painted === target ||
      painted === 0 ||
      typeof requestAnimationFrame !== 'function'
    ) {
      painted = target;
      paint();
      return;
    }

    const from = painted;
    const duration = 220;
    const started = performance.now();

    const step = (/** @type {number} */ now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      painted = from + (target - from) * eased;
      paint();
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        frame = null;
        painted = target;
        paint();
      }
    };

    frame = requestAnimationFrame(step);
  };

  return {
    element,
    /** @param {RingState} next */
    draw(next) {
      state = { ...state, ...next };
      const target = Math.max(0, Math.min(1, state.value));
      if (state.animate === true) {
        animateTo(target);
        return;
      }
      cancelFrame();
      painted = target;
      paint();
    },
    resize() {
      // A resize never animates: the arc is already where it should be, only
      // its pixel size changed.
      cancelFrame();
      paint();
    },
    destroy() {
      cancelFrame();
    }
  };
}
