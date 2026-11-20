import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Minus, Plus, ShieldCheck } from 'lucide-react';
import { prepareOrder } from '../api.js';
import { getProduct, imageUrl, money, products, settings } from '../catalog.js';
import { PAYMENT_METHODS, orderSummary, paymentLinkFor, totals, upiUrl, whatsappUrl } from '../commerce.js';
import { useT } from '../i18n.js';
import { Link, productHref } from './shared.jsx';

const enabledMethods = Object.keys(PAYMENT_METHODS).filter((method) => settings.methods[method]);
const storeReady = /^\d{10,15}$/.test(settings.whatsapp);

export default function Checkout({ cartItems, onUpdateQuantity, onRemove, onOrderSent }) {
  const t = useT();
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', pincode: '' });
  const [method, setMethod] = useState(enabledMethods[0] || 'whatsapp');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [order, setOrder] = useState(null);
  const [qr, setQr] = useState('');
  const result = useRef(null);
  const sum = totals(cartItems, products, settings, method);

  useEffect(() => {
    if (!order) return;
    result.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    if (order.method !== 'upi') return;
    let cancelled = false;
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(upiUrl(order, settings), { width: 240, margin: 2 }))
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setQr(''));
    return () => { cancelled = true; };
  }, [order]);

  const field = (key) => ({ value: customer[key], onChange: (event) => setCustomer({ ...customer, [key]: key === 'phone' || key === 'pincode' ? event.target.value.replace(/\D/g, '') : event.target.value }) });

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    setOrder(null);
    setQr('');
    try {
      setOrder(await prepareOrder({ items: cartItems, customer, method }));
    } catch (problem) {
      setError(problem?.message || 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  }

  const summary = order ? orderSummary(order, products, money) : '';
  const whatsapp = (paid = false) => whatsappUrl(settings.whatsapp, summary + (paid ? '\nI have paid. Please verify receipt and confirm this order.' : ''));
  const sendLink = (label, url, primary = true) => <a className={`btn ${primary ? '' : 'secondary'}`} href={url} target="_blank" rel="noopener noreferrer" onClick={() => onOrderSent(order)}>{label} <ArrowUpRight size={15} /></a>;

  return (
    <div className="wrap section">
      <p className="eyebrow">A FEW GOOD CHOICES</p>
      <h1 className="page-title">{t('Your bag.')}</h1>
      <div className="cart-layout">
        <div aria-live="polite">
          {cartItems.length === 0 && !order && <div className="empty"><p>{t('empty')}</p><Link className="btn" to="shop">{t('collection')} <ArrowUpRight size={15} /></Link></div>}
          {cartItems.map((item) => {
            const product = getProduct(item.productId);
            return (
              <div className="cart-row" key={`${item.productId}-${item.size}`}>
                <a href={productHref(product)}><img src={imageUrl(product.images[0])} alt={product.name} width="85" height="85" /></a>
                <div>
                  <h3><a href={productHref(product)}>{product.name}</a></h3>
                  <p className="hint">{t(product.colour)} / {item.size} in · {money(product.price)}</p>
                  <button className="plain hint" onClick={() => onRemove(item)} aria-label={`Remove ${product.name}`}>{t('Remove')}</button>
                </div>
                <div className="qty">
                  <button aria-label={`One less ${product.name}`} onClick={() => onUpdateQuantity(item, -1)}><Minus size={13} /></button>
                  <span aria-label="Quantity">{item.quantity}</span>
                  <button aria-label={`One more ${product.name}`} disabled={item.quantity >= Math.min(99, product.stock)} onClick={() => onUpdateQuantity(item, 1)}><Plus size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="summary-box">
            <h3>{t('The details')}</h3>
            <div className="total-row"><span>{t('Subtotal')}</span><span>{money(sum.subtotal)}</span></div>
            <div className="total-row"><span>{t('Shipping')}</span><span>{sum.subtotal && !sum.shipping ? t('Free shipping unlocked.') : money(sum.shipping)}</span></div>
            {method === 'cod' && <div className="total-row"><span>{t('COD charge')}</span><span>{money(sum.cod)}</span></div>}
            <hr />
            <div className="total-row"><b>{t('Total')}</b><b>{money(sum.total)}</b></div>
            <p className="hint">{t('tax')}. {sum.subtotal > 0 && sum.shipping > 0 ? `Add ${money(settings.freeShippingAbove - sum.subtotal)} more for free shipping.` : ''}</p>
          </div>

          {cartItems.length > 0 && (
            <form className="checkout" onSubmit={submit}>
              <h3>{t('checkout')}</h3>
              {!storeReady && <p className="account-panel hint">Ordering opens once the store adds its WhatsApp number in <code>src/data/settings.json</code>. You can still try the form.</p>}
              <div className="form-grid">
                <label>{t('Name')}<input autoComplete="name" required maxLength={100} {...field('name')} /></label>
                <label>{t('Mobile number')}<input type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]{10}" maxLength={10} required placeholder={t('10 digits')} {...field('phone')} /></label>
                <label className="full">{t('Delivery address')}<textarea autoComplete="street-address" required rows={3} maxLength={600} {...field('address')} /></label>
                <label>{t('Pincode')}<input autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder={t('6-digit pincode')} {...field('pincode')} /></label>
              </div>
              <fieldset>
                <legend>{t('How would you like to order?')}</legend>
                {enabledMethods.map((key) => <label key={key}><input type="radio" name="method" value={key} checked={method === key} onChange={() => { setMethod(key); setOrder(null); }} /> {t(PAYMENT_METHODS[key])}</label>)}
              </fieldset>
              <p className="hint">This prepares an order request. The store confirms stock, payment and delivery with you. Your address stays on this page until you choose to send it.</p>
              <button className="btn" type="submit" disabled={pending} aria-busy={pending}>{pending ? t('Preparing…') : <>{t('Prepare order')} <ArrowUpRight size={15} /></>}</button>
              <p className="error" role="alert">{error}</p>
            </form>
          )}

          {order && (
            <div className="order-result" ref={result} role="status">
              <h3>{t('Order request')} {order.id}</h3>
              <p className="hint"><ShieldCheck size={14} /> This is a request, not a confirmed order. The store must verify stock and any payment.</p>
              <p className="order-summary">{summary}</p>
              <div className="button-row">
                {order.method === 'upi' && <>
                  {sendLink('Open UPI app', upiUrl(order, settings))}
                  {sendLink('I’ve paid — ask the store to verify', whatsapp(true), false)}
                </>}
                {order.method === 'paymentLink' && (paymentLinkFor(order, products, settings)
                  ? <>{sendLink('Continue to payment link', paymentLinkFor(order, products, settings))}{storeReady && sendLink('Send order details to the store', whatsapp(), false)}</>
                  : <p className="error">No HTTPS payment link is set up for this order.</p>)}
                {order.method === 'whatsapp' && sendLink('Send order on WhatsApp', whatsapp())}
                {order.method === 'cod' && sendLink('Request COD on WhatsApp', whatsapp())}
              </div>
              {order.method === 'upi' && <>
                {qr && <img className="upi-qr" src={qr} alt={`UPI payment QR for ${order.id}, ${money(order.total)}`} width="240" height="240" />}
                <p className="hint">Payee: {settings.payeeName} · {settings.upiVpa}. Check this name in your UPI app before paying.</p>
              </>}
              {order.method === 'paymentLink' && <p className="hint">Check the amount and reference on the payment page. A fixed payment link may not include shipping or quantity.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
