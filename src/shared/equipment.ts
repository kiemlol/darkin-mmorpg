import mounts from '../../public/game-data/accessories/studio/mount-data.json';
import square from '../../public/game-data/accessories/studio/glasses_square.accessory-pack.json';
import round from '../../public/game-data/accessories/studio/glasses_round.accessory-pack.json';
import patchwork from '../../public/game-data/accessories/studio/patchwork/merged.accessory-pack.json';
import {gameCatalog} from './catalog';
import {validateAccessoryPack,resolveAccessory,equipAccessory} from '../../public/game-data/accessories/studio/accessory-runtime.mjs';
export {validateAccessoryPack,resolveAccessory,equipAccessory};
export const mountCatalog=mounts;
export const accessoryItems=[...validateAccessoryPack(square).items,...validateAccessoryPack(round).items,...validateAccessoryPack(patchwork).items];
if(new Set(accessoryItems.map(a=>a.accessoryId)).size!==accessoryItems.length)throw Error('Trùng accessoryId giữa các gói');
if(gameCatalog.defaults.weaponId&&!accessoryItems.some(a=>a.accessoryId===gameCatalog.defaults.weaponId&&a.category==='weapon'))throw Error('Vũ khí mặc định chưa được đăng ký');
for(const w of gameCatalog.swordFlight?.weapons||[])if(!accessoryItems.some(a=>a.accessoryId===w.accessoryId&&a.category==='weapon'))throw Error('Kiếm cho phép bay chưa được đăng ký: '+w.accessoryId);
export type EquipmentState={headId:string;bodyId:string;accessories:{accessoryId:string;visible:boolean}[]};
export type CosmeticCommand={operation:'equip'|'unequip'|'mount'|'set';accessoryId?:string;headId?:string;bodyId?:string;accessoryIds?:string[]};
export function characterMount(state:EquipmentState){
 const head=mounts.characters.find(c=>c.headId===state.headId),body=mounts.characters.find(c=>c.bodyId===state.bodyId);
 if(!head||!body)throw Error('Mã đầu/thân chưa được phát hành');
 return{headId:state.headId,bodyId:state.bodyId,parts:{head:structuredClone(head.parts.head),torso:structuredClone(body.parts.torso)},mountSignatures:{head:head.mountSignatures.head,body:body.mountSignatures.body}};
}
export function defaultEquipment(appearanceId:string):EquipmentState{
 const c=mounts.characters.find(c=>c.appearanceId===appearanceId)||mounts.characters[0];
 return{headId:c.headId,bodyId:c.bodyId,accessories:accessoryItems.map(a=>({accessoryId:a.accessoryId,visible:a.accessoryId===gameCatalog.defaults.weaponId||c.inventory.some(v=>v.accessoryId===a.accessoryId&&v.visible)}))};
}
export function resolveInventory(state:EquipmentState,base:any[]=[],character:any=characterMount(state)){
 const warnings:string[]=[];
 let inventory=structuredClone(base).map(a=>accessoryItems.some(i=>i.accessoryId===(a.accessoryId||a.id))?{...a,visible:false}:a);
 for(const choice of state.accessories){
  const item=accessoryItems.find(a=>a.accessoryId===choice.accessoryId);if(!item)throw Error('Phụ kiện chưa được phát hành: '+choice.accessoryId);
  if(choice.visible){try{inventory=equipAccessory(inventory,item,character)}catch(e){warnings.push(String(e));inventory=inventory.filter(a=>(a.accessoryId||a.id)!==choice.accessoryId);inventory.push({...structuredClone(item),id:item.accessoryId,visible:false,mountStatus:String(e)})}}
  else if(!inventory.some(a=>(a.accessoryId||a.id)===choice.accessoryId))inventory.push({...structuredClone(item),id:item.accessoryId,visible:false});
 }
 return{inventory,warnings};
}
export function changeEquipment(current:EquipmentState,command:CosmeticCommand):EquipmentState{
 const next:EquipmentState={headId:current.headId,bodyId:current.bodyId,accessories:structuredClone(current.accessories)};
 if(command.operation==='set'){
  const ids=command.accessoryIds;if(!Array.isArray(ids)||ids.length>accessoryItems.length||new Set(ids).size!==ids.length||ids.some(id=>!accessoryItems.some(a=>a.accessoryId===id)))throw Error('Danh sách phụ kiện không hợp lệ');
  let result=changeEquipment(next,{operation:'mount',headId:command.headId,bodyId:command.bodyId});
  for(const choice of result.accessories)if(!ids.includes(choice.accessoryId))choice.visible=false;
  for(const id of ids)if(!current.accessories.some(a=>a.accessoryId===id&&a.visible))result=changeEquipment(result,{operation:'equip',accessoryId:id});
  return result;
 }
 if(command.operation==='mount'){
  if(command.headId!==undefined)next.headId=command.headId;
  if(command.bodyId!==undefined)next.bodyId=command.bodyId;
  characterMount(next);return next;
 }
 const item=accessoryItems.find(a=>a.accessoryId===command.accessoryId);if(!item)throw Error('Phụ kiện chưa được phát hành');
 if(command.operation==='unequip'){for(const a of next.accessories)if(a.accessoryId===item.accessoryId)a.visible=false;return next}
 if(command.operation!=='equip')throw Error('Thao tác phụ kiện không hợp lệ');
 // Use the supplied helper for both fit selection and exclusive category behaviour.
 const result=equipAccessory(resolveInventory(next).inventory,item,characterMount(next));
 next.accessories=accessoryItems.map(a=>({accessoryId:a.accessoryId,visible:result.some((v:any)=>(v.accessoryId||v.id)===a.accessoryId&&v.visible!==false)}));
 return next;
}
