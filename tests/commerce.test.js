import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categories, findProductProblems, matchesSearch, money, products, settings as storeSettings } from '../src/catalog.js';
import { createOrderRequest, orderId, orderSummary, paymentLinkFor, pincodeMessage, suggestedSize, totals, upiUrl, validateItems } from '../src/commerce.js';

// Store settings with ordering switched on (the shipped settings.json has no WhatsApp number yet).
const settings = { ...storeSettings, whatsapp: '919876543210', upiVpa: 'beltaly@upi', methods: { whatsapp: true, upi: true, paymentLink: true, cod: true } };
const first = products[0];
const item = { productId: first.id, size: first.sizes[1], quantity: 1 };
const customer = { name: 'Test Shopper', phone: '9876543210', address: '10 Sample Street', pincode: '110001' };

test('catalog data is valid: 24 products, known categories, INR prices ₹499–₹4,999', () => {
  assert.deepEqual(findProductProblems(products, categories.map((c) => c.id)), []);
  assert.equal(products.length, 24);
  for (const p of products) assert.ok(p.price >= 499 && p.price <= 4999, `${p.id} price ${p.price}`);
});

test('validation names the spreadsheet row and field', () => {
  const broken = structuredClone(products);
  broken[0].price = -1;
  broken[1].id = broken[2].id;
  const problems = findProductProblems(broken, categories.map((c) => c.id));
  assert.ok(problems.some((p) => /row 2 .*price/.test(p)));
  assert.ok(problems.some((p) => /duplicate id/.test(p)));
});

test('rupees use Indian digit grouping', () => {
  assert.equal(money(149999), '₹1,49,999');
});

test('shipping threshold and COD charge are added to the total', () => {
  const single = totals([item], products, settings, 'cod');
  assert.equal(single.subtotal, first.price);
  assert.equal(single.shipping, first.price < settings.freeShippingAbove ? settings.shippingFee : 0);
  assert.equal(single.cod, settings.codCharge);
  assert.equal(single.total, single.subtotal + single.shipping + single.cod);
  assert.equal(totals([{ ...item, quantity: 3 }], products, settings).shipping, 0);
  assert.equal(totals([], products, settings, 'cod').total, 0);
});

test('stock is checked across sizes of the same belt', () => {
  const half = Math.ceil(first.stock / 2) + 1;
  assert.throws(() => validateItems([{ ...item, quantity: half }, { ...item, size: first.sizes[2], quantity: half }], products), /only/);
  assert.throws(() => validateItems([{ ...item, size: 99 }], products), /no longer/);
  assert.throws(() => validateItems([{ ...item, quantity: -1 }], products), /no longer/);
  assert.throws(() => validateItems([], products), /empty/);
});

test('order request rejects an unserviceable pincode and bad phone numbers', () => {
  assert.throws(() => createOrderRequest([item], { ...customer, pincode: '999999' }, 'whatsapp', products, { ...settings, deliverAllIndia: false }), /delivery area/);
  assert.throws(() => createOrderRequest([item], { ...customer, phone: '12345' }, 'whatsapp', products, settings), /10-digit/);
});

test('ordering stays closed until the store adds a WhatsApp number', () => {
  assert.throws(() => createOrderRequest([item], customer, 'whatsapp', products, { ...settings, whatsapp: '' }), /not configured/);
  assert.throws(() => createOrderRequest([item], customer, 'upi', products, { ...settings, upiVpa: '' }), /UPI/);
  assert.throws(() => createOrderRequest([item], customer, 'cod', products, { ...settings, methods: { ...settings.methods, cod: false } }), /not available/);
});

test('order request has a BLT reference and is never marked paid', () => {
  const order = createOrderRequest([item], customer, 'cod', products, settings, new Date('2026-11-20T10:00:00Z'));
  assert.match(order.id, /^BLT-261120-[A-F0-9]{4}$/);
  assert.equal(order.method, 'cod');
  assert.equal(order.total, totals([item], products, settings, 'cod').total);
  assert.ok(!('paid' in order));
  const text = orderSummary(order, products, money);
  assert.match(text, new RegExp(order.id));
  assert.match(text, /Pincode: 110001/);
});

test('UPI link carries payee, amount and reference', () => {
  const order = createOrderRequest([item], customer, 'upi', products, settings);
  const url = new URL(upiUrl(order, settings).replace('upi://', 'https://upi/'));
  assert.equal(url.searchParams.get('pa'), 'beltaly@upi');
  assert.equal(url.searchParams.get('am'), order.total.toFixed(2));
  assert.equal(url.searchParams.get('tn'), order.id);
  assert.equal(url.searchParams.get('cu'), 'INR');
});

test('payment links must be HTTPS', () => {
  const order = createOrderRequest([item], customer, 'paymentLink', products, { ...settings, paymentLink: 'https://rzp.io/l/beltaly' });
  assert.equal(paymentLinkFor(order, products, { ...settings, paymentLink: 'https://rzp.io/l/beltaly' }), 'https://rzp.io/l/beltaly');
  assert.equal(paymentLinkFor(order, products, { ...settings, paymentLink: 'javascript:alert(1)' }), null);
});

test('order IDs use India date', () => {
  assert.equal(orderId(new Date('2026-11-19T20:00:00Z'), () => 'abcd-0000'), 'BLT-261120-ABCD');
});

test('size calculator and pincode checker', () => {
  assert.deepEqual(suggestedSize(32), { inches: 34, cm: 86 });
  assert.deepEqual(suggestedSize(33), { inches: 36, cm: 91 });
  assert.equal(suggestedSize(5), null);
  assert.match(pincodeMessage('12', settings), /valid/);
  assert.match(pincodeMessage('110001', settings), /We deliver/);
  assert.match(pincodeMessage('012345', settings), /valid/);
  const listOnly = { ...settings, deliverAllIndia: false };
  assert.match(pincodeMessage('999999', listOnly), /not serving/);
  assert.match(pincodeMessage('110001', listOnly), /We deliver/);
});

test('deliver-all-India accepts any valid pincode', () => {
  assert.match(pincodeMessage('682001', settings), /We deliver/);
  assert.ok(createOrderRequest([item], { ...customer, pincode: '682001' }, 'whatsapp', products, settings));
  assert.throws(() => createOrderRequest([item], { ...customer, pincode: '012345' }, 'whatsapp', products, settings), /6-digit/);
});

test('search matches multiple words and small typos', () => {
  const tan = products.find((p) => p.colour === 'Tan');
  assert.ok(matchesSearch(tan, 'tan'));
  assert.ok(matchesSearch(tan, `${tan.colour} ${tan.material}`));
  assert.ok(matchesSearch(products.find((p) => p.category === 'ethnic'), 'weding'));
  assert.ok(!matchesSearch(tan, 'zzzz'));
});
