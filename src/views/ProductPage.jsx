import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Banknote, BadgeCheck, Gift, Heart, MapPin, MessageCircle, Plus, Ruler, Share2, ShoppingBag, X, Zap, ZoomIn } from 'lucide-react';
import { discountPercent, getCategory, imageUrl, money, products, settings } from '../catalog.js';
import { pincodeMessage, suggestedSize, whatsappUrl } from '../commerce.js';
import { useT } from '../i18n.js';
import { rememberViewed } from '../storage.js';
import { Link, ProductGrid, Rating, href, navigate, productHref } from './shared.jsx';

export default function ProductPage({ product, saved, onToggleSaved, onAddToCart, onAddMany }) {
  const t = useT();
  const [image, setImage] = useState(0);
  const [size, setSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState('');
  const [waist, setWaist] = useState('');
  const zoom = useRef(null);
  const sizeBlock = useRef(null);
  const isSaved = saved.includes(product.id);
  const off = discountPercent(product);
  const category = getCategory(product.category);
  const related = products.filter((item) => item.id !== product.id).slice(0, 4);
  const suggestion = suggestedSize(waist);
  const question = `Hi! I'd like to know more about ${product.name} (${product.id}).`;
  const isCombo = /combo/i.test(product.name);

  // Pair this belt with a different colour, preferring a single belt over the combo pack.
  const partner = products.filter((item) => item.id !== product.id && item.colour !== product.colour && item.stock > 0)
    .sort((a, b) => Number(/combo/i.test(a.name)) - Number(/combo/i.test(b.name)))[0];

  useEffect(() => {
    document.title = `${product.name} | Beltaly`;
    rememberViewed(product.id);
  }, [product]);

  function addBundle() {
    if (!size) {
      setSizeError(true);
      sizeBlock.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onAddMany([{ productId: product.id, size }, { productId: partner.id, size: partner.sizes.includes(size) ? size : partner.sizes[0] }]);
  }

  async function share() {
    const url = window.location.href.split('?')[0];
    const text = `${product.name} for ${money(product.price)} on Beltaly`;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text, url }); } catch { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}`, '_blank', 'noopener');
    }
  }

  // Shoppers must pick a size; the size block is highlighted if they try to buy without one.
  function buy(goToBag) {
    if (!size) {
      setSizeError(true);
      sizeBlock.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (onAddToCart(product.id, size, 1, !goToBag) && goToBag) navigate(href('cart'));
  }

  const specs = [
    ['Material', product.material.replace(/^./, (c) => c.toUpperCase())],
    ['Colour', product.colour],
    ['Buckle', `${product.buckle.replace(/^./, (c) => c.toUpperCase())} buckle`],
    ['In the box', isCombo ? '2 belts' : '1 belt'],
    ['Sizes', `${product.sizes[0]}–${product.sizes.at(-1)} in (waist)`],
    ['Category', category?.name ?? ''],
    ['SKU', product.id],
  ];

  return (
    <div className="wrap pdp-page">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="">Home</Link> › <Link to="shop">Belts</Link> › <Link to="shop" params={{ category: product.category }}>{t(category?.name ?? '')}</Link> › <span>{product.name}</span></nav>
      <div className="detail">
        <div className="gallery">
          {product.images.length > 1 && (
            <div className="gallery-thumbs">
              {product.images.map((path, index) => (
                <button key={path} className={index === image ? 'is-selected' : ''} aria-pressed={index === image} aria-label={`View image ${index + 1}`} onMouseEnter={() => setImage(index)} onClick={() => setImage(index)}>
                  <img src={imageUrl(path)} alt="" width="80" height="80" />
                </button>
              ))}
            </div>
          )}
          <div className="gallery-main">
            <button className="zoom-button" onClick={() => zoom.current?.showModal()} aria-label="Zoom product image">
              <img className="main-image" src={imageUrl(product.images[image])} alt={`${product.name} in ${product.colour}`} width="900" height="900" fetchpriority="high" />
              <span className="zoom-hint"><ZoomIn size={16} /></span>
            </button>
            <button className={`save-toggle save-toggle--float ${isSaved ? 'is-saved' : ''}`} aria-pressed={isSaved} aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => onToggleSaved(product.id)}><Heart size={18} fill={isSaved ? 'currentColor' : 'none'} /></button>
            {product.images.length > 1 && <div className="gallery-dots" aria-hidden="true">{product.images.map((path, index) => <span key={path} className={index === image ? 'on' : ''} />)}</div>}
          </div>
          <div className="buy-buttons buy-buttons--desktop">
            <button className="btn btn--cart" disabled={!product.stock} onClick={() => buy(false)}><ShoppingBag size={17} /> {t('add')}</button>
            <button className="btn btn--buy" disabled={!product.stock} onClick={() => buy(true)}><Zap size={17} /> Buy now</button>
          </div>
        </div>

        <div className="pdp-info">
          <div className="pdp-top"><p className="pdp-brand">Beltaly</p><button className="plain-button share-btn" onClick={share}><Share2 size={16} /> Share</button></div>
          <h1>{product.name}</h1>
          <div className="pdp-rating-row">
            <Rating value={product.rating} />
            {product.amazon && <a className="link-muted" href={product.amazon} target="_blank" rel="noopener noreferrer">See reviews on Amazon.in</a>}
          </div>

          <div className="price-block">
            {off > 0 && <span className="price-off">-{off}%</span>}
            <span className="price-now">{money(product.price)}</span>
            {off > 0 && <span className="price-mrp">M.R.P.: <del>{money(product.mrp)}</del></span>}
            <p className="hint">{t('tax')}</p>
          </div>

          <div className="perks">
            <span><Banknote size={20} />Cash on Delivery</span>
            <span><BadgeCheck size={20} />Genuine leather</span>
            <span><Gift size={20} />{isCombo ? 'Combo pack' : 'Gift box'}</span>
            <span><MessageCircle size={20} />WhatsApp support</span>
          </div>

          <div ref={sizeBlock} className={`size-block ${sizeError ? 'has-error' : ''}`}>
            <div className="size-head"><b>Select size <span className="hint">(waist, inches)</span></b><Link className="text-link" to="size-guide"><Ruler size={14} /> Size chart</Link></div>
            <div className="size-chips" role="radiogroup" aria-label="Belt size">
              {product.sizes.map((value) => (
                <button key={value} role="radio" aria-checked={size === value} className={size === value ? 'is-selected' : ''} onClick={() => { setSize(value); setSizeError(false); }}>{value}</button>
              ))}
            </div>
            {sizeError && <p className="error" role="alert">Please select a size.</p>}
            {size && <p className="hint">Size {size} in fits a trouser waist of about {size - 2} in ({Math.round(size * 2.54)} cm belt).</p>}
            <details className="size-help">
              <summary>Not sure? Find your size</summary>
              <label className="inline-label">Your trouser waist (inches) <input type="number" min="18" max="60" value={waist} onChange={(event) => setWaist(event.target.value)} /></label>
              <p className="hint" role="status">{waist === '' ? 'Most people choose a belt 2 inches larger than their trouser waist.' : suggestion ? `Suggested size: ${suggestion.inches} in${product.sizes.includes(suggestion.inches) ? '' : ' (not available in this belt)'}.` : 'Enter a waist between 18 and 60 inches.'}</p>
              {suggestion && product.sizes.includes(suggestion.inches) && suggestion.inches !== size && <button className="btn btn--small" onClick={() => { setSize(suggestion.inches); setSizeError(false); }}>Select {suggestion.inches} in</button>}
            </details>
          </div>

          <p className={product.stock ? 'stock' : 'error'}>{product.stock ? (product.stock <= 5 ? `Only ${product.stock} left in stock` : t('In stock')) : t('Out of stock')}</p>

          <div className="delivery-box">
            <label htmlFor="pincode"><MapPin size={16} /> Delivery</label>
            <form className="inline-form" onSubmit={(event) => { event.preventDefault(); setPincodeResult(pincodeMessage(pincode, settings)); }}>
              <input id="pincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, ''))} placeholder="Enter 6-digit pincode" />
              <button className="plain-button text-link" type="submit">{t('check')}</button>
            </form>
            <p className="hint" role="status">{pincodeResult || `Delivery ${money(settings.shippingFee)}, free above ${money(settings.freeShippingAbove)}. Cash on Delivery +${money(settings.codCharge)}.`}</p>
          </div>

          <section className="pdp-section">
            <h2>About this item</h2>
            <p>{product.description}</p>
          </section>

          <section className="pdp-section">
            <h2>Product details</h2>
            <table className="spec-table"><tbody>{specs.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table>
          </section>

          <details className="pdp-details"><summary>{t('Material & care')}</summary><p>{product.care}</p></details>
          <details className="pdp-details"><summary>{t('Shipping & returns')}</summary><p>Delivery is {money(settings.shippingFee)}, free on orders of {money(settings.freeShippingAbove)} or more. Cash on Delivery adds {money(settings.codCharge)}. Wrong size or a problem with your belt? Message us on WhatsApp with your order reference. <Link className="text-link" to="shipping">Shipping & returns policy</Link></p></details>

          <div className="link-row">
            <a className="text-link" href={settings.whatsapp ? whatsappUrl(settings.whatsapp, question) : href('contact')} target={settings.whatsapp ? '_blank' : undefined} rel="noopener noreferrer"><MessageCircle size={15} /> {t('Ask about this belt on WhatsApp')}</a>
            {product.amazon && <a className="text-link" href={product.amazon} target="_blank" rel="noopener noreferrer">Also on Amazon.in <ArrowUpRight size={14} /></a>}
          </div>
        </div>
      </div>

      {partner && (
        <section className="section bundle">
          <h2 className="section-title">Make it a pair</h2>
          <div className="bundle-box panel">
            <div className="bundle-items">
              <div className="bundle-item"><img src={imageUrl(product.images[0])} alt="" width="140" height="140" /><span>This item: {product.name}</span><b>{money(product.price)}</b></div>
              <Plus size={22} className="bundle-plus" aria-hidden="true" />
              <a className="bundle-item" href={productHref(partner)}><img src={imageUrl(partner.images[0])} alt="" width="140" height="140" /><span>{partner.name}</span><b>{money(partner.price)}</b></a>
            </div>
            <div className="bundle-total">
              <p>Both belts: <b>{money(product.price + partner.price)}</b> <del>{money(product.mrp + partner.mrp)}</del></p>
              <p className="hint">{size ? `Both in size ${size} in.` : 'Select a size above first.'}{product.price + partner.price >= settings.freeShippingAbove ? ' Free delivery.' : ''}</p>
              <button className="btn btn--cart" disabled={!product.stock} onClick={addBundle}><ShoppingBag size={17} /> Add both to bag</button>
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && <section className="section section--tight"><h2 className="section-title">You may also like</h2><ProductGrid items={related} saved={saved} onToggleSaved={onToggleSaved} /></section>}

      <div className="buy-bar">
        <div className="buy-bar-price"><b>{money(product.price)}</b>{off > 0 && <small><del>{money(product.mrp)}</del> {off}% off</small>}</div>
        <button className="btn btn--cart" disabled={!product.stock} onClick={() => buy(false)}>{t('add')}</button>
        <button className="btn btn--buy" disabled={!product.stock} onClick={() => buy(true)}>Buy now</button>
      </div>

      <dialog ref={zoom} className="zoom-dialog" onClick={(event) => event.target === zoom.current && zoom.current.close()}>
        <form method="dialog"><button className="icon-btn zoom-close" aria-label="Close zoom"><X size={20} /></button></form>
        <img src={imageUrl(product.images[image])} alt={`${product.name}, enlarged`} width="900" height="900" />
      </dialog>
    </div>
  );
}
