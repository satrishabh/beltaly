import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
const root = resolve('dist');
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)]))).flat();
}
const all = await files(root);
const existing = new Set(all);
const html = all.filter(file => extname(file) === '.html');
const missing = [];
let products = 0;
await Promise.all(html.map(async file => {
  const text = await readFile(file, 'utf8');
  if (!text.includes('<title>') || !text.includes('name="description"')) throw new Error(`Missing SEO metadata: ${file}`);
  if (!text.toLowerCase().includes('beltaly')) throw new Error(`Missing Beltaly branding: ${file}`);
  for (const match of text.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    let target = match[1];
    if (/^[a-z]+:|^\/\//i.test(target)) continue;
    if (base && target.startsWith(base + '/')) target = target.slice(base.length);
    else if (base && target.startsWith('/')) { missing.push(`${file}: bypasses base path ${target}`); continue; }
    const path = target.startsWith('/') ? resolve(root, '.' + decodeURI(target)) : resolve(dirname(file), decodeURI(target));
    if (!existing.has(path) && !existing.has(resolve(path, 'index.html'))) missing.push(`${file}: ${target}`);
  }
  for (const match of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const schema = JSON.parse(match[1]);
    if (schema['@type'] === 'Product') {
      products++;
      if (schema.offers.priceCurrency !== 'INR' || schema.offers.price <= 0) throw new Error(`Invalid product offer: ${file}`);
    }
  }
}));
if (missing.length) throw new Error(missing.join('\n'));
if (products !== 24) throw new Error(`Expected 24 product schemas, got ${products}`);
const home = await readFile(resolve(root, 'index.html'), 'utf8');
if (!/wallets[\s\S]{0,80}coming soon/i.test(home)) throw new Error('Missing upcoming wallet messaging');
console.log(`Verified ${html.length} HTML pages, 24 INR Product schemas, Beltaly branding, wallet messaging, metadata and local links${base ? ' under ' + base : ''}.`);
