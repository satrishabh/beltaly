import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Check, ChevronDown, Globe, Heart, Home as HomeIcon, LayoutGrid, Mail, Menu, MessageCircle, Minus, Package, Plus, ShoppingBag, Truck, X } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary.jsx';
import { categories, discountPercent, getProduct, imageUrl, money, products, settings } from './catalog.js';
import { totals, validateItems, whatsappUrl } from './commerce.js';
import { LANGUAGES, LanguageContext, detectLanguage, directionOf, isLanguage, loadDictionary, loadFont, makeT } from './i18n.js';
import { STORAGE_KEYS, clampQuantity, readCart, readLanguage, readOrders, readSaved, readTheme, writeJson } from './storage.js';
import Account, { ACCOUNT_TITLES } from './views/Account.jsx';
import Checkout from './views/Checkout.jsx';
import Home from './views/Home.jsx';
import InfoPage, { INFO_PAGES } from './views/InfoPage.jsx';
import MenuSheet from './views/MenuSheet.jsx';
import ProductPage from './views/ProductPage.jsx';
import SearchBox from './views/SearchBox.jsx';
import Shop from './views/Shop.jsx';
import { Link, Marketplaces, PageHero, href, navigate, parseRoute, productHref } from './views/shared.jsx';
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
  const [language, setLanguage] = useState(() => { const saved = readLanguage(); return isLanguage(saved) ? saved : detectLanguage(); });
  const [dict, setDict] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(readTheme);
  const [toast, setToast] = useState('');
  const [clicked, setClicked] = useState(false);
  const lastPath = useRef(window.location.pathname);
  const t = makeT(dict);

  const resolved = resolveRoute(route);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const bag = totals(cartItems, products, settings);
  const mrpTotal = cartItems.reduce((sum, item) => sum + (getProduct(item.productId)?.mrp || 0) * item.quantity, 0);
  const overlayOpen = cartOpen || menuOpen;

  useEffect(() => writeJson(STORAGE_KEYS.cart, cartItems), [cartItems]);
  useEffect(() => writeJson(STORAGE_KEYS.saved, saved), [saved]);
  useEffect(() => writeJson(STORAGE_KEYS.orders, orders), [orders]);
  // Switching language downloads that language's words and script font, then re-renders everything.
  useEffect(() => {
    let cancelled = false;
    writeJson(STORAGE_KEYS.language, language);
    document.documentElement.lang = language;
    document.documentElement.dir = directionOf(language);
    loadFont(language);
    if (language === 'en') setDict({});
    else loadDictionary(language).then((words) => !cancelled && setDict(words)).catch(() => !cancelled && setDict({}));
    return () => { cancelled = true; };
  }, [language]);
  useEffect(() => { document.title = `${t(resolved.title)} | Beltaly`; }, [resolved.title, dict]);

  // Theme: light, dark, or follow the device ("system"), updating live if the device switches.
  useEffect(() => {
    writeJson(STORAGE_KEYS.theme, theme);
    const root = document.documentElement;
    const dark = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => { root.dataset.theme = theme === 'system' ? (dark.matches ? 'dark' : 'light') : theme; };
    apply();
    const ready = window.setTimeout(() => root.classList.add('theme-ready'), 50);
    if (theme !== 'system') return () => window.clearTimeout(ready);
    dark.addEventListener('change', apply);
    return () => { window.clearTimeout(ready); dark.removeEventListener('change', apply); };
  }, [theme]);

  // Path routing: in-site links are handled here (no page reload); back/forward, refresh and shared links all work.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    // Old links without the trailing slash (/shop/formal/x) are tidied to the canonical form (/shop/formal/x/).
    if (window.location.pathname !== '/' && !window.location.pathname.endsWith('/')) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}/${window.location.search}`);
      lastPath.current = window.location.pathname;
    }
    const onLocation = (event) => {
      const path = window.location.pathname;
      // Back/forward returns to where the shopper was; a new page starts at the top.
      const target = event?.type === 'popstate' ? (window.history.state?.scroll ?? 0) : 0;
      if (path !== lastPath.current || event?.type === 'popstate') {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: target, behavior: 'instant' })));
      }
      lastPath.current = path;
      setRoute(parseRoute());
      setCartOpen(false);
      setMenuOpen(false);
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

  // Sections marked data-reveal fade up as they scroll into view (skipped for reduced motion).
  useEffect(() => {
    const root = document.documentElement;
    const items = [...document.querySelectorAll('[data-reveal]:not(.is-visible)')];
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((item) => item.classList.add('is-visible'));
      return undefined;
    }
    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [route, dict]);

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
    const onKey = (event) => { if (event.key === 'Escape') { setCartOpen(false); setMenuOpen(false); } };
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
      setToast(t(error.message));
      return false;
    }
    setCartItems(next);
    setClicked(true);
    window.setTimeout(() => setClicked(false), 450);
    if (openBag) setCartOpen(true);
    return true;
  }

  // Adds several bag lines in one step (used by "Make it a pair" on the product page).
  function addManyToCart(lines) {
    let next = [...cartItems];
    for (const { productId, size, quantity = 1 } of lines) {
      next = next.some((item) => sameLine(item, { productId, size }))
        ? next.map((item) => (sameLine(item, { productId, size }) ? { ...item, quantity: clampQuantity(item.quantity + quantity) } : item))
        : [...next, { productId, size, quantity: clampQuantity(quantity) }];
    }
    try {
      validateItems(next, products);
    } catch (error) {
      setToast(t(error.message));
      return false;
    }
    setCartItems(next);
    setCartOpen(true);
    return true;
  }

  function updateQuantity(line, change) {
    const next = cartItems.map((item) => (sameLine(item, line) ? { ...item, quantity: item.quantity + change } : item)).filter((item) => item.quantity > 0);
    try {
      if (next.length) validateItems(next, products);
      setCartItems(next);
    } catch (error) {
      setToast(t(error.message));
    }
  }

  const removeLine = (line) => setCartItems((items) => items.filter((item) => !sameLine(item, line)));

  function toggleSaved(productId) {
    const wasSaved = saved.includes(productId);
    setSaved((items) => (wasSaved ? items.filter((id) => id !== productId) : [...items, productId]));
    setToast(t(wasSaved ? 'Removed from your wishlist.' : 'Added to your wishlist.'));
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
    setToast(t(added === order.items.length ? 'Added to your bag.' : 'Some items are no longer available and were skipped.'));
    if (added) setCartOpen(true);
  }


  const currentCategory = resolved.view === 'product' ? resolved.product.category : route.query.get('category');
  const itemsLabel = (count) => t(count === 1 ? '{count} item' : '{count} items', { count });

  let screen;
  if (resolved.view === 'home') screen = <Home saved={saved} onToggleSaved={toggleSaved} />;
  else if (resolved.view === 'shop') screen = <Shop query={route.query} saved={saved} onToggleSaved={toggleSaved} />;
  else if (resolved.view === 'product') screen = <ProductPage key={resolved.product.id} product={resolved.product} saved={saved} onToggleSaved={toggleSaved} onAddToCart={addToCart} onAddMany={addManyToCart} />;
  else if (resolved.view === 'cart') screen = <Checkout cartItems={cartItems} onUpdateQuantity={updateQuantity} onRemove={removeLine} onOrderSent={orderSent} />;
  else if (resolved.view === 'info') screen = <InfoPage page={resolved.page} />;
  else if (resolved.view === 'account') screen = <Account page={resolved.page} orders={orders} saved={saved} onToggleSaved={toggleSaved} onBuyAgain={buyAgain} />;
  else screen = <div className="not-found"><PageHero kicker="404" title={t('This page slipped a notch.')} lead={t('The link may be old, or the belt may have moved.')}><Link className="btn btn--buy" to="shop">{t('Explore the collection')} <ArrowUpRight size={15} /></Link></PageHero></div>;

  return (
    <LanguageContext.Provider value={{ code: language, dict }}>
      <a className="skip" href="#main" onClick={(event) => { event.preventDefault(); document.getElementById('main')?.focus(); }}>{t('Skip to content')}</a>
      <div className="announcement">{t(settings.announcement)}</div>

      <header className="topbar">
        <div className="wrap header">
          <Link className="logo" to="" aria-label={t('Beltaly home')}>
            <picture><source srcSet={imageUrl('/brand/mark-3d.webp')} type="image/webp" /><img className="logo-mark" src={imageUrl('/brand/mark-3d.png')} alt="" width="192" height="182" /></picture>
            <span className="logo-word">BELTALY<small>GENUINE LEATHER</small></span>
          </Link>
          <SearchBox className="header-search" initial={route.query.get('q') ?? ''} />
          <div className="actions">
            <label className="lang-select" title={t('Language')}>
              <Globe size={17} aria-hidden="true" />
              <span className="lang-current" aria-hidden="true">{LANGUAGES.find((item) => item.code === language)?.native}</span>
              <ChevronDown size={14} aria-hidden="true" />
              <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t('Language')}>
                {LANGUAGES.map((item) => <option key={item.code} value={item.code} lang={item.code}>{item.native}{item.code !== 'en' ? ` · ${item.name}` : ''}</option>)}
              </select>
            </label>
            <Link className="head-link orders-link" to="orders"><Package size={19} /><span>{t('Orders')}</span></Link>
            <Link className="head-link saved-link" to="saved" aria-label={`${t('Wishlist')}, ${saved.length}`}><span className="nav-bag"><Heart size={19} />{saved.length > 0 && <span className="dot-count">{saved.length}</span>}</span><span>{t('Wishlist')}</span></Link>
            <button className={`head-link bag-pill ${clicked ? 'is-clicked' : ''}`} onClick={() => setCartOpen(true)} aria-label={`${t('Bag')}, ${cartCount}`}><span className="nav-bag"><ShoppingBag size={20} />{cartCount > 0 && <span className="dot-count">{cartCount}</span>}</span><span>{t('Bag')}</span></button>
            <button className="menu-btn" onClick={() => setMenuOpen(true)} aria-label={t('Menu')} aria-expanded={menuOpen}><Menu size={22} /></button>
          </div>
        </div>
        <div className="wrap mobile-search-wrap"><SearchBox className="mobile-search" initial={route.query.get('q') ?? ''} placeholder={t('Search belts')} showButton={false} /></div>
      </header>
      <nav className="catbar" aria-label={t('Categories')}>
        <div className="wrap catbar-inner">
          <Link to="shop" aria-current={resolved.view === 'shop' && !currentCategory ? 'page' : undefined}>{t('All belts')}</Link>
          {categories.map((category) => <Link key={category.id} to="shop" params={{ category: category.id }} aria-current={currentCategory === category.id ? 'page' : undefined}>{t(category.name)}</Link>)}
          <Link to="size-guide">{t('Size guide')}</Link>
          <Link to="business">{t('Bulk & corporate')}</Link>
          <Link to="about">{t('Our story')}</Link>
        </div>
      </nav>

      <main id="main" tabIndex={-1} key={route.parts.join('/')} className="page-enter">{screen}</main>

      <section className="help-band">
        <div className="wrap help-band-inner">
          <div><h2>{t('Need help choosing a size?')}</h2><p>{t('Message us on WhatsApp. A real person replies, usually within a few hours.')}</p></div>
          <a className="btn btn--whatsapp" href={contactHref} {...contactTarget}><MessageCircle size={17} /> {t('Chat on WhatsApp')}</a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap footer">
          <div><Link className="footer-logo" to="" aria-label={t('Beltaly home')}><picture><source srcSet={imageUrl('/brand/logo-3d.webp')} type="image/webp" /><img src={imageUrl('/brand/logo-3d.png')} alt="Beltaly — Genuine Leather" width="220" height="142" loading="lazy" /></picture></Link><p>{t('Thoughtful belts. Everyday character.')}</p>
            <Marketplaces className="marketplaces--dark" />
          </div>
          <div><h3>{t('Explore')}</h3><Link to="shop">{t('All belts')}</Link>{categories.map((category) => <Link key={category.id} to="shop" params={{ category: category.id }}>{t(category.name)}</Link>)}<Link to="size-guide">{t('Size guide')}</Link><Link to="about">{t('About Beltaly')}</Link></div>
          <div><h3>{t('Here to help')}</h3><Link to="contact">{t('Contact us')}</Link><Link to="faq">{t('FAQs')}</Link><Link to="shipping">{t('Shipping & returns')}</Link><Link to="orders">{t('Orders')}</Link><Link to="business">{t('Bulk & corporate orders')}</Link>{settings.business?.email && <a className="footer-mail" href={`mailto:${settings.business.email}`}><Mail size={14} /> {settings.business.email}</a>}</div>
          <div><h3>{t('The fine print')}</h3><Link to="privacy">{t('Privacy policy')}</Link><Link to="terms">{t('Terms of use')}</Link>{settings.gstin && <p className="hint">GSTIN: {settings.gstin}</p>}</div>
        </div>
        <div className="wrap footer-bottom"><span>© {new Date().getFullYear()} {settings.business?.legalName || 'Beltaly'}. {t('All prices in ₹, inclusive of taxes.')}</span><span className="pay-methods">{t('Cash on Delivery')} · {t('WhatsApp ordering')}{settings.methods.upi ? ' · UPI' : ''}</span></div>
      </footer>

      <a className="whatsapp" href={contactHref} {...contactTarget} aria-label={t('Chat with Beltaly on WhatsApp')}><MessageCircle size={22} /></a>

      <nav className="bottom-nav" aria-label={t('Menu')}>
        <Link to="" aria-current={resolved.view === 'home' ? 'page' : undefined}><HomeIcon size={19} /><b>{t('Home')}</b></Link>
        <Link to="shop" aria-current={resolved.view === 'shop' ? 'page' : undefined}><LayoutGrid size={19} /><b>{t('Shop')}</b></Link>
        <Link to="saved" aria-current={resolved.page === 'saved' ? 'page' : undefined}><span className="nav-bag"><Heart size={19} />{saved.length > 0 && <span className="dot-count">{saved.length}</span>}</span><b>{t('Wishlist')}</b></Link>
        <Link to="orders" aria-current={resolved.page === 'orders' ? 'page' : undefined}><Package size={19} /><b>{t('Orders')}</b></Link>
        <button className="nav-menu" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen}><Menu size={19} /><b>{t('Menu')}</b></button>
      </nav>

      {cartOpen && (
        <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="bag-title">
            <div className="drawer-head"><h2 id="bag-title">{t('Bag')} <span className="hint">({itemsLabel(cartCount)})</span></h2><button className="icon-btn" onClick={() => setCartOpen(false)} aria-label={t('Close bag')} autoFocus><X size={20} /></button></div>
            {cartItems.length === 0
              ? <div className="drawer-empty"><ShoppingBag size={30} /><p>{t('Your bag is waiting for a good fit.')}</p><Link className="btn" to="shop">{t('Explore the collection')}</Link></div>
              : <>
                <div className="free-ship"><Truck size={15} /> {bag.shipping ? <span>{t.rich('Add {amount} more for free delivery.', { amount: money(settings.freeShippingAbove - bag.subtotal) })}</span> : <span><b>{t('Free delivery unlocked.')}</b></span>}<span className="free-ship-bar"><span style={{ width: `${Math.min(100, (bag.subtotal / settings.freeShippingAbove) * 100)}%` }} /></span></div>
                <div className="drawer-lines">
                  {cartItems.map((item) => {
                    const product = getProduct(item.productId);
                    const off = discountPercent(product);
                    return (
                      <div className="cart-row" key={`${item.productId}-${item.size}`}>
                        <a href={productHref(product)}><img src={imageUrl(product.images[0])} alt={t(product.name)} width="72" height="72" /></a>
                        <div>
                          <h3>{t(product.name)}</h3>
                          <p className="hint">{t('Size {size} in', { size: item.size })}</p>
                          <p className="line-price"><b>{money(product.price * item.quantity)}</b>{off > 0 && <><del>{money(product.mrp * item.quantity)}</del><span className="off">{t('{percent}% off', { percent: off })}</span></>}</p>
                          <div className="line-actions">
                            <div className="qty"><button aria-label={t('One less')} onClick={() => updateQuantity(item, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label={t('One more')} disabled={item.quantity >= Math.min(99, product.stock)} onClick={() => updateQuantity(item, 1)}><Plus size={13} /></button></div>
                            <button className="plain-button link-muted" onClick={() => removeLine(item)}>{t('Remove')}</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="drawer-foot">
                  <div className="total-row"><span>{t('Subtotal')}</span><b>{money(bag.subtotal)}</b></div>
                  <div className="total-row"><span>{t('Delivery')}</span><span>{bag.shipping ? money(bag.shipping) : <span className="good">{t('FREE')}</span>}</span></div>
                  {mrpTotal > bag.subtotal && <p className="savings">{t('You save {amount} on this order', { amount: money(mrpTotal - bag.subtotal) })}</p>}
                  <Link className="btn btn--buy btn--block" to="cart">{t('Place order')}</Link>
                  <button className="plain-button link-muted" onClick={() => setCartOpen(false)}>{t('Keep looking')}</button>
                </div>
              </>}
          </aside>
        </div>
      )}

      {menuOpen && <MenuSheet onClose={() => setMenuOpen(false)} orderCount={orders.length} savedCount={saved.length} language={language} onLanguage={setLanguage} theme={theme} onTheme={setTheme} />}

      {toast && <div className="toast" role="status"><Check size={16} /> {toast}<button className="plain" onClick={() => setToast('')} aria-label={t('Dismiss message')}><X size={14} /></button></div>}
    </LanguageContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);
