import { ArrowUpRight, Heart, Star, Truck } from 'lucide-react';
import { discountPercent, imageUrl, money, settings, swatchColours } from '../catalog.js';
import { useT } from '../i18n.js';

// Real paths: /shop, /shop/<category>/<slug>, /cart, /about … Query strings hold filters (/shop?category=formal).
// Each route is also written as a static HTML file at build time (scripts/prerender.mjs), so search engines
// get a proper title and description for every page.
export function parseRoute(location = window.location) {
  let parts;
  try {
    parts = location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    parts = [];
  }
  return { parts, query: new URLSearchParams(location.search) };
}

// Paths end in a slash (/shop/, /cart/) because GitHub Pages answers /shop with a 301 redirect to /shop/,
// which made every refresh or shared link load twice.
export const href = (path, params) => {
  const query = params ? new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)).toString() : '';
  const clean = path.replace(/^\/+|\/+$/g, '');
  return `/${clean}${clean ? '/' : ''}${query ? `?${query}` : ''}`;
};

// Client-side navigation. replace=true swaps the history entry (used by filters, so Back leaves the shop).
// The current scroll position is stored in the entry being left, so Back returns to the same spot.
export function navigate(to, { replace = false } = {}) {
  if (replace) window.history.replaceState(window.history.state, '', to);
  else {
    window.history.replaceState({ ...window.history.state, scroll: window.scrollY }, '');
    window.history.pushState({ scroll: 0 }, '', to);
  }
  window.dispatchEvent(new Event('locationchange'));
}

export const productHref = (product) => href(`shop/${product.category}/${product.slug}`);

export function Link({ to, params, children, ...props }) {
  return <a href={href(to, params)} {...props}>{children}</a>;
}

// "Also available on Amazon · Flipkart · Meesho" — from settings.marketplaces (https links only).
export const marketplaces = (settings.marketplaces ?? []).filter((item) => item?.name && /^https:\/\//.test(item.url ?? ''));
export function Marketplaces({ className = '' }) {
  const t = useT();
  if (!marketplaces.length) return null;
  return (
    <div className={`marketplaces ${className}`}>
      <span>{t('Also available on')}</span>
      {marketplaces.map((item) => <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer">{item.name} <ArrowUpRight size={12} /></a>)}
    </div>
  );
}

export function Rating({ value, label = true }) {
  const t = useT();
  if (!value) return null;
  return <span className="rating-chip" title={t('Rating on Amazon.in')}>{value.toFixed(1)} <Star size={11} fill="currentColor" />{label && <small>Amazon</small>}</span>;
}

export function ProductCard({ product, saved, onToggleSaved }) {
  const t = useT();
  const off = discountPercent(product);
  return (
    <article className="product-card">
      <a href={productHref(product)} className="product-link">
        <div className={`product-image studio ${product.images.length > 1 ? 'has-alt' : ''}`}>
          <img src={imageUrl(product.images[0])} alt={t(product.name)} width="600" height="600" loading="lazy" />
          {product.images.length > 1 && <img className="alt-image" src={imageUrl(product.images[1])} alt="" width="600" height="600" loading="lazy" aria-hidden="true" />}
          {(product.badge || !product.stock) && <span className="badge">{!product.stock ? t('Out of stock') : t(product.badge)}</span>}
        </div>
        <div className="product-body">
          <h3>{t(product.name)}</h3>
          <p className="product-meta">{t(product.material.replace(/^./, (c) => c.toUpperCase()))} · {t(`${product.buckle.replace(/^./, (c) => c.toUpperCase())} buckle`)} <span className="swatch" style={{ background: swatchColours[product.colour] || '#8B5A2B' }} /></p>
          <Rating value={product.rating} label={false} />
          <div className="price"><b>{money(product.price)}</b>{off > 0 && <><del>{money(product.mrp)}</del><span className="off">{t('{percent}% off', { percent: off })}</span></>}</div>
          <p className="product-ship"><Truck size={13} /> {t(product.price >= settings.freeShippingAbove ? 'Free delivery' : 'Cash on Delivery available')}</p>
        </div>
      </a>
      {onToggleSaved && (
        <button className={`save-toggle ${saved ? 'is-saved' : ''}`} aria-pressed={saved} aria-label={t(saved ? 'Remove from wishlist' : 'Add to wishlist')} onClick={() => onToggleSaved(product.id)}>
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      )}
    </article>
  );
}

export function ProductGrid({ items, saved, onToggleSaved, className = '' }) {
  return <div className={`products ${className}`}>{items.map((product) => <ProductCard key={product.id} product={product} saved={saved.includes(product.id)} onToggleSaved={onToggleSaved} />)}</div>;
}

// Espresso editorial band used at the top of the shop, info and account pages.
export function PageHero({ crumb, kicker, title, lead, children }) {
  const t = useT();
  return (
    <header className="page-head page-hero">
      <div className="wrap page-hero-inner">
        {crumb && <nav className="breadcrumb" aria-label={t('Breadcrumb')}><a href={href('')}>{t('Home')}</a> › <span>{crumb}</span></nav>}
        {kicker && <p className="lux-kicker">{kicker}</p>}
        <h1>{title}</h1>
        {lead && <p className="page-hero-lead">{lead}</p>}
        {children}
      </div>
    </header>
  );
}
