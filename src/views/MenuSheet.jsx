import { BriefcaseBusiness, ChevronRight, CircleHelp, Globe, Heart, Laptop, MessageCircle, Moon, Package, Ruler, ScrollText, Shield, Sun, Truck, UserRound, X } from 'lucide-react';
import { settings } from '../catalog.js';
import { whatsappUrl } from '../commerce.js';
import { LANGUAGES, useT } from '../i18n.js';
import { Link } from './shared.jsx';

const THEMES = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'system', label: 'System', Icon: Laptop },
];

// The ≡ menu: profile (sign-in comes later with the backend), orders, wishlist, settings and help.
export default function MenuSheet({ onClose, orderCount, savedCount, language, onLanguage, theme, onTheme }) {
  const t = useT();
  return (
    <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer drawer--menu" role="dialog" aria-modal="true" aria-labelledby="menu-title">
        <div className="drawer-head"><h2 id="menu-title">{t('Menu')}</h2><button className="icon-btn" onClick={onClose} aria-label={t('Close menu')} autoFocus><X size={20} /></button></div>

        <div className="menu-profile">
          <span className="menu-avatar"><UserRound size={24} /></span>
          <div>
            <b>{t('Hello!')}</b>
            <p>{t('Sign in and profiles are coming soon. For now, your orders and wishlist are saved on this device.')}</p>
            <button className="soon" disabled>{t('Sign in')} · {t('Coming soon')}</button>
          </div>
        </div>

        <section className="menu-section">
          <h3>{t('Your Beltaly')}</h3>
          <nav className="menu-list">
            <Link to="orders"><Package size={19} /><span>{t('My orders')}</span><span className="count">{orderCount}</span></Link>
            <Link to="saved"><Heart size={19} /><span>{t('Wishlist')}</span><span className="count">{savedCount}</span></Link>
            <Link to="business"><BriefcaseBusiness size={19} /><span>{t('Bulk orders')}</span><ChevronRight size={16} /></Link>
          </nav>
        </section>

        <section className="menu-section">
          <h3>{t('Settings')}</h3>
          <div className="menu-list">
            <label className="menu-row"><Globe size={19} /><span>{t('Language')}</span>
              <select value={language} onChange={(event) => onLanguage(event.target.value)}>
                {LANGUAGES.map((item) => <option key={item.code} value={item.code} lang={item.code}>{item.native}</option>)}
              </select>
            </label>
          </div>
          <p className="menu-label">{t('Theme')}</p>
          <div className="theme-switch" role="radiogroup" aria-label={t('Theme')}>
            {THEMES.map(({ id, label, Icon }) => <button key={id} role="radio" aria-checked={theme === id} onClick={() => onTheme(id)}><Icon size={18} />{t(label)}</button>)}
          </div>
        </section>

        <section className="menu-section">
          <h3>{t('Help & information')}</h3>
          <nav className="menu-list">
            {settings.whatsapp && <a href={whatsappUrl(settings.whatsapp)} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} /><span>{t('Chat on WhatsApp')}</span><ChevronRight size={16} /></a>}
            <Link to="size-guide"><Ruler size={19} /><span>{t('Size guide')}</span><ChevronRight size={16} /></Link>
            <Link to="shipping"><Truck size={19} /><span>{t('Shipping & returns')}</span><ChevronRight size={16} /></Link>
            <Link to="faq"><CircleHelp size={19} /><span>{t('FAQs')}</span><ChevronRight size={16} /></Link>
            <Link to="privacy"><Shield size={19} /><span>{t('Privacy policy')}</span><ChevronRight size={16} /></Link>
            <Link to="terms"><ScrollText size={19} /><span>{t('Terms of use')}</span><ChevronRight size={16} /></Link>
          </nav>
        </section>
        <p className="menu-foot">Beltaly · {t('Genuine leather belts')}</p>
      </aside>
    </div>
  );
}
