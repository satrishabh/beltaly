// Integration seam. Every backend-shaped action goes through this module, so a real order API
// (e.g. Razorpay + an order service) can replace it later without touching the UI components.
import { products, settings } from './catalog.js';
import { createOrderRequest } from './commerce.js';

const delay = (ms = 200) => new Promise((resolve) => window.setTimeout(resolve, ms));

// Phase 1 (no backend): validates the bag, customer and pincode, and returns an order *request*
// with a BLT-YYMMDD-XXXX reference. The shopper then sends it on WhatsApp, pays by UPI or a
// payment link; the store confirms stock and payment itself. Nothing here marks an order as paid.
// Phase 2: POST to your order API here (e.g. create a Razorpay order and confirm via webhook).
export async function prepareOrder({ items, customer, method }) {
  await delay();
  return createOrderRequest(items, customer, method, products, settings);
}
