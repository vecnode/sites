/**
 * The single entry point a host site includes.
 *
 *   <script type="module" src="https://your-host/recom-game/src/embed.js"></script>
 *   <recom-game game="brindes"></recom-game>
 *
 * This file does three things and nothing else:
 *   1. defines the `<recom-game>` element
 *   2. installs `window.RecomGame`
 *   3. leaves the page alone
 *
 * It deliberately does NOT auto-inject anything, fetch anything, or touch the
 * DOM at load. A script that rewrites a host page on import is exactly the kind
 * of embed that breaks someone else's site, so this one waits to be asked.
 *
 * Self-hosting note: because this is a plain ES module, EVERY host must be able
 * to reach `src/` — either by copying the folder, by pointing at a CDN, or by
 * serving the built `dist/recom-game.esm.js` single file. See docs/INTEGRAR.md.
 */

import { install, register } from './api.js';
import { defineGame } from './ui/recom-game.js';

const RecomGame = install();
register();

/**
 * A convenience for a host that wants to hand the widget its own content in the
 * same script tag, with no second request:
 *
 *   <recom-game game="inline-plans"></recom-game>
 *   <script type="module">
 *     import { RecomGame } from '.../embed.js';
 *     RecomGame.define({ gameId: 'inline-plans', items: [...], questions: [...] });
 *   </script>
 *
 * `define` is already on the API object; this alias exists so the intent reads
 * clearly at the call site and so a host can register content that arrives from
 * its own server as JSON without going through the widget's loader.
 */
export { RecomGame, defineGame };
export { TAG, RecomGameElement, getGame, listGames, registerElement } from './ui/recom-game.js';
export {
  api,
  install,
  register,
  define,
  open,
  close,
  play,
  version,
  GLOBAL_NAME
} from './api.js';
export default RecomGame;
