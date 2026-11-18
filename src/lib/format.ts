export const money=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
export const url=(path:string)=>`${import.meta.env.BASE_URL.replace(/\/$/,'')}${path}`;
export const productUrl=(p:{category:string;slug:string})=>url(`/shop/${p.category}/${p.slug}/`);
export function imageUrl(path:string,cloud=''){return cloud&&path.startsWith('https://')?`https://res.cloudinary.com/${encodeURIComponent(cloud)}/image/fetch/f_auto,q_auto,w_900/${encodeURIComponent(path)}`:path.startsWith('/')?url(path):path;}
