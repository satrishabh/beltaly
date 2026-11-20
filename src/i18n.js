// English / Hindi strings. Codex's dictionaries are reused as-is from src/data:
//   en.json + hi.json  → short keys ("heroTitle")
//   ui.json            → English phrase → { en, hi }
// `extra` below holds strings added for the React screens. To add a language (Tamil, Bengali,
// Marathi…), add its column to each source and to LANGUAGES.
import { createContext, useContext } from 'react';
import en from './data/en.json' with { type: 'json' };
import hi from './data/hi.json' with { type: 'json' };
import ui from './data/ui.json' with { type: 'json' };

export const LANGUAGES = ['en', 'hi'];

const extra = {
  'Saved': { en: 'Saved', hi: 'सेव किए गए' },
  'Orders': { en: 'Orders', hi: 'ऑर्डर' },
  'Business': { en: 'Business', hi: 'बिज़नेस' },
  'Sign in': { en: 'Sign in', hi: 'साइन इन' },
  'Bag': { en: 'Bag', hi: 'बैग' },
  'Search Beltaly': { en: 'Search Beltaly', hi: 'Beltaly में खोजें' },
  'Looking for something?': { en: 'Looking for something?', hi: 'कुछ ढूँढ रहे हैं?' },
  'No matches yet. Try another word.': { en: 'No matches yet. Try another word.', hi: 'अभी कुछ नहीं मिला। दूसरा शब्द आज़माएँ।' },
  'belts found': { en: 'belts found', hi: 'बेल्ट मिलीं' },
  'Ask about this belt on WhatsApp': { en: 'Ask about this belt on WhatsApp', hi: 'इस बेल्ट के बारे में WhatsApp पर पूछें' },
  'Not sure? Find your belt size': { en: 'Not sure? Find your belt size', hi: 'पक्का नहीं? अपना बेल्ट साइज़ जानें' },
  'Out of stock': { en: 'Out of stock', hi: 'स्टॉक में नहीं' },
  'In stock': { en: 'In stock', hi: 'स्टॉक में है' },
  'off': { en: 'off', hi: 'छूट' },
  'A little more your style.': { en: 'A little more your style.', hi: 'आपके अंदाज़ की कुछ और।' },
  'Save for later': { en: 'Save for later', hi: 'बाद के लिए सेव करें' },
  'Saved for later': { en: 'Saved for later', hi: 'बाद के लिए सेव' },
  'Continue to checkout': { en: 'Continue to checkout', hi: 'चेकआउट पर जाएँ' },
  'Keep looking': { en: 'Keep looking', hi: 'और देखें' },
  'Free shipping unlocked.': { en: 'Free shipping unlocked.', hi: 'मुफ़्त शिपिंग मिल गई।' },
  'Prepare order': { en: 'Prepare order', hi: 'ऑर्डर तैयार करें' },
  'Preparing…': { en: 'Preparing…', hi: 'तैयार हो रहा है…' },
  'Order request': { en: 'Order request', hi: 'ऑर्डर अनुरोध' },
  'Back to the shop': { en: 'Back to the shop', hi: 'दुकान पर वापस' },
  'Wallets · coming soon': { en: 'Wallets · coming soon', hi: 'वॉलेट · जल्द आ रहे हैं' },
  'Let’s talk': { en: 'Let’s talk', hi: 'बात करें' },
};

const tables = { en: { ...Object.fromEntries(Object.entries(ui).map(([k, v]) => [k, v.en])), ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v.en])), ...en } };
tables.hi = { ...Object.fromEntries(Object.entries(ui).map(([k, v]) => [k, v.hi])), ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v.hi])), ...hi };

// Falls back to English, then to the key itself, so a missing translation never shows a blank.
export function translate(language, key) {
  return tables[language]?.[key] ?? tables.en[key] ?? key;
}

export const LanguageContext = createContext('en');
export function useT() {
  const language = useContext(LanguageContext);
  return (key) => translate(language, key);
}
