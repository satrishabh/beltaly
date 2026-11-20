import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { money, settings } from '../catalog.js';
import { suggestedSize, whatsappUrl } from '../commerce.js';
import { useT } from '../i18n.js';
import { Link } from './shared.jsx';

export const INFO_PAGES = {
  'size-guide': 'Measure once. Wear it every day.',
  about: 'Every detail has a story.',
  contact: 'Good conversations start here.',
  faq: 'A few things you might be wondering.',
  shipping: 'From our hands to yours.',
  privacy: 'Your information, thoughtfully handled.',
  terms: 'The details that matter.',
};

const faqs = [
  ['How do I choose a size?', 'Start with your trouser waist plus 2 inches, or measure a belt from buckle pin to the most-used hole. See our size guide.'],
  ['Are the displayed prices tax inclusive?', 'Yes. INR prices include all applicable taxes. Shipping and optional COD fees are shown separately in the bag.'],
  ['Is my order confirmed when I send it on WhatsApp?', 'No. The message is an order request. The store confirms stock, delivery, the final amount and acceptance.'],
  ['Does this site verify UPI payments?', 'No. The store checks its own bank or payment dashboard before marking a payment received. A screenshot is not proof of payment.'],
  ['When are wallets coming?', 'Our wallet collection is coming soon. Follow Beltaly announcements or contact the store for updates.'],
  ['Do I need an account?', 'No. Your bag and saved belts are kept in this browser. An account only keeps your order requests together on this device.'],
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

export default function InfoPage({ page }) {
  const contactHref = settings.whatsapp ? whatsappUrl(settings.whatsapp) : null;
  return (
    <article className="wrap prose">
      <p className="eyebrow">BELTALY / {page.replace('-', ' ').toUpperCase()}</p>
      <h1>{INFO_PAGES[page]}</h1>

      {page === 'size-guide' && <>
        <p>The best guide is a belt you already love. Measure from the buckle pin to the hole you use most. That measurement is your belt size, not the total length of the strap.</p>
        <h2>A good starting point.</h2>
        <p>Choose a belt about 2 inches larger than your trouser waist. Fit varies by rise, clothing and personal preference, so use this as a guide and confirm the measurement.</p>
        <SizeCalculator />
        <h2>The three small steps.</h2>
        <ol><li>Wrap a measuring tape where your belt will sit, over your trousers.</li><li>Keep it comfortably snug, without pulling tight.</li><li>Add about 2 inches and choose the closest available size. If between sizes, size up.</li></ol>
        <p>For kids, measure an existing belt or the waist over clothing. Width is shown in millimetres; check your trouser loops before choosing.</p>
      </>}

      {page === 'about' && <>
        <p>We believe the smallest detail can bring an outfit together. Beltaly is a belt and leather goods company, beginning with considered belts for everyday wear. Wallets are our next chapter, coming soon.</p>
        <h2>Crafted leather. Modern India.</h2>
        <p>Deep black. Warm gold. An everyday ease that moves from office mornings to wedding evenings. Our design takes its cues from the belt itself: a continuous line, honest stitching, and a buckle that brings it all together.</p>
        <p>This preview contains illustrative products and original drawings. Material details and real product photography will be published once verified.</p>
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
        <p className="account-panel">Sample policy for owner review. Verified dispatch times, return windows and refund timelines must be published before accepting orders.</p>
        <h2>Delivery areas & fees.</h2>
        <p>{settings.deliverAllIndia ? 'We deliver across India, to any valid pincode.' : 'Delivery is currently limited to the pincodes in the delivery checker.'} Standard shipping is {money(settings.shippingFee)}, free on orders of {money(settings.freeShippingAbove)} or more. Cash on Delivery adds {money(settings.codCharge)} where available. These charges appear before you prepare an order request.</p>
        <h2>Delivery estimates.</h2>
        <p>The store confirms dispatch and delivery estimates on WhatsApp before accepting the request. There is no automated courier tracking yet.</p>
        <h2>Returns & exchanges.</h2>
        <p>Contact the store before sending an item back. Keep the order reference, packaging and photographs of any issue. Return eligibility and the refund process are confirmed with the store.</p>
      </>}

      {page === 'privacy' && <>
        <p>This store keeps your bag, saved belts, order requests and language preference in your browser’s local storage. You can remove them through your browser’s site settings. No analytics or advertising trackers are included.</p>
        <h2>Checkout information.</h2>
        <p>Your name, phone and delivery address stay on the page while you prepare a request. Choosing WhatsApp puts them in a message that you decide whether to send. UPI links contain the amount, payee and order reference. Payment link providers handle their own payment pages.</p>
        <h2>Third parties.</h2>
        <p>The hosting provider processes normal web requests. WhatsApp, UPI apps and payment providers apply their own privacy policies.</p>
        <p>The owner must add its legal identity, privacy contact and retention periods before launch.</p>
      </>}

      {page === 'terms' && <>
        <p>This is a demonstration catalogue. Product descriptions, images and prices are samples and must be verified before commercial use.</p>
        <h2>Order requests & payments.</h2>
        <p>A BLT reference identifies a request; it is not an invoice, a stock reservation or acceptance of an order. The store accepts requests and verifies payments itself. Prices and stock may change before acceptance.</p>
        <h2>Store information.</h2>
        <p>The owner must publish its registered business name, address, contact details, GSTIN where applicable, final delivery and return policies, and a grievance contact before launch.</p>
      </>}
    </article>
  );
}
