import {localProvider} from './local-json';
import {sheetsProvider} from './google-sheets';
import {supabaseProvider} from './supabase';
import {airtableProvider} from './airtable';
import type {StoreData} from './types';
let cache:Promise<StoreData>;
export function getStore(){const name=import.meta.env.DATA_PROVIDER||'local-json';const providers={'local-json':localProvider,'google-sheets':sheetsProvider,supabase:supabaseProvider,airtable:airtableProvider};if(!(name in providers))throw new Error(`Unknown DATA_PROVIDER: ${name}`);return cache??=providers[name as keyof typeof providers].load();}
