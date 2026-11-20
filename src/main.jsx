import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Check, Heart, Home as HomeIcon, LayoutGrid, MessageCircle, Minus, Package, Plus, Search, ShoppingBag, Truck, X } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary.jsx';
import { categories, discountPercent, getProduct, imageUrl, money, products, settings } from './catalog.js';
import { totals, validateItems, whatsappUrl } from './commerce.js';
import { LanguageContext, translate } from './i18n.js';
import { STORAGE_KEYS, clampQuantity, readCart, readLanguage, readOrders, readSaved, writeJson } from './storage.js';
import Account, { ACCOUNT_TITLES } from './views/Account.jsx';
import Checkout from './views/Checkout.jsx';
import Home from './views/Home.jsx';
import InfoPage, { INFO_PAGES } from './views/InfoPage.jsx';
import ProductPage from './views/ProductPage.jsx';
import Shop from './views/Shop.jsx';
import { Link, href, navigate, parseRoute, productHref } from './views/shared.jsx';
import './styles.css';

const sameLine = (a, b) => a.productId === b.productId && a.size === b.size;
const contactHref = settings.whatsapp ? whatsappUrl(settings.whatsapp) : href('contact');
const contactTarget = settings.whatsapp ? { target: '_blank', rel: 'noopener noreferrer' } : {};

// Links shared before the switch to real paths looked like /#/shop/formal/slug. Move them to /shop/formal/slug.
if (window.location.hash.startsWith('#/')) window.history.replaceState(null, '', window.location.hash.slice(1));

// Picks the screen for the current path.
function resolveRoute({ parts }) {
  const [page, category, slug] = parts;
  if (!page) return { view: 'home', title: 'Genuine leather belts for men' };
  if (page === 'shop' && slug) {
    const product = products.find((item) => item.slug === slug && item.category === category);
    return product ? { view: 'product', product, title: product.name } : { view: 'notFound', title: 'Page not found' };
  }
  if (page === 'shop' || page === 'search') return { view: 'shop', title: 'Shop belts' };
  if (page === 'cart') return { view: 'cart', title: 'Your bag' };
  if (INFO_PAGES[page]) return { view: 'info', page, title: INFO_PAGES[page].title };
  if (ACCOUNT_TITLES[page]) return { view: 'account', page, title: ACCOUNT_TITLES[page] };
  return { view: 'notFound', title: 'Page not found' };
}

