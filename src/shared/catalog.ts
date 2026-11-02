import data from '../../public/game-data/catalog.json';
export type ActionBinding={clip:string;aliases?:string[];loop:boolean;rate:number};
export type Resource={id:string;type:string;rig:string;path?:string;baseCharacter?:string;source?:string;embedded?:string;slot?:string;actions?:Record<string,ActionBinding>};
export type Appearance={id:string;name:string;character:string;outfit?:string;accessories:string[];animationSet:string;rig:string;scale:number};
export type Catalog={format:string;version:number;defaults:{appearance:string;animationSet:string};rigs:{id:string;sourceRig:string;parts:string[];sockets:string[];channels?:string[];requiredChannels?:string[]}[];resources:Resource[];appearances:Appearance[]};
export function validateCatalog(c:any):Catalog{
 const fail=(s:string):never=>{throw Error('Catalog: '+s)};
 if(c?.format!=='darkin-game-catalog-v1'||c.version!==1||!Array.isArray(c.rigs)||!Array.isArray(c.resources)||!Array.isArray(c.appearances))fail('sai định dạng/version');
 const ids=new Set();for(const r of [...c.rigs,...c.resources,...c.appearances]){if(typeof r.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(r.id)||ids.has(r.id))fail('ID thiếu/trùng');ids.add(r.id)}
 for(const r of c.rigs)if(!Array.isArray(r.parts)||!r.parts.length||!Array.isArray(r.sockets)||typeof r.sourceRig!=='string')fail('rig');
 for(const r of c.resources){const rig=c.rigs.find((v:any)=>v.id===r.rig);if(!rig||!['character','outfit','accessory','animation'].includes(r.type))fail('loại/rig '+r.id);if(r.path&&(!/^[\w./-]+\.json$/.test(r.path)||r.path.includes('..')))fail('path '+r.id);if(!r.path&&!c.resources.some((v:any)=>v.id===r.source&&v.type==='character'&&v.rig===r.rig))fail('source '+r.id);if(r.path&&r.source)fail('Chỉ chọn path hoặc source '+r.id);if(r.baseCharacter&&!c.resources.some((b:any)=>b.id===r.baseCharacter&&b.type==='character'&&b.rig===r.rig))fail('baseCharacter '+r.id);if(r.slot&&!rig.sockets.includes(r.slot))fail('slot '+r.id);if(r.type==='animation'){if(!r.actions)fail('actions');for(const [a,b]of Object.entries(r.actions) as [string,ActionBinding][]){if(!a||typeof b.clip!=='string'||typeof b.loop!=='boolean'||!Number.isFinite(b.rate)||b.rate<=0||b.rate>8||b.aliases!==undefined&&(!Array.isArray(b.aliases)||!b.aliases.every(v=>typeof v==='string')))fail('binding '+a)}}}
 for(const a of c.appearances){if(!Array.isArray(a.accessories)||!Number.isFinite(a.scale)||a.scale<.1||a.scale>3)fail('appearance '+a.id);for(const [id,type] of [[a.character,'character'],[a.animationSet,'animation'],...(a.outfit?[[a.outfit,'outfit']]:[]),...a.accessories.map((v:string)=>[v,'accessory'])])if(!c.resources.some((r:any)=>r.id===id&&r.type===type&&r.rig===a.rig))fail('tài nguyên không tương thích '+id)}
 const a=c.appearances.find((a:any)=>a.id===c.defaults?.appearance);if(!a||a.animationSet!==c.defaults.animationSet)fail('defaults');return c;
}
export const gameCatalog=validateCatalog(data);
export const allowedAppearance=(id:unknown):id is string=>typeof id==='string'&&gameCatalog.appearances.some(a=>a.id===id);
