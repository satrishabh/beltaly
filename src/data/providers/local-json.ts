import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateStore,type DataProvider} from './types';
export const localProvider:DataProvider={
 async load(){
  const names=['products','categories','collections','banners','settings'];
  const entries=await Promise.all(names.map(async name=>{
   const text=await readFile(resolve('content',`${name}.json`),'utf8');
   return [name,JSON.parse(text)];
  }));
  return validateStore(Object.fromEntries(entries));
 }
};
