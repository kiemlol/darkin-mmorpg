import manifest from '../../public/game-data/items/catalog.json';
import {accessoryItems} from './equipment';

export type ItemDefinition={id:string;name:string;category:string;accessoryId?:string;slot?:string;description:string};
export type ItemStack={itemId:string;quantity:number};
export type Inventory={version:1;capacity:number;revision:number;slots:(ItemStack|null)[]};
export type InventoryMove={from:number;to:number;quantity?:number;revision:number};
export const SOUL_BANNER_ID='attachment_1793960988158_2',SOUL_RELEASE='soul_banner_release_v1';
export const BAG_CAPACITY=4,MAX_STACK=10;
export const itemDefinitions=manifest.items as ItemDefinition[];
if(manifest.format!=='darkin-item-catalog-v1'||manifest.version!==1||manifest.initialCapacity!==BAG_CAPACITY||manifest.maxStack!==MAX_STACK||new Set(itemDefinitions.map(i=>i.id)).size!==itemDefinitions.length||itemDefinitions.some(i=>!accessoryItems.some(a=>a.accessoryId===i.accessoryId)))throw Error('Danh mục vật phẩm không hợp lệ');
export const itemDefinition=(id:string)=>itemDefinitions.find(i=>i.id===id);
export function emptyInventory():Inventory{return{version:1,capacity:BAG_CAPACITY,revision:0,slots:Array(BAG_CAPACITY).fill(null)}}
export function starterInventory():Inventory{let bag=emptyInventory();for(const id of manifest.starterItems)bag=addItems(bag,id,1);bag.revision=0;return bag}
export function validInventory(b:any):b is Inventory{
 return b?.version===1&&b.capacity===BAG_CAPACITY&&Number.isSafeInteger(b.revision)&&b.revision>=0&&b.revision<1e12&&Array.isArray(b.slots)&&b.slots.length===BAG_CAPACITY&&b.slots.every((s:any)=>s===null||!!s&&typeof s.itemId==='string'&&!!itemDefinition(s.itemId)&&Number.isSafeInteger(s.quantity)&&s.quantity>=1&&s.quantity<=MAX_STACK);
}
export function ownsItem(b:Inventory,id:string){return b.slots.some(s=>s?.itemId===id&&s.quantity>0)}
export function addItems(current:Inventory,itemId:string,quantity:number):Inventory{
 if(!validInventory(current)||!itemDefinition(itemId)||!Number.isSafeInteger(quantity)||quantity<1||quantity>MAX_STACK*BAG_CAPACITY)throw Error('Vật phẩm/số lượng không hợp lệ');
 const next=structuredClone(current);let remaining=quantity;
 for(const s of next.slots)if(s?.itemId===itemId){const n=Math.min(remaining,MAX_STACK-s.quantity);s.quantity+=n;remaining-=n}
 for(let i=0;i<next.capacity&&remaining;i++)if(!next.slots[i]){const n=Math.min(MAX_STACK,remaining);next.slots[i]={itemId,quantity:n};remaining-=n}
 if(remaining)throw Error('Túi đã đầy; không nhận một phần hoặc làm mất vật phẩm');
 if(next.revision>=1e12-1)throw Error('Túi vượt giới hạn phiên bản');next.revision++;return next;
}
export function moveItems(current:Inventory,command:InventoryMove):Inventory{
 if(!validInventory(current)||!command||!Number.isInteger(command.from)||!Number.isInteger(command.to)||command.from<0||command.to<0||command.from>=current.capacity||command.to>=current.capacity||!Number.isSafeInteger(command.revision)||command.revision!==current.revision)throw Error('Túi đã thay đổi hoặc vị trí ô không hợp lệ');
 const source=current.slots[command.from];if(!source)throw Error('Ô nguồn trống');
 const amount=command.quantity??source.quantity;if(!Number.isSafeInteger(amount)||amount<1||amount>source.quantity)throw Error('Số lượng chuyển không hợp lệ');
 if(command.from===command.to)return structuredClone(current);
 const next=structuredClone(current),s=next.slots[command.from]!,target=next.slots[command.to];
 if(!target){next.slots[command.to]={itemId:s.itemId,quantity:amount};s.quantity-=amount}
 else if(target.itemId===s.itemId){const take=Math.min(amount,MAX_STACK-target.quantity);if(take===0)throw Error('Ô đích đã đủ 10 món');target.quantity+=take;s.quantity-=take}
 else{if(amount!==s.quantity)throw Error('Chỉ đổi chỗ toàn bộ chồng khác loại');next.slots[command.from]=target;next.slots[command.to]=s}
 if(next.slots[command.from]?.quantity===0)next.slots[command.from]=null;
 if(next.revision>=1e12-1)throw Error('Túi vượt giới hạn phiên bản');next.revision++;return next;
}
