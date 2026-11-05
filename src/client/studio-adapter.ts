import {validate,PARTS} from '../../public/game-data/cutout-runtime/model.mjs';
import type {ActionBinding} from '../shared/catalog';
import {validAnimationId} from '../../public/game-data/cutout-runtime/animation-identity.mjs';
// Studio publishes both a complete export wrapper and a single-clip project.
// Unwrap without renaming or rewriting the source format.
export function studioProject(data:any){
 const p=data?.format==='nightcamp-cutout-export-v1'?data.project:data;
 if(p?.format!=='nightcamp-cutout-v1')throw Error('Không hỗ trợ định dạng project Studio');
 return validate(p);
}
export function studioSpec(data:any,base?:any){
 let spec:any;
 if(data?.format==='cutout-character-v1')spec=structuredClone(data);
 else if(['nightcamp-cutout-v1','nightcamp-cutout-export-v1'].includes(data?.format)){
  const p=studioProject(data);
  if(!base)throw Error('Project Studio có một clip; cần baseCharacter tương thích cung cấp các clip còn lại');
  if(p.rig!==base.rig)throw Error('Rig project không tương thích baseCharacter');
  spec={...structuredClone(base),rig:p.rig,parts:structuredClone(p.parts),headId:p.headId,bodyId:p.bodyId,mountSignatures:structuredClone(p.mountSignatures),mountState:structuredClone(p.mountState),attachments:structuredClone(p.attachments||[])};
  spec.clips={...spec.clips,...structuredClone(p.animationClips||{}),[p.clip.name]:structuredClone(p.clip)};
  // Same explicit compatible-base pose completion as the demo import workflow.
  for(const key of spec.clips[p.clip.name].keys)key.P={...base.clips.idle.keys[0].P,...key.P};
 }else throw Error('Không hỗ trợ định dạng nhân vật');
 return spec;
}
export function adaptStudio(data:any,rig:string,bindings:Record<string,ActionBinding>,base?:any,identities:Record<string,string>={}){
 const spec=studioSpec(data,base);
 if(spec.rig!==rig)throw Error('Rig nguồn không khớp catalog');
 for(const clip of Object.values(spec.clips||{}))validate({format:'nightcamp-cutout-v1',rig:spec.rig,parts:spec.parts,attachments:spec.attachments,clip});
 for(const part of PARTS)if(!spec.parts[part])throw Error('Thiếu phần '+part);
 if(!spec.weapon||!spec.weapon.spriteData)throw Error('Thiếu weapon.spriteData độc lập của bộ phát');
 const actions:Record<string,ActionBinding>={};
 for(const [action,b]of Object.entries(bindings)){
  const key=(b.animationId&&Object.keys(spec.clips).find(k=>spec.clips[k].id===b.animationId))||[b.clip,...b.aliases||[]].find(k=>spec.clips[k])||Object.keys(spec.clips).find(k=>[b.clip,...b.aliases||[]].includes(spec.clips[k].name));
  if(!key)throw Error('Thiếu clip cho hành động '+action);
  const id=spec.clips[key].id||identities[key]||b.animationId;if(!validAnimationId(id))throw Error('Chưa đăng ký animationId cố định cho '+key);
  if(b.animationId&&id!==b.animationId)throw Error('animationId không khớp hành động '+action);
  spec.clips[key].id=id;actions[action]={...b,clip:key,animationId:id};
  const clip=spec.clips[key];if(!b.loop&&['walk','loop'].includes(clip.kind)||b.loop&&!['walk','loop'].includes(clip.kind))throw Error('Cơ chế lặp không khớp '+action);
 }
 for(const a of ['idle','walk','run','attack'])if(!actions[a])throw Error('Thiếu action '+a);
 const installed=new Map<string,string>();for(const [key,clip]of Object.entries(spec.clips) as [string,any][]){clip.id||=identities[key];if(!validAnimationId(clip.id))throw Error('Chưa đăng ký animationId cố định cho '+key);const content=JSON.stringify({...clip,name:undefined}),prior=installed.get(clip.id);if(prior&&prior!==content)throw Error('animationId trùng cho các clip khác nhau: '+clip.id);installed.set(clip.id,content)}
 // CutoutPlayer's legacy mandatory slots are aliases in the adapter only; source is untouched.
 for(const a of ['idle','walk','run','attack'])if(!spec.clips[a])spec.clips[a]=spec.clips[actions[a].clip];
 return {spec,actions};
}
