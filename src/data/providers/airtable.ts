import type {DataProvider} from './types';
export const airtableProvider:DataProvider={async load(){throw new Error('Airtable adapter is a future integration. Choose local-json, google-sheets or supabase.');}};
