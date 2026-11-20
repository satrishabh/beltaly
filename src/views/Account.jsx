import { useState } from 'react';
import { ArrowUpRight, Check, MessageCircle } from 'lucide-react';
import { getProduct, imageUrl, money, settings } from '../catalog.js';
import { PAYMENT_METHODS, whatsappUrl } from '../commerce.js';
import { useLanguage, useT } from '../i18n.js';
import { Link, ProductGrid, productHref } from './shared.jsx';

// No sign-in: orders and the wishlist are kept in this browser. "account" is kept so old links still open.
export const ACCOUNT_TITLES = {
  account: 'My orders',
  orders: 'My orders',
  saved: 'Wishlist',
  business: 'Bulk & corporate orders',
};

// Bulk enquiries go straight to the store's WhatsApp with the details filled in.
function BusinessForm() {
  const t = useT();
  const [form, setForm] = useState({ businessName: '', name: '', phone: '', quantity: '25–50', note: '' });
  const field = (key) => ({ value: form[key], onChange: (event) => setForm({ ...form, [key]: key === 'phone' ? event.target.value.replace(/\D/g, '') : event.target.value }) });
  const message = [
    'Hi Beltaly, I have a bulk / corporate enquiry.',
    `Company: ${form.businessName.trim()}`,
    `Name: ${form.name.trim()}`,
    `Phone: ${form.phone}`,
    `Quantity: ${form.quantity} belts`,
    form.note.trim() && `Details: ${form.note.trim()}`,
  ].filter(Boolean).join('\n');

  function submit(event) {
    event.preventDefault();
    window.open(whatsappUrl(settings.whatsapp, message), '_blank', 'noopener');
  }

  return (
    <div className="business">
      <div>
        <p>{t('Corporate gifting, wedding party sets, uniforms and resellers. Tell us what you need and we’ll reply on WhatsApp with bulk pricing.')}</p>
        <ul className="check-list"><li><Check size={15} /> {t('Volume pricing')}</li><li><Check size={15} /> {t('Gift-ready Beltaly boxes')}</li><li><Check size={15} /> {t('One contact for your whole order')}</li></ul>
      </div>
      <form className="panel stack-form" onSubmit={submit}>
        <label>{t('Company or organisation')}<input required maxLength={120} autoComplete="organization" {...field('businessName')} /></label>
        <label>{t('Your name')}<input required maxLength={80} autoComplete="name" {...field('name')} /></label>
        <label>{t('Mobile number')}<input type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required placeholder={t('10 digits')} autoComplete="tel-national" {...field('phone')} /></label>
        <label>{t('How many belts?')}<select {...field('quantity')}><option>10–25</option><option>25–50</option><option>50–200</option><option>200+</option></select></label>
        <label>{t('Anything else?')} <span className="hint">{t('(optional)')}</span><textarea rows={3} maxLength={500} placeholder={t('Sizes, colours, delivery date, logo branding…')} {...field('note')} /></label>
        <button className="btn btn--whatsapp" type="submit"><MessageCircle size={17} /> {t('Send enquiry on WhatsApp')}</button>
      </form>
    </div>
  );
}

export default function Account({ page, orders, saved, onToggleSaved, onBuyAgain }) {
  const t = useT();
  const language = useLanguage();
  const savedProducts = saved.map(getProduct).filter(Boolean);
  const view = page === 'account' ? 'orders' : page;

  return (
    <div className="wrap section">
      <h1 className="page-title">{t(ACCOUNT_TITLES[view])}</h1>
      <nav className="account-tabs" aria-label="Beltaly">
        {[['orders', t('My orders')], ['saved', `${t('Wishlist')} (${saved.length})`], ['business', t('Bulk orders')]].map(([key, label]) => <Link key={key} to={key} aria-current={view === key ? 'page' : undefined}>{label}</Link>)}
      </nav>

      {view === 'orders' && (orders.length === 0
        ? <div className="empty panel"><p>{t('No orders yet. Orders you send from this phone or computer appear here with their BLT reference.')}</p><Link className="btn btn--buy" to="shop">{t('Explore the collection')}</Link></div>
        : <div className="order-list">
          <p className="hint">{t('Orders sent from this browser. For updates, message us on WhatsApp with the BLT reference.')}</p>
          {orders.map((order) => (
            <article className="panel order-card" key={order.id}>
              <div className="order-head"><div><b>{order.id}</b><p className="hint">{new Date(order.createdAt).toLocaleString(`${language}-IN`, { dateStyle: 'medium', timeStyle: 'short' })} · {t(PAYMENT_METHODS[order.method] ?? 'Order')}</p></div><strong>{money(order.total)}</strong></div>
              <div className="order-items">
                {order.items.map((item) => { const product = getProduct(item.productId); return <a key={`${item.productId}-${item.size}`} href={productHref(product)}><img src={imageUrl(product.images[0])} alt="" width="56" height="56" /><span><b>{t(product.name)}</b><small className="hint">{t('Size {size} in', { size: item.size })} × {item.quantity}</small></span></a>; })}
              </div>
              <div className="button-row">
                <button className="btn secondary" onClick={() => onBuyAgain(order)}>{t('Buy again')}</button>
                {settings.whatsapp && <a className="text-link" href={whatsappUrl(settings.whatsapp, `Hi Beltaly, any update on my order ${order.id}?`)} target="_blank" rel="noopener noreferrer">{t('Ask about this order')} <ArrowUpRight size={14} /></a>}
              </div>
            </article>
          ))}
        </div>)}

      {view === 'saved' && (savedProducts.length === 0
        ? <div className="empty panel"><p>{t('Tap the heart on any belt to save it here.')}</p><Link className="btn btn--buy" to="shop">{t('Explore the collection')}</Link></div>
        : <ProductGrid items={savedProducts} saved={saved} onToggleSaved={onToggleSaved} className="shop-products" />)}

      {view === 'business' && <BusinessForm />}
    </div>
  );
}
