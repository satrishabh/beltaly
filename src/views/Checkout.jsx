import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Minus, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
import { prepareOrder } from '../api.js';
import { discountPercent, getProduct, imageUrl, money, products, settings } from '../catalog.js';
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
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const mrpTotal = cartItems.reduce((total, item) => total + (getProduct(item.productId)?.mrp || 0) * item.quantity, 0);

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
  const sendLink = (label, url, primary = true) => <a className={`btn ${primary ? 'btn--buy' : 'secondary'}`} href={url} target="_blank" rel="noopener noreferrer" onClick={() => onOrderSent(order)}>{label} <ArrowUpRight size={15} /></a>;

  return (
    <div className="wrap section">
      <h1 className="page-title">{order ? 'Send your order' : `Bag (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}</h1>
      <div className="cart-layout">
        <div aria-live="polite">
          {cartItems.length === 0 && !order && <div className="empty panel"><ShoppingBag size={34} /><p>{t('empty')}</p><Link className="btn" to="shop">{t('collection')} <ArrowUpRight size={15} /></Link></div>}
          {cartItems.map((item) => {
            const product = getProduct(item.productId);
            return (
              <div className="cart-row panel" key={`${item.productId}-${item.size}`}>
                <a href={productHref(product)}><img src={imageUrl(product.images[0])} alt={product.name} width="96" height="96" /></a>
                <div>
                  <h3><a href={productHref(product)}>{product.name}</a></h3>
                  <p className="hint">Size {item.size} in · {product.colour}</p>
                  <p className="line-price"><b>{money(product.price * item.quantity)}</b>{discountPercent(product) > 0 && <><del>{money(product.mrp * item.quantity)}</del><span className="off">{discountPercent(product)}% off</span></>}</p>
                  <div className="line-actions">
                    <div className="qty">
                      <button aria-label={`One less ${product.name}`} onClick={() => onUpdateQuantity(item, -1)}><Minus size={13} /></button>
                      <span aria-label="Quantity">{item.quantity}</span>
                      <button aria-label={`One more ${product.name}`} disabled={item.quantity >= Math.min(99, product.stock)} onClick={() => onUpdateQuantity(item, 1)}><Plus size={13} /></button>
                    </div>
                    <button className="plain-button link-muted" onClick={() => onRemove(item)} aria-label={`Remove ${product.name}`}>{t('Remove')}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          {cartItems.length > 0 && <>
          <div className="summary-box">
            <h3>Price details</h3>
            <div className="total-row"><span>Price ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span><span>{money(mrpTotal)}</span></div>
            {mrpTotal > sum.subtotal && <div className="total-row"><span>Discount</span><span className="good">−{money(mrpTotal - sum.subtotal)}</span></div>}
            <div className="total-row"><span>Delivery</span><span>{sum.subtotal && !sum.shipping ? <span className="good">FREE</span> : money(sum.shipping)}</span></div>
            {method === 'cod' && <div className="total-row"><span>{t('COD charge')}</span><span>{money(sum.cod)}</span></div>}
            <hr />
            <div className="total-row total-row--grand"><b>{t('Total')}</b><b>{money(sum.total)}</b></div>
            {mrpTotal > sum.subtotal && sum.subtotal > 0 && <p className="savings">You will save {money(mrpTotal - sum.subtotal)} on this order</p>}
            <p className="hint">{t('tax')}.{sum.subtotal > 0 && sum.shipping > 0 ? ` Add ${money(settings.freeShippingAbove - sum.subtotal)} more for free delivery.` : ''}</p>
          </div>
          <p className="secure-note"><ShieldCheck size={16} /> No online payment is taken on this site. You pay on delivery or after the store confirms on WhatsApp.</p>
          </>}

          {cartItems.length > 0 && (
            <form className="checkout panel" onSubmit={submit}>
              <h3>Delivery address</h3>
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
              <p className="hint">Next, you send the order to us on WhatsApp. We confirm stock and delivery there. Your details are not sent anywhere until you do.</p>
              <button className="btn btn--buy btn--block" type="submit" disabled={pending} aria-busy={pending}>{pending ? t('Preparing…') : <>Continue <ArrowUpRight size={15} /></>}</button>
              <p className="error" role="alert">{error}</p>
            </form>
          )}

          {order && (
            <div className="order-result" ref={result} role="status">
              <h3>Last step: send order {order.id}</h3>
              <p className="hint"><ShieldCheck size={14} /> Tap the button to send this order to Beltaly on WhatsApp. Your order is confirmed when we reply.</p>
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
