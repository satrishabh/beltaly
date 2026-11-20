import { Heart, Star, Truck } from 'lucide-react';
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

export const href = (path, params) => {
  const query = params ? new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)).toString() : '';
  return `/${path.replace(/^\//, '')}${query ? `?${query}` : ''}`;
};

// Client-side navigation. replace=true swaps the history entry (used by filters, so Back leaves the shop).
export function navigate(to, { replace = false } = {}) {
  if (replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new Event('locationchange'));
}

export const productHref = (product) => href(`shop/${product.category}/${product.slug}`);

export function Link({ to, params, children, ...props }) {
  return <a href={href(to, params)} {...props}>{children}</a>;
}

export function Rating({ value, label = true }) {
  if (!value) return null;
  return <span className="rating-chip" title="Rating on Amazon.in">{value.toFixed(1)} <Star size={11} fill="currentColor" />{label && <small>Amazon</small>}</span>;
}

export function ProductCard({ product, saved, onToggleSaved }) {
  const t = useT();
  const off = discountPercent(product);
  return (
    <article className="product-card">
      <a href={productHref(product)} className="product-link">
        <div className="product-image">
          <img src={imageUrl(product.images[0])} alt={`${product.name}, ${product.colour} ${product.material} belt`} width="600" height="600" loading="lazy" />
          {(product.badge || !product.stock) && <span className="badge">{!product.stock ? t('Out of stock') : product.badge}</span>}
        </div>
        <div className="product-body">
          <h3>{product.name}</h3>
          <p className="product-meta">{t(product.material)} · {t(product.buckle)} buckle <span className="swatch" style={{ background: swatchColours[product.colour] || '#8B5A2B' }} /></p>
          <Rating value={product.rating} label={false} />
          <div className="price"><b>{money(product.price)}</b>{off > 0 && <><del>{money(product.mrp)}</del><span className="off">{off}% {t('off')}</span></>}</div>
          <p className="product-ship"><Truck size={13} /> {product.price >= settings.freeShippingAbove ? 'Free delivery' : 'Cash on Delivery available'}</p>
        </div>
      </a>
      {onToggleSaved && (
        <button className={`save-toggle ${saved ? 'is-saved' : ''}`} aria-pressed={saved} aria-label={`${saved ? 'Remove' : 'Save'} ${product.name}`} onClick={() => onToggleSaved(product.id)}>
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      )}
    </article>
  );
}

export function ProductGrid({ items, saved, onToggleSaved, className = '' }) {
  return <div className={`products ${className}`}>{items.map((product) => <ProductCard key={product.id} product={product} saved={saved.includes(product.id)} onToggleSaved={onToggleSaved} />)}</div>;
}
