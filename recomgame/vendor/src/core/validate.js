/**
 * Content validation.
 *
 * A game IS data, so the most valuable thing this engine can do is refuse to
 * play broken data loudly and precisely. Every problem is reported with a
 * stable CODE, a JSON PATH into the document, and a message written for the
 * person authoring the game — not for the person who wrote this file.
 *
 * Two severities:
 *   'error'   — the game cannot be played. `valid` is false.
 *   'warning' — the game plays, but something is almost certainly a mistake.
 *
 * Every code is documented in docs/CONTEUDO.md. Codes are part of the
 * public contract and must not be renamed or reused.
 *
 * FROZEN. See src/core/freeze.js.
 */

import { MIN_ITEMS, MIN_QUESTIONS, MAX_QUESTIONS, MAX_ITEMS, SCHEMA_VERSION } from './version.js';

/**
 * @typedef {'error'|'warning'} Severity
 *
 * @typedef {object} Issue
 * @property {string} code    Stable machine-readable code, e.g. CONTENT_ITEM_DUPLICATE_ID.
 * @property {string} path    JSON pointer-ish path, e.g. questions[2].options[0].weights.basic.
 * @property {string} message Human sentence naming the fix.
 * @property {Severity} severity
 *
 * @typedef {object} ValidationReport
 * @property {boolean} valid       True when there are no issues of severity 'error'.
 * @property {Issue[]} issues      All issues, errors first, in document order.
 * @property {number} errorCount
 * @property {number} warningCount
 * @property {string[]} codes      Distinct codes present, for quick logging.
 *
 * @typedef {object} RawOption
 * @property {string} id
 * @property {string} label
 * @property {Record<string, number>} [weights]
 * @property {string} [detail]
 *
 * @typedef {object} RawQuestion
 * @property {string} id
 * @property {string} text
 * @property {RawOption[]} options
 * @property {string} [help]
 * @property {boolean} [skippable]
 *
 * @typedef {object} RawItem
 * @property {string} id
 * @property {string} label
 * @property {string} [summary]
 * @property {string[]} [bullets]
 * @property {string} [url]
 * @property {number} [rank]
 *
 * @typedef {object} RawGame
 * @property {string} [schemaVersion]
 * @property {string} gameId
 * @property {string} [version]
 * @property {string} [title]
 * @property {string} [intro]
 * @property {string} [outro]
 * @property {string} [lang]
 * @property {number} [maxQuestions]
 * @property {number} [marginThreshold]
 * @property {RawItem[]} items
 * @property {RawQuestion[]} questions
 */

/** Identifier shape: letters, digits, dash, underscore, dot. */
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

/**
 * Names an item id may not use, because they are members of `Object.prototype`.
 *
 * This is the content-side half of defect D1 (docs/OPERACOES.md). The maths-side
 * half is `weightFor` in src/core/model.js, and it is the half that actually
 * fixes the scoring. This one exists so that a content author who writes
 * `constructor` as an id is TOLD, instead of shipping a catalog whose scoring is
 * quietly wrong — a silent defect is the kind that reaches a player.
 *
 * It is read from `Object.getOwnPropertyNames` rather than written out by hand,
 * so it cannot drift from the runtime it is protecting against. `__proto__`,
 * `__defineGetter__` and the other three underscore-first names are already
 * refused by ID_PATTERN, and are listed here anyway: a rule that depends on
 * another rule's pattern to cover a case is a rule that breaks when the pattern
 * is edited.
 */
const RESERVED_ITEM_IDS = new Set(Object.getOwnPropertyNames(Object.prototype));

/** @returns {Issue} */
function issue(code, path, message, severity = 'error') {
  return { code, path, message, severity };
}

