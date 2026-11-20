import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { money, settings } from '../catalog.js';
import { suggestedSize, whatsappUrl } from '../commerce.js';
import { useT } from '../i18n.js';
import { Link } from './shared.jsx';
import pages from '../data/pages.json' with { type: 'json' };

// Page titles, headings and search descriptions live in src/data/pages.json (also read by scripts/prerender.mjs).
export const INFO_PAGES = pages;

const faqs = [
  ['How do I choose a size?', 'Start with your trouser waist plus 2 inches, or measure a belt from buckle pin to the most-used hole. See our size guide.'],
  ['Are the displayed prices tax inclusive?', 'Yes. INR prices include all applicable taxes. Shipping and optional COD fees are shown separately in the bag.'],
  ['Is Cash on Delivery available?', 'Yes. Choose Cash on Delivery at checkout; a {cod} COD charge applies. We confirm your order on WhatsApp before dispatch.', { cod: money(settings.codCharge) }],
  ['When is my order confirmed?', 'When we reply to your WhatsApp order message. We check stock and confirm the delivery details with you there.'],
  ['What if the size is wrong?', 'Message us on WhatsApp with your order reference. Keep the belt unused in its box and we will help with an exchange.'],
  ['When are wallets coming?', 'Our wallet collection is coming soon. Follow Beltaly announcements or contact the store for updates.'],
  ['Do I need an account?', 'No. Your bag, wishlist and past orders are kept in this browser, so there is nothing to sign up for.'],
];

function SizeCalculator() {
  const t = useT();
  const [waist, setWaist] = useState('');
  const [unit, setUnit] = useState('in');
  const [result, setResult] = useState('');
  function calculate(event) {
    event.preventDefault();
    const inches = unit === 'cm' ? Number(waist) / 2.54 : Number(waist);
    const size = suggestedSize(inches);
    setResult(size ? t('Suggested belt: {inches} inches / {cm} cm. Measure an existing belt from buckle pin to the most-used hole to confirm.', { inches: size.inches, cm: size.cm }) : t('Enter a waist between 18 and 60 inches (46–152 cm).'));
  }
  return (
    <form onSubmit={calculate} className="size-calc">
      <label htmlFor="waist">{t('Your waist measurement')}</label>
      <div className="inline-form">
        <input id="waist" type="number" min="18" max="152" step="0.1" required placeholder={t('e.g. 32')} value={waist} onChange={(event) => setWaist(event.target.value)} />
        <select aria-label={t('Measurement unit')} value={unit} onChange={(event) => setUnit(event.target.value)}><option value="in">{t('Inches')}</option><option value="cm">{t('Centimetres')}</option></select>
        <button className="btn">{t('Find my size')}</button>
      </div>
      <p role="status">{result}</p>
    </form>
  );
}

