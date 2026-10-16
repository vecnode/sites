/**
 * The catalog compiler: a CSV export plus a plan becomes a game document.
 *
 * Why this exists. The engine's scoring model is a weight table, and a weight
 * table is typed once per item per option. Ten items is about 130 hand-written
 * integers; a hundred items is about 1,300, and every new product means editing
 * every question. That does not scale, and neither does a "mode" per outcome.
 *
 * So judgement is typed twice instead: once per question option ("this answer
 * says the gift is worn"), and once per product ("this product is worn"). This
 * module expands the two into the ordinary `{ itemId: points }` table the engine
 * already understands. The compiled document is therefore NOT a new format — it
 * is the ordinary document shape [CONTEUDO.md](../../docs/CONTEUDO.md)
 * describes, which is what lets every existing guarantee (validation,
 * winnability, the tie-break ladder, verifyTrace) apply to generated content with
 * no new engine code at all.
 *
 * What it will not do is invent. Every sentence the player reads comes either
 * from a CSV field or from a template in the plan; a missing value is an error
 * naming the item, never a blank or a guess. Every failure is reported with a
 * stable code and a path, using the same report shape as `validate.js`, so
 * `formatReport` renders both and a build fails with a sentence rather than a
 * stack trace.
 *
 * Pure: no DOM, no fetch, no clock, no randomness. Same text and plan in, byte-
 * identical document out — which is what makes `build-catalog --check` possible.
 *
 * FROZEN. See src/core/freeze.js.
 */

import { parseCsv, toRecords } from './csv.js';
import { validateGame } from './validate.js';
import { SCHEMA_VERSION } from './version.js';

/** The widget budgets 40 characters for an item label, so the compiler must too. */
export const LABEL_MAX = 40;

/** Bullets the item view shows: 2 to 5, by the shipped-content test. */
const BULLET_MIN = 2;
const BULLET_MAX = 5;

/** Item ids must survive both the validator and the shipped-content id test. */
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** Category keys seen in real exports; a plan may add to this list. */
const DEFAULT_CATEGORY_KEYS = ['mba_categories', 'categories'];

/** Used when a plan carries no `dimensions` block. */
const DEFAULT_DIMENSIONS = {
  pattern: '(\\d+(?:[.,]\\d+)?)\\s*(?:x\\s*(\\d+(?:[.,]\\d+)?))?\\s*(mm|cms?|cm|g|ml)',
  sizeUnits: ['mm', 'cm', 'cms'],
  smallMaxMm: 45,
  smallTrait: 'pequeno',
  otherUnits: { g: 'peso', ml: 'capacidade' }
};

/**
 * @typedef {object} CatalogIssue
 * @property {string} code
 * @property {string} path
 * @property {string} message
 * @property {'error'|'warning'} severity
 *
 * @typedef {object} CatalogStats
 * @property {number} rows          Data rows in the file.
 * @property {number} selected      Rows that became items.
 * @property {number} items
 * @property {number} questions
 * @property {number} options
 * @property {number} weightEntries Non-zero item weights across every option.
 * @property {number} traits        Distinct traits an item ended up with.
 * @property {Record<string,string>} skuById  Item id -> the SKU as exported. A host needs this to turn a winner into an order line.
 * @property {string[]} categoryKeys  The key spellings the export actually used.
 * @property {string[]} fallbackCategories  SKUs whose category came from the plan's fallback.
 * @property {Record<string,number>} exclusiveValues  Exclusive trait -> the value assigned.
 * @property {Record<string,number>} kinds    Product kind -> how many items.
 */

/* --------------------------------------------------------------- utilities */

/** Fold case and accents: `Crachá` and `cracha` must match the same rule. */
function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** @param {string} haystack @param {string[]} needles */
function matchesAny(haystack, needles) {
  return Array.isArray(needles) && needles.some((needle) => haystack.includes(fold(needle)));
}

