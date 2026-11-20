import { categories, filterFields, matchesFilters, matchesSearch, products, sorters } from '../catalog.js';
import { useT } from '../i18n.js';
import { ProductGrid, href } from './shared.jsx';

const FILTER_KEYS = ['q', 'category', ...filterFields.map((field) => field.name), 'max', 'sort'];

// All filter state lives in the URL (#/shop?category=formal&material=canvas&sort=price-asc), so it is shareable.
export default function Shop({ query, saved, onToggleSaved }) {
  const t = useT();
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, query.get(key) || '']));
  const sort = sorters[filters.sort] ? filters.sort : 'featured';
  const results = products.filter((product) => matchesFilters(product, filters) && matchesSearch(product, filters.q)).sort(sorters[sort]);

  function update(key, value) {
    const next = { ...filters, [key]: value };
    if (next.sort === 'featured') next.sort = '';
    window.history.replaceState(null, '', href('shop', next));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  function clear() {
    window.history.replaceState(null, '', href('shop', filters.q ? { q: filters.q } : undefined));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  const categoryName = categories.find((category) => category.id === filters.category)?.name;

  return (
    <div className="wrap">
      <header className="page-head">
        <p className="eyebrow">THE BELTALY COLLECTION</p>
        <h1>{filters.q ? <>Results for “{filters.q}”</> : categoryName ? t(categoryName) : 'A good fit starts here.'}</h1>
        <p>Thoughtful details for every day, and the days that call for a little more.</p>
      </header>
      <div className="shop-layout section section--flush">
        <form className="filters" onSubmit={(event) => event.preventDefault()} aria-label="Filter belts">
          <label>{t('Search Beltaly')}<input type="search" value={filters.q} onChange={(event) => update('q', event.target.value)} placeholder={t('Search by name, material, colour or occasion')} /></label>
          <label>{t('Category')}
            <select value={filters.category} onChange={(event) => update('category', event.target.value)}>
              <option value="">{t('All categories')}</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{t(category.name)}</option>)}
            </select>
          </label>
          {filterFields.map((field) => (
            <label key={field.name}>{t(field.label)}
              <select value={filters[field.name]} onChange={(event) => update(field.name, event.target.value)}>
                <option value="">{t('All')}</option>
                {field.values.map((value) => <option key={value} value={value}>{t(value)}</option>)}
              </select>
            </label>
          ))}
          <label>{t('Maximum price (₹)')}<input type="number" min="0" inputMode="numeric" value={filters.max} onChange={(event) => update('max', event.target.value)} placeholder={t('Any price')} /></label>
          <button className="btn secondary" type="button" onClick={clear}>{t('Clear filters')}</button>
        </form>
        <div>
          <div className="listing-top">
            <span role="status">{results.length} {t('belts found')}</span>
            <label>{t('Sort')}{' '}
              <select aria-label="Sort products" value={sort} onChange={(event) => update('sort', event.target.value)}>
                <option value="featured">{t('Featured')}</option>
                <option value="price-asc">{t('Price: low to high')}</option>
                <option value="price-desc">{t('Price: high to low')}</option>
                <option value="name">{t('Name: A–Z')}</option>
              </select>
            </label>
          </div>
          {results.length > 0
            ? <ProductGrid items={results} saved={saved} onToggleSaved={onToggleSaved} className="shop-products" />
            : <p className="empty">{t('No belts match those filters. Try a different combination.')}</p>}
        </div>
      </div>
    </div>
  );
}
