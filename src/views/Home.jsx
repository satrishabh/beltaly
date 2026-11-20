import { ArrowUpRight, Banknote, RotateCcw, Smartphone } from 'lucide-react';
import { banners, categories, collections, getProduct, imageUrl, products } from '../catalog.js';
import { useT } from '../i18n.js';
import { Link, ProductGrid, href } from './shared.jsx';

const categoryMarks = ['▱', '≈', '✳', '⇄', '⌁', '⊞'];
const stories = [
  ['The everyday upgrade', 'A considered finish for office mornings, coffee runs, and everything in between.', '01 / WORKDAY'],
  ['A gift with character', 'Something useful. Something personal. Something they will reach for again.', '02 / GIFTING'],
  ['One less thing to think about', 'A good fit brings the whole outfit together. Simple as that.', '03 / EVERYDAY'],
];

export default function Home({ saved, onToggleSaved }) {
  const t = useT();
  const bestsellers = collections.find((collection) => collection.id === 'bestsellers');
  const featured = bestsellers?.productIds.length ? bestsellers.productIds.map(getProduct) : products.slice(0, 4);

  return (
    <div className="wrap">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t('heroEyebrow')}</p>
          <h1>{t('heroTitle')}<br /><em>{t('heroEmphasis')}</em></h1>
          <p>{t('heroBody')}</p>
          <div className="button-row">
            <Link className="btn" to="shop">{t('collection')} <ArrowUpRight size={16} /></Link>
            <Link className="text-link" to="about">{t('story')}</Link>
          </div>
          <div className="tiny-note">CONSIDERED DETAILS. &nbsp; HONEST CHARACTER. &nbsp; EVERYDAY EASE.</div>
        </div>
        <div className="hero-art">
          <img src={imageUrl('/products/hero.svg')} alt="Studio illustration of a tan leather belt with brass buckle" width="900" height="900" fetchpriority="high" />
          <div className="circle-seal">Small details.<br />Big character.<br />✳</div>
          <div className="art-caption"><span>THE EVERYDAY EDIT — 01</span><span>BELTALY STUDIO</span></div>
        </div>
      </section>

      <div className="trust">
        <span><Banknote size={15} /> {t('trustCod')}</span>
        <span><RotateCcw size={15} /> {t('trustReturns')}</span>
        <span><Smartphone size={15} /> {t('trustSecure')}</span>
      </div>

      <section className="section">
        <div className="section-head"><div><p className="eyebrow">{t('categoryEyebrow')}</p><h2>{t('categories')}</h2></div></div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <a className="category" key={category.id} href={href('shop', { category: category.id })}>
              <span aria-hidden="true">{categoryMarks[index % categoryMarks.length]}</span>
              <b>{t(category.name)} <ArrowUpRight size={15} className="category-arrow" /></b>
            </a>
          ))}
        </div>
      </section>

      <section className="section section--tight">
        <div className="section-head">
          <div><p className="eyebrow">{t('favouritesEyebrow')}</p><h2>{t('favourites')}</h2></div>
          <Link className="text-link" to="shop">{t('viewAll')} <ArrowUpRight size={14} /></Link>
        </div>
        <ProductGrid items={featured} saved={saved} onToggleSaved={onToggleSaved} className="home-products" />
      </section>

      {banners.map((banner) => (
        <section className="strip" key={banner.id}>
          <div><p className="eyebrow">{banner.eyebrow}</p><h2>{banner.title}</h2><p>{banner.description}</p></div>
          <div>
            <div className="strip-mark" aria-hidden="true">✳ ─── ✳</div>
            <a className="btn" href={`#${banner.href.replace(/\/\?/, '?').replace(/\/$/, '')}`}>Discover the edit <ArrowUpRight size={16} /></a>
          </div>
        </section>
      ))}

      <section className="section editorial">
        <div className="editorial-art"><img src={imageUrl('/products/detail-0.svg')} alt="Belt sizing studio illustration" width="900" height="900" loading="lazy" /></div>
        <div>
          <p className="eyebrow">A LITTLE GUIDE TO A GREAT FIT</p>
          <h2>{t('sizeTitle')}</h2>
          <p>{t('sizeBody')}</p>
          <Link className="text-link" to="size-guide">{t('sizeCta')} <ArrowUpRight size={14} /></Link>
          <div className="steps" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <span className="hole" key={i} />)}</div>
        </div>
      </section>

      <section className="section section--flush">
        <p className="eyebrow">THE FEELING WE’RE MAKING ROOM FOR</p>
        <h2>Made to fit your life.</h2>
        <p className="hint">Illustrative customer stories. Real reviews will appear after launch.</p>
        <div className="quotes">
          {stories.map(([title, quote, note]) => <div className="quote" key={title}><small>{title}</small><blockquote>“{quote}”</blockquote><small>{note}</small></div>)}
        </div>
      </section>

      <section className="section next-chapter">
        <p className="eyebrow">THE NEXT CHAPTER</p>
        <h2>Belts today.<br /><em>Wallets on the horizon.</em></h2>
        <p>Beltaly is a belt and leather goods company. Our upcoming wallet collection will bring the same considered details to what you carry every day.</p>
        <span className="badge badge--static">{t('Wallets · coming soon').toUpperCase()}</span>
      </section>
    </div>
  );
}
