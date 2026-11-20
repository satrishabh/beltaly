// Lists every English string the storefront shows, so translators know exactly what to cover.
//   node scripts/i18n-keys.mjs          → writes src/locales/_keys.json
//   node scripts/i18n-keys.mjs --check  → exits 1 if any locale is missing keys or breaks a {placeholder}
// Sources: t('…') / t.rich('…') calls in src (first argument's string literals), plus store data
// (products, categories, banners, pages, settings) and the fixed messages in commerce.js and the account titles.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const read = (path) => readFileSync(join(src, path), 'utf8');
const json = (path) => JSON.parse(read(path));
const keys = new Set();
const add = (text) => { if (typeof text === 'string' && text.trim()) keys.add(text); };
const literals = (code) => [...code.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map((match) => match[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));

// 1. t(...) and t.rich(...) calls: take the first argument (up to the top-level comma) and collect its literals.
function firstArgument(code, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < code.length; i++) {
    const c = code[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (depth === 0) return code.slice(start, i); depth--; }
    else if (c === ',' && depth === 0) return code.slice(start, i);
  }
  return '';
}
for (const dir of ['', 'views']) {
  for (const file of readdirSync(join(src, dir)).filter((name) => /\.(jsx?|mjs)$/.test(name))) {
    const code = read(join(dir, file));
    for (const match of code.matchAll(/\bt(?:\.rich)?\(/g)) {
      const arg = firstArgument(code, match.index + match[0].length);
      if (!/^\s*(?:'|[\w.]+\s*\?|\()/.test(arg) && !arg.includes("'")) continue;
      literals(arg.replace(/\$\{[^}]*\}/g, '')).forEach(add);
    }
  }
}

// 2. Plain string tables that are translated at render time.
const info = read('views/InfoPage.jsx');
literals(info.slice(info.indexOf('const faqs = ['), info.indexOf('];', info.indexOf('const faqs = [')))).forEach(add);
const account = read('views/Account.jsx');
literals(account.slice(account.indexOf('ACCOUNT_TITLES = {'), account.indexOf('};', account.indexOf('ACCOUNT_TITLES = {')))).forEach(add);
const commerce = read('commerce.js');
literals(commerce.slice(commerce.indexOf('PAYMENT_METHODS = {'), commerce.indexOf('};', commerce.indexOf('PAYMENT_METHODS = {')))).forEach(add);
for (const match of commerce.matchAll(/(?:return|throw new Error\(|\?|:)\s*'([^'$]+)'/g)) if (/[a-z] [a-z]/i.test(match[1])) add(match[1]);

// 3. Store data.
const cap = (text) => text.replace(/^./, (c) => c.toUpperCase());
for (const product of json('data/products.json')) {
  [product.name, product.description, product.care, product.colour, product.badge, cap(product.material), `${cap(product.buckle)} buckle`].forEach(add);
}
for (const category of json('data/categories.json')) [category.name, category.description].forEach(add);
for (const banner of json('data/banners.json')) [banner.eyebrow, banner.title, banner.description].forEach(add);
for (const page of Object.values(json('data/pages.json'))) [page.title, page.heading].forEach(add);
add(json('data/settings.json').announcement);
add(json('data/settings.json').tagline);
for (const look of json('data/lookbook.json').items ?? []) add(look.caption);

const list = [...keys].filter((key) => !/^(en|hi|q|link|qrcode|locationchange|category)$/.test(key)).sort((a, b) => a.localeCompare(b));
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

if (process.argv.includes('--check')) {
  let failed = false;
  for (const file of readdirSync(join(src, 'locales')).filter((name) => /^[a-z]{2}\.json$/.test(name))) {
    const dict = JSON.parse(readFileSync(join(src, 'locales', file), 'utf8'));
    const missing = list.filter((key) => !dict[key]);
    const broken = list.filter((key) => dict[key] && placeholders(dict[key]) !== placeholders(key));
    if (missing.length || broken.length) {
      failed = true;
      console.log(`${file}: ${missing.length} missing, ${broken.length} with wrong {placeholders}`);
      [...missing.slice(0, 5), ...broken.slice(0, 5)].forEach((key) => console.log(`  - ${key}`));
    } else console.log(`${file}: all ${list.length} strings translated`);
  }
  process.exit(failed ? 1 : 0);
} else {
  writeFileSync(join(src, 'locales', '_keys.json'), `${JSON.stringify(list, null, 2)}\n`);
  console.log(`${list.length} strings → src/locales/_keys.json`);
}