/**
 * The URL schemes an `items[].url` may use.
 *
 * A closed allow-list rather than a deny-list, because the widget hands this
 * string to `window.open`: a document that says `javascript:` or `data:` is a
 * one-click script execution in the host's origin. `noopener` protects the
 * opened page from the opener, not the opener from the opened URL.
 *
 * `mailto:` is included because a "contact us about this gift" link is a
 * legitimate recommendation action. See defect D4 in docs/OPERACOES.md.
 */
const ALLOWED_URL_SCHEMES = Object.freeze(['http:', 'https:', 'mailto:']);

/**
 * Is this `items[].url` one the widget is willing to open?
 *
 * Deliberately strict and total: anything that is not a string, does not parse
 * against a base, or carries a scheme outside the allow-list answers `false`.
 * A relative URL is refused rather than resolved, because the document may come
 * from a third-party origin and a relative path would then point at the host's
 * own site — a navigation the content author did not ask for and cannot see.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isSafeItemUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  /** @type {URL} */
  let parsed;
  try {
    // A base is required for `new URL` to accept anything; the base is only
    // there to let the parse happen, and any result that needed it is refused
    // by the scheme test below or by the explicit relative check.
    parsed = new URL(value, 'https://invalid.invalid/');
  } catch {
    return false;
  }
  // `new URL('foo', base)` yields a URL on the base origin; that is the
  // relative case, and it is not allowed to silently become the host's site.
  if (parsed.origin === 'https://invalid.invalid') return false;
  return ALLOWED_URL_SCHEMES.includes(parsed.protocol);
}

/**
 * Validate a game document.
 *
 * Never throws — a non-object, a string, or `null` is reported as
 * CONTENT_NOT_AN_OBJECT so a caller can show a message instead of crashing.
 *
 * @param {unknown} game
 * @returns {ValidationReport}
 */
export function validateGame(game) {
  /** @type {Issue[]} */
  const issues = [];

  if (game === null || typeof game !== 'object' || Array.isArray(game)) {
    issues.push(
      issue(
        'CONTENT_NOT_AN_OBJECT',
        '$',
        `A game must be a JSON object with "items" and "questions"; received ${
          game === null ? 'null' : Array.isArray(game) ? 'an array' : `a ${typeof game}`
        }.`
      )
    );
    return report(issues);
  }

  const doc = /** @type {Record<string, unknown>} */ (game);

  /* ---------------------------------------------------------------- header */

  if (typeof doc.schemaVersion === 'string' && doc.schemaVersion !== SCHEMA_VERSION) {
    issues.push(
      issue(
        'CONTENT_SCHEMA_VERSION_UNSUPPORTED',
        'schemaVersion',
        `This engine implements schema ${SCHEMA_VERSION}; the document declares "${doc.schemaVersion}".`,
        'warning'
      )
    );
  }

  if (typeof doc.gameId !== 'string' || doc.gameId.trim() === '') {
    issues.push(
      issue('CONTENT_MISSING_GAME_ID', 'gameId', 'Every game needs a stable "gameId" string.')
    );
  } else if (!ID_PATTERN.test(doc.gameId)) {
    issues.push(
      issue(
        'CONTENT_BAD_ID',
        'gameId',
        `"${doc.gameId}" is not a usable id; use letters, digits, dot, dash or underscore.`
      )
    );
  }

  if (doc.maxQuestions !== undefined) {
    const value = doc.maxQuestions;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
      issues.push(
        issue(
          'CONTENT_BAD_MAX_QUESTIONS',
          'maxQuestions',
          '"maxQuestions" must be a positive whole number.'
        )
      );
    } else if (value > MAX_QUESTIONS) {
      issues.push(
        issue(
          'CONTENT_TOO_MANY_QUESTIONS',
          'maxQuestions',
          `"maxQuestions" is ${value}, but this engine asks at most ${MAX_QUESTIONS}.`,
          'warning'
        )
      );
    }
  }

  if (doc.marginThreshold !== undefined) {
    const value = doc.marginThreshold;
    if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > 1) {
      issues.push(
        issue(
          'CONTENT_BAD_MARGIN_THRESHOLD',
          'marginThreshold',
          '"marginThreshold" must be a number between 0 and 1 (a fraction of the normalized scale).'
        )
      );
    }
  }

  /* ----------------------------------------------------------------- items */

  const itemIds = validateItems(doc.items, issues);
  const questionIds = validateQuestions(doc.questions, issues);

  /* ----------------------------------- cross-references and reachability */

  if (Array.isArray(doc.questions)) {
    validateWeights(doc.questions, itemIds, issues);
    validateReachability(doc.questions, doc.items, itemIds, issues);
    validateQuestionIdCollisions(questionIds, itemIds, issues);
  }

  return report(issues);
}

