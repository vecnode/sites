/**
 * Generate the theme layer of the widget's stylesheet from the tokens.
 *
 * The custom properties are emitted from src/ui/tokens.js so that the
 * stylesheet can never disagree with the values the canvas layer and the tests
 * use. Every property is also exposed to the HOST page through the element's
 * `::part()` hooks, which is the supported way to re-theme the widget: a host
 * sets `--rg-accent: #b0006d` on the element and it takes effect without
 * inventing a build step or fighting specificity.
 *
 * What this file deliberately does NOT do:
 *   - emit both palettes unconditionally (that would fight `color-scheme`)
 *   - use `@import` (a shadow root cannot apply an outer stylesheet)
 *   - rely on `light-dark()` (unsupported in older embedded webviews, and the
 *     fallback is worth more than the brevity)
 */

import { dark, light, metrics, motion, typography } from './tokens.js';
/**
 * @param {Record<string, string|number>} record
 * @param {string} indent
 * @returns {string}
 */
function customProperties(record, indent = '  ') {
  return Object.entries(record)
    .map(([key, value]) => `${indent}--rg-${kebab(key)}: ${value};`)
    .join('\n');
}

/**
 * Emit a `:host { ... }` block with every custom property.
 *
 * Light values are unconditional; the dark palette is applied by a media query
 * (following the OS) and can be forced in either direction with the
 * `--rg-scheme` property, which is how a host pins the widget to match its own
 * theme even when the OS disagrees.
 *
 * @returns {string}
 */
export function themeCss() {
  return `/* Generated from src/ui/tokens.js — edit the tokens, not this output. */
:host {
  color-scheme: light;
${customProperties(light)}
${customProperties(metrics)}
${customProperties(motion)}
${customProperties(typography)}
}

/*
 * Dark values. The two selectors are disjoint on purpose:
 *   - the first follows the OS, but only while the host has not forced light
 *   - the second is an explicit request and wins over the OS
 * They are written so that no combination needs source order to resolve, which
 * is what stops a host setting data-scheme="light" on a dark-mode machine from
 * silently getting the dark palette.
 */
:host([data-system-scheme="dark"]:not([data-scheme="light"])),
:host([data-scheme="dark"]) {
  color-scheme: dark;
${customProperties(dark)}
}`;
}

/**
 * `camelCase` or `snake_case` -> `kebab-case`, so a token named `surfaceRaised`
 * becomes `--rg-surface-raised` without a hand-written mapping table.
 *
 * @param {string} value
 * @returns {string}
 */
export function kebab(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

/**
 * The custom property name for a token, so JS never spells a `--rg-` name by
 * hand: `varName('accent')` -> `'--rg-accent'`.
 *
 * @param {string} token
 * @returns {string}
 */
export function varName(token) {
  return `--rg-${kebab(token)}`;
}

/**
 * The light palette as CSS custom properties, for the canvas layer. Canvas
 * cannot resolve `var(--rg-...)`, so it needs the plain values keyed by name.
 *
 * @param {'light'|'dark'} scheme
 * @returns {Record<string, string>}
 */
export function resolvedPalette(scheme) {
  const source = scheme === 'dark' ? dark : light;
  /** @type {Record<string, string>} */
  const out = {};
  for (const [key, value] of Object.entries(source)) out[varName(key)] = value;
  return out;
}

export { light, dark, metrics, motion, typography };