function App() {
  const [route, setRoute] = useState(() => parseRoute());
  const [cartItems, setCartItems] = useState(readCart);
  const [saved, setSaved] = useState(readSaved);
  const [orders, setOrders] = useState(readOrders);
  const [language, setLanguage] = useState(readLanguage);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [clicked, setClicked] = useState(false);
  const lastPath = useRef(window.location.pathname);
  const t = (key) => translate(language, key);

  const resolved = resolveRoute(route);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const bag = totals(cartItems, products, settings);
  const mrpTotal = cartItems.reduce((sum, item) => sum + (getProduct(item.productId)?.mrp || 0) * item.quantity, 0);
  const overlayOpen = cartOpen;

  useEffect(() => writeJson(STORAGE_KEYS.cart, cartItems), [cartItems]);
  useEffect(() => writeJson(STORAGE_KEYS.saved, saved), [saved]);
  useEffect(() => writeJson(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => {
    writeJson(STORAGE_KEYS.language, language);
    document.documentElement.lang = language;
    // The Devanagari font is only downloaded once someone switches to Hindi.
    if (language === 'hi' && !document.getElementById('font-hi')) {
      const link = Object.assign(document.createElement('link'), { id: 'font-hi', rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600&display=swap' });
      document.head.append(link);
    }
  }, [language]);
  useEffect(() => { document.title = `${resolved.title} | Beltaly`; }, [resolved.title]);

  // Path routing: in-site links are handled here (no page reload); back/forward, refresh and shared links all work.
  useEffect(() => {
    const onLocation = () => {
      const path = window.location.pathname;
      if (path !== lastPath.current) window.scrollTo({ top: 0 });
      lastPath.current = path;
      setRoute(parseRoute());
      setCartOpen(false);
    };
    const onClick = (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target && link.target !== '_self') return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || /\.\w+$/.test(url.pathname)) return;
      event.preventDefault();
      if (url.pathname + url.search !== window.location.pathname + window.location.search) navigate(url.pathname + url.search);
      else onLocation();
    };
    window.addEventListener('popstate', onLocation);
    window.addEventListener('locationchange', onLocation);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('popstate', onLocation);
      window.removeEventListener('locationchange', onLocation);
      document.removeEventListener('click', onClick);
    };
  }, []);

  // Keep the bag and saved items in sync across tabs.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEYS.cart) setCartItems(readCart());
      if (event.key === STORAGE_KEYS.saved) setSaved(readSaved());
      if (event.key === STORAGE_KEYS.orders) setOrders(readOrders());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Hide broken remote images instead of showing a broken-image icon.
  useEffect(() => {
    const onError = (event) => event.target instanceof HTMLImageElement && event.target.classList.add('img-failed');
    document.addEventListener('error', onError, true);
    return () => document.removeEventListener('error', onError, true);
  }, []);

  // Dialogs: lock background scroll and close with Escape.
  useEffect(() => {
    if (!overlayOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => { if (event.key === 'Escape') setCartOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [overlayOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  // openBag=false is used by "Buy now", which goes straight to the bag page instead.
  function addToCart(productId, size, amount = 1, openBag = true) {
    const existing = cartItems.find((item) => sameLine(item, { productId, size }));
    const next = existing
      ? cartItems.map((item) => (item === existing ? { ...item, quantity: clampQuantity(item.quantity + amount) } : item))
      : [...cartItems, { productId, size, quantity: clampQuantity(amount) }];
    try {
      validateItems(next, products);
    } catch (error) {
      setToast(error.message);
      return false;
    }
    setCartItems(next);
    setClicked(true);
    window.setTimeout(() => setClicked(false), 450);
    if (openBag) setCartOpen(true);
    return true;
  }

  function updateQuantity(line, change) {
    const next = cartItems.map((item) => (sameLine(item, line) ? { ...item, quantity: item.quantity + change } : item)).filter((item) => item.quantity > 0);
    try {
      if (next.length) validateItems(next, products);
      setCartItems(next);
    } catch (error) {
      setToast(error.message);
    }
  }

  const removeLine = (line) => setCartItems((items) => items.filter((item) => !sameLine(item, line)));

  function toggleSaved(productId) {
    const wasSaved = saved.includes(productId);
    setSaved((items) => (wasSaved ? items.filter((id) => id !== productId) : [...items, productId]));
    setToast(wasSaved ? 'Removed from your wishlist.' : 'Added to your wishlist.');
  }

  // Record the request once the shopper sends it (WhatsApp, UPI or payment link), then empty the bag.
  function orderSent(order) {
    setOrders((items) => (items.some((item) => item.id === order.id) ? items : [order, ...items].slice(0, 50)));
    setCartItems([]);
  }

  function buyAgain(order) {
    let added = 0;
    let next = [...cartItems];
    for (const item of order.items) {
      const candidate = next.some((line) => sameLine(line, item))
        ? next.map((line) => (sameLine(line, item) ? { ...line, quantity: clampQuantity(line.quantity + item.quantity) } : line))
        : [...next, { ...item }];
      try { validateItems(candidate, products); next = candidate; added++; } catch { /* skip unavailable items */ }
    }
    setCartItems(next);
    setToast(added === order.items.length ? 'Added to your bag.' : 'Some items are no longer available and were skipped.');
    if (added) setCartOpen(true);
  }

  function submitSearch(event) {
    event.preventDefault();
    const term = String(new FormData(event.currentTarget).get('q') ?? '').trim();
    navigate(href('shop', { q: term }));
  }

  const currentCategory = resolved.view === 'product' ? resolved.product.category : route.query.get('category');

  let screen;
  if (resolved.view === 'home') screen = <Home saved={saved} onToggleSaved={toggleSaved} />;
  else if (resolved.view === 'shop') screen = <Shop query={route.query} saved={saved} onToggleSaved={toggleSaved} />;
  else if (resolved.view === 'product') screen = <ProductPage key={resolved.product.id} product={resolved.product} saved={saved} onToggleSaved={toggleSaved} onAddToCart={addToCart} />;
  else if (resolved.view === 'cart') screen = <Checkout cartItems={cartItems} onUpdateQuantity={updateQuantity} onRemove={removeLine} onOrderSent={orderSent} />;
  else if (resolved.view === 'info') screen = <InfoPage page={resolved.page} />;
  else if (resolved.view === 'account') screen = <Account page={resolved.page} orders={orders} saved={saved} onToggleSaved={toggleSaved} onBuyAgain={buyAgain} />;
  else screen = <div className="wrap prose"><h1>This page slipped a notch.</h1><p>The link may be old, or the belt may have moved.</p><Link className="btn" to="shop">{t('collection')} <ArrowUpRight size={15} /></Link></div>;

  return (
    <LanguageContext.Provider value={language}>
      <a className="skip" href="#main" onClick={(event) => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <div className="announcement">{settings.announcement}</div>

      <header className="topbar">
        <div className="wrap header">
          <Link className="logo" to="" aria-label="Beltaly home">
            <picture><source srcSet={imageUrl('/brand/mark-3d.webp')} type="image/webp" /><img className="logo-mark" src={imageUrl('/brand/mark-3d.png')} alt="" width="192" height="182" /></picture>
            <span className="logo-word">BELTALY<small>GENUINE LEATHER</small></span>
          </Link>
          <form className="header-search" role="search" onSubmit={submitSearch}>
            <input name="q" type="search" key={route.query.get('q') ?? ''} defaultValue={route.query.get('q') ?? ''} aria-label={t('Search Beltaly')} placeholder={t('Search by name, material, colour or occasion')} />
            <button type="submit" aria-label={t('search')}><Search size={18} /></button>
          </form>
          <div className="actions">
            <button className="lang-toggle" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} aria-label={language === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}>{language === 'hi' ? 'EN' : 'हिं'}</button>
            <Link className="head-link" to="orders"><Package size={19} /><span>{t('Orders')}</span></Link>
            <Link className="head-link saved-link" to="saved" aria-label={`Wishlist, ${saved.length}`}><span className="nav-bag"><Heart size={19} />{saved.length > 0 && <span className="dot-count">{saved.length}</span>}</span><span>Wishlist</span></Link>
            <button className={`head-link bag-pill ${clicked ? 'is-clicked' : ''}`} onClick={() => setCartOpen(true)} aria-label={`${t('Bag')}, ${cartCount}`}><span className="nav-bag"><ShoppingBag size={20} />{cartCount > 0 && <span className="dot-count">{cartCount}</span>}</span><span>{t('Bag')}</span></button>
          </div>
        </div>
        <form className="mobile-search wrap" role="search" onSubmit={submitSearch}>
          <Search size={17} />
          <input name="q" type="search" key={route.query.get('q') ?? ''} defaultValue={route.query.get('q') ?? ''} aria-label={t('Search Beltaly')} placeholder="Search belts" />
        </form>
      </header>
      <nav className="catbar" aria-label="Categories">
        <div className="wrap catbar-inner">
          <Link to="shop" aria-current={resolved.view === 'shop' && !currentCategory ? 'page' : undefined}>All belts</Link>
          {categories.map((category) => <Link key={category.id} to="shop" params={{ category: category.id }} aria-current={currentCategory === category.id ? 'page' : undefined}>{t(category.name)}</Link>)}
          <Link to="size-guide">{t('guide')}</Link>
          <Link to="business">Bulk & corporate</Link>
          <Link to="about">{t('story')}</Link>
        </div>
      </nav>

      <main id="main" tabIndex={-1}>{screen}</main>

      <section className="help-band">
        <div className="wrap help-band-inner">
          <div><h2>Need help choosing a size?</h2><p>Message us on WhatsApp. A real person replies, usually within a few hours.</p></div>
          <a className="btn btn--whatsapp" href={contactHref} {...contactTarget}><MessageCircle size={17} /> {t('whatsapp')}</a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap footer">
          <div><Link className="footer-logo" to="" aria-label="Beltaly home"><picture><source srcSet={imageUrl('/brand/logo-3d.webp')} type="image/webp" /><img src={imageUrl('/brand/logo-3d.png')} alt="Beltaly — Genuine Leather" width="220" height="142" loading="lazy" /></picture></Link><p>{t('footer')}</p>
            {/^https:\/\/(www\.)?amazon\.in\//.test(settings.amazonStore) && <a className="text-link" href={settings.amazonStore} target="_blank" rel="noopener noreferrer">Also on Amazon.in <ArrowUpRight size={13} /></a>}
          </div>
          <div><h3>{t('Explore')}</h3><Link to="shop">All belts</Link>{categories.map((category) => <Link key={category.id} to="shop" params={{ category: category.id }}>{t(category.name)}</Link>)}<Link to="size-guide">{t('guide')}</Link><Link to="about">{t('about')}</Link></div>
          <div><h3>{t('Here to help')}</h3><Link to="contact">{t('contact')}</Link><Link to="faq">{t('faq')}</Link><Link to="shipping">{t('shipping')}</Link><Link to="orders">{t('Orders')}</Link><Link to="business">Bulk & corporate orders</Link></div>
          <div><h3>{t('The fine print')}</h3><Link to="privacy">{t('privacy')}</Link><Link to="terms">{t('terms')}</Link>{settings.gstin && <p className="hint">GSTIN: {settings.gstin}</p>}</div>
        </div>
        <div className="wrap footer-bottom"><span>© {new Date().getFullYear()} {settings.business?.legalName || 'Beltaly'}. All prices in ₹, inclusive of taxes.</span><span className="pay-methods">Cash on Delivery · WhatsApp ordering{settings.methods.upi ? ' · UPI' : ''}</span></div>
      </footer>

      <a className="whatsapp" href={contactHref} {...contactTarget} aria-label="Chat with Beltaly on WhatsApp"><MessageCircle size={22} /></a>

      <nav className="bottom-nav" aria-label="Mobile">
        <Link to="" aria-current={resolved.view === 'home' ? 'page' : undefined}><HomeIcon size={19} /><b>{t('home')}</b></Link>
        <Link to="shop" aria-current={resolved.view === 'shop' ? 'page' : undefined}><LayoutGrid size={19} /><b>{t('shop')}</b></Link>
        <Link to="saved" aria-current={resolved.page === 'saved' ? 'page' : undefined}><span className="nav-bag"><Heart size={19} />{saved.length > 0 && <span className="dot-count">{saved.length}</span>}</span><b>Wishlist</b></Link>
        <Link to="orders" aria-current={resolved.page === 'orders' ? 'page' : undefined}><Package size={19} /><b>{t('Orders')}</b></Link>
        <Link to="cart" aria-current={resolved.view === 'cart' ? 'page' : undefined}><span className="nav-bag"><ShoppingBag size={19} />{cartCount > 0 && <span className="dot-count">{cartCount}</span>}</span><b>{t('Bag')}</b></Link>
      </nav>

      {cartOpen && (
        <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="bag-title">
            <div className="drawer-head"><h2 id="bag-title">{t('Bag')} <span className="hint">({cartCount} {cartCount === 1 ? 'item' : 'items'})</span></h2><button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close bag" autoFocus><X size={20} /></button></div>
            {cartItems.length === 0
              ? <div className="drawer-empty"><ShoppingBag size={30} /><p>{t('empty')}</p><Link className="btn" to="shop">{t('collection')}</Link></div>
              : <>
                <div className="free-ship"><Truck size={15} /> {bag.shipping ? <span>Add <b>{money(settings.freeShippingAbove - bag.subtotal)}</b> more for free delivery.</span> : <span><b>{t('Free shipping unlocked.')}</b></span>}<span className="free-ship-bar"><span style={{ width: `${Math.min(100, (bag.subtotal / settings.freeShippingAbove) * 100)}%` }} /></span></div>
                <div className="drawer-lines">
                  {cartItems.map((item) => {
                    const product = getProduct(item.productId);
                    const off = discountPercent(product);
                    return (
                      <div className="cart-row" key={`${item.productId}-${item.size}`}>
                        <a href={productHref(product)}><img src={imageUrl(product.images[0])} alt={product.name} width="72" height="72" /></a>
                        <div>
                          <h3>{product.name}</h3>
                          <p className="hint">Size {item.size} in</p>
                          <p className="line-price"><b>{money(product.price * item.quantity)}</b>{off > 0 && <><del>{money(product.mrp * item.quantity)}</del><span className="off">{off}% off</span></>}</p>
                          <div className="line-actions">
                            <div className="qty"><button aria-label={`One less ${product.name}`} onClick={() => updateQuantity(item, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label={`One more ${product.name}`} disabled={item.quantity >= Math.min(99, product.stock)} onClick={() => updateQuantity(item, 1)}><Plus size={13} /></button></div>
                            <button className="plain-button link-muted" onClick={() => removeLine(item)}>{t('Remove')}</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="drawer-foot">
                  <div className="total-row"><span>{t('Subtotal')}</span><b>{money(bag.subtotal)}</b></div>
                  <div className="total-row"><span>Delivery</span><span>{bag.shipping ? money(bag.shipping) : <span className="good">FREE</span>}</span></div>
                  {mrpTotal > bag.subtotal && <p className="savings">You save {money(mrpTotal - bag.subtotal)} on this order</p>}
                  <Link className="btn btn--buy btn--block" to="cart">Place order</Link>
                  <button className="plain-button link-muted" onClick={() => setCartOpen(false)}>{t('Keep looking')}</button>
                </div>
              </>}
          </aside>
        </div>
      )}

      {toast && <div className="toast" role="status"><Check size={16} /> {toast}<button className="plain" onClick={() => setToast('')} aria-label="Dismiss message"><X size={14} /></button></div>}
    </LanguageContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);