/**
 * @param {unknown} items
 * @param {Issue[]} issues
 * @returns {Set<string>} the ids encountered
 */
function validateItems(items, issues) {
  /** @type {Set<string>} */
  const ids = new Set();

  if (!Array.isArray(items)) {
    issues.push(
      issue('CONTENT_MISSING_ITEMS', 'items', 'A game needs an "items" array of recommendations.')
    );
    return ids;
  }

  if (items.length < MIN_ITEMS) {
    issues.push(
      issue(
        'CONTENT_TOO_FEW_ITEMS',
        'items',
        `A game needs at least ${MIN_ITEMS} items to have anything to choose between; found ${items.length}.`
      )
    );
  }

  // Refuse an oversized catalogue BEFORE walking it. Returning here is the
  // point, not an optimisation: the array is attacker-controlled on the
  // `content-src` path, and visiting every entry to raise one issue each is the
  // same denial of service the ceiling exists to prevent. See MAX_ITEMS in
  // version.js and defect D4 in docs/OPERACOES.md.
  if (items.length > MAX_ITEMS) {
    issues.push(
      issue(
        'CONTENT_TOO_MANY_ITEMS',
        'items',
        `This engine scores at most ${MAX_ITEMS} items; the document declares ${items.length}.`
      )
    );
    return ids;
  }

  items.forEach((raw, index) => {
    const path = `items[${index}]`;
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      issues.push(issue('CONTENT_ITEM_NOT_AN_OBJECT', path, 'Every item must be an object.'));
      return;
    }
    const item = /** @type {Record<string, unknown>} */ (raw);

    if (typeof item.id !== 'string' || item.id.trim() === '') {
      issues.push(issue('CONTENT_ITEM_MISSING_ID', `${path}.id`, 'Every item needs an "id".'));
    } else if (!ID_PATTERN.test(item.id)) {
      issues.push(
        issue(
          'CONTENT_BAD_ID',
          `${path}.id`,
          `Item id "${item.id}" is unusable; use letters, digits, dot, dash or underscore.`
        )
      );
    } else if (RESERVED_ITEM_IDS.has(item.id)) {
      issues.push(
        issue(
          'CONTENT_RESERVED_ITEM_ID',
          `${path}.id`,
          `Item id "${item.id}" is a member of Object.prototype, which the scorer would read as an inherited function instead of as a weight. Rename it (for example "${item.id}-item").`
        )
      );
    } else if (ids.has(item.id)) {
      issues.push(
        issue(
          'CONTENT_ITEM_DUPLICATE_ID',
          `${path}.id`,
          `Item id "${item.id}" appears more than once; ids must be unique.`
        )
      );
    } else {
      ids.add(item.id);
    }

    if (typeof item.label !== 'string' || item.label.trim() === '') {
      issues.push(
        issue('CONTENT_ITEM_MISSING_LABEL', `${path}.label`, 'Every item needs a "label" to show the player.')
      );
    }
    if (typeof item.label === 'string' && /<[a-z][\s\S]*>/i.test(item.label)) {
      issues.push(
        issue(
          'CONTENT_ITEM_LABEL_LOOKS_LIKE_HTML',
          `${path}.label`,
          'Labels are inserted as plain text, so HTML tags would be shown literally. Remove them.',
          'warning'
        )
      );
    }
    if (item.bullets !== undefined && !isStringArray(item.bullets)) {
      issues.push(
        issue('CONTENT_BAD_BULLETS', `${path}.bullets`, '"bullets" must be an array of strings.')
      );
    }
    if (item.rank !== undefined && typeof item.rank !== 'number') {
      issues.push(issue('CONTENT_BAD_RANK', `${path}.rank`, '"rank" must be a number.'));
    }
    // An absent or empty `url` means "no claim link", which is the normal case.
    // Only a present, non-empty value is a navigation the widget would perform.
    if (typeof item.url === 'string' && item.url.trim() !== '' && !isSafeItemUrl(item.url)) {
      issues.push(
        issue(
          'CONTENT_BAD_ITEM_URL',
          `${path}.url`,
          `"url" must be an absolute ${ALLOWED_URL_SCHEMES.map((s) => s.replace(':', '')).join('/')} address, because the widget opens it in a new tab; received ${JSON.stringify(item.url)}.`
        )
      );
    }
  });

  return ids;
}

