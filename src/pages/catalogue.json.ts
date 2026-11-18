import {getStore} from '../data/providers';
export async function GET(){const {products}=await getStore();return new Response(JSON.stringify(products),{headers:{'Content-Type':'application/json'}});}
