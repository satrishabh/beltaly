import { useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, Check, Heart, Package, ShieldCheck } from 'lucide-react';
import { requestPasswordReset, signIn, signUp, submitBusinessRequest } from '../api.js';
import { getProduct, imageUrl, money } from '../catalog.js';
import { PAYMENT_METHODS } from '../commerce.js';
import { useT } from '../i18n.js';
import { Link, ProductGrid, productHref } from './shared.jsx';

export const ACCOUNT_TITLES = {
  account: 'Your Beltaly corner.',
  orders: 'Your order requests.',
  saved: 'Saved for another day.',
  business: 'Belts for the whole team.',
};

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const switchTo = (next) => { setMode(next); setMessage(''); };

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage('');
    try {
      if (mode === 'reset') setMessage(await requestPasswordReset({ email }));
      else if (mode === 'signup') onAuthenticated(await signUp({ name, email, password }));
      else onAuthenticated(await signIn({ email, password }));
      setPassword('');
    } catch (error) {
      setMessage(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="account-panel auth-panel">
      <p className="eyebrow">BELTALY ACCOUNT</p>
      <h2>{mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Sign in'}</h2>
      <p className="hint">No account is needed to order. Signing in keeps your order requests together on this device.</p>
      <form className="stack-form" onSubmit={submit}>
        {mode === 'signup' && <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>}
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        {mode !== 'reset' && <label>Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>}
        {message && <p className="hint" role="status">{message}</p>}
        <button className="btn" type="submit" disabled={pending} aria-busy={pending}>{pending ? 'One moment…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'} <ArrowUpRight size={15} /></button>
      </form>
      <div className="auth-switch">
        {mode !== 'signup' && <button className="plain-button text-link" onClick={() => switchTo('signup')}>Create an account</button>}
        {mode !== 'signin' && <button className="plain-button text-link" onClick={() => switchTo('signin')}>Back to sign in</button>}
        {mode === 'signin' && <button className="plain-button text-link" onClick={() => switchTo('reset')}>Forgot password?</button>}
      </div>
      <p className="hint"><ShieldCheck size={14} /> Demo sign-in: matches an email saved in this browser and does not check passwords.</p>
    </div>
  );
}

function BusinessForm() {
  const [form, setForm] = useState({ businessName: '', email: '', phone: '', teamSize: '2–10' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const field = (key) => ({ value: form[key], onChange: (event) => setForm({ ...form, [key]: event.target.value }) });

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await submitBusinessRequest({ ...form, businessName: form.businessName.trim(), email: form.email.trim().toLowerCase() });
      setDone(true);
    } catch (problem) {
      setError(problem?.message || 'We couldn’t send that. Please try again.');
    } finally {
      setPending(false);
    }
  }

  if (done) return <div className="account-panel"><Check size={22} /><h2>We’ll be in touch.</h2><p>We’ll follow up with {form.email} about {form.businessName}.</p><button className="btn secondary" onClick={() => setDone(false)}>Update your details</button></div>;
  return (
    <div className="editorial business">
      <div>
        <p className="eyebrow">BELTALY FOR BUSINESS</p>
        <p>Corporate gifting, wedding party sets and uniforms. Tell us about your team and we’ll share bulk pricing.</p>
        <ul className="check-list"><li><Check size={15} /> Volume pricing</li><li><Check size={15} /> Gift-ready packaging</li><li><Check size={15} /> One contact for your order</li></ul>
      </div>
      <form className="account-panel stack-form" onSubmit={submit}>
        <label>Business name<input required {...field('businessName')} /></label>
        <label>Work email<input type="email" required {...field('email')} /></label>
        <label>Mobile number<input type="tel" inputMode="numeric" pattern="[0-9]{10}" placeholder="10 digits" {...field('phone')} /></label>
        <label>Team size<select {...field('teamSize')}><option>2–10</option><option>11–50</option><option>51–200</option><option>201+</option></select></label>
        <p className="error" role="alert">{error}</p>
        <button className="btn" type="submit" disabled={pending} aria-busy={pending}>{pending ? 'Sending…' : 'Request business pricing'} <ArrowUpRight size={15} /></button>
        <small className="hint">This demo saves the request in this browser only.</small>
      </form>
    </div>
  );
}

export default function Account({ page, user, orders, saved, onToggleSaved, onAuthenticated, onLogout, onBuyAgain }) {
  const t = useT();
  const savedProducts = saved.map(getProduct).filter(Boolean);

  return (
    <div className="wrap section">
      <p className="eyebrow">BELTALY / {page.toUpperCase()}</p>
      <h1 className="page-title">{page === 'account' && user ? `Hello, ${user.name.split(' ')[0]}.` : ACCOUNT_TITLES[page]}</h1>
      <nav className="account-tabs" aria-label="Account">
        {[['account', t('account')], ['orders', t('Orders')], ['saved', `${t('Saved')} (${saved.length})`], ['business', t('Business')]].map(([key, label]) => <Link key={key} to={key} aria-current={page === key ? 'page' : undefined}>{label}</Link>)}
      </nav>

      {page === 'account' && (user
        ? <div className="account-panel"><p className="eyebrow">SIGNED IN AS</p><h2>{user.name}</h2><p>{user.email}</p><div className="button-row"><Link className="btn" to="orders"><Package size={15} /> {t('Orders')}</Link><Link className="btn secondary" to="saved"><Heart size={15} /> {t('Saved')}</Link><Link className="btn secondary" to="business"><BriefcaseBusiness size={15} /> {t('Business')}</Link><button className="plain-button text-link" onClick={onLogout}>Sign out</button></div></div>
        : <AuthForm onAuthenticated={onAuthenticated} />)}

      {page === 'orders' && (orders.length === 0
        ? <div className="empty"><p>No order requests yet. When you send one on WhatsApp, UPI or a payment link, it will be listed here with its BLT reference.</p><Link className="btn" to="shop">{t('collection')} <ArrowUpRight size={15} /></Link></div>
        : <div className="order-list">
          {orders.map((order) => (
            <article className="account-panel order-card" key={order.id}>
              <div className="order-head"><div><p className="eyebrow">{order.id}</p><p className="hint">{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {PAYMENT_METHODS[order.method] ?? 'Order'}</p></div><strong>{money(order.total)}</strong></div>
              <div className="order-items">
                {order.items.map((item) => { const product = getProduct(item.productId); return <a key={`${item.productId}-${item.size}`} href={productHref(product)}><img src={imageUrl(product.images[0])} alt="" width="56" height="56" /><span><b>{product.name}</b><small className="hint">{item.size} in × {item.quantity}</small></span></a>; })}
              </div>
              <p className="hint">{order.status}. The store confirms stock, payment and delivery on WhatsApp.</p>
              <button className="btn secondary" onClick={() => onBuyAgain(order)}>Add these to bag again</button>
            </article>
          ))}
        </div>)}

      {page === 'saved' && (savedProducts.length === 0
        ? <div className="empty"><p>Tap the heart on any belt and it will be waiting here.</p><Link className="btn" to="shop">{t('collection')} <ArrowUpRight size={15} /></Link></div>
        : <ProductGrid items={savedProducts} saved={saved} onToggleSaved={onToggleSaved} className="shop-products" />)}

      {page === 'business' && <BusinessForm />}
    </div>
  );
}