/**
 * @param {unknown} questions
 * @param {Issue[]} issues
 * @returns {Set<string>}
 */
function validateQuestions(questions, issues) {
  /** @type {Set<string>} */
  const ids = new Set();

  if (!Array.isArray(questions)) {
    issues.push(
      issue('CONTENT_MISSING_QUESTIONS', 'questions', 'A game needs a "questions" array.')
    );
    return ids;
  }

  if (questions.length < MIN_QUESTIONS) {
    issues.push(
      issue(
        'CONTENT_TOO_FEW_QUESTIONS',
        'questions',
        `A game needs at least ${MIN_QUESTIONS} question; found ${questions.length}.`
      )
    );
  }

  if (questions.length > MAX_QUESTIONS) {
    issues.push(
      issue(
        'CONTENT_TOO_MANY_QUESTIONS',
        'questions',
        `The engine asks at most ${MAX_QUESTIONS} questions; the document defines ${questions.length}.`,
        'warning'
      )
    );
  }

  questions.forEach((raw, index) => {
    const path = `questions[${index}]`;
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      issues.push(issue('CONTENT_QUESTION_NOT_AN_OBJECT', path, 'Every question must be an object.'));
      return;
    }
    const question = /** @type {Record<string, unknown>} */ (raw);

    if (typeof question.id !== 'string' || question.id.trim() === '') {
      issues.push(issue('CONTENT_QUESTION_MISSING_ID', `${path}.id`, 'Every question needs an "id".'));
    } else if (!ID_PATTERN.test(question.id)) {
      issues.push(
        issue(
          'CONTENT_BAD_ID',
          `${path}.id`,
          `Question id "${question.id}" is unusable; use letters, digits, dot, dash or underscore.`
        )
      );
    } else if (ids.has(question.id)) {
      issues.push(
        issue(
          'CONTENT_QUESTION_DUPLICATE_ID',
          `${path}.id`,
          `Question id "${question.id}" appears more than once; ids must be unique.`
        )
      );
    } else {
      ids.add(question.id);
    }

    if (typeof question.text !== 'string' || question.text.trim() === '') {
      issues.push(
        issue('CONTENT_QUESTION_MISSING_TEXT', `${path}.text`, 'Every question needs "text" to ask.')
      );
    }

    if (!Array.isArray(question.options)) {
      issues.push(
        issue('CONTENT_QUESTION_MISSING_OPTIONS', `${path}.options`, 'Every question needs an "options" array.')
      );
      return;
    }

    if (question.options.length < 2) {
      issues.push(
        issue(
          'CONTENT_QUESTION_TOO_FEW_OPTIONS',
          `${path}.options`,
          `A question with ${question.options.length} option cannot discriminate; give it at least 2.`
        )
      );
    }

    /** @type {Set<string>} */
    const optionIds = new Set();
    question.options.forEach((rawOption, optionIndex) => {
      const optionPath = `${path}.options[${optionIndex}]`;
      if (rawOption === null || typeof rawOption !== 'object' || Array.isArray(rawOption)) {
        issues.push(issue('CONTENT_OPTION_NOT_AN_OBJECT', optionPath, 'Every option must be an object.'));
        return;
      }
      const option = /** @type {Record<string, unknown>} */ (rawOption);

      if (typeof option.id !== 'string' || option.id.trim() === '') {
        issues.push(issue('CONTENT_OPTION_MISSING_ID', `${optionPath}.id`, 'Every option needs an "id".'));
      } else if (!ID_PATTERN.test(option.id)) {
        issues.push(
          issue(
            'CONTENT_BAD_ID',
            `${optionPath}.id`,
            `Option id "${option.id}" is unusable; use letters, digits, dot, dash or underscore.`
          )
        );
      } else if (optionIds.has(option.id)) {
        issues.push(
          issue(
            'CONTENT_OPTION_DUPLICATE_ID',
            `${optionPath}.id`,
            `Option id "${option.id}" is used twice in this question; option ids must be unique within a question.`
          )
        );
      } else {
        optionIds.add(option.id);
      }

      if (typeof option.label !== 'string' || option.label.trim() === '') {
        issues.push(
          issue('CONTENT_OPTION_MISSING_LABEL', `${optionPath}.label`, 'Every option needs a "label".')
        );
      }
      if (option.weights === undefined) {
        issues.push(
          issue(
            'CONTENT_OPTION_MISSING_WEIGHTS',
            `${optionPath}.weights`,
            `Option "${String(option.id ?? optionIndex)}" has no "weights"; it can never influence the result. If that is intentional (a "no preference" answer) set "weights": {}.`,
            'warning'
          )
        );
      }
    });
  });

  return ids;
}

