import type {Product,SiteSettings} from '../data/providers/types';
export interface CartItem {productId:string;size:number;colour:string;quantity:number}
export interface Customer {name:string;phone:string;address:string;pincode:string}
export type Method='whatsapp'|'upi'|'paymentLink'|'cod';
export interface Order {id:string;items:CartItem[];customer:Customer;method:Method;subtotal:number;shipping:number;cod:number;total:number}
export interface CartService {get():Promise<CartItem[]>;save(items:CartItem[]):Promise<void>}
export interface OrderService {create(items:CartItem[],customer:Customer,method:Method,products:Product[],settings:SiteSettings):Promise<Order>}
export interface AuthService {currentUser():Promise<{name:string}|null>}
export class StaticCartService implements CartService {
 async get(){try{const data:unknown=JSON.parse(localStorage.getItem('beltaly-cart-v1')||'[]');if(!Array.isArray(data))return [];return data.filter((v):v is CartItem=>v&&typeof v.productId==='string'&&typeof v.colour==='string'&&Number.isInteger(v.size)&&Number.isInteger(v.quantity)&&v.quantity>0&&v.quantity<=99);}catch{return [];}}
 async save(items:CartItem[]){localStorage.setItem('beltaly-cart-v1',JSON.stringify(items));window.dispatchEvent(new Event('cart-changed'));}
}
export function totals(items:CartItem[],products:Product[],settings:SiteSettings,method:Method='whatsapp'){const subtotal=items.reduce((sum,i)=>sum+(products.find(p=>p.id===i.productId)?.price||0)*i.quantity,0);const shipping=subtotal>0&&subtotal<settings.freeShippingAbove?settings.shippingFee:0;const cod=method==='cod'&&subtotal>0?settings.codCharge:0;return {subtotal,shipping,cod,total:subtotal+shipping+cod};}
export function validateItems(items:CartItem[],products:Product[]){if(!items.length)throw new Error('Your bag is empty.');const counts=new Map<string,number>();for(const item of items){const p=products.find(p=>p.id===item.productId);if(!p||!p.sizes.includes(item.size)||p.colour!==item.colour||!Number.isInteger(item.quantity)||item.quantity<1)throw new Error('A bag item is no longer available. Remove it and choose again.');counts.set(p.id,(counts.get(p.id)||0)+item.quantity);if(counts.get(p.id)!>p.stock)throw new Error(`${p.name}: only ${p.stock} available.`);}}
export function orderId(){const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'2-digit',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-','');return `BLT-${date}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;}
export class StaticOrderService implements OrderService {async create(items:CartItem[],customer:Customer,method:Method,products:Product[],settings:SiteSettings){validateItems(items,products);if(!customer.name.trim()||!customer.address.trim()||!/^\d{10}$/.test(customer.phone)||!/^\d{6}$/.test(customer.pincode))throw new Error('Enter a name, 10-digit phone, full address and 6-digit pincode.');if(!settings.pincodes.includes(customer.pincode))throw new Error('This pincode is not in our delivery area yet.');if(!settings.methods[method])throw new Error('This payment method is disabled.');return {id:orderId(),items,customer,method,...totals(items,products,settings,method)};}}
export class StaticAuthService implements AuthService {async currentUser(){return null;}}
async function api<T>(path:string,method='GET',body?:unknown):Promise<T>{const base=import.meta.env.PUBLIC_API_URL;if(!base)throw new Error('API mode needs PUBLIC_API_URL.');const response=await fetch(`${base.replace(/\/$/,'')}${path}`,{method,credentials:'include',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!response.ok)throw new Error(`API request failed (${response.status})`);return response.status===204?undefined as T:response.json();}
// TODO: deploy the authenticated API contract in ARCHITECTURE.md before enabling API mode.
class ApiCartService implements CartService {get(){return api<CartItem[]>('/cart');}save(items:CartItem[]){return api<void>('/cart','PUT',{items});}}
class ApiOrderService implements OrderService {create(items:CartItem[],customer:Customer,method:Method){return api<Order>('/orders','POST',{items,customer,method});}}
class ApiAuthService implements AuthService {currentUser(){return api<{name:string}|null>('/auth/me');}}
const mode=import.meta.env?.PUBLIC_SERVICE_MODE||'static';
export const cartService:CartService=mode==='api'?new ApiCartService():new StaticCartService();
export const orderService:OrderService=mode==='api'?new ApiOrderService():new StaticOrderService();
export const authService:AuthService=mode==='api'?new ApiAuthService():new StaticAuthService();
