import{MATERIALS}from'../shared/cultivation';import type{Actor}from'../shared/world';
export type BagEntry={kind:'equipment';slot:number}|{kind:'locked';slot:number}|{kind:'material';id:string;quantity:number}|{kind:'wallet';quantity:number}|{kind:'empty'};
/** One inventory presentation over existing authoritative saves. No conversion can spend or lose resources. */
export function inventoryEntries(a:Actor,filter:number):BagEntry[]{const equipment:BagEntry[]=a.inventory.slots.map((_,slot)=>({kind:'equipment',slot}));const materials:BagEntry[]=Object.keys(MATERIALS).filter(id=>(a.cultivation?.materials[id]||0)>0).map(id=>({kind:'material',id,quantity:a.cultivation!.materials[id]}));
 if(filter===1)return [...equipment,...Array.from({length:16-a.inventory.capacity},(_,i):BagEntry=>({kind:'locked',slot:a.inventory.capacity+i}))];if(filter===2)return[];if(filter===3)return materials;if(filter===4)return[{kind:'wallet',quantity:a.wallet.spirit_stone}];return[...equipment,...materials]}
export const inventoryPages=(entries:BagEntry[])=>Math.max(1,Math.ceil(entries.length/16));
