import {gameCatalog,allowedAppearance} from './catalog';
import {defaultEquipment,characterMount,accessoryItems,type EquipmentState} from './equipment';
import {starterInventory,validInventory,ownsItem,type Inventory} from './inventory';

export type CharacterProfile=EquipmentState&{appearanceId:string;inventory:Inventory;potentialPoints:number};
export function normalizeCharacterProfile(raw:any){
 const warnings:string[]=[];let migrated=false;
 if(raw?.inventory!==undefined&&!validInventory(raw.inventory))throw Error('Dữ liệu túi đồ không hợp lệ');
 const inventory:Inventory=raw?.inventory?structuredClone(raw.inventory):starterInventory();if(!raw?.inventory)migrated=true;
 const stored=raw?.equipment;const appearanceId=allowedAppearance(stored?.appearanceId)?stored.appearanceId:gameCatalog.defaults.appearance;
 if(stored?.appearanceId!==undefined&&!allowedAppearance(stored.appearanceId)){warnings.push('Ngoại hình lưu chưa được phát hành; dùng mặc định.');migrated=true}
 let equipment=defaultEquipment(appearanceId);
 if(stored){try{characterMount(stored);if(!Array.isArray(stored.accessories)||stored.accessories.length>accessoryItems.length||new Set(stored.accessories.map((a:any)=>a.accessoryId)).size!==stored.accessories.length||stored.accessories.some((a:any)=>typeof a.visible!=='boolean'||!accessoryItems.some(i=>i.accessoryId===a.accessoryId)))throw Error('Phụ kiện chưa được phát hành');equipment={headId:stored.headId,bodyId:stored.bodyId,accessories:accessoryItems.map(item=>({accessoryId:item.accessoryId,visible:stored.accessories.find((a:any)=>a.accessoryId===item.accessoryId)?.visible??false}))}}catch{warnings.push('Trang bị lưu không hợp lệ; dùng ngoại hình mặc định.');migrated=true}}else migrated=true;
 equipment.accessories=equipment.accessories.map(a=>a.visible&&!ownsItem(inventory,a.accessoryId)?{...a,visible:false}:a);
 const potentialPoints=Number.isSafeInteger(raw?.potentialPoints)&&raw.potentialPoints>=0?raw.potentialPoints:0;if(raw?.potentialPoints!==potentialPoints){migrated=true;if(raw?.potentialPoints!==undefined)warnings.push('Điểm tiềm năng không hợp lệ; dùng 0.')} 
 return{state:{...equipment,appearanceId,inventory,potentialPoints} as CharacterProfile,warnings,migrated};
}
export function profileRecord(a:CharacterProfile){return{inventory:structuredClone(a.inventory),potentialPoints:a.potentialPoints,equipment:{appearanceId:a.appearanceId,headId:a.headId,bodyId:a.bodyId,accessories:structuredClone(a.accessories)}}}
