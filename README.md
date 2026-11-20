# Beltaly Storefront (React)

A React + Vite storefront for **Beltaly**, a belt and leather goods company (wallets coming soon), built for Indian shoppers. It runs with no backend: shoppers prepare an order request and send it on WhatsApp, pay with UPI, use a payment link, or choose Cash on Delivery. The store then confirms the order directly.

The store content, checkout rules, Hindi strings and black-and-gold design come from the Codex-built Astro store in `D:\2026\beltely`. This app uses the same data files and the same rules.

## Features

- **24 sample belts** across Formal, Casual, Ethnic & Wedding, Reversible, Kids and Gift Sets, priced ₹499–₹4,999
- Prices in INR with Indian digit grouping (₹1,49,999), MRP strike-through, % off, "Inclusive of all taxes"
- **Shop filters** for category, material, colour, width, buckle, maximum price and sort. Filters are stored in the URL, so filtered views can be shared.
- Search with multi-word matching and small-typo tolerance
- **Product page:** gallery with zoom, sizes in inches and cm, delivery pincode checker, waist-to-belt size calculator, care notes, "Ask on WhatsApp", related belts, Product JSON-LD with an INR offer
- **Checkout without a backend:** name, 10-digit mobile number, address and pincode, then one of:
  - Order on WhatsApp (pre-filled order summary)
  - Pay with UPI (`upi://pay` link and QR code, then "I've paid" on WhatsApp)
  - Payment link (Razorpay or Cashfree link, per product or store-wide; HTTPS only)
  - Cash on Delivery (COD charge added, confirmed on WhatsApp)
- Order reference `BLT-YYMMDD-XXXX` (India date). It's always a *request*: nothing is marked paid or confirmed.
- Shipping fee with free shipping above a threshold, a progress bar in the bag, and stock checked across sizes
- **English / हिन्दी toggle** covering navigation, home page, filters, product and checkout labels
- Saved belts, order request history and "add these to bag again", a demo account, and a business enquiry form
- Floating WhatsApp button, mobile bottom navigation (Home, Shop, Search, Cart, Account), and a size guide, About, Contact, FAQ, Shipping, Privacy and Terms pages
- Black-and-gold theme from the Beltaly logo; respects reduced-motion settings

## Run locally

```bash
npm install
npm run dev      # dev server
npm test         # commerce, data and search tests (Node's built-in runner)
npm run build    # production build to dist/
npm run preview  # serve the build
```

Routes use `#/` hashes (`#/shop?category=formal`, `#/shop/formal/the-everyday-tan`, `#/cart`). Any static host works, including GitHub Pages under a subpath, with no rewrite rules.

## Setting up the store (no code)

Everything is in `src/data/`:

| File | What it holds |
| --- | --- |
| `settings.json` | WhatsApp number, UPI ID and payee name, payment link, enabled payment methods, shipping fee, free-shipping threshold, COD charge, delivery area (`deliverAllIndia: true` accepts any valid Indian pincode; set it to `false` to allow only the `pincodes` list), announcement bar, GSTIN, Instagram, logo, Cloudinary cloud name |
| `products.json` | Products: `id, slug, name, category, material, colour, width, buckle, price, mrp, sizes, stock, description, care, images, badge, paymentLink` |
| `categories.json`, `collections.json`, `banners.json` | Categories, the bestsellers collection, the occasion banner |
| `en.json`, `hi.json`, `ui.json` | English and Hindi strings |

**Before taking orders,** set `whatsapp` in `settings.json` (country code and number, digits only, e.g. `919876543210`). Until then, checkout explains that ordering isn't open yet. For UPI, also set `upiVpa` (e.g. `beltaly@okhdfcbank`) and `payeeName`.

Product photos go in `public/products/` (referenced as `/products/name.jpg`), or use HTTPS URLs. If `cloudinaryCloud` is set, remote images are served through Cloudinary's optimiser. Problems in the product data are logged in the browser console and the bad rows are skipped. `npm test` fails and names the row and field.

## Project structure

| File | Purpose |
| --- | --- |
| `src/main.jsx` | App shell: routing, header, bag drawer, search, footer, mobile nav |
| `src/views/` | Home, Shop, ProductPage, Checkout, InfoPage, Account, shared components |
| `src/catalog.js` | Loads and validates data; filters, search, ₹ formatting, image URLs |
| `src/commerce.js` | Pure checkout rules: totals, stock, order IDs, WhatsApp/UPI messages, size calculator |
| `src/api.js` | **Integration seam:** auth, `prepareOrder`, business requests, newsletter |
| `src/storage.js` | localStorage keys, safe read/write and sanitisers |
| `src/i18n.js` | English/Hindi lookup |
| `src/ErrorBoundary.jsx` | Crash recovery screen |
| `tests/commerce.test.js` | 13 tests |

## Moving to a backend later

Replace function bodies in `src/api.js`. The UI already handles pending, error and success states.

| Function | Replace with |
| --- | --- |
| `prepareOrder({ items, customer, method })` | Your order API, e.g. create a Razorpay order, then confirm payment via webhook |
| `signUp`, `signIn`, `requestPasswordReset` | Auth provider (Supabase, Clerk, Auth0) |
| `submitBusinessRequest` | CRM or form backend |
| `subscribeNewsletter` | Email platform |

To load the catalogue from Google Sheets, Supabase or a CMS, map the rows to the `products.json` shape in `src/catalog.js`. The Astro project's `src/data/providers/` already includes those adapters.

## Still pending

- Real WhatsApp number, UPI ID, GSTIN and policies in `settings.json` and the info pages
- Real product photos (the current images are sample SVG drawings)
- Real authentication: the demo sign-in only matches an email saved in this browser and **never checks passwords**
- Payment verification and persistent orders (needs a backend)

The previous version of this app (the micro-adjust belt store) is kept in `_backup/react-before-codex-port/`.
