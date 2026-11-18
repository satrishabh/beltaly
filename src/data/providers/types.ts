import { z } from 'zod';
const image = z.string().refine(v => v.startsWith('/products/') || /^https:\/\//.test(v), 'Use /products/ path or HTTPS image URL');
const httpsUrl=z.string().url().refine(v=>v.startsWith('https://'),'Use an HTTPS URL');
const slug=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Use a lowercase hyphenated URL slug');
export const productSchema = z.object({id:z.string().min(1),slug:slug,name:z.string().min(1),category:z.string(),material:z.string(),colour:z.string(),width:z.number().positive(),buckle:z.string(),price:z.number().positive(),mrp:z.number().positive(),sizes:z.array(z.number().positive()).min(1),stock:z.number().int().nonnegative(),description:z.string(),care:z.string(),images:z.array(image).min(1),badge:z.string().default(''),paymentLink:httpsUrl.or(z.literal('')).default('')}).refine(p=>p.mrp>=p.price,{message:'MRP must be at least price',path:['mrp']});
export const categorySchema=z.object({id:slug,name:z.string(),description:z.string()});
export const collectionSchema=z.object({id:z.string(),name:z.string(),description:z.string(),productIds:z.array(z.string())});
export const bannerSchema=z.object({id:z.string(),eyebrow:z.string(),title:z.string(),description:z.string(),href:z.string().startsWith('/').refine(v=>!v.startsWith('//'),'Use an internal path'),enabled:z.boolean()});
export const settingsSchema=z.object({name:z.string(),logo:image.or(z.literal('')).default(''),tagline:z.string(),announcement:z.string(),whatsapp:z.string().regex(/^\d{10,15}$/).or(z.literal('')),upiVpa:z.string(),payeeName:z.string(),gstin:z.string(),shippingFee:z.number().nonnegative(),freeShippingAbove:z.number().nonnegative(),codCharge:z.number().nonnegative(),pincodes:z.array(z.string().regex(/^\d{6}$/)),methods:z.object({whatsapp:z.boolean(),upi:z.boolean(),paymentLink:z.boolean(),cod:z.boolean()}),paymentLink:httpsUrl.or(z.literal('')),instagram:httpsUrl.or(z.literal('')),cloudinaryCloud:z.string(),liveRefresh:z.boolean(),liveRefreshUrl:httpsUrl.or(z.literal('')),colours:z.object({leather:z.string().regex(/^#[\da-fA-F]{6}$/),cream:z.string().regex(/^#[\da-fA-F]{6}$/),espresso:z.string().regex(/^#[\da-fA-F]{6}$/),brass:z.string().regex(/^#[\da-fA-F]{6}$/)})});
export type Product=z.infer<typeof productSchema>;
export type Category=z.infer<typeof categorySchema>;
export type Collection=z.infer<typeof collectionSchema>;
export type Banner=z.infer<typeof bannerSchema>;
export type SiteSettings=z.infer<typeof settingsSchema>;
export interface StoreData {products:Product[];categories:Category[];collections:Collection[];banners:Banner[];settings:SiteSettings}
export interface DataProvider {load():Promise<StoreData>}
export function validateStore(raw:Record<string,unknown>):StoreData {
 const schemas={products:z.array(productSchema),categories:z.array(categorySchema),collections:z.array(collectionSchema),banners:z.array(bannerSchema),settings:settingsSchema};
 const out:Record<string,unknown>={};
 for(const [tab,schema] of Object.entries(schemas)){const result=schema.safeParse(raw[tab]);if(!result.success)throw new Error(`${tab}: ${result.error.issues.map(i=>`${typeof i.path[0]==='number'?`row ${Number(i.path[0])+2} `:''}${i.path.join('.')}: ${i.message}`).join('; ')}`);out[tab]=result.data;}
 const data=out as unknown as StoreData;
 for(const key of ['products','categories','collections','banners'] as const){const ids=data[key].map(v=>v.id);if(new Set(ids).size!==ids.length)throw new Error(`${key}: duplicate id`);}
 if(new Set(data.products.map(p=>p.slug)).size!==data.products.length)throw new Error('products: duplicate slug');
 for(const p of data.products)if(!data.categories.some(c=>c.id===p.category))throw new Error(`products ${p.id}: unknown category ${p.category}`);
 for(const c of data.collections)for(const id of c.productIds)if(!data.products.some(p=>p.id===id))throw new Error(`collections ${c.id}: unknown product ${id}`);
 return data;
}
