# Beltaly architecture

## Boundaries

`content/` or external provider → build-time adapter → Zod `StoreData` validation → Astro routes/components → static HTML and `catalogue.json`. UI components do not import storage-specific adapters. `getStore()` selects and caches a provider during the build. Validation checks fields, IDs, slugs, categories and collection references. External requests use the server-side build environment; no privileged secrets enter the browser.

The independent `src/services/commerce.ts` boundary owns `CartService`, `OrderService`, and `AuthService`. Static mode uses browser storage and direct communication. Product UI, search and filters use a normalized generated catalogue. All prices and stock are snapshots; owner acceptance remains necessary. Optional normalized live refresh affects interactive prices and availability only; it cannot reserve inventory.

`src/styles/tokens.css` defines palette, typography, spacing primitives and width. Store palette overrides come from validated settings. Tailwind utilities and a compact global stylesheet provide the responsive shell. The visual system is original: buckle logo, saddle-stitch separators, belt-hole steps and horizontally scrolling product cards. Original SVG mock-ups keep the demo self-contained. Real raster photography should be delivered through responsive image transforms when added.

## Backend contract

The API clients exist behind `PUBLIC_SERVICE_MODE=api` and `PUBLIC_API_URL`. They are integration stubs until a real service implements these endpoints:

| Endpoint | Contract |
| --- | --- |
| GET /cart | CartItem[] for an authenticated user or signed guest session |
| PUT /cart | `{items: CartItem[]}`; return 204 or JSON; validate variants and quantities |
| POST /orders | `{items,customer,method}`; return Order with server-generated id and recalculated totals |
| GET /auth/me | `{name}` or null; use secure HttpOnly session cookies |

Use `PUBLIC_SERVICE_MODE=static` until that service is deployed. Changing the service selector needs configuration and rebuild only; **implementing and deploying the real backend is separate work**. API mode still uses the existing direct-payment presentation; add a hosted checkout method to the service contract when automating payment collection.

For Supabase auth/orders, implement the same contract in an edge/API layer; use RLS for per-user orders and customer data. Never give browser clients direct unrestricted writes to catalogue, prices or order status. For a Node API, implement authoritative stock checks, server totals, idempotency keys, inventory reservation and signed Razorpay/Cashfree webhooks. Mark orders paid only after webhook signature verification and reconciliation of amount/currency/reference; never trust an “I’ve paid” click. Add rate limiting and authenticated admin operations there.

Use an authenticated hosted CMS or private Sheets ingestion service for private admin data. Published Sheets are a public catalogue only. Moving public catalogue data to a different provider changes environment values, while private order/auth storage stays behind services.

## Verification and limitations

`npm test` covers aggregate stock across sizes, shipping/COD arithmetic, malformed data diagnostics, referential integrity, pincode rejection and request IDs. `npm run build` runs Astro/TypeScript checks and produces every static route. Browser acceptance should exercise keyboard navigation, narrow Android screens, URL filters, reload persistence, the WhatsApp URL, UPI QR/intent and the owner’s actual payment link before commercial launch.

No payment settlement, real order persistence, email notifications, fabricated reviews or fulfilment promises are supplied. The brief’s free/static phase takes priority over copying Sarvaikam’s backend. ECC is workflow inspiration only, not a dependency or an installed agent configuration.
