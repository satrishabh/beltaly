import { useEffect, useState } from 'react';
import { ArrowRight, Banknote, BadgeCheck, Gift, MessageCircle, Ruler, Truck } from 'lucide-react';
import { banners, categories, collections, discountPercent, getProduct, imageUrl, money, products, settings } from '../catalog.js';
import { useT } from '../i18n.js';
import { readViewed } from '../storage.js';
import { Link, ProductGrid, href, productHref } from './shared.jsx';

const lowestPrice = Math.min(...products.map((product) => product.price));
const bestOff = Math.max(...products.map(discountPercent));

export default function Home({ saved, onToggleSaved }) {
  const t = useT();
  const bestsellers = collections.find((collection) => collection.id === 'bestsellers');
  const featured = bestsellers?.productIds.length ? bestsellers.productIds.map(getProduct) : products.slice(0, 4);
  const hero = products.find((product) => product.badge === 'BESTSELLER') ?? products[0];
  const slides = [hero, ...products.filter((product) => product !== hero)];
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewed] = useState(() => readViewed().map(getProduct).filter(Boolean));
  const current = slides[slide];

  // Rotate the hero product every 5 seconds, unless the shopper is hovering or prefers less motion.
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setSlide((index) => (index + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);
  const combo = products.find((product) => product.category === 'gifts');

  return (
    <div className="home">
      <section className="hero-banner">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <p className="hero-kicker">Genuine leather belts</p>
            <h1>{t('heroTitle')} <em>{t('heroEmphasis')}</em></h1>
            <p>Plate buckle belts and combo packs in sizes 28 to 44. Starting at <b>{money(lowestPrice)}</b>{bestOff > 0 ? <>, up to <b>{bestOff}% off</b> M.R.P.</> : null}</p>
            <div className="button-row">
              <Link className="btn btn--buy" to="shop">Shop all belts <ArrowRight size={16} /></Link>
              <a className="btn btn--ghost" href={productHref(hero)}>View the bestseller</a>
            </div>
          </div>
          <div className="hero-stage" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
            <a className="hero-product" href={productHref(current)} aria-label={`${current.name}, ${money(current.price)}`}>
              {slides.map((product, index) => <img key={product.id} className={index === slide ? 'is-on' : ''} src={imageUrl(product.images[0])} alt="" width="900" height="900" fetchpriority={index === 0 ? 'high' : 'low'} loading={index === 0 ? 'eager' : 'lazy'} />)}
              <span className="hero-tag"><small>{current.badge || 'Beltaly'}</small><b>{money(current.price)}</b>{discountPercent(current) > 0 && <em>{discountPercent(current)}% off</em>}</span>
            </a>
            <p className="hero-name">{current.name}</p>
            {slides.length > 1 && <div className="hero-dots" role="tablist" aria-label="Featured belts">{slides.map((product, index) => <button key={product.id} role="tab" aria-selected={index === slide} aria-label={product.name} className={index === slide ? 'on' : ''} onClick={() => setSlide(index)} />)}</div>}
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="trust">
          <span><Banknote size={22} /><b>Cash on Delivery</b><small>Pay when it arrives</small></span>
          <span><Truck size={22} /><b>Pan-India delivery</b><small>Free above {money(settings.freeShippingAbove)}</small></span>
          <span><BadgeCheck size={22} /><b>Genuine leather</b><small>Metal buckles</small></span>
          <span><MessageCircle size={22} /><b>WhatsApp support</b><small>Talk to a real person</small></span>
        </div>

        {viewed.length > 0 && (
          <section className="section section--tight recent">
            <h2 className="section-title">Pick up where you left off</h2>
            <div className="recent-row">
              {viewed.slice(0, 6).map((product) => <a key={product.id} href={productHref(product)}><img src={imageUrl(product.images[0])} alt="" width="120" height="120" /><span>{product.name}</span><b>{money(product.price)}</b></a>)}
            </div>
          </section>
        )}

        <section className="section">
          <h2 className="section-title">Shop by category</h2>
          <div className="category-grid">
            {categories.map((category) => {
              const sample = products.find((product) => product.category === category.id);
              return (
                <a className="category" key={category.id} href={href('shop', { category: category.id })}>
                  <span className="category-img"><img src={imageUrl(sample.images[0])} alt="" width="300" height="300" loading="lazy" /></span>
                  <b>{t(category.name)}</b>
                  <small>{category.description}</small>
                </a>
              );
            })}
          </div>
        </section>

        <section className="section section--tight">
          <div className="section-head">
            <h2 className="section-title">{t('favourites')}</h2>
            <Link className="text-link" to="shop">{t('viewAll')} <ArrowRight size={14} /></Link>
          </div>
          <ProductGrid items={featured} saved={saved} onToggleSaved={onToggleSaved} className="home-products" />
        </section>

        {combo && banners.map((banner) => (
          <section className="offer-strip" key={banner.id}>
            <div>
              <p className="offer-kicker">{banner.eyebrow}</p>
              <h2>{banner.title}</h2>
              <p>{banner.description}</p>
              <p className="offer-price"><b>{money(combo.price)}</b> <del>{money(combo.mrp)}</del> <span>{discountPercent(combo)}% off</span></p>
              <a className="btn btn--buy" href={productHref(combo)}>Shop the combo <ArrowRight size={16} /></a>
            </div>
            <img src={imageUrl(combo.images[combo.images.length - 1])} alt={combo.name} width="600" height="600" loading="lazy" />
          </section>
        ))}

        <section className="section why">
          <h2 className="section-title">Why Beltaly</h2>
          <div className="why-grid">
            <div><BadgeCheck size={26} /><h3>Genuine leather</h3><p>Real leather straps with brushed metal buckles, made for daily wear.</p></div>
            <div><Ruler size={26} /><h3>Sizes 28 to 44</h3><p>Nine waist sizes, and a <Link className="text-link" to="size-guide">simple size guide</Link> so you get it right the first time.</p></div>
            <div><Gift size={26} /><h3>Ready to gift</h3><p>Belts arrive in the Beltaly box. The combo pack is an easy present.</p></div>
            <div><Banknote size={26} /><h3>Order your way</h3><p>Cash on Delivery or order on WhatsApp. Also sold on <a className="text-link" href={settings.amazonStore} target="_blank" rel="noopener noreferrer">Amazon.in</a>.</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}