/**
 * Every weight key must name a real item, and every weight must be a finite
 * number, so scoring can never produce NaN.
 *
 * @param {unknown[]} questions
 * @param {Set<string>} itemIds
 * @param {Issue[]} issues
 */
function validateWeights(questions, itemIds, issues) {
  questions.forEach((rawQuestion, qIndex) => {
    if (rawQuestion === null || typeof rawQuestion !== 'object' || Array.isArray(rawQuestion)) return;
    const options = /** @type {Record<string, unknown>} */ (rawQuestion).options;
    if (!Array.isArray(options)) return;

    options.forEach((rawOption, oIndex) => {
      if (rawOption === null || typeof rawOption !== 'object' || Array.isArray(rawOption)) return;
      const weights = /** @type {Record<string, unknown>} */ (rawOption).weights;
      if (weights === undefined) return;

      const weightsPath = `questions[${qIndex}].options[${oIndex}].weights`;

      if (weights === null || typeof weights !== 'object' || Array.isArray(weights)) {
        issues.push(
          issue(
            'CONTENT_BAD_WEIGHTS',
            weightsPath,
            '"weights" must be an object mapping item id to a number, e.g. { "plan-basic": 2 }.'
          )
        );
        return;
      }

      for (const [itemId, value] of Object.entries(weights)) {
        const valuePath = `${weightsPath}.${itemId}`;
        if (!itemIds.has(itemId)) {
          issues.push(
            issue(
              'CONTENT_UNKNOWN_ITEM_ID',
              valuePath,
              `Weight targets item "${itemId}", which is not declared in "items". Known ids: ${
                [...itemIds].join(', ') || '(none)'
              }.`
            )
          );
        }
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          issues.push(
            issue('CONTENT_BAD_WEIGHT_VALUE', valuePath, `Weight for "${itemId}" must be a finite number.`)
          );
        }
      }
    });
  });
}