// Seller details from settings.business. Fields left empty are simply not shown.
function StoreDetails() {
  const t = useT();
  const business = settings.business ?? {};
  const rows = [
    [t('Seller'), business.legalName || 'Beltaly'],
    [t('Address'), business.address],
    ['GSTIN', settings.gstin],
    [t('Email'), business.email],
    ['WhatsApp', settings.whatsapp ? `+${settings.whatsapp.replace(/^91/, '91 ')}` : ''],
    [t('Grievance officer'), business.grievanceOfficer],
  ].filter(([, value]) => value);
  return <table className="spec-table"><tbody>{rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table>;
}

export default function InfoPage({ page }) {
  const t = useT();
  const contactHref = settings.whatsapp ? whatsappUrl(settings.whatsapp) : null;
  return (
    <article className="wrap prose">
      <nav className="breadcrumb" aria-label={t('Breadcrumb')}><Link to="">{t('Home')}</Link> › <span>{t(INFO_PAGES[page].title)}</span></nav>
      <h1>{t(INFO_PAGES[page].heading)}</h1>

      {page === 'size-guide' && <>
        <p>{t('The best guide is a belt you already love. Measure from the buckle pin to the hole you use most. That measurement is your belt size, not the total length of the strap.')}</p>
        <h2>{t('A good starting point.')}</h2>
        <p>{t('Choose a belt about 2 inches larger than your trouser waist. Fit varies by rise, clothing and personal preference, so use this as a guide and confirm the measurement.')}</p>
        <SizeCalculator />
        <h2>{t('Size chart.')}</h2>
        <table className="spec-table size-table">
          <thead><tr><th>{t('Your trouser waist')}</th><th>{t('Belt size to order')}</th><th>{t('Belt size (cm)')}</th></tr></thead>
          <tbody>{[28, 30, 32, 34, 36, 38, 40, 42, 44].map((belt) => <tr key={belt}><td>{belt - 2} in</td><td><b>{belt}</b></td><td>{Math.round(belt * 2.54)} cm</td></tr>)}</tbody>
        </table>
        <h2>{t('The three small steps.')}</h2>
        <ol><li>{t('Wrap a measuring tape where your belt will sit, over your trousers.')}</li><li>{t('Keep it comfortably snug, without pulling tight.')}</li><li>{t('Add about 2 inches and choose the closest available size. If between sizes, size up.')}</li></ol>
        <p>{t('For kids, measure an existing belt or the waist over clothing. Width is shown in millimetres; check your trouser loops before choosing.')}</p>
      </>}

      {page === 'about' && <>
        <p>{t('We believe the smallest detail can bring an outfit together. Beltaly is a belt and leather goods company, beginning with considered belts for everyday wear. Wallets are our next chapter, coming soon.')}</p>
        <h2>{t('Crafted leather. Modern India.')}</h2>
        <p>{t('Deep black. Warm gold. An everyday ease that moves from office mornings to wedding evenings. Our design takes its cues from the belt itself: a continuous line, honest stitching, and a buckle that brings it all together.')}</p>
        <p>{t('Beltaly belts are genuine leather with metal buckles, and many arrive in the Beltaly gift box. You can also find us on Amazon, Flipkart and Meesho.')}</p>
        <Link className="btn" to="shop">{t('Find your everyday')} <ArrowUpRight size={15} /></Link>
      </>}

      {page === 'contact' && <>
        <p>{t('Questions about fit, an order or a gift? WhatsApp is our main contact channel.')}</p>
        {contactHref
          ? <a className="btn" href={contactHref} target="_blank" rel="noopener noreferrer">{t('Start a WhatsApp conversation')} <ArrowUpRight size={15} /></a>
          : <div className="account-panel"><h3>{t('We’re getting ready.')}</h3><p>{t('The store’s WhatsApp number has not been added yet. Ordering opens once setup is complete.')}</p></div>}
        <h2>{t('Before you message.')}</h2>
        <p>{t('For product questions, include the product name and preferred size. For existing orders, include your BLT reference. Never share a UPI PIN, OTP or card details.')}</p>
      </>}

      {page === 'faq' && <>
        {faqs.map(([question, answer, vars]) => <details key={question}><summary>{t(question)}</summary><p>{t(answer, vars)}</p></details>)}
        <p><Link className="text-link" to="size-guide">{t('Open the size guide')} <ArrowUpRight size={14} /></Link></p>
      </>}

      {page === 'shipping' && <>
        <h2>{t('Delivery.')}</h2>
        <p>{t(settings.deliverAllIndia ? 'We deliver across India.' : 'We currently deliver to the pincodes accepted by the delivery checker.')} {t('Delivery is {fee} per order, and free on orders of {free} or more. Cash on Delivery adds {cod}. All charges are shown in your bag before you send the order.', { fee: money(settings.shippingFee), free: money(settings.freeShippingAbove), cod: money(settings.codCharge) })}</p>
        <p>{t('Once you send your order on WhatsApp, we confirm it and share the dispatch date there. If you have a question about delivery, message us with your BLT order reference.')}</p>
        <h2>{t('Size exchanges & returns.')}</h2>
        <p>{t('Wrong size, damaged in transit, or not what you expected? Message us on WhatsApp with your BLT order reference and a photo of the belt and its box. Please keep the belt unused and in its original packaging while we sort it out with you.')}{settings.returnDays ? ` ${t('Requests must be raised within {days} days of delivery.', { days: settings.returnDays })}` : ''}</p>
        {contactHref && <a className="btn btn--whatsapp" href={contactHref} target="_blank" rel="noopener noreferrer">{t('Message us on WhatsApp')}</a>}
      </>}

      {page === 'privacy' && <>
        <p>{t('We only collect what we need to deliver your order: your name, mobile number and delivery address. You choose to send these to us on WhatsApp when you place an order.')}</p>
        <h2>{t('What stays on your device.')}</h2>
        <p>{t('Your bag, wishlist, order history, language choice and (if you tick “Remember my details”) your delivery details are saved in your own browser so they are still there next time. You can clear them at any time from your browser’s site settings. This site has no advertising or tracking cookies.')}</p>
        <h2>{t('Third parties.')}</h2>
        <p>{t('WhatsApp, UPI apps and payment providers you choose to use apply their own privacy policies. We never ask for your UPI PIN, OTP or card details.')}</p>
        <h2>{t('Contact.')}</h2>
        <p>{t('For any privacy question, message us on WhatsApp.')}{settings.business?.email ? <> {t('Email')}: <a href={`mailto:${settings.business.email}`}>{settings.business.email}</a></> : null}</p>
      </>}

      {page === 'terms' && <>
        <p>{t('Prices on this site are in Indian rupees and include all taxes. Delivery and Cash on Delivery charges are shown before you send an order.')}</p>
        <h2>{t('Orders & payments.')}</h2>
        <p>{t('An order sent from this site, with its BLT reference, is confirmed when Beltaly replies on WhatsApp. Prices and stock can change until then. If we cannot fulfil an order, we will tell you, and refund any amount already paid.')}</p>
        <h2>{t('Store information.')}</h2>
        <StoreDetails />
      </>}
    </article>
  );
}
