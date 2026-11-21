import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Banknote, BadgeCheck, Gift, Heart, MapPin, MessageCircle, Plus, Ruler, Share2, ShoppingBag, X, Zap, ZoomIn } from 'lucide-react';
import { discountPercent, getCategory, imageUrl, money, products, settings } from '../catalog.js';
import { pincodeMessage, suggestedSize, whatsappUrl } from '../commerce.js';
import { useT } from '../i18n.js';
import { rememberViewed } from '../storage.js';
import { Link, Marketplaces, ProductGrid, Rating, href, navigate, productHref } from './shared.jsx';

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
  // Full photos first, then close-ups cut from them (products.json "details": focus point + zoom).
  const views = [
    ...product.images.map((path) => ({ path })),
    ...(product.details ?? []).map((detail) => ({ path: product.images[detail.image ?? 0], focus: detail.focus, zoom: detail.zoom })),
  ];
  const view = views[image] ?? views[0];
  const crop = (item) => (item.zoom ? { transformOrigin: item.focus, transform: `scale(${item.zoom})` } : undefined);
  const swipe = useRef(null);
  const step = (delta) => setImage((index) => (index + delta + views.length) % views.length);
  const category = getCategory(product.category);
  const related = products.filter((item) => item.id !== product.id).slice(0, 4);
  const suggestion = suggestedSize(waist);
  const question = `Hi! I'd like to know more about ${product.name} (${product.id}).`;
  const isCombo = /combo/i.test(product.name);

  // Pair this belt with a different colour, preferring a single belt over the combo pack.
  const partner = products.filter((item) => item.id !== product.id && item.colour !== product.colour && item.stock > 0)
    .sort((a, b) => Number(/combo/i.test(a.name)) - Number(/combo/i.test(b.name)))[0];

  useEffect(() => {
    document.title = `${t(product.name)} | Beltaly`;
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
    const text = t('{name} for {price} on Beltaly', { name: t(product.name), price: money(product.price) });
    if (navigator.share) {
      try { await navigator.share({ title: t(product.name), text, url }); } catch { /* cancelled */ }
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

  const cap = (text) => text.replace(/^./, (c) => c.toUpperCase());
  const specs = [
    [t('Material'), t(cap(product.material))],
    [t('Colour'), t(product.colour)],
    [t('Buckle'), t(`${cap(product.buckle)} buckle`)],
    [t('In the box'), t(isCombo ? '2 belts' : '1 belt')],
    [t('Sizes'), t('{from}–{to} in (waist)', { from: product.sizes[0], to: product.sizes.at(-1) })],
    [t('Category'), t(category?.name ?? '')],
    ['SKU', product.id],
  ];

  return (
    <div className="wrap pdp-page">
      <nav className="breadcrumb" aria-label={t('Breadcrumb')}><Link to="">{t('Home')}</Link> › <Link to="shop">{t('Belts')}</Link> › <Link to="shop" params={{ category: product.category }}>{t(category?.name ?? '')}</Link> › <span>{t(product.name)}</span></nav>
      <div className="detail">
        <div className="gallery">
          {views.length > 1 && (
            <div className="gallery-thumbs">
              {views.map((item, index) => (
                <button key={`${item.path}-${item.focus ?? 'full'}`} className={index === image ? 'is-selected' : ''} aria-pressed={index === image} aria-label={t('View image {number}', { number: index + 1 })} onMouseEnter={() => setImage(index)} onClick={() => setImage(index)}>
                  <img src={imageUrl(item.path)} alt="" width="80" height="80" style={crop(item)} />
                </button>
              ))}
            </div>
          )}
          <div className="gallery-main" onTouchStart={(event) => { swipe.current = event.touches[0].clientX; }} onTouchEnd={(event) => { const dx = event.changedTouches[0].clientX - (swipe.current ?? event.changedTouches[0].clientX); swipe.current = null; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); }}>
            <button className="zoom-button" onClick={() => zoom.current?.showModal()} aria-label={t('Zoom product image')}>
              <img key={image} className="main-image" src={imageUrl(view.path)} alt={t(product.name)} width="900" height="900" fetchpriority="high" style={crop(view)} />
              <span className="zoom-hint"><ZoomIn size={16} /></span>
            </button>
            <button className={`save-toggle save-toggle--float ${isSaved ? 'is-saved' : ''}`} aria-pressed={isSaved} aria-label={t(isSaved ? 'Remove from wishlist' : 'Add to wishlist')} onClick={() => onToggleSaved(product.id)}><Heart size={18} fill={isSaved ? 'currentColor' : 'none'} /></button>
            {views.length > 1 && <div className="gallery-dots" aria-hidden="true">{views.map((item, index) => <span key={`${item.path}-${item.focus ?? 'full'}`} className={index === image ? 'on' : ''} />)}</div>}
          </div>
          <div className="buy-buttons buy-buttons--desktop">
            <button className="btn btn--cart" disabled={!product.stock} onClick={() => buy(false)}><ShoppingBag size={17} /> {t('Add to bag')}</button>
            <button className="btn btn--buy" disabled={!product.stock} onClick={() => buy(true)}><Zap size={17} /> {t('Buy now')}</button>
          </div>
        </div>

        <div className="pdp-info">
          <div className="pdp-top"><p className="pdp-brand">Beltaly</p><button className="plain-button share-btn" onClick={share}><Share2 size={16} /> {t('Share')}</button></div>
          <h1>{t(product.name)}</h1>
          <div className="pdp-rating-row">
            <Rating value={product.rating} />
            {product.amazon && <a className="link-muted" href={product.amazon} target="_blank" rel="noopener noreferrer">{t('See reviews on Amazon.in')}</a>}
          </div>

          <div className="price-block">
            {off > 0 && <span className="price-off">-{off}%</span>}
            <span className="price-now">{money(product.price)}</span>
            {off > 0 && <span className="price-mrp">{t('M.R.P.:')} <del>{money(product.mrp)}</del></span>}
            <p className="hint">{t('Inclusive of all taxes')}</p>
          </div>

          <div className="perks">
            <span><Banknote size={20} />{t('Cash on Delivery')}</span>
            <span><BadgeCheck size={20} />{t('Genuine leather')}</span>
            <span><Gift size={20} />{t(isCombo ? 'Combo pack' : 'Gift box')}</span>
            <span><MessageCircle size={20} />{t('WhatsApp support')}</span>
          </div>

          <div ref={sizeBlock} className={`size-block ${sizeError ? 'has-error' : ''}`}>
            <div className="size-head"><b>{t('Select size')} <span className="hint">{t('(waist, inches)')}</span></b><Link className="text-link" to="size-guide"><Ruler size={14} /> {t('Size chart')}</Link></div>
            <div className="size-chips" role="radiogroup" aria-label={t('Belt size')}>
              {product.sizes.map((value) => (
                <button key={value} role="radio" aria-checked={size === value} className={size === value ? 'is-selected' : ''} onClick={() => { setSize(value); setSizeError(false); }}>{value}</button>
              ))}
            </div>
            {sizeError && <p className="error" role="alert">{t('Please select a size.')}</p>}
            {size && <p className="hint">{t('Size {size} in fits a trouser waist of about {waist} in ({cm} cm belt).', { size, waist: size - 2, cm: Math.round(size * 2.54) })}</p>}
            <details className="size-help">
              <summary>{t('Not sure? Find your size')}</summary>
              <label className="inline-label">{t('Your trouser waist (inches)')} <input type="number" min="18" max="60" value={waist} onChange={(event) => setWaist(event.target.value)} /></label>
              <p className="hint" role="status">{waist === '' ? t('Most people choose a belt 2 inches larger than their trouser waist.') : suggestion ? t(product.sizes.includes(suggestion.inches) ? 'Suggested size: {size} in.' : 'Suggested size: {size} in (not available in this belt).', { size: suggestion.inches }) : t('Enter a waist between 18 and 60 inches.')}</p>
              {suggestion && product.sizes.includes(suggestion.inches) && suggestion.inches !== size && <button className="btn btn--small" onClick={() => { setSize(suggestion.inches); setSizeError(false); }}>{t('Select {size} in', { size: suggestion.inches })}</button>}
            </details>
          </div>

          <p className={product.stock ? 'stock' : 'error'}>{product.stock ? (product.stock <= 5 ? t('Only {count} left in stock', { count: product.stock }) : t('In stock')) : t('Out of stock')}</p>

          <div className="delivery-box">
            <label htmlFor="pincode"><MapPin size={16} /> {t('Delivery')}</label>
            <form className="inline-form" onSubmit={(event) => { event.preventDefault(); setPincodeResult(pincodeMessage(pincode, settings)); }}>
              <input id="pincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, ''))} placeholder={t('Enter 6-digit pincode')} />
              <button className="plain-button text-link" type="submit">{t('Check')}</button>
            </form>
            <p className="hint" role="status">{pincodeResult ? t(pincodeResult) : t('Delivery {fee}, free above {free}. Cash on Delivery +{cod}.', { fee: money(settings.shippingFee), free: money(settings.freeShippingAbove), cod: money(settings.codCharge) })}</p>
          </div>

          <section className="pdp-section">
            <h2>{t('About this item')}</h2>
            <p>{t(product.description)}</p>
          </section>

          <section className="pdp-section">
            <h2>{t('Product details')}</h2>
            <table className="spec-table"><tbody>{specs.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table>
          </section>

          <details className="pdp-details"><summary>{t('Material & care')}</summary><p>{t(product.care)}</p></details>
          <details className="pdp-details"><summary>{t('Shipping & returns')}</summary><p>{t('Delivery is {fee}, free on orders of {free} or more. Cash on Delivery adds {cod}.', { fee: money(settings.shippingFee), free: money(settings.freeShippingAbove), cod: money(settings.codCharge) })} {t('Wrong size or a problem with your belt? Message us on WhatsApp with your order reference.')} <Link className="text-link" to="shipping">{t('Shipping & returns policy')}</Link></p></details>

          <div className="link-row">
            <a className="text-link" href={settings.whatsapp ? whatsappUrl(settings.whatsapp, question) : href('contact')} target={settings.whatsapp ? '_blank' : undefined} rel="noopener noreferrer"><MessageCircle size={15} /> {t('Ask about this belt on WhatsApp')}</a>
          </div>
          <Marketplaces className="marketplaces--pdp" />
        </div>
      </div>

      {partner && (
        <section className="section bundle">
          <h2 className="section-title">{t('Make it a pair')}</h2>
          <div className="bundle-box panel">
            <div className="bundle-items">
              <div className="bundle-item"><span className="bundle-thumb studio"><img src={imageUrl(product.images[0])} alt="" width="140" height="140" /></span><span>{t('This item: {name}', { name: t(product.name) })}</span><b>{money(product.price)}</b></div>
              <Plus size={22} className="bundle-plus" aria-hidden="true" />
              <a className="bundle-item" href={productHref(partner)}><span className="bundle-thumb studio"><img src={imageUrl(partner.images[0])} alt="" width="140" height="140" /></span><span>{t(partner.name)}</span><b>{money(partner.price)}</b></a>
            </div>
            <div className="bundle-total">
              <p>{t('Both belts:')} <b>{money(product.price + partner.price)}</b> <del>{money(product.mrp + partner.mrp)}</del></p>
              <p className="hint">{size ? t('Both in size {size} in.', { size }) : t('Select a size above first.')}{product.price + partner.price >= settings.freeShippingAbove ? ` ${t('Free delivery.')}` : ''}</p>
              <button className="btn btn--cart" disabled={!product.stock} onClick={addBundle}><ShoppingBag size={17} /> {t('Add both to bag')}</button>
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && <section className="section section--tight"><h2 className="section-title">{t('You may also like')}</h2><ProductGrid items={related} saved={saved} onToggleSaved={onToggleSaved} /></section>}

      <div className="buy-bar">
        <div className="buy-bar-price"><b>{money(product.price)}</b>{off > 0 && <small><del>{money(product.mrp)}</del> {t('{percent}% off', { percent: off })}</small>}</div>
        <button className="btn btn--cart" disabled={!product.stock} onClick={() => buy(false)}>{t('Add to bag')}</button>
        <button className="btn btn--buy" disabled={!product.stock} onClick={() => buy(true)}>{t('Buy now')}</button>
      </div>

      <dialog ref={zoom} className="zoom-dialog" onClick={(event) => event.target === zoom.current && zoom.current.close()}>
        <form method="dialog"><button className="icon-btn zoom-close" aria-label={t('Close')}><X size={20} /></button></form>
        <span className="zoom-frame"><img src={imageUrl(view.path)} alt={t(product.name)} width="900" height="900" style={crop(view)} /></span>
      </dialog>
    </div>
  );
}
