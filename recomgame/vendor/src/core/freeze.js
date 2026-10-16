/**
 * The frozen set, as data. FROZEN. See src/core/freeze.js.
 *
 * The guard's marker names this file, so this file IS where the marker is
 * defined. That is not cute: it means the sentence a frozen file carries points
 * at the module a reader can open to find out what the sentence obliges.
 *
 * This is the DECLARATION of what may not change without the owner's explicit
 * permission, written as data so that a test reads it instead of a reader
 * having to remember it. `tools/freeze.mjs` enforces it,
 * `test/unit/frozen.test.js` verifies it, and `frozen.manifest.json` is the
 * hash of it.
 *
 * It is deliberately small, and deliberately inside `src/core/`, because that
 * is the frozen directory: adding a rule here is itself a change to the frozen
 * set and goes through the same procedure as changing the scoring. That
 * circularity is the point. There is no way to widen what is frozen, or to
 * narrow it, without leaving a manifest diff in the commit that did it.
 *
 * WHY DATA AND NOT A CONVENTION. The rule is "the game, the questions, the
 * logic and the maths do not change until the owner says so". A rule kept in a
 * document is one a hurried change violates silently; a rule kept as a hash is
 * one a hurried change cannot violate quietly. See the long explanation at the
 * top of tools/freeze.mjs for the mechanism and for the owner's procedure, and
 * docs/OPERACOES.md for the reasoning and the limits.
 */

/**
 * The sentence every frozen file that can carry a comment carries near its top.
 *
 * The guard requires it in both directions: a file inside the frozen set
 * without the marker fails, because that is how a NEW engine module would
 * otherwise be used by scoring without anyone deciding to freeze it.
 *
 * JSON files and the product CSV cannot carry a comment, so for them the
 * manifest is the only guard. That is stated plainly in docs/OPERACOES.md rather
 * than left for a reader to discover.
 */
export const FROZEN_MARKER = 'FROZEN. See src/core/freeze.js';

/**
 * Directories frozen in full. Every JavaScript file inside must carry the
 * marker; every file inside, marker or not, is hashed into the manifest.
 */
export const FROZEN_DIRS = ['src/core', 'content', 'test/unit', 'test/fixtures'];

/**
 * Individual frozen files, relative to the root: the ones OUTSIDE the frozen
 * directories below. Anything already inside a frozen directory is covered by
 * that directory and must NOT be repeated here — the two lists are unioned, and
 * a path in both would be counted twice.
 *
 * `package.json` is here because `version` in it is the identity of a release;
 * `.gitattributes` because the golden trace is compared byte for byte, so line
 * endings are part of the maths; and `test/browser/widget.test.js` because the
 * browser suite is the only place the widget is exercised against a real
 * engine, and it is not inside a frozen directory.
 *
 * `tools/freeze.mjs` and `tools/*.mjs` are here because weakening the guard, or
 * the gate a trace is checked through, is precisely the change that most needs
 * to be visible.
 *
 * `frozen.manifest.json` is deliberately NOT in this list, and the reason is
 * worth knowing: a file cannot record its own SHA-256, because the hash covers
 * the bytes that would contain it. The manifest is covered by its FINGERPRINT
 * instead, which is computed over the entry list and over the manifest's own
 * metadata, so editing any value in it fails the check exactly as editing a
 * frozen file would. See tools/freeze.mjs. What that leaves uncovered is the
 * manifest's formatting, which carries no meaning.
 *
 * `src/core/freeze.js` is not listed either: it is inside `src/core`, and the
 * duplicate was a real bug caught by test/unit/frozen.test.js, which asserts
 * the declared set and the manifest are the same SIZE as well as the same
 * members.
 */
export const FROZEN_FILES = [
  'package.json',
  'tools/freeze.mjs',
  'tools/make-golden-trace.mjs',
  'tools/validate-content.mjs',
  'tools/build-catalog.mjs',
  'test/browser/widget.test.js',
  '.gitattributes'
];

/**
 * What inside a frozen directory is exempt, and why. Each entry is a judgement,
 * so it is written down and reviewed with the rest.
 *
 * There are none today. An entry here removes a file from the manifest
 * entirely, which is a real hole, so the list is asserted to be empty by
 * `test/unit/frozen.test.js`: adding an exemption has to be a deliberate edit
 * to that test as well, and two edits are harder to make in a hurry than one.
 *
 * @type {Record<string, string>}
 */
export const FROZEN_EXEMPT = {};

/** The shape version of the manifest itself. */
export const MANIFEST_VERSION = 1;

/**
 * The files whose changing is what "the maths changed" means.
 *
 * Named separately from the frozen set because a reader asking "did the scoring
 * change?" should not have to read a list that also contains the manifest and a
 * product CSV. `test/unit/frozen.test.js` asserts this list covers every module
 * in `src/core/` in both directions, so a new engine module that nobody added
 * here fails rather than hiding behind a directory glob.
 */
export const FROZEN_ENGINE = [
  'src/core/audit.js',
  'src/core/catalog.js',
  'src/core/csv.js',
  'src/core/explain.js',
  'src/core/freeze.js',
  'src/core/hash.js',
  'src/core/i18n.js',
  'src/core/index.js',
  'src/core/model.js',
  'src/core/prng.js',
  'src/core/scoring.js',
  'src/core/session.js',
  'src/core/validate.js',
  'src/core/version.js'
];
