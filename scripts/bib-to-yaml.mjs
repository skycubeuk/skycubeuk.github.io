/**
 * bib-to-yaml.mjs
 *
 * Converts public/bib/pubs.bib → src/content/publications/{key}.yaml
 * Cover image metadata is merged from src/content/publication-covers.yaml.
 *
 * Run: node scripts/bib-to-yaml.mjs
 * Or:  npm run sync-pubs
 */

import { createRequire } from 'module';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import { stringify as stringifyYaml } from 'yaml';

const require = createRequire(import.meta.url);
const bibtex = require('bibtex-parse');

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const BIB_FILE = join(root, 'public', 'bib', 'pubs.bib');
const PUBS_DIR = join(root, 'src', 'content', 'publications');
const COVERS_FILE = join(root, 'src', 'content', 'publication-covers.yaml');

// ─── LaTeX character decoding ─────────────────────────────────────────────────

const LATEX_MAP = [
  // Double-braced wrappers first (e.g. {{Title Case}})
  [/\{\{([^}]*)\}\}/g, '$1'],
  // Accented characters — common LaTeX sequences
  [/\{\\"\{u\}\}/g, 'ü'],
  [/\{\\"\{U\}\}/g, 'Ü'],
  [/\{\\"\{o\}\}/g, 'ö'],
  [/\{\\"\{O\}\}/g, 'Ö'],
  [/\{\\"\{a\}\}/g, 'ä'],
  [/\{\\"\{A\}\}/g, 'Ä'],
  [/\{\\'\\{e\\}\}/g, 'é'],
  [/\{\\'e\}/g, 'é'],
  [/\{\\'\{e\}\}/g, 'é'],
  [/\{\\'\{i\}\}/g, 'í'],
  [/\{\\'\{I\}\}/g, 'Í'],
  [/\{\\'\{a\}\}/g, 'á'],
  [/\{\\'\{A\}\}/g, 'Á'],
  [/\{\\'\{o\}\}/g, 'ó'],
  [/\{\\'\{O\}\}/g, 'Ó'],
  [/\{\\'\{u\}\}/g, 'ú'],
  [/\{\\'\{U\}\}/g, 'Ú'],
  [/\{\\c\{c\}\}/g, 'ç'],
  [/\{\\c\{C\}\}/g, 'Ç'],
  [/\{\\~\{n\}\}/g, 'ñ'],
  [/\{\\~\{N\}\}/g, 'Ñ'],
  [/\{\\aa\}/g, 'å'],
  [/\{\\AA\}/g, 'Å'],
  [/\{\\ae\}/g, 'æ'],
  [/\{\\AE\}/g, 'Æ'],
  [/\{\\oe\}/g, 'œ'],
  [/\{\\OE\}/g, 'Œ'],
  // Escaped chars inside braces like {\"u} (without extra braces)
  [/\\"([uUoOaA])/g, (_, c) => ({ u: 'ü', U: 'Ü', o: 'ö', O: 'Ö', a: 'ä', A: 'Ä' })[c]],
  [/\\'([eEiIaAoOuU])/g, (_, c) => ({ e: 'é', E: 'É', i: 'í', I: 'Í', a: 'á', A: 'Á', o: 'ó', O: 'Ó', u: 'ú', U: 'Ú' })[c]],
  // bibtex-parse strips backslashes, leaving literal " + letter (e.g. M"uller)
  [/"([uUoOaA])/g, (_, c) => ({ u: 'ü', U: 'Ü', o: 'ö', O: 'Ö', a: 'ä', A: 'Ä' })[c]],
  // bibtex-parse strips \' leaving literal ' + letter (e.g. 'ia → ía in García)
  [/'([eEiIaAoOuU])/g, (_, c) => ({ e: 'é', E: 'É', i: 'í', I: 'Í', a: 'á', A: 'Á', o: 'ó', O: 'Ó', u: 'ú', U: 'Ú' })[c]],
  // Strip single braces used for capitalisation protection: {CO} → CO
  [/\{([^{}]*)\}/g, '$1'],
];

function decodeLatex(str) {
  if (!str) return str;
  let s = str;
  for (const [pattern, replacement] of LATEX_MAP) {
    s = s.replace(pattern, replacement);
  }
  // Collapse any remaining braces that weren't caught above
  s = s.replace(/[{}]/g, '');
  return s.trim();
}

// ─── Author normalisation ─────────────────────────────────────────────────────
// BibTeX uses two formats: "Last, First" or "First Last", separated by " and ".
// We always output "First Last" separated by ", ".

function normaliseAuthors(authorStr) {
  if (!authorStr) return '';
  const raw = decodeLatex(authorStr);
  return raw
    .split(/\s+and\s+/i)
    .map(name => {
      name = name.trim();
      if (name.includes(',')) {
        // "Last, First [Middle]" → "First [Middle] Last"
        const [last, ...rest] = name.split(',').map(s => s.trim());
        const first = rest.join(' ');
        return first ? `${first} ${last}` : last;
      }
      return name; // already "First Last"
    })
    .join(', ');
}

// ─── Field mapping ────────────────────────────────────────────────────────────

function entryToYaml(entry, coverData) {
  const f = (k) => entry[k] ?? null;

  const obj = {};

  // Store the citation key for reference and CMS relation widget
  obj.key = entry.key;

  const title = decodeLatex(f('TITLE'));
  if (!title) throw new Error(`Entry ${entry.key} is missing a title`);
  obj.title = title;

  const authors = normaliseAuthors(f('AUTHOR'));
  if (!authors) throw new Error(`Entry ${entry.key} is missing authors`);
  obj.authors = authors;

  const journal = decodeLatex(f('JOURNAL'));
  if (!journal) throw new Error(`Entry ${entry.key} is missing a journal`);
  obj.journal = journal;

  const yearStr = f('YEAR');
  if (!yearStr) throw new Error(`Entry ${entry.key} is missing a year`);
  obj.year = parseInt(yearStr, 10);

  if (f('DOI')) obj.doi = f('DOI');
  if (f('URL')) obj.url = f('URL');
  if (f('ABSTRACT')) obj.abstract = decodeLatex(f('ABSTRACT'));
  if (f('VOLUME')) obj.volume = f('VOLUME');
  if (f('PAGES')) obj.pages = f('PAGES').replace('--', '–'); // em dash

  // Merge cover image metadata from sidecar
  const cover = coverData[entry.key];
  if (cover) {
    obj.isCover = true;
    if (cover.coverImage) obj.coverImage = cover.coverImage;
    if (cover.coverThumb) obj.coverThumb = cover.coverThumb;
  }

  return obj;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const bibSrc = readFileSync(BIB_FILE, 'utf8');
  const entries = bibtex.entries(bibSrc);

  const coverData = existsSync(COVERS_FILE)
    ? Object.fromEntries(
        ((parseYaml(readFileSync(COVERS_FILE, 'utf8')) ?? {}).covers ?? [])
          .map(c => [c.key, c])
      )
    : {};

  let generated = 0;
  let errors = 0;

  for (const entry of entries) {
    if (entry.type !== 'article') continue;

    try {
      const data = entryToYaml(entry, coverData);
      const yamlStr = stringifyYaml(data, {
        lineWidth: 0,      // no line wrapping
        defaultKeyType: 'PLAIN',
      });
      const outPath = join(PUBS_DIR, `${entry.key}.yaml`);
      writeFileSync(outPath, yamlStr, 'utf8');
      generated++;
      console.log(`  ✓ ${entry.key}`);
    } catch (err) {
      console.error(`  ✗ ${entry.key}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nGenerated ${generated} YAML file(s).${errors ? ` ${errors} error(s).` : ''}`);
  if (errors) process.exit(1);
}

main();
