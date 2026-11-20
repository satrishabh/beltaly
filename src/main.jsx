import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Check, Heart, Home as HomeIcon, LayoutGrid, Minus, Plus, Search, ShoppingBag, Truck, UserRound, X } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary.jsx';
import { categories, getProduct, imageUrl, matchesSearch, money, products, settings } from './catalog.js';
import { totals, validateItems, whatsappUrl } from './commerce.js';
import { LanguageContext, translate } from './i18n.js';
import { STORAGE_KEYS, clampQuantity, readCart, readLanguage, readOrders, readSaved, readSession, writeJson } from './storage.js';
import Account, { ACCOUNT_TITLES } from './views/Account.jsx';
import Checkout from './views/Checkout.jsx';
import Home from './views/Home.jsx';
import InfoPage, { INFO_PAGES } from './views/InfoPage.jsx';
import ProductPage from './views/ProductPage.jsx';
import Shop from './views/Shop.jsx';
import { Link, href, parseRoute, productHref } from './views/shared.jsx';
import './styles.css';

const sameLine = (a, b) => a.productId === b.productId && a.size === b.size;
const contactHref = settings.whatsapp ? whatsappUrl(settings.whatsapp) : href('contact');
const contactTarget = settings.whatsapp ? { target: '_blank', rel: 'noopener noreferrer' } : {};

// Picks the screen for the current hash route.
function resolveRoute({ parts }) {
  const [page, category, slug] = parts;
  if (!page) return { view: 'home', title: 'Belts with character. Made for your everyday.' };
  if (page === 'shop' && slug) {
    const product = products.find((item) => item.slug === slug && item.category === category);
    return product ? { view: 'product', product, title: product.name } : { view: 'notFound', title: 'Page not found' };
  }
  if (page === 'shop' || page === 'search') return { view: 'shop', title: 'Shop belts' };
  if (page === 'cart') return { view: 'cart', title: 'Your bag' };
  if (INFO_PAGES[page]) return { view: 'info', page, title: INFO_PAGES[page] };
  if (ACCOUNT_TITLES[page]) return { view: 'account', page, title: ACCOUNT_TITLES[page] };
  return { view: 'notFound', title: 'Page not found' };
}

