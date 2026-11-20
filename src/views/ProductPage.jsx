import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Heart, Plus, X, ZoomIn } from 'lucide-react';
import { discountPercent, getCategory, imageUrl, money, products, settings } from '../catalog.js';
import { pincodeMessage, suggestedSize, whatsappUrl } from '../commerce.js';
import { useT } from '../i18n.js';
import { Link, ProductGrid } from './shared.jsx';

export default function ProductPage({ product, saved, onToggleSaved, onAddToCart }) {
  const t = useT();
  const [image, setImage] = useState(0);
  const [size, setSize] = useState(product.sizes[Math.floor(product.sizes.length / 2) - 1] ?? product.sizes[0]);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState('');
  const [waist, setWaist] = useState('');
  const zoom = useRef(null);
  const isSaved = saved.includes(product.id);
  const off = discountPercent(product);
  const category = getCategory(product.category);
  const related = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4);
  const suggestion = suggestedSize(waist);
  const question = `Hi! I'd like to know more about ${product.name} (${product.id}).`;

  // Product structured data (INR offer) for search engines that render JavaScript.
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images.map((path) => new URL(imageUrl(path), window.location.href).href),
      sku: product.id,
      brand: { '@type': 'Brand', name: 'Beltaly' },
      offers: { '@type': 'Offer', price: product.price, priceCurrency: 'INR', availability: `https://schema.org/${product.stock ? 'InStock' : 'OutOfStock'}`, url: window.location.href },
    });
    document.head.append(script);
    document.title = `${product.name} | Beltaly`;
    return () => script.remove();
  }, [product]);

  return (
    <div className="wrap section">
      <div className="breadcrumb"><Link to="">Home</Link> / <Link to="shop">Shop</Link> / <Link to="shop" params={{ category: product.category }}>{t(category?.name ?? '')}</Link> / {product.name}</div>
      <div className="detail">
        <div>
          <button className="zoom-button" onClick={() => zoom.current?.showModal()} aria-label="Zoom product image">
            <img className="main-image" src={imageUrl(product.images[image])} alt={`${product.name} in ${product.colour}`} width="900" height="900" fetchpriority="high" />
            <span className="zoom-hint"><ZoomIn size={16} /></span>
          </button>
          {product.images.length > 1 && (
            <div className="gallery-thumbs">
              {product.images.map((path, index) => (
                <button key={path} className={index === image ? 'is-selected' : ''} aria-pressed={index === image} aria-label={`View ${index + 1}`} onClick={() => setImage(index)}>
                  <img src={imageUrl(path)} alt="" width="80" height="80" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="eyebrow">{t(product.material)} / {product.width} MM / {t(product.buckle)}</p>
          <div className="title-row">
            <h1>{product.name}</h1>
            <button className={`save-toggle save-toggle--inline ${isSaved ? 'is-saved' : ''}`} aria-pressed={isSaved} aria-label={isSaved ? 'Remove from saved' : t('Save for later')} onClick={() => onToggleSaved(product.id)}><Heart size={18} fill={isSaved ? 'currentColor' : 'none'} /></button>
          </div>
          <div className="detail-price">{money(product.price)} {off > 0 && <><del>{money(product.mrp)}</del> <span className="badge badge--static">{off}% {t('off').toUpperCase()}</span></>}</div>
          <p className="hint">{t('tax')}</p>
          <p>{product.description}</p>
          <p className={product.stock ? 'stock' : 'error'}>{product.stock ? `● ${t('In stock')}` : t('Out of stock')}</p>

          <form className="add-form" onSubmit={(event) => { event.preventDefault(); onAddToCart(product.id, size, 1); }}>
            <label>{t('size')}
              <select value={size} onChange={(event) => setSize(Number(event.target.value))}>
                {product.sizes.map((value) => <option key={value} value={value}>{value} in / {Math.round(value * 2.54)} cm</option>)}
              </select>
            </label>
            <label>{t('colour')}
              <span className="colour-value">{t(product.colour)}</span>
            </label>
            <p className="hint"><Link className="text-link" to="size-guide">{t('Not sure? Find your belt size')} <ArrowUpRight size={13} /></Link></p>
            <button className="btn mobile-add" type="submit" disabled={!product.stock}>{t('add')} <Plus size={16} /></button>
          </form>

          <a className="text-link" href={settings.whatsapp ? whatsappUrl(settings.whatsapp, question) : '#/contact'} target={settings.whatsapp ? '_blank' : undefined} rel="noopener noreferrer">{t('Ask about this belt on WhatsApp')} <ArrowUpRight size={14} /></a>

          <div className="pincode-check">
            <label htmlFor="pincode">{t('delivery')}</label>
            <form className="inline-form" onSubmit={(event) => { event.preventDefault(); setPincodeResult(pincodeMessage(pincode, settings)); }}>
              <input id="pincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, ''))} placeholder={t('6-digit pincode')} />
              <button className="btn secondary" type="submit">{t('check')}</button>
            </form>
            <p className="hint" role="status">{pincodeResult}</p>
          </div>

          <details><summary>{t('Material & care')}</summary><p>{product.care}</p></details>
          <details><summary>{t('Shipping & returns')}</summary><p>Shipping is {money(settings.shippingFee)}; free on orders of {money(settings.freeShippingAbove)} or more. Cash on Delivery adds {money(settings.codCharge)}. <Link className="text-link" to="shipping">Read the policy</Link>.</p></details>
          <details>
            <summary>{t('Quick size calculator')}</summary>
            <label className="inline-label">{t('Waist (inches)')} <input type="number" min="18" max="60" value={waist} onChange={(event) => setWaist(event.target.value)} /></label>
            <p className="hint" role="status">{waist === '' ? 'Usually choose a belt 2 inches larger than your waist; check available sizes.' : suggestion ? `Suggested belt: ${suggestion.inches} in / ${suggestion.cm} cm${product.sizes.includes(suggestion.inches) ? '' : ' (not available in this belt)'}.` : 'Enter a waist between 18 and 60 inches.'}</p>
            {suggestion && product.sizes.includes(suggestion.inches) && suggestion.inches !== size && <button className="text-link plain-button" onClick={() => setSize(suggestion.inches)}>Select {suggestion.inches} in</button>}
          </details>
        </div>
      </div>

      {related.length > 0 && <section className="section"><h2>{t('A little more your style.')}</h2><ProductGrid items={related} saved={saved} onToggleSaved={onToggleSaved} /></section>}

      <dialog ref={zoom} className="zoom-dialog" onClick={(event) => event.target === zoom.current && zoom.current.close()}>
        <form method="dialog"><button className="btn secondary" aria-label="Close zoom"><X size={16} /> {t('Close ×').replace(' ×', '')}</button></form>
        <img src={imageUrl(product.images[image])} alt={`${product.name}, enlarged`} width="900" height="900" />
      </dialog>
    </div>
  );
}
