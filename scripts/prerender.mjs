// Runs after `vite build`. GitHub Pages only serves files, so for every page of the store this writes
// dist/<path>/index.html: the same app, but with that page's own <title>, description, canonical URL,
// share preview and (for products) Google product data. It also writes sitemap.xml, robots.txt and 404.html.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import products from '../src/data/products.json' with { type: 'json' };
import categories from '../src/data/categories.json' with { type: 'json' };
import pages from '../src/data/pages.json' with { type: 'json' };
import settings from '../src/data/settings.json' with { type: 'json' };

const SITE = 'https://www.beltaly.in';
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const template = readFileSync(join(dist, 'index.html'), 'utf8');
const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// GitHub Pages serves /shop as /shop/ (folder index), so public URLs end in a slash.
const pageUrl = (path) => `${SITE}${path === '/' ? '/' : `${path}/`}`;
const inr = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

function render({ path, title, description, image = '/og/home.jpg', type = 'website', jsonLd = [], noindex = false, body = '' }) {
  const url = pageUrl(path);
  const fullTitle = `${title} | Beltaly`;
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(fullTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escape(description)}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escape(fullTitle)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escape(description)}"`)
    .replace(/<meta property="og:type" content="[^"]*"/, `<meta property="og:type" content="${type}"`)
    .replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${SITE}${image}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
    // Real text and links inside #root: search engines, link previews and no-JavaScript visitors read this.
    // The app replaces it on start, and an inline style hides it once JavaScript is running (no flash).
    .replace('<div id="root"></div>', `<div id="root">${staticPage(body)}</div>`);
  const extra = [
    noindex ? '<meta name="robots" content="noindex" />' : '',
    image.endsWith('.jpg') ? '<meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />' : '',
    `<meta name="twitter:image" content="${SITE}${image}" />`,
    ...jsonLd.map((data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`),
  ].filter(Boolean).join('\n    ');
  if (extra) html = html.replace('</head>', `    ${extra}\n  </head>`);
  return html;
}

function write(path, html) {
  const file = path === '/' ? join(dist, 'index.html') : join(dist, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}


// ---------- Static page text ----------
const link = (path, text) => `<a href="${path === '/' ? '/' : `${path}/`}">${escape(text)}</a>`;
const productPath = (product) => `/shop/${product.category}/${product.slug}`;
const ogImage = (product) => (existsSync(join(dist, 'og', `${product.slug}.jpg`)) ? `/og/${product.slug}.jpg` : product.images[0]);
const priceText = (product) => `${inr(product.price)}${product.mrp > product.price ? ` <del>${inr(product.mrp)}</del> (${Math.round((1 - product.price / product.mrp) * 100)}% off)` : ''}`;
const productList = () => `<ul>${products.map((product) => `<li>${link(productPath(product), product.name)} — ${priceText(product)}</li>`).join('')}</ul>`;
const siteNav = () => `<nav aria-label="Site">${[link('/', 'Home'), link('/shop', 'All belts'), ...Object.entries(pages).map(([slug, page]) => link(`/${slug}`, page.title))].join(' · ')}</nav>`;
const howToOrder = () => `<p>Order on this site with Cash on Delivery${settings.methods?.upi ? ' or UPI' : ''}, or on WhatsApp${settings.whatsapp ? ` (<a href="https://wa.me/${settings.whatsapp}">+${settings.whatsapp}</a>)` : ''}. Delivery ${inr(settings.shippingFee)} across India, free above ${inr(settings.freeShippingAbove)}.</p>`;
function staticPage(body) {
  if (!body) return '';
  return `<div class="static-page wrap prose"><p><b>BELTALY</b> · Genuine leather</p>${body}${siteNav()}</div>`;
}
function productBody(product) {
  const category = categories.find((item) => item.id === product.category);
  return `<h1>${escape(product.name)}</h1>
<img src="${product.images[0]}" alt="${escape(product.name)}" width="600" height="600" />
<p><b>${priceText(product)}</b>, inclusive of all taxes. ${product.stock > 0 ? 'In stock.' : 'Out of stock.'}</p>
<p>${escape(product.description)}</p>
<ul><li>Material: ${escape(product.material)}</li><li>Colour: ${escape(product.colour)}</li><li>Buckle: ${escape(product.buckle)}</li><li>Sizes: ${product.sizes.join(', ')} inches (waist)</li><li>Category: ${escape(category?.name ?? '')}</li></ul>
<p>Care: ${escape(product.care)}</p>
${howToOrder()}
<h2>More belts</h2>${productList()}`;
}

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Beltaly',
  url: SITE,
  logo: `${SITE}/brand/logo-3d.png`,
  sameAs: (settings.marketplaces ?? []).map((item) => item.url).filter((url) => /^https:\/\//.test(url ?? '')),
  ...(settings.whatsapp ? { contactPoint: { '@type': 'ContactPoint', telephone: `+${settings.whatsapp}`, contactType: 'customer service', areaServed: 'IN', ...(settings.business?.email ? { email: settings.business.email } : {}) } } : {}),
};

const lowest = Math.min(...products.map((product) => product.price));
const routes = [
  { path: '/', title: 'Genuine leather belts for men', description: `Genuine leather belts by Beltaly from ${inr(lowest)}: plate buckle belts and combo packs in sizes 28–44. Cash on Delivery and WhatsApp ordering across India.`, jsonLd: [organization, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Beltaly', url: SITE }],
    body: `<h1>Genuine leather belts for men</h1><p>Plate buckle belts and textured combo packs from ${inr(lowest)}, in gift-ready boxes.</p>${howToOrder()}<h2>Our belts</h2>${productList()}` },
  { path: '/shop', title: 'Shop leather belts', description: `All Beltaly genuine leather belts and combo packs, from ${inr(lowest)}. Sizes 28–44, Cash on Delivery across India.`,
    body: `<h1>Shop leather belts</h1>${productList()}${howToOrder()}` },
  ...Object.entries(pages).map(([slug, page]) => ({ path: `/${slug}`, title: page.title, description: page.description, body: `<h1>${escape(page.heading ?? page.title)}</h1><p>${escape(page.description)}</p>${howToOrder()}` })),
  ...products.map((product) => {
    const category = categories.find((item) => item.id === product.category);
    const path = `/shop/${product.category}/${product.slug}`;
    return {
      path,
      title: product.name,
      description: `${product.name} at ${inr(product.price)}${product.mrp > product.price ? ` (M.R.P. ${inr(product.mrp)})` : ''}. ${product.description}`.slice(0, 300),
      image: ogImage(product),
      body: productBody(product),
      type: 'product',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.images.map((image) => `${SITE}${image}`),
          sku: product.id,
          color: product.colour,
          material: product.material,
          brand: { '@type': 'Brand', name: 'Beltaly' },
          offers: {
            '@type': 'Offer',
            url: pageUrl(path),
            price: product.price,
            priceCurrency: 'INR',
            itemCondition: 'https://schema.org/NewCondition',
            availability: `https://schema.org/${product.stock > 0 ? 'InStock' : 'OutOfStock'}`,
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: { '@type': 'MonetaryAmount', value: product.price >= settings.freeShippingAbove ? 0 : settings.shippingFee, currency: 'INR' },
              shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
            },
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: category?.name ?? 'Belts', item: `${SITE}/shop/?category=${product.category}` },
            { '@type': 'ListItem', position: 3, name: product.name, item: pageUrl(path) },
          ],
        },
      ],
    };
  }),
];

