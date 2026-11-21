import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { banners, categories, collections, discountPercent, getProduct, imageUrl, money, products, settings } from '../catalog.js';
import { useT } from '../i18n.js';
import { readViewed } from '../storage.js';
import lookbook from '../data/lookbook.json' with { type: 'json' };
import { Link, Marketplaces, ProductGrid, href, productHref } from './shared.jsx';

const lowestPrice = Math.min(...products.map((product) => product.price));
const bestOff = Math.max(...products.map(discountPercent));
const looks = (lookbook.items ?? []).filter((item) => item?.image);
// Where each category tile's close-up crop is centred (the buckle, the stitching, the box).
const CATEGORY_FOCUS = { formal: '18% 50%', casual: '24% 40%', gifts: '42% 55%' };

// Line illustrations for the craft section (drawn in currentColor, so they follow the theme).
const BuckleArt = () => (
  <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="18" width="30" height="28" rx="5" /><path d="M25 18v28M40 32h18M4 26h6M4 38h6" /><circle cx="50" cy="32" r="1.6" /></svg>
);
const StitchArt = () => (
  <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 22h52M6 42h52" /><path d="M10 28h6M22 28h6M34 28h6M46 28h6M10 36h6M22 36h6M34 36h6M46 36h6" /></svg>
);
const BoxArt = () => (
  <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 24l24-10 24 10v24L32 58 8 48z" /><path d="M8 24l24 10 24-10M32 34v24" /><path d="M20 19l24 10" /></svg>
);
const RulerArt = () => (
  <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="22" width="52" height="20" rx="3" /><path d="M14 22v8M22 22v5M30 22v8M38 22v5M46 22v8" /></svg>
);

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
  const combo = products.find((product) => product.category === 'gifts');
  const black = products.find((product) => product.colour === 'Black') ?? hero;
  const promises = ['Genuine leather', 'Cash on Delivery', 'Sizes 28 to 44', 'Ready to gift', 'Pan-India delivery', 'WhatsApp support'];

  // Rotate the hero product every 6 seconds, unless the shopper is hovering or prefers less motion.
  useEffect(() => {
    if (lookbook.heroImage || paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setSlide((index) => (index + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  return (
    <div className="home lux">
      {/* ---------- Hero ---------- */}
      <section className="lux-hero">
        <div className="wrap lux-hero-inner">
          <div className="lux-hero-copy" data-reveal>
            <p className="lux-kicker">{t('Genuine leather belts')}</p>
            <h1>{t('A small detail.')} <em>{t('A lasting impression.')}</em></h1>
            <p className="lux-lead">{bestOff > 0 ? t.rich('Plate buckle belts and combo packs in sizes 28 to 44. Starting at {price}, up to {percent} off M.R.P.', { price: money(lowestPrice), percent: `${bestOff}%` }) : t.rich('Plate buckle belts and combo packs in sizes 28 to 44. Starting at {price}.', { price: money(lowestPrice) })}</p>
            <div className="button-row">
              <Link className="btn btn--gold" to="shop">{t('Shop all belts')} <ArrowRight size={16} /></Link>
              <a className="btn btn--line" href={productHref(hero)}>{t('View the bestseller')}</a>
            </div>
          </div>

          <div className="lux-arch-wrap" data-reveal onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {lookbook.heroImage
              ? <div className="lux-arch lux-arch--photo"><img src={imageUrl(lookbook.heroImage)} alt="" width="900" height="1100" fetchpriority="high" /></div>
              : <a className="lux-arch studio" href={productHref(current)} aria-label={`${t(current.name)}, ${money(current.price)}`}>
                {slides.map((product, index) => <img key={product.id} className={index === slide ? 'is-on' : ''} src={imageUrl(product.images[0])} alt="" width="900" height="900" fetchpriority={index === 0 ? 'high' : 'low'} loading={index === 0 ? 'eager' : 'lazy'} />)}
              </a>}
            {!lookbook.heroImage && (
              <div className="lux-hero-caption">
                <span><small>{current.badge ? t(current.badge) : 'Beltaly'}</small><b>{t(current.name)}</b></span>
                <span className="lux-hero-price">{money(current.price)}{discountPercent(current) > 0 && <em>{t('{percent}% off', { percent: discountPercent(current) })}</em>}</span>
              </div>
            )}
            {!lookbook.heroImage && slides.length > 1 && <div className="hero-dots" role="tablist" aria-label={t('Featured belts')}>{slides.map((product, index) => <button key={product.id} role="tab" aria-selected={index === slide} aria-label={t(product.name)} className={index === slide ? 'on' : ''} onClick={() => setSlide(index)} />)}</div>}
          </div>
        </div>
      </section>

      {/* ---------- Promise ribbon ---------- */}
      <div className="lux-ribbon" aria-label={t('Why Beltaly')}>
        <div className="lux-ribbon-track">
          {[0, 1].map((copy) => <span key={copy} aria-hidden={copy === 1 ? 'true' : undefined}>{promises.map((item) => <b key={item}>{t(item)}<i>✦</i></b>)}</span>)}
        </div>
      </div>

      <div className="wrap">
        <Marketplaces className="marketplaces--home" />

        {viewed.length > 0 && (
          <section className="section recent" data-reveal>
            <h2 className="lux-title">{t('Pick up where you left off')}</h2>
            <div className="recent-row">
              {viewed.slice(0, 6).map((product) => <a key={product.id} href={productHref(product)}><span className="studio"><img src={imageUrl(product.images[0])} alt="" width="120" height="120" /></span><span>{t(product.name)}</span><b>{money(product.price)}</b></a>)}
            </div>
          </section>
        )}

        {/* ---------- Categories ---------- */}
        <section className="section" data-reveal>
          <div className="lux-head"><p className="lux-kicker">{t('Explore')}</p><h2 className="lux-title">{t('Shop by category')}</h2></div>
          <div className="lux-categories">
            {categories.map((category) => {
              const sample = products.find((product) => product.category === category.id);
              return (
                <a className="lux-category" key={category.id} href={href('shop', { category: category.id })} style={{ '--focus': CATEGORY_FOCUS[category.id] ?? '50% 50%' }}>
                  <span className="lux-category-img studio"><img src={imageUrl(sample.images.at(-1))} alt="" width="600" height="600" loading="lazy" /></span>
                  <span className="lux-category-text"><b>{t(category.name)}</b><small>{t(category.description)}</small><i>{t('Explore')} <ArrowRight size={14} /></i></span>
                </a>
              );
            })}
          </div>
        </section>

        {/* ---------- Bestsellers ---------- */}
        <section className="section section--tight" data-reveal>
          <div className="lux-head lux-head--row">
            <div><p className="lux-kicker">{t('BESTSELLER')}</p><h2 className="lux-title">{t('The everyday favourites.')}</h2></div>
            <Link className="text-link" to="shop">{t('View all belts')} <ArrowRight size={14} /></Link>
          </div>
          <ProductGrid items={featured} saved={saved} onToggleSaved={onToggleSaved} className="home-products" />
        </section>
      </div>

      {/* ---------- The craft ---------- */}
      <section className="lux-craft" data-reveal>
        <div className="wrap lux-craft-inner">
          <div className="lux-craft-art">
            <div className="lux-arch lux-arch--crop studio" style={{ '--crop': `url(${imageUrl(black.images[0])})` }} role="img" aria-label={t('Brushed metal buckle')} />
          </div>
          <div className="lux-craft-copy">
            <p className="lux-kicker">{t('The craft')}</p>
            <h2>{t('Every detail has a story.')}</h2>
            <ul className="lux-points">
              <li><BuckleArt /><div><h3>{t('Genuine leather')}</h3><p>{t('Real leather straps with brushed metal buckles, made for daily wear.')}</p></div></li>
              <li><RulerArt /><div><h3>{t('Sizes 28 to 44')}</h3><p>{t('Nine waist sizes, and a simple size guide so you get it right the first time.')} <Link className="text-link" to="size-guide">{t('Size guide')}</Link></p></div></li>
              <li><BoxArt /><div><h3>{t('Ready to gift')}</h3><p>{t('Belts arrive in the Beltaly box. The combo pack is an easy present.')}</p></div></li>
            </ul>
          </div>
        </div>
        <div className="wrap lux-details">
          <figure><span className="lux-detail studio" style={{ '--crop': `url(${imageUrl(black.images[0])})`, '--pos': '7% 48%' }} /><figcaption><BuckleArt />{t('Brushed metal buckle')}</figcaption></figure>
          {combo && <figure><span className="lux-detail studio" style={{ '--crop': `url(${imageUrl(combo.images[0])})`, '--pos': '74% 30%' }} /><figcaption><StitchArt />{t('Textured leather')}</figcaption></figure>}
          {combo && <figure><span className="lux-detail studio" style={{ '--crop': `url(${imageUrl(combo.images.at(-1))})`, '--pos': '0% 37%', '--zoom': '200%' }} /><figcaption><BoxArt />{t('Gift box')}</figcaption></figure>}
        </div>
      </section>

      <div className="wrap">
        {/* ---------- Gift edit ---------- */}
        {combo && banners.map((banner) => (
          <section className="lux-gift" key={banner.id} data-reveal>
            <a className="lux-gift-img studio" href={productHref(combo)} aria-label={t(combo.name)}><img src={imageUrl(combo.images.at(-1))} alt="" width="600" height="600" loading="lazy" /></a>
            <div className="lux-gift-copy">
              <p className="lux-kicker">{t(banner.eyebrow)}</p>
              <h2>{t(banner.title)}</h2>
              <p>{t(banner.description)}</p>
              <p className="offer-price"><b>{money(combo.price)}</b> <del>{money(combo.mrp)}</del> <span>{t('{percent}% off', { percent: discountPercent(combo) })}</span></p>
              <a className="btn btn--gold" href={productHref(combo)}>{t('Shop the combo')} <ArrowRight size={16} /></a>
            </div>
          </section>
        ))}

        {/* ---------- Lookbook (appears once photos are added to src/data/lookbook.json) ---------- */}
        {looks.length > 0 && (
          <section className="section lux-lookbook" data-reveal>
            <div className="lux-head"><p className="lux-kicker">Beltaly</p><h2 className="lux-title">{t('Lookbook')}</h2></div>
            <div className="lux-looks">
              {looks.map((look) => {
                const product = look.product ? getProduct(look.product) : null;
                const body = <><img src={imageUrl(look.image)} alt={look.caption ? t(look.caption) : ''} width="800" height="1000" loading="lazy" />{(look.caption || product) && <figcaption>{look.caption && t(look.caption)}{product && <b>{t(product.name)} · {money(product.price)}</b>}</figcaption>}</>;
                return product ? <a className="lux-look" key={look.image} href={productHref(product)}><figure>{body}</figure></a> : <figure className="lux-look" key={look.image}>{body}</figure>;
              })}
            </div>
          </section>
        )}

        {/* ---------- Size promise ---------- */}
        <section className="lux-fit" data-reveal>
          <RulerArt />
          <div><h2>{t('Find your belt size')}</h2><p>{t('Most people choose a belt 2 inches larger than their trouser waist.')}</p></div>
          <Link className="btn btn--line-dark" to="size-guide">{t('Size guide')} <ArrowRight size={16} /></Link>
        </section>

        <section className="section lux-promise" data-reveal>
          <picture><source srcSet={imageUrl('/brand/mark-3d.webp')} type="image/webp" /><img className="lux-sign-mark" src={imageUrl('/brand/mark-3d.png')} alt="" width="192" height="182" loading="lazy" /></picture>
          <h2 className="lux-sign">{t(settings.tagline)}</h2>
        </section>
      </div>
    </div>
  );
}
