/**
 * A CSV reader.
 *
 * Written rather than imported because the project has no dependencies, and
 * small on purpose: it implements RFC 4180 and stops there. No type coercion, no
 * trimming, no header guessing, no delimiter sniffing. Everything of that kind is
 * the caller's decision, and a reader that makes decisions silently is exactly
 * the kind of component that turns a data mistake into a wrong recommendation.
 *
 * The one thing it does have to get right is the file this catalog actually
 * ships: `categories_id_json` is a JSON document inside a CSV field, so it
 * contains commas AND double quotes, doubled to escape them. A naive
 * `split(',')` mangles it into six fields, the categories become nonsense, and
 * the products lose the traits the questions are supposed to match on.
 *
 * Deliberate liberties, each because the alternative is worse:
 *   - `\r\n`, `\n` and a bare `\r` all end a record. RFC 4180 says CRLF; a file
 *     exported by a Windows tool and re-saved by a Mac editor is common, and
 *     refusing to read it helps nobody.
 *   - A quote that is not the first character of a field is a literal quote, so
 *     `Bolsa 9.5" auto` reads as typed instead of swallowing the rest of the file.
 *   - A completely blank line becomes a record with one empty field, NOT a
 *     skipped line. Dropping lines silently is what makes a "short" file look
 *     fine; the caller reports the shape mismatch instead.
 *   - An unterminated quote is reported (`unterminated: true`), not thrown: the
 *     caller can show a message rather than crash a build.
 *
 * FROZEN. See src/core/freeze.js.
 */

/** @typedef {{ headers: string[], rows: string[][], unterminated: boolean }} CsvTable */

/** @typedef {{ index: number, record: number, fields: string[], values: Record<string,string>, complete: boolean }} CsvRecord */

const DEFAULT_DELIMITER = ',';
const DEFAULT_QUOTE = '"';

/**
 * Split CSV text into a header row and data rows.
 *
 * @param {string} text
 * @param {{ delimiter?: string, quote?: string }} [options]
 * @returns {CsvTable}
 */
export function parseCsv(text, options = {}) {
  const delimiter = typeof options.delimiter === 'string' && options.delimiter !== ''
    ? options.delimiter
    : DEFAULT_DELIMITER;
  const quote = typeof options.quote === 'string' && options.quote !== ''
    ? options.quote
    : DEFAULT_QUOTE;

  const source = typeof text === 'string' ? text : '';
  // A BOM is invisible and would otherwise become part of the first header name,
  // so `values['sku']` would be undefined with no clue as to why.
  const body = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;

  /** @type {string[][]} */
  const rows = [];
  /** @type {string[]} */
  let row = [];
  let field = '';
  let inQuotes = false;
  let fieldWasQuoted = false;
  let unterminated = false;

  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];

    if (inQuotes) {
      if (ch === quote) {
        if (body[i + 1] === quote) {
          field += quote; // "" inside a quoted field is one literal quote
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch; // includes the delimiter and both line endings
      }
      continue;
    }

    if (ch === quote && field === '' && !fieldWasQuoted) {
      inQuotes = true;
      fieldWasQuoted = true;
      continue;
    }

    if (ch === delimiter) {
      row.push(field);
      field = '';
      fieldWasQuoted = false;
      continue;
    }

    if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && body[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      fieldWasQuoted = false;
      rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  if (inQuotes) unterminated = true;

  // Anything left is a final record. Text that ended exactly on a line ending
  // leaves nothing behind, which is why a trailing newline adds no empty row —
  // but an empty quoted last field ("a,b,\"\"" or "a,b,") still does.
  if (field !== '' || row.length > 0 || fieldWasQuoted) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.length > 0 ? rows[0] : [];
  return { headers, rows: rows.slice(1), unterminated };
}

/**
 * Pair data rows with the header names, keeping the row's own shape visible.
 *
 * `complete` is false for a row whose field count differs from the header count.
 * The value is deliberately NOT hidden: a short row usually means an unescaped
 * delimiter somewhere earlier, and the caller should say so.
 *
 * @param {CsvTable} table
 * @returns {CsvRecord[]}
 */
export function toRecords(table) {
  const headers = Array.isArray(table?.headers) ? table.headers : [];
  const rows = Array.isArray(table?.rows) ? table.rows : [];
  return rows.map((fields, index) => ({
    index,
    record: index + 1,
    fields,
    values: Object.fromEntries(headers.map((header, position) => [header, fields[position] ?? ''])),
    complete: fields.length === headers.length
  }));
}
