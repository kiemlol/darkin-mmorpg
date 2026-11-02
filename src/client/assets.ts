import {CutoutPlayer} from '../../public/game-data/cutout-runtime/player.mjs';
import {validateAttachments} from '../../public/game-data/cutout-runtime/attachments.mjs';
import {validateCatalog,type Catalog,type Resource,type Appearance,type ActionBinding} from '../shared/catalog';
import {adaptStudio,studioSpec} from './studio-adapter';
const RuntimePlayer:any=CutoutPlayer;
export type LoadedVisual={prototype:any;appearance:Appearance;actions:Record<string,ActionBinding>};
const freeze=(v:any):any=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v)}return v};
export class AssetRegistry{
 catalog!:Catalog;data=new Map<string,Promise<any>>();visuals=new Map<string,Promise<LoadedVisual>>();
 async init(){const r=await fetch('/game-data/catalog.json');if(!r.ok)throw Error('Không tải được catalog');this.catalog=validateCatalog(await r.json());return this}
 resource(id:string,type?:string){const r=this.catalog.resources.find(r=>r.id===id&&(!type||r.type===type));if(!r)throw Error('Không tìm thấy tài nguyên '+id);return r}
 async read(r:Resource):Promise<any>{
  if(r.source){const raw=await this.read(this.resource(r.source));const source=raw.project||raw;return r.embedded==='clips'&&!source.clips&&source.clip?{[source.clip.name]:source.clip}:r.embedded?source[r.embedded]:source}
  if(!r.path)throw Error('Thiếu path '+r.id);
  if(!this.data.has(r.path))this.data.set(r.path,(async()=>{const res=await fetch('/game-data/'+r.path);if(!res.ok)throw Error('Thiếu '+r.path);return freeze(await res.json())})().catch(e=>{this.data.delete(r.path!);throw e}));
  return this.data.get(r.path)!;
 }
 async load(id:string):Promise<LoadedVisual>{
  if(!this.visuals.has(id))this.visuals.set(id,this.build(id).catch(e=>{this.visuals.delete(id);throw e}));return this.visuals.get(id)!;
 }
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
 private async build(id:string):Promise<LoadedVisual>{
  const a=this.catalog.appearances.find(a=>a.id===id);if(!a)throw Error('Ngoại hình chưa đăng ký: '+id);
  const rig=this.catalog.rigs.find(r=>r.id===a.rig)!;const character=this.resource(a.character,'character'),animation=this.resource(a.animationSet,'animation');
  const urls=new Map<string,string>();let raw=this.qualified(await this.read(character),character,urls);
  // Studio project/export may refer to a registered complete base character, without editing its original JSON.
  const baseId=(character as any).baseCharacter;const base=baseId?this.qualified(await this.read(this.resource(baseId,'character')),this.resource(baseId),urls):undefined;raw=studioSpec(raw,base);
  if(a.outfit){const outfit=this.resource(a.outfit,'outfit');if(outfit.source!==a.character||outfit.path){const o=this.qualified(await this.read(outfit),outfit,urls);raw.parts=structuredClone(o.parts||o)}}
  if(animation.source!==a.character||animation.path){const d=await this.read(animation);const p=d.project||d;raw.clips={...(raw.clips||base?.clips),...(p.clips||(p.clip?{[p.clip.name]:p.clip}:p))}}
  const combined=adaptStudio(raw,rig.sourceRig,animation.actions!,base);
  for(const id of a.accessories){const r=this.resource(id,'accessory');if(r.source===a.character&&r.embedded==='weapon')continue;const d=this.qualified(await this.read(r),r,urls);if(r.embedded==='weapon'||d.spriteData){combined.spec.weapon=structuredClone(d);continue}const items=Array.isArray(d)?d:d.attachments||[d];for(const item of items){if(!rig.sockets.includes(item.socket))throw Error('Slot không tương thích '+item.socket)}combined.spec.attachments=[...(combined.spec.attachments||[]),...structuredClone(items)]}
  validateAttachments(combined.spec.attachments);
  const channels=(rig as any).channels as string[]|undefined;
  if(channels)for(const clip of Object.values(combined.spec.clips) as any[])for(const k of clip.keys)for(const channel of Object.keys(k.P))if(!channels.includes(channel))throw Error('Kênh animation không tương thích rig: '+channel);
  for(const clip of Object.values(combined.spec.clips) as any[])for(const key of clip.keys)for(const channel of (rig as any).requiredChannels||[])if(!Object.hasOwn(key.P,channel))throw Error('Thiếu kênh bắt buộc '+channel);
  const prototype=await RuntimePlayer.load(combined.spec,new URL('/game-data/'+character.path!.slice(0,character.path!.lastIndexOf('/')+1),location.href),{resolveSource:(src:string)=>src.startsWith('data:')?src:urls.get(src)||(()=>{throw Error('Ảnh chưa đăng ký '+src)})()});
  freeze(prototype.spec);
  return{prototype,appearance:a,actions:combined.actions};
 }
}
export const assets=new AssetRegistry();
export function assetWarning(message:string){const el=document.getElementById('asset-status');if(el){el.hidden=false;el.textContent=message}console.warn(message)}