// Pages that exist for shoppers but should not appear in Google.
const privateRoutes = [
  { path: '/cart', title: 'Your bag' },
  { path: '/orders', title: 'My orders' },
  { path: '/saved', title: 'Wishlist' },
  { path: '/account', title: 'My orders' },
  { path: '/business', title: 'Bulk & corporate orders', index: true, description: 'Corporate gifting, wedding sets and bulk orders of Beltaly genuine leather belts. Enquire on WhatsApp for volume pricing.' },
];

for (const route of routes) write(route.path, render(route));
for (const route of privateRoutes) {
  write(route.path, render({ ...route, description: route.description ?? 'Beltaly genuine leather belts.', noindex: !route.index }));
  if (route.index) routes.push(route);
}
// Unknown paths: GitHub Pages serves 404.html, and the app shows its "not found" screen.
writeFileSync(join(dist, '404.html'), render({ path: '/404', title: 'Page not found', description: 'This page could not be found.', noindex: true }));

const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url><loc>${pageUrl(route.path)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /cart
Disallow: /orders
Disallow: /saved
Disallow: /account

Sitemap: ${SITE}/sitemap.xml
`);

console.log(`prerender: ${routes.length + privateRoutes.length - 1} pages, sitemap.xml, robots.txt, 404.html`);
