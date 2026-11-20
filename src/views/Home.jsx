import { ArrowRight, Banknote, BadgeCheck, Gift, MessageCircle, Ruler, Truck } from 'lucide-react';
import { banners, categories, collections, discountPercent, getProduct, imageUrl, money, products, settings } from '../catalog.js';
import { useT } from '../i18n.js';
import { Link, ProductGrid, href, productHref } from './shared.jsx';

const lowestPrice = Math.min(...products.map((product) => product.price));
const bestOff = Math.max(...products.map(discountPercent));

export default function Home({ saved, onToggleSaved }) {
  const t = useT();
  const bestsellers = collections.find((collection) => collection.id === 'bestsellers');
  const featured = bestsellers?.productIds.length ? bestsellers.productIds.map(getProduct) : products.slice(0, 4);
  const hero = products.find((product) => product.badge === 'BESTSELLER') ?? products[0];
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
          <a className="hero-product" href={productHref(hero)} aria-label={hero.name}>
            <img src={imageUrl(hero.images[0])} alt={hero.name} width="900" height="900" fetchpriority="high" />
            <span className="hero-tag"><small>Bestseller</small><b>{money(hero.price)}</b></span>
          </a>
        </div>
      </section>

      <div className="wrap">
        <div className="trust">
          <span><Banknote size={22} /><b>Cash on Delivery</b><small>Pay when it arrives</small></span>
          <span><Truck size={22} /><b>Pan-India delivery</b><small>Free above {money(settings.freeShippingAbove)}</small></span>
          <span><BadgeCheck size={22} /><b>Genuine leather</b><small>Metal buckles</small></span>
          <span><MessageCircle size={22} /><b>WhatsApp support</b><small>Talk to a real person</small></span>
        </div>

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
