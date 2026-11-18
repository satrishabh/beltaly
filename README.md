# Beltaly

A static storefront for **Beltaly**, a belt and leather goods company. Belts form the current sample catalogue; wallets are marked **coming soon**. The original visual identity uses cream, leather and brass. Astro + TypeScript + Tailwind; small vanilla TypeScript interactions. No backend or paid subscription is required for local operation. Sample products use original SVG illustrations, not commercial product photography.

## Run

Use Node 22.22.1+ or Node 24.14+; recent transitive dependencies require a current runtime.

```sh
npm install
npm run dev
```

The catalogue is included under `content/`. Do not run `npm run seed` after editing it: that command **overwrites sample catalogue, images and CSV templates**. Use it only to reset demo data. `npm test` checks order arithmetic, stock, schemas and order requests. `npm run build` type-checks and generates `dist/`. `npm run preview` serves that build.

## Owner setup

Update `content/settings.json`, or the settings row in Sheets: name, logo, announcement, palette, WhatsApp number (country code and digits only), UPI VPA/payee, GSTIN, shipping threshold and fee, COD fee, serviceable pincodes, payment methods, HTTPS payment link, Instagram, Cloudinary cloud, and optional live refresh endpoint. Empty WhatsApp and payment details are intentional. Orders cannot be sent until valid details are configured. Review sample policies and confirm real products, prices, materials and photography before opening for trade.

Products, categories, collections and seasonal banners each have a separate JSON file. The `bestsellers` collection controls the home page. Banner `enabled` controls visibility. Images accept `/products/...` or HTTPS URLs. Local SVG placeholders are tiny, resolution-independent illustrations. Remote raster images should have AVIF/WebP variants at their host. Set `cloudinaryCloud` to wrap remote images with `f_auto,q_auto,w_900`. Images have fixed dimensions, and below-fold images are lazy loaded.

## Google Sheets: no-code editing

1. Create one spreadsheet. Import each CSV in `templates/` as a separate tab: **products, categories, collections, banners, settings**. Keep header names unchanged.
2. File → Share → Publish to web. Publish each individual tab as CSV and copy its CSV URL. Publishing makes the tab public. Never put private customer data, service credentials or payment secrets in these tabs.
3. Copy `.env.example` to `.env`. Set `DATA_PROVIDER=google-sheets` and the five `SHEETS_*_URL` values. Use the published CSV export URLs, not the normal browser edit URL.
4. Leave numeric cells numeric. `sizes`, `images`, `productIds`, `pincodes`, `methods` and `colours` contain JSON arrays or objects. Preserve quotes inside the cell. Pincodes are JSON strings. Booleans must be `true` or `false`.
5. Edit rows, then rebuild or push to trigger hosting. Schema errors fail with the tab, row and field. Bad data never silently replaces the catalogue. Invalid JSON cells fail with their field name.
6. Configure the same environment variables as GitHub repository variables. The daily GitHub workflow rebuilds at 07:00 India time (01:30 UTC); scheduled workflows may be delayed by GitHub.

## Other providers

- Default: `DATA_PROVIDER=local-json`. Repo JSON only; no service dependencies.
- Supabase: `DATA_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Create public catalogue tables `products`, `categories`, `collections`, `banners`, `settings` matching `src/data/providers/types.ts`; arrays/objects should be JSONB, and numeric and boolean columns typed accordingly. `settings` needs exactly one public row. Enable RLS and allow SELECT only for public catalogue data. Do not expose customer/order tables. Never use a service-role key. These credentials are used at build time.
- Airtable is an explicit optional stub and fails with a clear message.

Provider changes require environment configuration and a rebuild, with no component edits. Provider failures stop the build. An optional `settings.liveRefresh` + `liveRefreshUrl` requests a public, CORS-enabled JSON array of `{id,price,stock}` during interactive catalogue/cart use. This keeps UI code independent of storage services; publish this normalized feed from your provider. It is an enhancement, not an inventory reservation system. Cards and SEO remain build snapshots. Do not point it to credential-protected services.

## Checkout

The bag stores only product, size, colour and quantity in localStorage. Customer details stay in page memory. Preparing an order generates `BLT-YYMMDD-XXXX` using the date in India. The owner accepts the request on WhatsApp. UPI opens a standard intent/QR, then the shopper asks for verification on WhatsApp. **Payment is never verified by this static site.** There is no automatic invoice, stock lock, order database or refund engine.

Payment-link mode opens a configured store link, or a product link for a single-line bag. It does not change a provider’s fixed link amount: the shopper and owner must verify quantity, shipping, amount and reference on the payment page. A dynamic checkout needs the backend described in `ARCHITECTURE.md`.

## Deployment: GitHub Pages + Hostinger domain

Hosting is GitHub Pages only; Hostinger holds the domain's DNS. No other hosting platform is used.

1. Push to `main` in a public GitHub repository (Pages on private repos needs a paid plan).
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**. The workflow tests, builds, checks the output and deploys on every push to `main`, daily at 07:00 IST and on manual dispatch.
3. Until a domain is set, the site is served at `https://<owner>.github.io/<repo>/`.
4. Hostinger → Domains → DNS / Nameservers for your domain:
   - Remove existing `A`/`AAAA` records for `@` that point to Hostinger hosting or parking.
   - Add `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - Optional IPv6 `AAAA` for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
   - Add `CNAME` for `www` → `<owner>.github.io`.
5. In GitHub: Settings → Secrets and variables → Actions → Variables → add `CUSTOM_DOMAIN` (e.g. `beltaly.in`). Then Settings → Pages → Custom domain: enter the same domain, wait for the DNS check, and tick **Enforce HTTPS** once the certificate is issued (can take up to 24 hours).
6. Re-run the workflow (Actions → Build and publish static storefront → Run workflow). With `CUSTOM_DOMAIN` set, the build uses `https://<domain>` and base path `/`.

Data provider variables (`DATA_PROVIDER`, `SHEETS_*_URL`, `SUPABASE_*`) are wired into the workflow as repository variables. GitHub may delay scheduled runs. No paid service is activated by this setup.

## Language, access and performance

English/Hindi navigation, hero and core labels live in `src/i18n/*.json`. The toggle persists in this browser. Product, policy and editorial content currently remains owner-authored English; translate catalogue content and remaining page copy for a complete Hindi commercial launch. System fonts avoid third-party font requests; Georgia is the serif, with Noto Sans Devanagari used when installed. Fixed image dimensions, lazy loading, dynamic search/QR imports, keyboard focus, a skip link and reduced-motion styles are included. Lighthouse 95+ is a target, not a measured claim.

## References

[ECC](https://github.com/affaan-m/ECC) informed the research/validation/verification approach; its runtime, hooks and agents are not installed. Sarvaikam’s content/configuration separation is a conceptual reference, with no shared auth, deployment or database. Beltaly is an independent static commerce implementation. [Astro deployment documentation](https://docs.astro.build/en/guides/deploy/github/) informed the Pages workflow. See `ARCHITECTURE.md` for the backend migration boundary.
