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
  ['Is Cash on Delivery available?', `Yes. Choose Cash on Delivery at checkout; a ${money(settings.codCharge)} COD charge applies. We confirm your order on WhatsApp before dispatch.`],
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
    setResult(size ? `Suggested belt: ${size.inches} inches / ${size.cm} cm. Measure an existing belt from buckle pin to the most-used hole to confirm.` : 'Enter a waist between 18 and 60 inches (46–152 cm).');
  }
  return (
    <form onSubmit={calculate} className="size-calc">
      <label htmlFor="waist">{t('Your waist measurement')}</label>
      <div className="inline-form">
        <input id="waist" type="number" min="18" max="152" step="0.1" required placeholder="e.g. 32" value={waist} onChange={(event) => setWaist(event.target.value)} />
        <select aria-label="Measurement unit" value={unit} onChange={(event) => setUnit(event.target.value)}><option value="in">{t('Inches')}</option><option value="cm">{t('Centimetres')}</option></select>
        <button className="btn">{t('Find my size')}</button>
      </div>
      <p role="status">{result}</p>
    </form>
  );
}

// Seller details from settings.business. Fields left empty are simply not shown.
function StoreDetails() {
  const business = settings.business ?? {};
  const rows = [
    ['Seller', business.legalName || 'Beltaly'],
    ['Address', business.address],
    ['GSTIN', settings.gstin],
    ['Email', business.email],
    ['WhatsApp', settings.whatsapp ? `+${settings.whatsapp.replace(/^91/, '91 ')}` : ''],
    ['Grievance officer', business.grievanceOfficer],
  ].filter(([, value]) => value);
  return <table className="spec-table"><tbody>{rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table>;
}

export default function InfoPage({ page }) {
  const contactHref = settings.whatsapp ? whatsappUrl(settings.whatsapp) : null;
  return (
    <article className="wrap prose">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="">Home</Link> › <span>{INFO_PAGES[page].title}</span></nav>
      <h1>{INFO_PAGES[page].heading}</h1>

      {page === 'size-guide' && <>
        <p>The best guide is a belt you already love. Measure from the buckle pin to the hole you use most. That measurement is your belt size, not the total length of the strap.</p>
        <h2>A good starting point.</h2>
        <p>Choose a belt about 2 inches larger than your trouser waist. Fit varies by rise, clothing and personal preference, so use this as a guide and confirm the measurement.</p>
        <SizeCalculator />
        <h2>Size chart.</h2>
        <table className="spec-table size-table">
          <thead><tr><th>Your trouser waist</th><th>Belt size to order</th><th>Belt size (cm)</th></tr></thead>
          <tbody>{[28, 30, 32, 34, 36, 38, 40, 42, 44].map((belt) => <tr key={belt}><td>{belt - 2} in</td><td><b>{belt}</b></td><td>{Math.round(belt * 2.54)} cm</td></tr>)}</tbody>
        </table>
        <h2>The three small steps.</h2>
        <ol><li>Wrap a measuring tape where your belt will sit, over your trousers.</li><li>Keep it comfortably snug, without pulling tight.</li><li>Add about 2 inches and choose the closest available size. If between sizes, size up.</li></ol>
        <p>For kids, measure an existing belt or the waist over clothing. Width is shown in millimetres; check your trouser loops before choosing.</p>
      </>}

      {page === 'about' && <>
        <p>We believe the smallest detail can bring an outfit together. Beltaly is a belt and leather goods company, beginning with considered belts for everyday wear. Wallets are our next chapter, coming soon.</p>
        <h2>Crafted leather. Modern India.</h2>
        <p>Deep black. Warm gold. An everyday ease that moves from office mornings to wedding evenings. Our design takes its cues from the belt itself: a continuous line, honest stitching, and a buckle that brings it all together.</p>
        <p>Beltaly belts are genuine leather with metal buckles, and many arrive in the Beltaly gift box. You can also find us on Amazon.in.</p>
        <Link className="btn" to="shop">Find your everyday <ArrowUpRight size={15} /></Link>
      </>}

      {page === 'contact' && <>
        <p>Questions about fit, an order or a gift? WhatsApp is our main contact channel.</p>
        {contactHref
          ? <a className="btn" href={contactHref} target="_blank" rel="noopener noreferrer">Start a WhatsApp conversation <ArrowUpRight size={15} /></a>
          : <div className="account-panel"><h3>We’re getting ready.</h3><p>The store’s WhatsApp number has not been added yet. Ordering opens once setup is complete.</p></div>}
        <h2>Before you message.</h2>
        <p>For product questions, include the product name and preferred size. For existing orders, include your BLT reference. Never share a UPI PIN, OTP or card details.</p>
      </>}

      {page === 'faq' && <>
        {faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        <p><Link className="text-link" to="size-guide">Open the size guide <ArrowUpRight size={14} /></Link></p>
      </>}

      {page === 'shipping' && <>
        <h2>Delivery.</h2>
        <p>{settings.deliverAllIndia ? 'We deliver across India.' : 'We currently deliver to the pincodes accepted by the delivery checker.'} Delivery is {money(settings.shippingFee)} per order, and free on orders of {money(settings.freeShippingAbove)} or more. Cash on Delivery adds {money(settings.codCharge)}. All charges are shown in your bag before you send the order.</p>
        <p>Once you send your order on WhatsApp, we confirm it and share the dispatch date there. If you have a question about delivery, message us with your BLT order reference.</p>
        <h2>Size exchanges & returns.</h2>
        <p>Wrong size, damaged in transit, or not what you expected? Message us on WhatsApp with your BLT order reference and a photo of the belt and its box. Please keep the belt unused and in its original packaging while we sort it out with you.{settings.returnDays ? ` Requests must be raised within ${settings.returnDays} days of delivery.` : ''}</p>
        {contactHref && <a className="btn btn--whatsapp" href={contactHref} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>}
      </>}

      {page === 'privacy' && <>
        <p>We only collect what we need to deliver your order: your name, mobile number and delivery address. You choose to send these to us on WhatsApp when you place an order.</p>
        <h2>What stays on your device.</h2>
        <p>Your bag, wishlist, order history and language choice are saved in your own browser so they are still there next time. You can clear them at any time from your browser’s site settings. This site has no advertising or tracking cookies.</p>
        <h2>Third parties.</h2>
        <p>WhatsApp, UPI apps and payment providers you choose to use apply their own privacy policies. We never ask for your UPI PIN, OTP or card details.</p>
        <h2>Contact.</h2>
        <p>For any privacy question, message us on WhatsApp{settings.business?.email ? <> or email <a href={`mailto:${settings.business.email}`}>{settings.business.email}</a></> : null}.</p>
      </>}

      {page === 'terms' && <>
        <p>Prices on this site are in Indian rupees and include all taxes. Delivery and Cash on Delivery charges are shown before you send an order.</p>
        <h2>Orders & payments.</h2>
        <p>An order sent from this site, with its BLT reference, is confirmed when Beltaly replies on WhatsApp. Prices and stock can change until then. If we cannot fulfil an order, we will tell you, and refund any amount already paid.</p>
        <h2>Store information.</h2>
        <StoreDetails />
      </>}
    </article>
  );
}
