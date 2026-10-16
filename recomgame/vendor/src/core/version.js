/**
 * Engine and schema versions.
 *
 * These live in their own module so that a trace, a bundle and a document can
 * all agree on them without importing anything heavy, and so bumping a version
 * is a one-line change with one obvious file to look at.
 *
 * ENGINE_VERSION — bump on any change to scoring, tie-breaking, or the shape
 *                  of the audit trace. A trace produced by a different engine
 *                  version is still readable, but must be re-verified rather
 *                  than assumed equivalent.
 * SCHEMA_VERSION — bump when the game content document changes shape in a way
 *                  older content cannot satisfy.
 * TRACE_VERSION  — bump when the audit trace changes shape.
 *
 * FROZEN. See src/core/freeze.js.
 */

/**
 * The engine and the package version. They move together, and a test asserts it.
 *
 * TWO VERSION AXES, and this is the one that is not obvious. This constant and
 * `package.json`'s `version` name the ENGINE. The `version` inside a game
 * document names the CONTENT, and they move independently:
 *
 *   - Bumping this one does NOT change any `contentHash`, so a stored trace keeps
 *     verifying against the same document. It is the honest way to say "the
 *     scorer was corrected".
 *   - Bumping a document's `version` DOES change its `contentHash`, because the
 *     hash covers it. That invalidates every trace taken against the old
 *     document, and it is therefore a content decision, not a release one.
 *
 * 0.1.1 corrected two defects in the scorer (docs/OPERACOES.md, D1 and D2). The
 * delivered game kept its content version, so no trace was invalidated.
 *
 * 0.1.3 changed no behaviour at all: it is the seventh use of the freeze guard
 * (docs/OPERACOES.md), and the eight frozen files it re-froze were corrected
 * claims rather than corrected maths. The content version and every contentHash
 * stayed where they were, which is what makes that checkable rather than a
 * promise.
 */
export const ENGINE_VERSION = '0.1.3';
export const SCHEMA_VERSION = '1.0';
/**
 * Bumped to 1.1 when the trace gained its `lang` field and its reasons, notes
 * and margin note stopped being hard-coded English. A stored 1.0 trace is
 * refused by the verifier rather than half-read: its prose is in a language it
 * cannot name, and its shape is not this one.
 */
export const TRACE_VERSION = '1.1';

/**
 * Maximum questions the engine will ask in one game. Ten is the product
 * requirement: ten questions, ten items, one answer.
 */
export const MAX_QUESTIONS = 10;

/** Minimum items a game must offer (a single-item game is not a game). */
export const MIN_ITEMS = 2;

/** Minimum questions a game must define. */
export const MIN_QUESTIONS = 1;

/**
 * Maximum items one game may declare. The counterpart to `MAX_QUESTIONS`, and
 * it exists for a different reason: the question cap is a product decision,
 * while this one is a brake.
 *
 * Every item is scored against every answered question and then written into
 * the audit trace, so a trace grows with `items x questions`: measured, 32 items
 * give a 15 KB trace, 1 000 give 240 KB, 5 000 give 2.0 MB, and 100 000 give
 * 32.9 MB and take 3.7 s of main-thread work. Before this cap existed a document
 * of 100 000 items validated cleanly, and a `content-src` pointing at content
 * someone else controls was therefore a one-request way to freeze a player's
 * browser. See docs/OPERACOES.md, D6.
 *
 * The ceiling is deliberately far above any catalogue this product describes
 * (the compiled catalogue is 1 000) so that choosing it is never the interesting
 * decision, and low enough that the worst accepted document stays bounded.
 */
export const MAX_ITEMS = 5000;

/** The documented tie-break ladder, in order of application. */
export const TIE_BREAK_LADDER = /** @type {const} */ ([
  'normalized-score',
  'raw-score',
  'last-question-score',
  'content-order',
  'lexicographic-id'
]);

/** @typedef {typeof TIE_BREAK_LADDER[number]} TieBreakRung */
