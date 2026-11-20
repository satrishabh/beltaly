// Catalog, settings and formatting helpers.
// Store content lives in src/data/*.json (same shape as the Codex/Astro store's content/ folder),
// so the owner can edit products and settings without touching UI code.
import rawProducts from './data/products.json' with { type: 'json' };
import rawCategories from './data/categories.json' with { type: 'json' };
import rawCollections from './data/collections.json' with { type: 'json' };
import rawBanners from './data/banners.json' with { type: 'json' };
import rawSettings from './data/settings.json' with { type: 'json' };

const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

// Returns a list of problems ("products: row 2 (BLT-001) price must be ..."). Row numbers match the CSV/Sheet rows.
export function findProductProblems(products, categoryIds) {
  const problems = [];
  const seen = new Set();
  products.forEach((p, index) => {
    const where = `products: row ${index + 2}${p?.id ? ` (${p.id})` : ''}`;
    if (!isText(p?.id)) problems.push(`${where} id is required`);
    else if (seen.has(p.id)) problems.push(`${where} duplicate id`);
    else seen.add(p.id);
    if (!isText(p?.slug) || !/^[a-z0-9-]+$/.test(p.slug)) problems.push(`${where} slug must be lowercase letters, numbers and dashes`);
    if (!isText(p?.name)) problems.push(`${where} name is required`);
    if (!categoryIds.includes(p?.category)) problems.push(`${where} category "${p?.category}" is not in categories`);
    if (!isPositiveInt(p?.price)) problems.push(`${where} price must be a whole number of rupees above 0`);
    if (!isPositiveInt(p?.mrp) || p.mrp < p.price) problems.push(`${where} mrp must be a whole number at least the price`);
    if (!Array.isArray(p?.sizes) || !p.sizes.length || !p.sizes.every(isPositiveInt)) problems.push(`${where} sizes must be a list of whole inch sizes`);
    if (!Number.isInteger(p?.stock) || p.stock < 0) problems.push(`${where} stock must be 0 or more`);
    if (!Array.isArray(p?.images) || !p.images.length || !p.images.every(isText)) problems.push(`${where} images needs at least one image`);
    if (p?.paymentLink && !/^https:\/\//.test(p.paymentLink)) problems.push(`${where} paymentLink must start with https://`);
    if (p?.amazon && !/^https:\/\/(www\.)?amazon\.in\//.test(p.amazon)) problems.push(`${where} amazon must be an https://www.amazon.in/ link`);
  });
  return problems;
}

const categoryIds = rawCategories.map((category) => category.id);
const productProblems = findProductProblems(rawProducts, categoryIds);
if (productProblems.length && typeof console !== 'undefined') console.warn(`Beltaly catalog: ${productProblems.length} problem(s)\n${productProblems.join('\n')}`);
const badIds = new Set(productProblems.map((problem) => problem.match(/\((.+?)\)/)?.[1]).filter(Boolean));
export const products = rawProducts.filter((product) => !badIds.has(product.id));
// Only categories that currently have products are shown in menus and filters.
export const categories = rawCategories.filter((category) => products.some((product) => product.category === category.id));

export const settings = rawSettings;
export const collections = rawCollections.map((collection) => ({ ...collection, productIds: collection.productIds.filter((id) => products.some((product) => product.id === id)) }));
export const banners = rawBanners.filter((banner) => banner.enabled && /^\/(?!\/)/.test(banner.href));

export const getProduct = (id) => products.find((product) => product.id === id) || null;
export const getCategory = (id) => rawCategories.find((category) => category.id === id) || null;
export const discountPercent = (product) => (product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0);

export const swatchColours = { Tan: '#a16b3e', Black: '#302b28', Brown: '#65422c', Cognac: '#a34f2c', 'Black & Brown': 'linear-gradient(90deg, #302b28 50%, #65422c 50%)' };

// Filter options derived from the data, so new materials or buckles appear automatically.
// A filter is shown only when products differ on it (no point filtering 3 belts by one material).
const unique = (key) => [...new Set(products.map((product) => product[key]).filter((value) => value !== undefined && value !== null && value !== '').map(String))];
export const filterFields = [
  { name: 'material', label: 'Material', values: unique('material') },
  { name: 'colour', label: 'Colour', values: unique('colour') },
  { name: 'width', label: 'Width (mm)', values: unique('width').sort((a, b) => a - b) },
  { name: 'buckle', label: 'Buckle', values: unique('buckle') },
].filter((field) => field.values.length > 1);

export function matchesFilters(product, filters) {
  if (filters.category && product.category !== filters.category) return false;
  for (const { name } of filterFields) if (filters[name] && String(product[name]) !== filters[name]) return false;
  const max = Number(filters.max);
  return !(max > 0 && product.price > max);
}

export const sorters = {
  featured: () => 0,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
};

// Multi-word search with simple typo tolerance (each word may match a word prefix or be one letter off).
function closeEnough(word, target) {
  if (target.startsWith(word) || target.includes(word)) return true;
  if (word.length < 4 || Math.abs(word.length - target.length) > 1) return false;
  let edits = 0;
  for (let i = 0, j = 0; i < word.length || j < target.length;) {
    if (word[i] === target[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (word.length > target.length) i++;
    else if (word.length < target.length) j++;
    else { i++; j++; }
  }
  return true;
}

export function matchesSearch(product, term) {
  const words = String(term ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const category = getCategory(product.category)?.name ?? '';
  const haystack = `${product.name} ${category} ${product.material} ${product.colour} ${product.buckle} ${product.badge ?? ''} ${product.description}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return words.every((word) => haystack.some((target) => closeEnough(word, target)));
}

// Indian rupee formatting with Indian digit grouping (₹1,49,999).
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const money = (value) => inr.format(Number.isFinite(Number(value)) ? Number(value) : 0);

// Local images respect Vite's base path (GitHub Pages subpaths); remote images can go through Cloudinary fetch.
export function imageUrl(path) {
  if (!path) return '';
  if (/^https:\/\//.test(path)) {
    return settings.cloudinaryCloud
      ? `https://res.cloudinary.com/${encodeURIComponent(settings.cloudinaryCloud)}/image/fetch/f_auto,q_auto,w_900/${encodeURIComponent(path)}`
      : path;
  }
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
