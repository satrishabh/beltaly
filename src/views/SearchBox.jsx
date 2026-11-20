import { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { categories, imageUrl, matchesSearch, money, products } from '../catalog.js';
import { useT } from '../i18n.js';
import { href, navigate, productHref } from './shared.jsx';

// Header search with live suggestions (photo, name, price). Arrow keys move through them, Enter opens one,
// Enter with nothing highlighted searches the shop, Escape closes the list.
export default function SearchBox({ initial = '', className = '', placeholder, showButton = true }) {
  const t = useT();
  const [term, setTerm] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef(null);
  const listId = useId();

  useEffect(() => setTerm(initial), [initial]);
  useEffect(() => {
    const close = (event) => { if (!box.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const query = term.trim();
  const local = (text) => t(text).toLowerCase().includes(query.toLowerCase());
  const results = query ? products.filter((product) => matchesSearch(product, query) || local(product.name) || local(product.colour)).slice(0, 5) : [];
  const categoryHits = query ? categories.filter((category) => category.name.toLowerCase().includes(query.toLowerCase()) || local(category.name)) : [];
  const showList = open && query.length > 0;

  function go(to) {
    setOpen(false);
    setActive(-1);
    navigate(to);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') { setOpen(false); return; }
    if (!results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive((index) => (index + 1) % results.length); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => (index <= 0 ? results.length - 1 : index - 1)); }
  }

  function submit(event) {
    event.preventDefault();
    if (active >= 0 && results[active]) go(productHref(results[active]));
    else go(href('shop', { q: query }));
    event.currentTarget.querySelector('input')?.blur();
  }

  return (
    <form ref={box} className={`search-box ${className}`} role="search" onSubmit={submit}>
      {!showButton && <Search size={17} aria-hidden="true" />}
      <input
        type="search" name="q" value={term} autoComplete="off" placeholder={placeholder ?? t('Search by name, colour or occasion')}
        aria-label={t('Search Beltaly')} role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(event) => { setTerm(event.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
      />
      {showButton && <button type="submit" aria-label={t('Search')}><Search size={18} /></button>}
      {showList && (
        <div className="suggest" id={listId} role="listbox">
          {results.map((product, index) => (
            <a key={product.id} id={`${listId}-${index}`} role="option" aria-selected={index === active} className={index === active ? 'is-active' : ''} href={productHref(product)} onClick={() => setOpen(false)}>
              <img src={imageUrl(product.images[0])} alt="" width="44" height="44" />
              <span><b>{t(product.name)}</b><small>{money(product.price)}{product.mrp > product.price ? ` · ${t('{percent}% off', { percent: Math.round((1 - product.price / product.mrp) * 100) })}` : ''}</small></span>
            </a>
          ))}
          {categoryHits.map((category) => <a key={category.id} className="suggest-cat" href={href('shop', { category: category.id })} onClick={() => setOpen(false)}>{t.rich('in {category}', { category: t(category.name) })}</a>)}
          {!results.length && !categoryHits.length && <p className="suggest-empty">{t('No belts match “{query}”. Try “black”, “tan” or “combo”.', { query })}</p>}
          {results.length > 0 && <button type="submit" className="suggest-all">{t('See all results for “{query}”', { query })}</button>}
        </div>
      )}
    </form>
  );
}
