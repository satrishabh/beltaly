import { products } from './catalog.js';
import { MAX_QUANTITY } from './commerce.js';

// Every localStorage key the storefront uses, in one place.
// v2 keys: the cart shape changed (product + size), so old v1 bags are ignored rather than misread.
export const STORAGE_KEYS = {
  cart: 'beltaly-cart-v2',
  saved: 'beltaly-saved-v2',
  orders: 'beltaly-orders-v2',
  language: 'beltaly-language',
  viewed: 'beltaly-viewed',
  customer: 'beltaly-customer',
};

function readJson(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

// Writes never throw: private mode, quota errors and disabled storage are ignored.
export function writeJson(key, value) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    // Storage unavailable; state still works in memory for this session.
  }
}

export function clampQuantity(value) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.min(MAX_QUANTITY, Math.max(1, number)) : 1;
}

function normalizeLine(item) {
  const product = products.find((entry) => entry.id === item?.productId);
  const size = Number(item?.size);
  if (!product || !product.sizes.includes(size)) return null;
  return { productId: product.id, size, quantity: clampQuantity(item.quantity) };
}

const readLines = (value) => (Array.isArray(value) ? value.map(normalizeLine).filter(Boolean) : []);

export const readCart = () => readLines(readJson(STORAGE_KEYS.cart, []));

export function readSaved() {
  const stored = readJson(STORAGE_KEYS.saved, []);
  return Array.isArray(stored) ? [...new Set(stored.filter((id) => products.some((product) => product.id === id)))] : [];
}

export function readOrders() {
  const stored = readJson(STORAGE_KEYS.orders, []);
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((order) => order && typeof order.id === 'string' && Array.isArray(order.items))
    .map((order) => ({ ...order, total: Number(order.total) || 0, createdAt: order.createdAt || new Date().toISOString(), items: readLines(order.items) }))
    .slice(0, 50);
}

export function readLanguage() {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.language) === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
}

// Product ids the shopper opened most recently, newest first.
export function readViewed() {
  const stored = readJson(STORAGE_KEYS.viewed, []);
  return Array.isArray(stored) ? stored.filter((id) => products.some((product) => product.id === id)).slice(0, 8) : [];
}

export function rememberViewed(productId) {
  writeJson(STORAGE_KEYS.viewed, [productId, ...readViewed().filter((id) => id !== productId)].slice(0, 8));
}

// Delivery details the shopper chose to remember on this device.
export function readCustomer() {
  const stored = readJson(STORAGE_KEYS.customer, null);
  if (!stored || typeof stored !== 'object') return null;
  const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
  return { name: text(stored.name, 100), phone: text(stored.phone, 10).replace(/\D/g, ''), address: text(stored.address, 600), pincode: text(stored.pincode, 6).replace(/\D/g, '') };
}
