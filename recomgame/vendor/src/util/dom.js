/**
 * DOM helpers.
 *
 * Small on purpose. The rule this file exists to enforce: the widget builds
 * every node itself and sets text with `textContent`, never `innerHTML`. Game
 * content is data that arrives from a host page, so "insert this string as
 * HTML" is a capability the widget simply does not have — XSS is then
 * structurally impossible rather than carefully avoided.
 */

/**
 * Create an element with attributes, properties and children in one call.
 *
 * Attribute vs property: a `style` string, `dataset`, `className` and `text`
 * are handled as properties (`text` means `textContent`); everything else
 * becomes a real HTML attribute. Event handlers are passed with an `on` prefix,
 * e.g. `{ onclick: fn }`.
 *
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {Record<string, unknown>} [props]
 * @param {Array<Node|string|null|undefined|false>} [children]
 * @returns {HTMLElementTagNameMap[K]}
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'text') {
      node.textContent = String(value);
    } else if (key === 'dataset') {
      for (const [dataKey, dataValue] of Object.entries(/** @type {Record<string, unknown>} */ (value))) {
        if (dataValue === undefined || dataValue === null) continue;
        node.dataset[dataKey] = String(dataValue);
      }
    } else if (key === 'style') {
      if (typeof value === 'string') node.setAttribute('style', value);
      else for (const [prop, propValue] of Object.entries(/** @type {Record<string, unknown>} */ (value))) {
        if (propValue === undefined || propValue === null) continue;
        node.style.setProperty(prop, String(propValue));
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), /** @type {EventListener} */ (value));
    } else if (key === 'class') {
      node.className = String(value);
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }
  append(node, children);
  return node;
}

/**
 * Append children, skipping anything falsy and flattening one level of array.
 *
 * @param {Node} parent
 * @param {Array<Node|string|null|undefined|false>} children
 * @returns {Node}
 */
export function append(parent, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return parent;
}

/**
 * Remove every child of a node, without touching it if it is already empty.
 *
 * @param {Node|null|undefined} node
 */
export function empty(node) {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}

/**
 * Focus the first focusable descendant, or the element itself.
 *
 * Used when a view becomes visible: a modal that opens with focus still on the
 * button behind it is unusable with a keyboard and invisible to a screen
 * reader.
 *
 * @param {ParentNode|null|undefined} root
 * @param {HTMLElement|null} [fallback]
 */
export function focusFirst(root, fallback = null) {
  const target = /** @type {HTMLElement|null} */ (
    root?.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? fallback
  );
  target?.focus();
}

/**
 * True when the environment can be queried about media features.
 *
 * Some embedded webviews throw when asked about a feature they do not know, so
 * every check goes through this guard rather than calling `matchMedia` blind.
 *
 * @param {string} query
 * @returns {boolean}
 */
export function media(query) {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/**
 * Subscribe to a media query, calling back on every change.
 *
 * `addEventListener('change')` is the modern spelling; the deprecated
 * `addListener` is not used, because every browser that supports custom
 * elements also supports the event form.
 *
 * @param {string} query
 * @param {(matches: boolean) => void} callback
 * @returns {() => void} unsubscribe
 */
export function onMedia(query, callback) {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
    const list = window.matchMedia(query);
    const handler = (/** @type {MediaQueryListEvent} */ event) => callback(event.matches);
    list.addEventListener('change', handler);
    return () => list.removeEventListener('change', handler);
  } catch {
    return () => {};
  }
}