/**
 * Reachability: an item that no option in any question awards points to can
 * never win. Such a game looks fine but quietly ignores one of its ten
 * recommendations — the single most common authoring bug, so it is an error.
 *
 * @param {unknown[]} questions
 * @param {unknown} items
 * @param {Set<string>} itemIds
 * @param {Issue[]} issues
 */
function validateReachability(questions, items, itemIds, issues) {
  if (itemIds.size === 0) return;

  /** @type {Set<string>} */
  const reachable = new Set();
  for (const rawQuestion of questions) {
    if (rawQuestion === null || typeof rawQuestion !== 'object' || Array.isArray(rawQuestion)) continue;
    const options = /** @type {Record<string, unknown>} */ (rawQuestion).options;
    if (!Array.isArray(options)) continue;
    for (const rawOption of options) {
      if (rawOption === null || typeof rawOption !== 'object' || Array.isArray(rawOption)) continue;
      const weights = /** @type {Record<string, unknown>} */ (rawOption).weights;
      if (weights === null || typeof weights !== 'object' || Array.isArray(weights)) continue;
      for (const [itemId, value] of Object.entries(weights)) {
        if (itemIds.has(itemId) && typeof value === 'number' && value > 0) reachable.add(itemId);
      }
    }
  }

  const unreachable = [...itemIds].filter((id) => !reachable.has(id));
  if (unreachable.length > 0) {
    const indexById = new Map();
    if (Array.isArray(items)) {
      items.forEach((raw, index) => {
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          const id = /** @type {Record<string, unknown>} */ (raw).id;
          if (typeof id === 'string') indexById.set(id, index);
        }
      });
    }
    for (const id of unreachable) {
      const index = indexById.get(id);
      const where = index === undefined ? `items` : `items[${index}]`;
      issues.push(
        issue(
          'CONTENT_ITEM_UNREACHABLE',
          `${where}.id`,
          `Item "${id}" is never awarded a positive weight by any option, so no answer can ever select it. Add it to at least one option's weights.`
        )
      );
    }
  }
}

/**
 * A question id equal to an item id is not fatal, but it makes traces and
 * logs ambiguous to read.
 *
 * @param {Set<string>} questionIds
 * @param {Set<string>} itemIds
 * @param {Issue[]} issues
 */
function validateQuestionIdCollisions(questionIds, itemIds, issues) {
  for (const id of questionIds) {
    if (itemIds.has(id)) {
      issues.push(
        issue(
          'CONTENT_QUESTION_ID_SHADOWS_ITEM_ID',
          'questions',
          `Question id "${id}" is also an item id, which makes traces and logs confusing; rename one of them.`,
          'warning'
        )
      );
    }
  }
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isStringArray(value) {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

/**
 * @param {Issue[]} issues
 * @returns {ValidationReport}
 */
function report(issues) {
  const errors = issues.filter((entry) => entry.severity === 'error');
  const warnings = issues.filter((entry) => entry.severity === 'warning');
  return {
    valid: errors.length === 0,
    issues: [...errors, ...warnings],
    errorCount: errors.length,
    warningCount: warnings.length,
    codes: [...new Set(issues.map((entry) => entry.code))]
  };
}

/**
 * Format a report as a human-readable block, for CLI output and the console.
 *
 * @param {ValidationReport} report
 * @param {string} [label]
 * @returns {string}
 */
export function formatReport(report, label = 'game') {
  if (report.issues.length === 0) return `${label}: valid`;
  const lines = [
    `${label}: ${report.valid ? 'valid' : 'INVALID'} (${report.errorCount} error(s), ${report.warningCount} warning(s))`
  ];
  for (const entry of report.issues) {
    const tag = entry.severity === 'error' ? 'error' : 'warn ';
    lines.push(`  ${tag} ${entry.code} at ${entry.path}`);
    lines.push(`        ${entry.message}`);
  }
  return lines.join('\n');
}