/**
 * Read the category names out of a `categories_id_json` cell.
 *
 * The column holds a JSON object whose key spelling is not stable in real
 * exports, and whose numbers are sometimes ints and sometimes floats. Neither is
 * fatal, and neither is hidden: an unexpected key is reported so the export can
 * be fixed rather than quietly accommodated forever.
 *
 * Never throws, and never parses the same cell twice: the key it used is
 * returned, because parsing it again in the caller threw on a cell that is not
 * JSON at all — exactly the malformed input this function exists to survive.
 *
 * @param {string} raw
 * @param {string[]} keys
 * @returns {{ names: string[], key: string|null, problem: 'empty'|'unparsable'|'unknown-key'|null }}
 */
function parseCategoryNames(raw, keys) {
  const text = String(raw ?? '').trim();
  if (text === '') return { names: [], key: null, problem: 'empty' };

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { names: [], key: null, problem: 'unparsable' };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { names: [], key: null, problem: 'unparsable' };
  }

  const present = Object.keys(parsed);
  let key = keys.find((candidate) => Array.isArray(parsed[candidate]));
  let problem = null;
  if (!key) {
    // One array-valued key and no recognised name: take it, and say so.
    const arrays = present.filter((candidate) => Array.isArray(parsed[candidate]));
    if (arrays.length === 0) return { names: [], key: null, problem: 'unparsable' };
    key = arrays[0];
    problem = 'unknown-key';
  }

  const names = parsed[key]
    .map((entry) => (entry && typeof entry === 'object' ? entry.name : undefined))
    .filter((name) => typeof name === 'string' && name.trim() !== '')
    .map((name) => name.trim());

  return { names, key, problem: names.length === 0 ? 'unparsable' : problem };
}

/** `{name}` substitution, with the empty result visible to the caller. */
function render(text, values) {
  let missing = false;
  const rendered = String(text ?? '').replace(/\{(\w+)\}/g, (_match, key) => {
    const value = values[key];
    if (value === undefined || value === '') {
      missing = true;
      return '';
    }
    return String(value);
  });
  return { text: rendered.trim(), missing };
}

/* ------------------------------------------------------------------- main */

/**
 * Compile a catalog export and a plan into a game document.
 *
 * @param {string} csvText
 * @param {Record<string, any>} plan
 * @param {{ labelMaxLength?: number, bulletMax?: number }} [options]
 * @returns {{ ok: boolean, document: Record<string, unknown>|null, report: { valid: boolean, issues: CatalogIssue[], errorCount: number, warningCount: number, codes: string[] }, stats: CatalogStats }}
 */