function App() {
  const [route, setRoute] = useState(() => parseRoute());
  const [cartItems, setCartItems] = useState(readCart);
  const [saved, setSaved] = useState(readSaved);
  const [orders, setOrders] = useState(readOrders);
  const [user, setUser] = useState(readSession);
  const [language, setLanguage] = useState(readLanguage);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState('');
  const [clicked, setClicked] = useState(false);
  const lastPath = useRef(route.parts.join('/'));
  const t = (key) => translate(language, key);

  const resolved = resolveRoute(route);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const bag = totals(cartItems, products, settings);
  const overlayOpen = cartOpen || searchOpen;

  useEffect(() => writeJson(STORAGE_KEYS.cart, cartItems), [cartItems]);
  useEffect(() => writeJson(STORAGE_KEYS.saved, saved), [saved]);
  useEffect(() => writeJson(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => {
    writeJson(STORAGE_KEYS.language, language);
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => { document.title = `${resolved.title} | Beltaly`; }, [resolved.title]);

  // Hash routing: back/forward, refresh and shared links all work. Scroll to top only when the page (not its filters) changes.
  useEffect(() => {
    const onHashChange = () => {
      const next = parseRoute();
      const path = next.parts.join('/');
      if (path !== lastPath.current) window.scrollTo({ top: 0 });
      lastPath.current = path;
      setRoute(next);
      setCartOpen(false);
      setSearchOpen(false);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Keep the bag, saved items and session in sync across tabs.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEYS.cart) setCartItems(readCart());
      if (event.key === STORAGE_KEYS.saved) setSaved(readSaved());
      if (event.key === STORAGE_KEYS.orders) setOrders(readOrders());
      if (event.key === STORAGE_KEYS.session) setUser(readSession());
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
    const onKey = (event) => { if (event.key === 'Escape') { setCartOpen(false); setSearchOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [overlayOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function addToCart(productId, size, amount = 1) {
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
    setCartOpen(true);
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
    setToast(wasSaved ? 'Removed from saved belts.' : t('Saved for later'));
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

  function signedIn(profile) {
    setUser(profile);
    writeJson(STORAGE_KEYS.session, profile);
    setToast(`Welcome, ${profile.name.split(' ')[0]}.`);
  }

  function signOut() {
    writeJson(STORAGE_KEYS.session, null);
    setUser(null);
    setToast('You’re signed out.');
  }

  function submitSearch(event) {
    event.preventDefault();
    window.location.hash = href('shop', { q: searchTerm.trim() });
  }

  const searchResults = searchTerm.trim() ? products.filter((product) => matchesSearch(product, searchTerm)).slice(0, 6) : [];

  let screen;
  if (resolved.view === 'home') screen = <Home saved={saved} onToggleSaved={toggleSaved} />;
  else if (resolved.view === 'shop') screen = <Shop query={route.query} saved={saved} onToggleSaved={toggleSaved} />;
  else if (resolved.view === 'product') screen = <ProductPage key={resolved.product.id} product={resolved.product} saved={saved} onToggleSaved={toggleSaved} onAddToCart={addToCart} />;
  else if (resolved.view === 'cart') screen = <Checkout cartItems={cartItems} onUpdateQuantity={updateQuantity} onRemove={removeLine} onOrderSent={orderSent} />;
  else if (resolved.view === 'info') screen = <InfoPage page={resolved.page} />;
  else if (resolved.view === 'account') screen = <Account page={resolved.page} user={user} orders={orders} saved={saved} onToggleSaved={toggleSaved} onAuthenticated={signedIn} onLogout={signOut} onBuyAgain={buyAgain} />;
  else screen = <div className="wrap prose"><p className="eyebrow">404 / A LOOSE END</p><h1>This page slipped a notch.</h1><p>The link may be old, or the belt may have moved.</p><Link className="btn" to="shop">{t('collection')} <ArrowUpRight size={15} /></Link></div>;

  return (
    <LanguageContext.Provider value={language}>
      <a className="skip" href="#main" onClick={(event) => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <div className="announcement">{settings.announcement}</div>

      <header className="wrap header">
        <Link className="logo" to="" aria-label="Beltaly home">
          <picture><source srcSet={imageUrl('/brand/mark-3d.webp')} type="image/webp" /><img className="logo-mark" src={imageUrl('/brand/mark-3d.png')} alt="" width="192" height="182" /></picture>
          <span className="logo-word">BELTALY<small>GENUINE LEATHER</small></span>
        </Link>
        <nav aria-label="Main">
          <Link to="shop">{t('shop')}</Link>
          {categories.map((category) => <Link key={category.id} to="shop" params={{ category: category.id }}>{t(category.name)}</Link>)}
          <Link to="size-guide">{t('guide')}</Link>
          <Link to="about">{t('story')}</Link>
        </nav>
        <div className="actions">
          <button className="plain lang-toggle" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} aria-label={language === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}>{language === 'hi' ? 'EN' : 'हिं'}</button>
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label={t('search')}><Search size={19} /></button>
          <Link className="icon-btn saved-link" to="saved" aria-label={`${t('Saved')}, ${saved.length}`}><Heart size={19} />{saved.length > 0 && <span className="dot-count">{saved.length}</span>}</Link>
          <Link className="icon-btn account-link" to="account" aria-label={user ? `${t('account')}: ${user.name}` : t('Sign in')}><UserRound size={19} /></Link>
          <button className={`bag-pill ${clicked ? 'is-clicked' : ''}`} onClick={() => setCartOpen(true)} aria-label={`${t('Bag')}, ${cartCount}`}><ShoppingBag size={16} /> {t('Bag')} ({cartCount})</button>
        </div>
      </header>

      <main id="main" tabIndex={-1}>{screen}</main>

      <section className="community">
        <div className="eyebrow">THE BELTALY CIRCLE</div>
        <h2>{t('community')}</h2>
        <p>{t('communityBody')}</p>
        <div className="button-row button-row--center">
          <a className="btn secondary" href={contactHref} {...contactTarget}>{t('whatsapp')} <ArrowUpRight size={15} /></a>
          {/^https:\/\//.test(settings.instagram) && <a className="text-link" href={settings.instagram} target="_blank" rel="noopener noreferrer">Instagram <ArrowUpRight size={14} /></a>}
        </div>
      </section>

      <footer className="wrap">
        <div className="footer">
          <div><Link className="footer-logo" to="" aria-label="Beltaly home"><picture><source srcSet={imageUrl('/brand/logo-3d.webp')} type="image/webp" /><img src={imageUrl('/brand/logo-3d.png')} alt="Beltaly — Genuine Leather" width="220" height="142" loading="lazy" /></picture></Link><p>{t('footer')}</p><small>DESIGNED FOR MODERN INDIA</small></div>
          <div><h3>{t('Explore')}</h3><Link to="shop">{t('shop')}</Link>{categories.slice(0, 3).map((category) => <Link key={category.id} to="shop" params={{ category: category.id }}>{t(category.name)}</Link>)}<Link to="size-guide">{t('guide')}</Link><Link to="about">{t('about')}</Link></div>
          <div><h3>{t('Here to help')}</h3><Link to="contact">{t('contact')}</Link><Link to="faq">{t('faq')}</Link><Link to="shipping">{t('shipping')}</Link><Link to="business">{t('Business')}</Link></div>
          <div><h3>{t('The fine print')}</h3><Link to="privacy">{t('privacy')}</Link><Link to="terms">{t('terms')}</Link><p className="hint">{settings.gstin ? `GSTIN: ${settings.gstin}` : 'GSTIN: owner setup pending'}</p></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Beltaly. A little detail goes a long way.</span><span>₹ INR · Made for India</span></div>
      </footer>
      {/^https:\/\/(www\.)?amazon\.in\//.test(settings.amazonStore) && <div className="sample-note">Also on Amazon: <a className="text-link" href={settings.amazonStore} target="_blank" rel="noopener noreferrer">shop Beltaly on Amazon.in <ArrowUpRight size={12} /></a></div>}

      <a className="whatsapp" href={contactHref} {...contactTarget} aria-label="Contact us on WhatsApp"><ArrowUpRight size={14} /> {t('Let’s talk')}</a>

      <nav className="bottom-nav" aria-label="Mobile">
        <Link to="" aria-current={resolved.view === 'home' ? 'page' : undefined}><HomeIcon size={18} /><b>{t('home')}</b></Link>
        <Link to="shop" aria-current={resolved.view === 'shop' ? 'page' : undefined}><LayoutGrid size={18} /><b>{t('shop')}</b></Link>
        <button onClick={() => setSearchOpen(true)}><Search size={18} /><b>{t('search')}</b></button>
        <Link to="cart" aria-current={resolved.view === 'cart' ? 'page' : undefined}><span className="nav-bag"><ShoppingBag size={18} />{cartCount > 0 && <span className="dot-count">{cartCount}</span>}</span><b>{t('cart')}</b></Link>
        <Link to="account" aria-current={resolved.view === 'account' ? 'page' : undefined}><UserRound size={18} /><b>{t('account')}</b></Link>
      </nav>

      {cartOpen && (
        <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="bag-title">
            <div className="drawer-head"><div><p className="eyebrow">BELTALY / YOUR BAG</p><h2 id="bag-title">{t('Your bag.')} <span className="hint">({cartCount})</span></h2></div><button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close bag" autoFocus><X size={20} /></button></div>
            {cartItems.length === 0
              ? <div className="drawer-empty"><ShoppingBag size={26} /><p>{t('empty')}</p><Link className="btn" to="shop">{t('collection')} <ArrowUpRight size={15} /></Link></div>
              : <>
                <div className="free-ship"><Truck size={15} /> {bag.shipping ? <span>Add <b>{money(settings.freeShippingAbove - bag.subtotal)}</b> more for free shipping.</span> : <span>{t('Free shipping unlocked.')}</span>}<span className="free-ship-bar"><span style={{ width: `${Math.min(100, (bag.subtotal / settings.freeShippingAbove) * 100)}%` }} /></span></div>
                <div className="drawer-lines">
                  {cartItems.map((item) => {
                    const product = getProduct(item.productId);
                    return (
                      <div className="cart-row" key={`${item.productId}-${item.size}`}>
                        <a href={productHref(product)}><img src={imageUrl(product.images[0])} alt={product.name} width="72" height="72" /></a>
                        <div><h3>{product.name}</h3><p className="hint">{t(product.colour)} / {item.size} in · {money(product.price * item.quantity)}</p><button className="plain hint" onClick={() => removeLine(item)}>{t('Remove')}</button></div>
                        <div className="qty"><button aria-label={`One less ${product.name}`} onClick={() => updateQuantity(item, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label={`One more ${product.name}`} disabled={item.quantity >= Math.min(99, product.stock)} onClick={() => updateQuantity(item, 1)}><Plus size={13} /></button></div>
                      </div>
                    );
                  })}
                </div>
                <div className="drawer-foot">
                  <div className="total-row"><span>{t('Subtotal')}</span><b>{money(bag.subtotal)}</b></div>
                  <div className="total-row"><span>{t('Shipping')}</span><span>{bag.shipping ? money(bag.shipping) : '₹0'}</span></div>
                  <p className="hint">{t('tax')}. COD charges, if chosen, are added at checkout.</p>
                  <Link className="btn btn--block" to="cart">{t('Continue to checkout')} <ArrowUpRight size={15} /></Link>
                  <button className="plain-button text-link" onClick={() => setCartOpen(false)}>{t('Keep looking')}</button>
                </div>
              </>}
          </aside>
        </div>
      )}

      {searchOpen && (
        <div className="drawer-backdrop drawer-backdrop--top" onMouseDown={(event) => event.target === event.currentTarget && setSearchOpen(false)}>
          <section className="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title">
            <div className="drawer-head"><h2 id="search-title">{t('Looking for something?')}</h2><button className="icon-btn" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={20} /></button></div>
            <form role="search" onSubmit={submitSearch} className="search-field"><Search size={18} /><input autoFocus type="search" aria-label={t('Search Beltaly')} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t('Search by name, material, colour or occasion')} /></form>
            {searchTerm.trim() && <div className="search-results">
              {searchResults.length ? searchResults.map((product) => <a key={product.id} href={productHref(product)}><img src={imageUrl(product.images[0])} alt="" width="52" height="52" /><span><b>{product.name}</b><small className="hint">{t(product.material)} · {money(product.price)}</small></span><ArrowUpRight size={16} /></a>) : <p className="hint">{t('No matches yet. Try another word.')}</p>}
              {searchResults.length > 0 && <a className="text-link" href={href('shop', { q: searchTerm.trim() })}>{t('viewAll')} <ArrowUpRight size={14} /></a>}
            </div>}
            <p className="search-hint">{categories.map((category) => <a key={category.id} href={href('shop', { category: category.id })}>{t(category.name)}</a>)}</p>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><Check size={16} /> {toast}<button className="plain" onClick={() => setToast('')} aria-label="Dismiss message"><X size={14} /></button></div>}
    </LanguageContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);
