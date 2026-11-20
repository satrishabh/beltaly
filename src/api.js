// Integration seam. Every backend-shaped action goes through this module.
// Today each function is backed by localStorage; replace the bodies with real
// API calls (auth provider, checkout/payments, order service, CRM) without
// touching the UI components. All functions are async so the UI already
// handles pending and error states.
import { products, settings } from './catalog.js';
import { createOrderRequest } from './commerce.js';
import { STORAGE_KEYS, readProfile, writeJson } from './storage.js';

const delay = (ms = 250) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function signUp({ name, email }) {
  await delay();
  const normalizedEmail = email.trim().toLowerCase();
  if (readProfile()?.email === normalizedEmail) throw new Error('That email already has an account. Sign in instead.');
  const profile = { name: name.trim(), email: normalizedEmail, createdAt: new Date().toISOString() };
  writeJson(STORAGE_KEYS.profile, profile);
  return profile;
}

// Demo only: no password is stored or checked. A real provider must verify it server-side.
export async function signIn({ email }) {
  await delay();
  const profile = readProfile();
  if (!profile || profile.email !== email.trim().toLowerCase()) throw new Error('We could not find that account. Create a new account to continue.');
  return profile;
}

export async function requestPasswordReset() {
  await delay();
  return 'If an account matches this email, password reset instructions will be sent.';
}

// Phase 1 (no backend): validates the bag, customer and pincode, and returns an order *request*
// with a BLT-YYMMDD-XXXX reference. The shopper then sends it on WhatsApp, pays by UPI or a
// payment link; the store confirms stock and payment itself. Nothing here marks an order as paid.
// Phase 2: POST to your order API here (e.g. create a Razorpay order and confirm via webhook).
export async function prepareOrder({ items, customer, method }) {
  await delay(200);
  return createOrderRequest(items, customer, method, products, settings);
}

export async function submitBusinessRequest(request) {
  await delay();
  const record = { ...request, createdAt: new Date().toISOString() };
  writeJson(STORAGE_KEYS.businessRequest, record);
  return record;
}

export async function subscribeNewsletter(email) {
  await delay();
  return { email: email.trim().toLowerCase() };
}