export function catalogToGame(csvText, plan, options = {}) {
  /** @type {CatalogIssue[]} */
  const issues = [];
  /** @param {string} code @param {string} path @param {string} message @param {'error'|'warning'} [severity] */
  const add = (code, path, message, severity = 'error') => {
    issues.push({ code, path, message, severity });
  };

  /** @type {CatalogStats} */
  const stats = {
    rows: 0,
    selected: 0,
    items: 0,
    questions: 0,
    options: 0,
    weightEntries: 0,
    traits: 0,
    skuById: {},
    categoryKeys: [],
    fallbackCategories: [],
    exclusiveValues: {},
    kinds: {}
  };

  const done = () => {
    const errors = issues.filter((entry) => entry.severity === 'error');
    const warnings = issues.filter((entry) => entry.severity === 'warning');
    /** How many of each code, so a caller can assert the exact set it accepts. */
    const counts = {};
    for (const entry of issues) counts[entry.code] = (counts[entry.code] ?? 0) + 1;
    return {
      ok: errors.length === 0,
      document: errors.length === 0 ? lastDocument : null,
      report: {
        valid: errors.length === 0,
        issues: [...errors, ...warnings],
        errorCount: errors.length,
        warningCount: warnings.length,
        codes: [...new Set(issues.map((entry) => entry.code))],
        counts
      },
      stats
    };
  };

  /** @type {Record<string, unknown>|null} */
  let lastDocument = null;

  /* ------------------------------------------------------------------ plan */

  if (plan === null || typeof plan !== 'object' || Array.isArray(plan)) {
    add('CATALOG_BAD_PLAN', '$', 'A plan must be an object with "source", "lexicon" and "questions".');
    return done();
  }

  const source = plan.source ?? {};
  const columns = source.columns ?? {};
  const game = plan.game ?? {};
  const copy = plan.copy ?? {};
  const lexicon = plan.lexicon ?? {};
  const labelMax = Number.isFinite(options.labelMaxLength) ? Number(options.labelMaxLength) : LABEL_MAX;
  const bulletMax = Number.isFinite(options.bulletMax) ? Number(options.bulletMax) : BULLET_MAX;
  const categoryKeys = Array.isArray(source.normalise?.categoryKeys) && source.normalise.categoryKeys.length > 0
    ? source.normalise.categoryKeys
    : DEFAULT_CATEGORY_KEYS;
  const dimensions = { ...DEFAULT_DIMENSIONS, ...(plan.dimensions ?? {}) };

  if (!Array.isArray(plan.questions) || plan.questions.length === 0) {
    add('CATALOG_BAD_PLAN', 'questions', 'A plan needs a non-empty "questions" array; without one there is nothing to ask.');
    return done();
  }

  /* ------------------------------------------------------------------- csv */

  if (typeof csvText !== 'string' || csvText.trim() === '') {
    add('CATALOG_CSV_EMPTY', 'csv', 'The catalog export is empty, so it holds no products.');
    return done();
  }

  const table = parseCsv(csvText, { delimiter: source.delimiter });
  if (table.headers.length === 0) {
    add('CATALOG_CSV_EMPTY', 'csv', 'The catalog export has no header row, so no column can be identified.');
    return done();
  }
  if (table.unterminated) {
    add(
      'CATALOG_UNTERMINATED_QUOTE',
      'csv',
      'A quoted field is never closed, so the last record was read to the end of the file. Check the export for a stray double quote.',
      'warning'
    );
  }

  /** Columns without which nothing can be compiled. */
  const requiredColumns = ['sku', 'name'];
  const missingColumns = requiredColumns.filter((alias) => typeof columns[alias] !== 'string' || columns[alias] === '');
  if (missingColumns.length > 0) {
    add(
      'CATALOG_MISSING_COLUMN',
      'source.columns',
      `The plan does not name a column for: ${missingColumns.join(', ')}. The export offers: ${table.headers.join(', ')}.`
    );
    return done();
  }
  for (const alias of requiredColumns) {
    if (!table.headers.includes(columns[alias])) {
      add(
        'CATALOG_MISSING_COLUMN',
        'source.columns',
        `The plan reads "${alias}" from column "${columns[alias]}", which the export does not have. The export offers: ${table.headers.join(', ')}.`
      );
    }
  }
  if (issues.some((entry) => entry.code === 'CATALOG_MISSING_COLUMN')) return done();

  const records = toRecords(table);
  stats.rows = records.length;
  for (const record of records) {
    if (!record.complete) {
      add(
        'CATALOG_ROW_SHAPE',
        `csv[record ${record.record}]`,
        `This row has ${record.fields.length} field(s) where the header has ${table.headers.length}. A short row usually means an unescaped delimiter earlier in the line.`,
        'warning'
      );
    }
  }

  /* --------------------------------------------------------------- selection */

  const select = source.select ?? {};
  const count = Number.isFinite(select.count) ? Math.max(0, Math.floor(select.count)) : records.length;
  const order = select.by === 'rank-desc' && typeof columns.rank === 'string'
    ? [...records].sort((a, b) => {
      const left = Number(a.values[columns.rank]);
      const right = Number(b.values[columns.rank]);
      const leftOk = Number.isFinite(left);
      const rightOk = Number.isFinite(right);
      if (leftOk && rightOk && left !== right) return right - left;
      if (leftOk !== rightOk) return leftOk ? -1 : 1;
      return a.index - b.index; // a stable tie-break, so the file order decides
    })
    : records;

  const selected = order.slice(0, count);
  stats.selected = selected.length;
  if (selected.length < count) {
    add(
      'CATALOG_TOO_FEW_ROWS',
      'source.select',
      `The plan selects ${count} product(s) but the export holds ${records.length}. Nothing is compiled from a short catalog, because a game with fewer items than promised is a different game.`
    );
    return done();
  }

  /* ------------------------------------------------------------------ items */

  const itemIdCase = source.idCase === 'keep' ? 'keep' : 'lower';
  const rankColumn = typeof columns.rank === 'string' && table.headers.includes(columns.rank) ? columns.rank : null;
  const skuMbaColumn = typeof columns.skuMba === 'string' && table.headers.includes(columns.skuMba) ? columns.skuMba : null;
  const categoryColumn = typeof columns.categories === 'string' && table.headers.includes(columns.categories) ? columns.categories : null;
  const materialLexicon = Array.isArray(lexicon.materials) ? lexicon.materials : [];
  const kindLexicon = Array.isArray(lexicon.kinds) ? lexicon.kinds : [];
  const keywordLexicon = Array.isArray(lexicon.keywords) ? lexicon.keywords : [];
  const categoryLexicon = Array.isArray(lexicon.categories) ? lexicon.categories : [];
  const overrides = plan.overrides ?? {};
  const labelOverrides = copy.labelOverrides ?? {};
  /**
   * Exclusive traits: a trait no lexicon rule can match, declared once in `exclusive`
   * and assigned a distinct value by this module, highest first.
   *
   * Why it exists. A catalogue can hold more products than the questions can describe
   * one by one — 32 products and 10 questions, here. A product still has to be able to
   * win. This is the mechanism for that: each product carries a trait only it has
   * (`ex-<sku>`), a question awards it, and the values are handed out as successive
   * integers so no two products can ever tie. The plan then carries no hand-tuned
   * magic numbers, and every product's win is reproduced by a compilation, not typed.
   *
   * The order of `traits` decides the values, so it is the ranking: the first named
   * trait receives the highest value.
   */
  const exclusive = plan.exclusive ?? {};
  const exclusiveTraits = Array.isArray(exclusive.traits) ? exclusive.traits.map(String) : [];
  const exclusiveBase = Number.isFinite(exclusive.base) ? Number(exclusive.base) : 100000;
  const exclusiveStep = Number.isFinite(exclusive.step) ? exclusive.step : 100;
  const exclusiveValues = {};
  const exclusiveIndex = new Map();
  /** @param {string} trait @returns {number|undefined} */
  const exclusiveValueFor = (trait) => {
    const at = exclusiveIndex.get(trait);
    if (at === undefined) return undefined;
    return exclusiveBase - at * exclusiveStep;
  };
  /**
   * A category to fall back on when a row's own category cell cannot be read, keyed
   * by SKU. An export that cannot fill a cell must not cost the build the whole
   * catalog: without this, one blank `categories_id_json` is a `CATALOG_MISSING_COPY`
   * error, because the summary template needs `{categoria}` and this compiler will not
   * invent one. With it, the row is still classified, still scored and still ranked —
   * and the substitution is reported, so it is a decision rather than a silent edit.
   */
  const fallbackCategory = copy.fallbackCategory ?? {};
  const usedFallback = new Set();
  const bulletTemplates = Array.isArray(copy.bulletTemplates) ? copy.bulletTemplates : [];
  const dimensionPattern = new RegExp(dimensions.pattern, 'g');

  const declaredTraits = new Set();
  for (const entry of kindLexicon) for (const trait of entry.traits ?? []) declaredTraits.add(trait);
  for (const entry of materialLexicon) declaredTraits.add(entry.trait);
  for (const entry of keywordLexicon) declaredTraits.add(entry.trait);
  for (const entry of categoryLexicon) declaredTraits.add(entry.trait);
  if (dimensions.smallTrait) declaredTraits.add(dimensions.smallTrait);
  for (const override of Object.values(overrides)) for (const trait of override?.traits ?? []) declaredTraits.add(trait);
  exclusiveTraits.forEach((trait, index) => {
    declaredTraits.add(trait);
    exclusiveIndex.set(trait, index);
  });

  /** @type {Array<{ id: string, label: string, summary: string, bullets: string[], rank?: number, traits: Set<string>, sku: string }>} */
  const items = [];
  const seenIds = new Set();

  selected.forEach((record, position) => {
    const path = `items[${position}]`;
    const sku = String(record.values[columns.sku] ?? '').trim();
    const name = String(record.values[columns.name] ?? '').trim();
    const id = itemIdCase === 'lower' ? sku.toLowerCase() : sku;

    if (!ID_PATTERN.test(id) || id.length > 40) {
      add(
        'CATALOG_BAD_ID',
        `${path}.id`,
        `SKU "${sku}" becomes the item id "${id}", which is not usable: ids are lowercase letters, digits and single dashes, up to 40 characters.`
      );
      return;
    }
    if (seenIds.has(id)) {
      add('CATALOG_DUPLICATE_ID', `${path}.id`, `Two selected products share the id "${id}" (SKU "${sku}"). Ids must be unique.`);
      return;
    }
    seenIds.add(id);

    /* categories ---------------------------------------------------------- */

    const category = categoryColumn
      ? parseCategoryNames(record.values[categoryColumn], categoryKeys)
      : { names: /** @type {string[]} */ ([]), key: null, problem: /** @type {'empty'} */ ('empty') };
    if (category.problem === 'unparsable') {
      add(
        'CATALOG_BAD_CATEGORIES',
        `${path}.categories`,
        `The categories cell for "${sku}" is not a JSON object with a name list, so this product gets no category.`,
        'warning'
      );
    } else if (category.problem === 'unknown-key') {
      add(
        'CATALOG_BAD_CATEGORIES',
        `${path}.categories`,
        `The categories cell for "${sku}" uses a key the plan does not expect (expected: ${categoryKeys.join(' or ')}). It was read anyway, so the export can be fixed without blocking this build.`,
        'warning'
      );
    }
    if (category.key && !stats.categoryKeys.includes(category.key)) stats.categoryKeys.push(category.key);

    /** The fallback is used only when the export produced no category at all. */
    const fallback = typeof fallbackCategory[sku] === 'string' && fallbackCategory[sku] !== ''
      ? fallbackCategory[sku]
      : null;
    if (category.names.length === 0 && fallback) {
      category.names.push(fallback);
      usedFallback.add(sku);
      add(
        'CATALOG_FALLBACK_CATEGORY',
        `${path}.categories`,
        `The categories cell for "${sku}" is empty or unreadable, so the plan's fallback "${fallback}" was used. The item is scored and ranked like any other; fix the export to retire the fallback.`,
        'warning'
      );
    }

    const broadest = category.names.length > 0 ? category.names[category.names.length - 1] : '';
    const leaf = category.names.length > 0 ? category.names[0] : '';

    /* traits -------------------------------------------------------------- */

    const traits = new Set();
    const haystack = `${fold(name)} :: ${category.names.map(fold).join(' ')}`;
    const categoryHaystack = category.names.map(fold).join(' ');
    const kindEntry = kindLexicon.find((entry) => matchesAny(haystack, entry.match));
    if (kindEntry) {
      for (const trait of kindEntry.traits ?? []) traits.add(trait);
      stats.kinds[kindEntry.kind] = (stats.kinds[kindEntry.kind] ?? 0) + 1;
    } else {
      stats.kinds['(none)'] = (stats.kinds['(none)'] ?? 0) + 1;
    }

    let material = '';
    for (const entry of materialLexicon) {
      const hit = (entry.match ?? []).find((needle) => haystack.includes(fold(needle)));
      if (hit) {
        traits.add(entry.trait);
        if (!material) material = String(hit);
      }
    }
    for (const entry of keywordLexicon) {
      if (matchesAny(haystack, entry.match)) traits.add(entry.trait);
    }
    for (const entry of categoryLexicon) {
      if (matchesAny(categoryHaystack, entry.match)) traits.add(entry.trait);
    }

    const measured = { dimensao: '', peso: '', capacidade: '' };
    dimensionPattern.lastIndex = 0;
    let match;
    while ((match = dimensionPattern.exec(fold(name))) !== null) {
      const unit = match[3];
      if (dimensions.sizeUnits.includes(unit)) {
        const toMm = (value) => (unit === 'mm' ? value : value * 10);
        const first = toMm(parseFloat(String(match[1]).replace(',', '.')));
        const second = match[2] ? toMm(parseFloat(String(match[2]).replace(',', '.'))) : first;
        if (Number.isFinite(first) && Math.min(first, second) <= dimensions.smallMaxMm && dimensions.smallTrait) {
          traits.add(dimensions.smallTrait);
        }
        if (!measured.dimensao) measured.dimensao = match[0].trim();
      } else {
        const slot = dimensions.otherUnits?.[unit];
        if (slot && !measured[slot]) measured[slot] = match[0].trim();
      }
    }

    const override = overrides[sku] ?? {};
    for (const trait of override.traits ?? []) traits.add(trait);
    if (traits.size === 0) {
      add(
        'CATALOG_UNCLASSIFIED_ROW',
        `${path}.traits`,
        `No trait matches "${name}", so no answer can ever favour this product and it can never win. Add it to the lexicon or to overrides.`,
        'warning'
      );
    }

    /* copy ---------------------------------------------------------------- */

    const overrideCopy = labelOverrides[sku] ?? {};
    const label = typeof overrideCopy.label === 'string' && overrideCopy.label !== '' ? overrideCopy.label : name;
    if (label.length > labelMax) {
      add(
        'CATALOG_LABEL_TOO_LONG',
        `${path}.label`,
        `The label for "${sku}" is ${label.length} characters and the widget shows at most ${labelMax}. Add a shorter one to copy.labelOverrides.${sku}.label rather than letting it be cut off.`
      );
    }

    const skuMba = skuMbaColumn ? String(record.values[skuMbaColumn] ?? '').trim() : '';
    const values = {
      name,
      sku,
      sku_mba: skuMba,
      categoria: broadest,
      folha: leaf,
      material,
      ...measured
    };

    const summary = render(copy.summaryTemplate, values);
    if (summary.missing || summary.text === '') {
      add(
        'CATALOG_MISSING_COPY',
        `${path}.summary`,
        `The summary template could not be filled for "${sku}": a value it needs is empty in the export (or copy.summaryTemplate is missing). Nothing is invented to fill the gap.`
      );
    }

    const bullets = [];
    for (const template of bulletTemplates) {
      const conditional = template.when && template.when !== 'always';
      const rendered = render(template.template, values);
      if (conditional) {
        // A conditional bullet is absent when its fact is absent, which is the
        // point of `when`: no "Material: " with nothing after it.
        if (rendered.missing || rendered.text === '') continue;
        bullets.push(rendered.text);
      } else if (rendered.missing || rendered.text === '') {
        add(
          'CATALOG_MISSING_COPY',
          `${path}.bullets`,
          `The bullet "${template.template}" could not be filled for "${sku}": a value it needs is empty in the export.`
        );
      } else {
        bullets.push(rendered.text);
      }
    }
    for (const extra of overrideCopy.extraBullets ?? []) bullets.push(String(extra));

    const kept = bullets.slice(0, bulletMax);
    if (kept.length < BULLET_MIN) {
      add(
        'CATALOG_MISSING_COPY',
        `${path}.bullets`,
        `"${sku}" produces ${kept.length} bullet(s); the item view needs at least ${BULLET_MIN} and the compiler will not invent one.`
      );
    }

    let rank;
    if (rankColumn) {
      const raw = Number(String(record.values[rankColumn] ?? '').trim());
      if (Number.isFinite(raw)) rank = raw;
      else {
        add(
          'CATALOG_BAD_RANK',
          `${path}.rank`,
          `The rank column "${rankColumn}" holds "${record.values[rankColumn]}" for "${sku}", which is not a number, so this item carries no rank.`,
          'warning'
        );
      }
    }

    items.push({
      id,
      label,
      summary: summary.text,
      bullets: kept,
      ...(rank === undefined ? {} : { rank }),
      traits,
      sku,
      skuMba
    });
    stats.skuById[id] = sku;
  });

  if (issues.some((entry) => entry.severity === 'error')) return done();

  stats.fallbackCategories = [...usedFallback];
  stats.exclusiveValues = { ...exclusiveValues };

  /* -------------------------------------------------------------- questions */

  const awardedTraits = new Set();
  const questions = plan.questions.map((question, questionIndex) => {
    const path = `questions[${questionIndex}]`;
    const options = (Array.isArray(question.options) ? question.options : []).map((option, optionIndex) => {
      const optionPath = `${path}.options[${optionIndex}]`;
      /** @type {Record<string, number>} */
      const weights = {};

      for (const [trait, points] of Object.entries(option.awards ?? {})) {
        if (!declaredTraits.has(trait)) {
          add(
            'CATALOG_UNKNOWN_TRAIT',
            `${optionPath}.awards.${trait}`,
            `Option "${option.id}" awards the trait "${trait}", which no lexicon rule and no override defines, so it matches no product.`
          );
          continue;
        }
        /* An exclusive trait's value comes from the plan's sequence, not from the
           question text, so the plan carries no per-product number. */
        const declared = exclusiveValueFor(trait);
        const value = declared === undefined ? Number(points) : declared;
        if (declared !== undefined) exclusiveValues[trait] = declared;
        awardedTraits.add(trait);
        for (const item of items) {
          if (item.traits.has(trait)) weights[item.id] = (weights[item.id] ?? 0) + value;
        }
      }

      for (const wanted of option.only ?? []) {
        const wantedId = fold(wanted);
        const item = items.find((candidate) => candidate.id === wantedId || fold(candidate.sku) === wantedId);
        if (!item) {
          add(
            'CATALOG_UNKNOWN_ITEM',
            `${optionPath}.only`,
            `Option "${option.id}" names the item "${wanted}", which is not among the selected products.`
          );
          continue;
        }
        weights[item.id] = (weights[item.id] ?? 0) + Number(option.points ?? 1);
      }

      if (Object.keys(weights).length === 0) {
        add(
          'CATALOG_EMPTY_OPTION',
          `${optionPath}.weights`,
          `Option "${option.id}" reaches no product, so it can never influence the result. An answer that says nothing is decoration.`
        );
      }

      stats.options += 1;
      stats.weightEntries += Object.keys(weights).length;
      return { id: option.id, label: option.label, weights };
    });

    return {
      id: question.id,
      text: question.text,
      ...(question.help ? { help: question.help } : {}),
      options
    };
  });

  for (const trait of declaredTraits) {
    if (awardedTraits.has(trait)) continue;
    // An exclusive trait is deliberately unused: it exists so a product can be
    // separated from its siblings, and a plan that describes products by shared axes
    // never needs it. Every OTHER declared trait is a rule somebody wrote, and a rule
    // nothing awards is the mistake this warning is for.
    if (trait.startsWith('ex-')) continue;
    add(
      'CATALOG_UNUSED_TRAIT',
      'lexicon',
      `The trait "${trait}" is defined but no option awards it, so it distinguishes nothing. Remove it or use it.`,
      'warning'
    );
  }
  stats.traits = awardedTraits.size;

  if (issues.some((entry) => entry.severity === 'error')) return done();

  /* --------------------------------------------------------------- document */

  const document = {
    schemaVersion: SCHEMA_VERSION,
    gameId: game.gameId,
    version: game.version,
    title: game.title,
    lang: game.lang,
    intro: game.intro,
    outro: game.outro,
    maxQuestions: game.maxQuestions,
    marginThreshold: game.marginThreshold,
    items: items.map((item) => ({
      id: item.id,
      label: item.label,
      summary: item.summary,
      bullets: item.bullets,
      // The SKU in its original case, and the supplier reference, so a winner
      // can be ordered rather than only admired. The fingerprint already covers
      // the id (which IS the lowercased SKU), so these do not enter it.
      sku: item.sku,
      ...(item.skuMba ? { skuMba: item.skuMba } : {}),
      ...(item.rank === undefined ? {} : { rank: item.rank })
    })),
    questions
  };
  lastDocument = document;
  stats.items = document.items.length;
  stats.questions = document.questions.length;

  // The engine has the last word. Appended verbatim so a build fails with the
  // validator's own sentence rather than this module's paraphrase of it.
  const engineReport = validateGame(document);
  for (const entry of engineReport.issues) issues.push(entry);

  return done();
}
