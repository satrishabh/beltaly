// Translations. Keys are the English text itself, so English needs no file and a missing translation
// falls back to English instead of showing a blank. Values may contain {placeholders}.
// Each language lives in src/locales/<code>.json and is downloaded only when a shopper picks it.
// To add a language: add it to LANGUAGES, create src/locales/<code>.json (run `npm run i18n:keys` for the list).
import { createContext, createElement, Fragment, useContext } from 'react';

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', font: 'Noto Sans Devanagari' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', font: 'Noto Sans Bengali' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', font: 'Noto Sans Devanagari' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', font: 'Noto Sans Telugu' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', font: 'Noto Sans Tamil' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', font: 'Noto Sans Gujarati' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', font: 'Noto Sans Kannada' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', font: 'Noto Sans Malayalam' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', font: 'Noto Sans Gurmukhi' },
  { code: 'ur', name: 'Urdu', native: 'اردو', font: 'Noto Nastaliq Urdu', dir: 'rtl' },
  { code: 'ks', name: 'Kashmiri', native: 'کٲشُر', font: 'Noto Naskh Arabic', dir: 'rtl' },
];

export const directionOf = (code) => LANGUAGES.find((language) => language.code === code)?.dir ?? 'ltr';

export const isLanguage = (code) => LANGUAGES.some((language) => language.code === code);

// First visit: use the browser's language if we support it (e.g. a phone set to Tamil), otherwise English.
export function detectLanguage() {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = String(tag).slice(0, 2).toLowerCase();
    if (isLanguage(code)) return code;
  }
  return 'en';
}

// Vite turns this into one lazily loaded chunk per language at build time.
const loaders = import.meta.glob(['./locales/*.json', '!./locales/_keys.json'], { import: 'default' });
export async function loadDictionary(code) {
  const load = loaders[`./locales/${code}.json`];
  return load ? load() : {};
}

// Adds the Google Noto font for the language's script, once.
export function loadFont(code) {
  const font = LANGUAGES.find((language) => language.code === code)?.font;
  const id = `font-${font?.replace(/\s+/g, '-')}`;
  if (!font || document.getElementById(id)) return;
  document.head.append(Object.assign(document.createElement('link'), {
    id, rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`,
  }));
}

export function format(dict, key, vars) {
  const text = (dict && dict[key]) || key;
  return vars ? text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] ?? match)) : text;
}

export const LanguageContext = createContext({ code: 'en', dict: {} });

// t('Add to bag'), t('Only {count} left', { count: 3 }), t.rich('Starting at {price}', { price }) → values in <b>.
export function useT() {
  return makeT(useContext(LanguageContext).dict);
}

// Same translator outside the context provider (the App shell builds the provider, so it can't use useT).
export function makeT(dict) {
  const t = (key, vars) => format(dict, key, vars);
  t.rich = (key, vars) => {
    const text = (dict && dict[key]) || key;
    return text.split(/\{(\w+)\}/g).map((part, index) => (index % 2 ? createElement('b', { key: index, dir: 'auto' }, vars[part] ?? part) : createElement(Fragment, { key: index }, part)));
  };
  return t;
}

export const useLanguage = () => useContext(LanguageContext).code;
