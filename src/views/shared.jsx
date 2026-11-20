import { Heart } from 'lucide-react';
import { discountPercent, imageUrl, money, swatchColours } from '../catalog.js';
import { useT } from '../i18n.js';

// Hash routes: #/shop, #/shop/<category>/<slug>, #/cart, #/about … Query strings hold filters (#/shop?category=formal).
export function parseRoute(hash = window.location.hash) {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  let parts;
  try {
    parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    parts = [];
  }
  return { parts, query: new URLSearchParams(query) };
}

export const href = (path, params) => {
  const query = params ? new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)).toString() : '';
  return `#/${path.replace(/^\//, '')}${query ? `?${query}` : ''}`;
};

export const productHref = (product) => href(`shop/${product.category}/${product.slug}`);

export function Link({ to, params, children, ...props }) {
  return <a href={href(to, params)} {...props}>{children}</a>;
}

export function ProductCard({ product, saved, onToggleSaved }) {
  const t = useT();
  const off = discountPercent(product);
  return (
    <article className="product-card">
      <a href={productHref(product)}>
        <div className="product-image">
          <img src={imageUrl(product.images[0])} alt={`${product.name}, ${product.colour} ${product.material} belt`} width="600" height="600" loading="lazy" />
          {(product.badge || !product.stock) && <span className="badge">{!product.stock ? t('Out of stock').toUpperCase() : product.badge}</span>}
        </div>
        <p className="product-meta">{t(product.material)} · {product.width} mm</p>
        <h3>{product.name}</h3>
        <div className="price">{money(product.price)} {off > 0 && <><del>{money(product.mrp)}</del> <span className="off">{off}% {t('off')}</span></>}</div>
        <div><span className="swatch" style={{ background: swatchColours[product.colour] || '#8B5A2B' }} /><span className="hint">{t(product.colour)}</span></div>
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
