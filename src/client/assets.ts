import {CutoutPlayer} from '../../public/game-data/cutout-runtime/player.mjs';
import {validateAttachments} from '../../public/game-data/cutout-runtime/attachments.mjs';
import {validateCatalog,type Catalog,type Resource,type Appearance,type ActionBinding} from '../shared/catalog';
import {adaptStudio,studioSpec,studioProject} from './studio-adapter';
import {defaultEquipment,resolveInventory,mountCatalog,type EquipmentState} from '../shared/equipment';
const RuntimePlayer:any=CutoutPlayer;
export type LoadedVisual={prototype:any;appearance:Appearance;actions:Record<string,ActionBinding>;key:string;warnings:string[];refs:number;pinned:boolean};
const freeze=(v:any):any=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v)}return v};
export class AssetRegistry{
 catalog!:Catalog;data=new Map<string,Promise<any>>();visuals=new Map<string,Promise<LoadedVisual>>();
 async init(){const r=await fetch('/game-data/catalog.json',{cache:'no-cache'});if(!r.ok)throw Error('Không tải được catalog');this.catalog=validateCatalog(await r.json());return this}
 resource(id:string,type?:string){const r=this.catalog.resources.find(r=>r.id===id&&(!type||r.type===type));if(!r)throw Error('Không tìm thấy tài nguyên '+id);return r}
 async read(r:Resource):Promise<any>{
  if(r.source){const raw=await this.read(this.resource(r.source));const source=raw.project||raw;return r.embedded==='clips'&&!source.clips&&source.clip?{[source.clip.name]:source.clip}:r.embedded?source[r.embedded]:source}
  if(!r.path)throw Error('Thiếu path '+r.id);
  if(!this.data.has(r.path))this.data.set(r.path,(async()=>{const res=await fetch('/game-data/'+r.path);if(!res.ok)throw Error('Thiếu '+r.path);return freeze(await res.json())})().catch(e=>{this.data.delete(r.path!);throw e}));
  return this.data.get(r.path)!;
 }
 key(id:string,state:EquipmentState=defaultEquipment(id)){const base:any[]=[id,state.headId,state.bodyId,state.accessories];if((state as any).toolId==='mining_hammer')base.push('mining_hammer');return JSON.stringify(base)}
 async load(id:string,state:EquipmentState=defaultEquipment(id)):Promise<LoadedVisual>{
  const key=this.key(id,state);if(!this.visuals.has(key))this.visuals.set(key,this.build(id,state,key).catch(e=>{this.visuals.delete(key);throw e}));return this.visuals.get(key)!;
 }
 async acquire(id:string,state?:EquipmentState):Promise<LoadedVisual>{
  const loaded=await this.load(id,state);
  // Another visual can release the last reference in the same render frame,
  // while this asynchronous acquisition is still waiting on the cached promise.
  // Never hand a disposed prototype to a new actor; rebuild before taking a ref.
  if(loaded.prototype.disposed)return this.acquire(id,state);
  loaded.refs++;return loaded;
 }
 release(loaded:LoadedVisual){loaded.refs=Math.max(0,loaded.refs-1);if(!loaded.refs&&!loaded.pinned){this.visuals.delete(loaded.key);loaded.prototype.dispose()}}
 async readBundle(path:string){return this.read({id:path,type:'character',rig:'',path})}
 private origin(r:Resource):string{return r.source?this.origin(this.resource(r.source)):r.path!}
 private qualified(data:any,r:Resource,urls:Map<string,string>):any{
  const copy=structuredClone(data),origin=this.origin(r);
  const visit=(v:any)=>{if(!v||typeof v!=='object')return;for(const [key,value]of Object.entries(v)){
   if(key==='src'&&typeof value==='string'&&!value.startsWith('data:')){
    if(!/^assets\/[\w./-]+$/.test(value)||value.includes('..'))throw Error('Đường ảnh không hợp lệ '+value);
    const alias='assets/catalog_'+r.id+'/'+value.slice(7);urls.set(alias,new URL('/game-data/'+origin.slice(0,origin.lastIndexOf('/')+1)+value,location.href).href);v[key]=alias;
   }else if(typeof value==='object')visit(value);
  }};visit(copy);return copy;
 }
 private async build(id:string,state:EquipmentState,key:string):Promise<LoadedVisual>{
  const a=this.catalog.appearances.find(a=>a.id===id);if(!a)throw Error('Ngoại hình chưa đăng ký: '+id);
  const rig=this.catalog.rigs.find(r=>r.id===a.rig)!;const character=this.resource(a.character,'character'),animation=this.resource(a.animationSet,'animation');
  const urls=new Map<string,string>();let raw=this.qualified(await this.read(character),character,urls);
  // Studio project/export may refer to a registered complete base character, without editing its original JSON.
  const baseId=(character as any).baseCharacter;const base=baseId?this.qualified(await this.read(this.resource(baseId,'character')),this.resource(baseId),urls):undefined;raw=studioSpec(raw,base);
  if(character.studioBundle){
   if(character.animationSourceRig&&character.animationSourceRig!==raw.rig)throw Error('Rig animation nền không tương thích');
   const project=studioProject(await this.readBundle(character.studioBundle));
   // Both released rigs explicitly use the same six-part angle channel convention.
   // Keep all existing clips and the additional authored clip, without remapping joints.
   raw={...raw,...structuredClone(project),format:'cutout-character-v1',clips:{...raw.clips,[project.clip.name]:structuredClone(project.clip)}};
   const head=mountCatalog.characters.find(c=>c.headId===state.headId),body=mountCatalog.characters.find(c=>c.bodyId===state.bodyId);
   if(!head||!body)throw Error('Đầu/thân chưa được phát hành');
   const headProject=studioProject(await this.readBundle(head.path)),bodyProject=studioProject(await this.readBundle(body.path));
   raw.parts={...structuredClone(bodyProject.parts),head:structuredClone(headProject.parts.head)};
   raw.headId=headProject.headId;raw.bodyId=bodyProject.bodyId;
   raw.mountSignatures={head:headProject.mountSignatures.head,body:bodyProject.mountSignatures.body};
   raw.mountState={head:structuredClone(headProject.mountState.head),body:structuredClone(bodyProject.mountState.body)};
  }
  if(a.outfit){const outfit=this.resource(a.outfit,'outfit');if(outfit.source!==a.character||outfit.path){const o=this.qualified(await this.read(outfit),outfit,urls);raw.parts=structuredClone(o.parts||o)}}
  if(animation.source!==a.character||animation.path){const d=await this.read(animation);const p=d.project||d;raw.clips={...(raw.clips||base?.clips),...(p.clips||(p.clip?{[p.clip.name]:p.clip}:p))}}
  const actions={...animation.actions};
  // A tool in the authored character inventory is displayed by the gameplay tool
  // state. Keep its exact geometry; return to the normal combat weapon elsewhere.
  const toolAttachments=new Set(this.catalog.tools?.map(t=>t.attachmentId)||[]);
  raw.attachments=(raw.attachments||[]).map((v:any)=>toolAttachments.has(v.accessoryId)?{...v,visible:false}:v);
  if((state as any).toolId==='mining_hammer'){
   const tool=this.catalog.tools?.find(t=>t.id==='mining_hammer');if(!tool||!tool.compatibleRigs.includes(a.rig)||tool.channelConvention!=='nightcamp-six-part-angles-v1')throw Error('Chưa có ánh xạ rig cho công cụ đào');
   const mining=await this.read(this.resource(tool.resourceId,'animation'));if(mining.format!=='nightcamp-cutout-v1'||mining.clip.name!==tool.clipId||mining.rig!=='traveler')throw Error('Clip đào Studio không hợp lệ');
   // Explicit retargeting: both published rigs share the six-part local angle channels.
   // Preserve the current parts/joints. Only the authored pose channel values transfer.
   for(const key of mining.clip.keys)for(const channel of Object.keys(key.P))if(!rig.channels?.includes(channel))throw Error('Kênh đào không tương thích '+channel);
   const toolProject=tool.attachmentResourceId?studioProject(await this.read(this.resource(tool.attachmentResourceId))):mining;
   const hammer=toolProject.attachments.find((v:any)=>v.accessoryId===tool.attachmentId&&v.visible);if(!hammer||hammer.socket!=='handF'||hammer.mountProfiles?.length)throw Error('Búa không có cấu hình socket tương thích');
   raw.clips={...raw.clips,[tool.clipId]:{...structuredClone(mining.clip),kind:'loop'}};actions.mining={clip:tool.clipId,loop:true,rate:1};
   raw.attachments=[...(raw.attachments||[]).filter((v:any)=>v.accessoryId!==tool.attachmentId).map((v:any)=>v.category==='weapon'||v.socket?.startsWith('hand')?{...v,visible:false}:v),structuredClone(hammer)];
  }
  const combined=adaptStudio(raw,rig.sourceRig,actions,base);
  const resolved=resolveInventory(state,combined.spec.attachments||[],{headId:raw.headId||state.headId,bodyId:raw.bodyId||state.bodyId,parts:raw.parts,mountSignatures:raw.mountSignatures});combined.spec.attachments=resolved.inventory;
  for(const id of a.accessories){const r=this.resource(id,'accessory');if(r.source===a.character&&r.embedded==='weapon')continue;const d=this.qualified(await this.read(r),r,urls);if(r.embedded==='weapon'||d.spriteData){combined.spec.weapon=structuredClone(d);continue}const items=Array.isArray(d)?d:d.attachments||[d];for(const item of items){if(!rig.sockets.includes(item.socket))throw Error('Slot không tương thích '+item.socket)}combined.spec.attachments=[...(combined.spec.attachments||[]),...structuredClone(items)]}
  validateAttachments(combined.spec.attachments);
  const channels=(rig as any).channels as string[]|undefined;
  if(channels)for(const clip of Object.values(combined.spec.clips) as any[])for(const k of clip.keys)for(const channel of Object.keys(k.P))if(!channels.includes(channel))throw Error('Kênh animation không tương thích rig: '+channel);
  for(const clip of Object.values(combined.spec.clips) as any[])for(const key of clip.keys)for(const channel of (rig as any).requiredChannels||[])if(!Object.hasOwn(key.P,channel))throw Error('Thiếu kênh bắt buộc '+channel);
  const prototype=await RuntimePlayer.load(combined.spec,new URL('/game-data/'+character.path!.slice(0,character.path!.lastIndexOf('/')+1),location.href),{resolveSource:(src:string)=>src.startsWith('data:')?src:urls.get(src)||(()=>{throw Error('Ảnh chưa đăng ký '+src)})()});
  freeze(prototype.spec);
  return{prototype,appearance:a,actions:combined.actions,key,warnings:resolved.warnings,refs:0,pinned:id===this.catalog.defaults.appearance&&key===this.key(id)};
 }
}
export const assets=new AssetRegistry();
export function assetWarning(message:string){const el=document.getElementById('asset-status');if(el){el.hidden=false;el.textContent=message}console.warn(message)}
