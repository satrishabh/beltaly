// Checkout rules for a store with no backend (phase 1), ported from the Codex/Astro build.
// Pure functions: no DOM or storage access, so they run in Node tests unchanged.
// A cart line is { productId, size, quantity }; each product has a single colour.

export const MAX_QUANTITY = 99;

export const PAYMENT_METHODS = {
  whatsapp: 'Order on WhatsApp',
  upi: 'Pay with UPI',
  paymentLink: 'Open payment link',
  cod: 'Cash on Delivery (confirm on WhatsApp)',
};

const findProduct = (products, id) => products.find((product) => product.id === id);

export function totals(items, products, settings, method = 'whatsapp') {
  const subtotal = items.reduce((sum, item) => sum + (findProduct(products, item.productId)?.price || 0) * item.quantity, 0);
  const shipping = subtotal > 0 && subtotal < settings.freeShippingAbove ? settings.shippingFee : 0;
  const cod = method === 'cod' && subtotal > 0 ? settings.codCharge : 0;
  return { subtotal, shipping, cod, total: subtotal + shipping + cod };
}

// Throws a shopper-safe message when the bag can't be ordered. Stock is checked across sizes of the same product.
export function validateItems(items, products) {
  if (!items.length) throw new Error('Your bag is empty.');
  const counts = new Map();
  for (const item of items) {
    const product = findProduct(products, item.productId);
    if (!product || !product.sizes.includes(item.size) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      throw new Error('A bag item is no longer available. Remove it and choose again.');
    }
    counts.set(product.id, (counts.get(product.id) || 0) + item.quantity);
    if (counts.get(product.id) > product.stock) throw new Error(`${product.name}: only ${product.stock} available.`);
  }
}

// BLT-YYMMDD-XXXX, date in India time.
export function orderId(now = new Date(), random = () => globalThis.crypto.randomUUID()) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: '2-digit', month: '2-digit', day: '2-digit' }).format(now).replaceAll('-', '');
  return `BLT-${date}-${random().replace(/-/g, '').slice(0, 4).toUpperCase()}`;
}

export const isValidPincode = (pin) => /^\d{6}$/.test(String(pin).trim());
export const isServiceable = (pin, settings) => settings.pincodes.includes(String(pin).trim());

export function pincodeMessage(pin, settings) {
  if (!isValidPincode(pin)) return 'Enter a valid 6-digit Indian pincode.';
  return isServiceable(pin, settings)
    ? 'This pincode is serviceable. The store will confirm dispatch and delivery dates.'
    : 'We are not serving this pincode yet. Contact us to ask.';
}

// Waist (inches) → suggested belt size: about 2 inches larger, rounded up to an even size.
export function suggestedSize(waistInches) {
  const waist = Number(waistInches);
  if (!waist || waist < 18 || waist > 60) return null;
  const inches = Math.ceil((waist + 2) / 2) * 2;
  return { inches, cm: Math.round(inches * 2.54) };
}

export function validateCustomer(customer) {
  if (!customer.name.trim() || !customer.address.trim() || !/^\d{10}$/.test(customer.phone) || !isValidPincode(customer.pincode)) {
    throw new Error('Enter a name, 10-digit mobile number, full address and 6-digit pincode.');
  }
}

// Builds an order *request*. It is never marked paid or confirmed: the store does that after checking stock and payment.
export function createOrderRequest(items, customer, method, products, settings, now = new Date()) {
  validateItems(items, products);
  const clean = { name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim(), pincode: customer.pincode.trim() };
  validateCustomer(clean);
  if (!isServiceable(clean.pincode, settings)) throw new Error('This pincode is not in our delivery area yet.');
  if (!settings.methods[method]) throw new Error('This payment method is not available.');
  if (['whatsapp', 'cod', 'upi'].includes(method) && !/^\d{10,15}$/.test(settings.whatsapp)) {
    throw new Error('Ordering is not configured yet. The store must add its WhatsApp number in settings.');
  }
  if (method === 'upi' && !/^[\w.-]+@[\w.-]+$/.test(settings.upiVpa)) throw new Error('The store must add a valid UPI ID in settings.');
  return {
    id: orderId(now),
    createdAt: now.toISOString(),
    status: 'Request prepared',
    items: items.map((item) => ({ ...item })),
    customer: clean,
    method,
    ...totals(items, products, settings, method),
  };
}

export function orderSummary(order, products, money) {
  return [
    `Beltaly order request ${order.id}`,
    `Method: ${PAYMENT_METHODS[order.method]}`,
    ...order.items.map((item) => {
      const product = findProduct(products, item.productId);
      return `${product?.name ?? item.productId} · ${product?.colour ?? ''} · ${item.size} in × ${item.quantity}`;
    }),
    `Subtotal: ${money(order.subtotal)}`,
    `Shipping: ${money(order.shipping)}`,
    `COD: ${money(order.cod)}`,
    `Total: ${money(order.total)} (inclusive of all taxes)`,
    `Name: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    `Address: ${order.customer.address}`,
    `Pincode: ${order.customer.pincode}`,
  ].join('\n');
}

export const whatsappUrl = (number, text = '') => `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export function upiUrl(order, settings) {
  return `upi://pay?${new URLSearchParams({ pa: settings.upiVpa, pn: settings.payeeName, am: order.total.toFixed(2), cu: 'INR', tn: order.id })}`;
}

// Per-product link only when the bag has a single product; otherwise the store-wide link.
export function paymentLinkFor(order, products, settings) {
  const perProduct = order.items.length === 1 ? findProduct(products, order.items[0].productId)?.paymentLink : '';
  const link = perProduct || settings.paymentLink;
  return /^https:\/\//.test(link || '') ? link : null;
}
