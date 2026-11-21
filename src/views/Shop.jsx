import { X } from 'lucide-react';
import { categories, filterFields, matchesFilters, matchesSearch, products, sorters } from '../catalog.js';
import { useT } from '../i18n.js';
import { ProductGrid, href, navigate } from './shared.jsx';

const FILTER_KEYS = ['q', 'category', ...filterFields.map((field) => field.name), 'max', 'sort'];
const PRICE_STEPS = [400, 500, 1000];

// All filter state lives in the URL (/shop?category=formal&sort=price-asc), so it is shareable.
export default function Shop({ query, saved, onToggleSaved }) {
  const t = useT();
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, query.get(key) || '']));
  const sort = sorters[filters.sort] ? filters.sort : 'featured';
  const local = (text) => t(text).toLowerCase().includes(filters.q.trim().toLowerCase());
  const results = products.filter((product) => matchesFilters(product, filters) && (matchesSearch(product, filters.q) || local(product.name) || local(product.colour))).sort(sorters[sort]);
  const active = FILTER_KEYS.filter((key) => key !== 'sort' && key !== 'category' && filters[key]);

  function update(key, value) {
    const next = { ...filters, [key]: value };
    if (next.sort === 'featured') next.sort = '';
    navigate(href('shop', next), { replace: true });
  }

  const clear = () => navigate(href('shop', filters.category ? { category: filters.category } : undefined), { replace: true });
  const currentCategory = categories.find((category) => category.id === filters.category);
  const categoryName = currentCategory?.name;
  // Filter values are raw data ("plate", "Black"); show them with the same wording as product pages.
  const cap = (text) => String(text).replace(/^./, (c) => c.toUpperCase());
  const valueLabel = (name, value) => t(name === 'buckle' ? `${cap(value)} buckle` : cap(value));
  const label = (key) => (key === 'q' ? `“${filters.q}”` : key === 'max' ? t('Under ₹{amount}', { amount: filters.max }) : valueLabel(key, filters[key]));

  return (
    <div className="shop-page">
      <header className="page-head page-hero">
        <div className="wrap page-hero-inner">
          <nav className="breadcrumb" aria-label={t('Breadcrumb')}><a href={href('')}>{t('Home')}</a> › <span>{categoryName ? t(categoryName) : t('Belts')}</span></nav>
          <p className="lux-kicker">{t('Genuine leather belts')}</p>
          <h1>{filters.q ? t('Results for “{query}”', { query: filters.q }) : categoryName ? t(categoryName) : t('All belts')}</h1>
          {currentCategory?.description && !filters.q && <p className="page-hero-lead">{t(currentCategory.description)}</p>}
        </div>
      </header>
      <div className="wrap">
        <div className="chip-row shop-tabs">
          <button className={!filters.category ? 'chip is-selected' : 'chip'} onClick={() => update('category', '')}>{t('All')}</button>
          {categories.map((category) => <button key={category.id} className={filters.category === category.id ? 'chip is-selected' : 'chip'} onClick={() => update('category', category.id)}>{t(category.name)}</button>)}
        </div>

      <form className="toolbar" onSubmit={(event) => event.preventDefault()} aria-label={t('Filter and sort belts')}>
        {filterFields.map((field) => (
          <label key={field.name}><span>{t(field.label)}</span>
            <select value={filters[field.name]} onChange={(event) => update(field.name, event.target.value)}>
              <option value="">{t('All')}</option>
              {field.values.map((value) => <option key={value} value={value}>{valueLabel(field.name, value)}</option>)}
            </select>
          </label>
        ))}
        <label><span>{t('Price')}</span>
          <select value={filters.max} onChange={(event) => update('max', event.target.value)}>
            <option value="">{t('Any price')}</option>
            {PRICE_STEPS.map((step) => <option key={step} value={step}>{t('Under ₹{amount}', { amount: step })}</option>)}
          </select>
        </label>
        <label className="toolbar-sort"><span>{t('Sort')}</span>
          <select value={sort} onChange={(event) => update('sort', event.target.value)}>
            <option value="featured">{t('Featured')}</option>
            <option value="price-asc">{t('Price: low to high')}</option>
            <option value="price-desc">{t('Price: high to low')}</option>
            <option value="name">{t('Name: A–Z')}</option>
          </select>
        </label>
      </form>

      <div className="listing-top">
        <span role="status">{t(results.length === 1 ? '{count} belt' : '{count} belts', { count: results.length })}</span>
        {active.map((key) => <button key={key} className="chip chip--small" onClick={() => update(key, '')} aria-label={`${t('Remove')}: ${label(key)}`}>{label(key)} <X size={13} /></button>)}
        {active.length > 1 && <button className="plain-button link-muted" onClick={clear}>{t('Clear filters')}</button>}
      </div>

      {results.length > 0
        ? <ProductGrid items={results} saved={saved} onToggleSaved={onToggleSaved} className="shop-products" />
        : <div className="empty panel"><p>{t('No belts match those filters. Try a different combination.')}</p><button className="btn secondary" onClick={clear}>{t('Clear filters')}</button></div>}
      </div>
    </div>
  );
}
