import {validate,PARTS} from '../../public/game-data/cutout-runtime/model.mjs';
import type {ActionBinding} from '../shared/catalog';
export function studioSpec(data:any,base?:any){
 let spec:any;
 if(data?.format==='cutout-character-v1')spec=structuredClone(data);
 else if(['nightcamp-cutout-v1','nightcamp-cutout-export-v1'].includes(data?.format)){
  const p=validate(data.format==='nightcamp-cutout-export-v1'?data.project:data);
  if(!base)throw Error('Project Studio có một clip; cần baseCharacter tương thích cung cấp các clip còn lại');
  if(p.rig!==base.rig)throw Error('Rig project không tương thích baseCharacter');
  spec={...structuredClone(base),rig:p.rig,parts:structuredClone(p.parts),headId:p.headId,bodyId:p.bodyId,mountSignatures:structuredClone(p.mountSignatures),mountState:structuredClone(p.mountState),attachments:structuredClone(p.attachments||[])};
  spec.clips[p.clip.name]=structuredClone(p.clip);
  // Same explicit compatible-base pose completion as the demo import workflow.
  for(const key of spec.clips[p.clip.name].keys)key.P={...base.clips.idle.keys[0].P,...key.P};
 }else throw Error('Không hỗ trợ định dạng nhân vật');
 return spec;
}
export function adaptStudio(data:any,rig:string,bindings:Record<string,ActionBinding>,base?:any){
 const spec=studioSpec(data,base);
 if(spec.rig!==rig)throw Error('Rig nguồn không khớp catalog');
 for(const clip of Object.values(spec.clips||{}))validate({format:'nightcamp-cutout-v1',rig:spec.rig,parts:spec.parts,attachments:spec.attachments,clip});
 for(const part of PARTS)if(!spec.parts[part])throw Error('Thiếu phần '+part);
 if(!spec.weapon||!spec.weapon.spriteData)throw Error('Thiếu weapon.spriteData độc lập của bộ phát');
 const actions:Record<string,ActionBinding>={};
 for(const [action,b]of Object.entries(bindings)){
  const key=[b.clip,...b.aliases||[]].find(k=>spec.clips[k])||Object.keys(spec.clips).find(k=>[b.clip,...b.aliases||[]].includes(spec.clips[k].name));
  if(!key)throw Error('Thiếu clip cho hành động '+action);
  actions[action]={...b,clip:key};
  const clip=spec.clips[key];if(!b.loop&&['walk','loop'].includes(clip.kind)||b.loop&&!['walk','loop'].includes(clip.kind))throw Error('Cơ chế lặp không khớp '+action);
 }
 for(const a of ['idle','walk','run','attack'])if(!actions[a])throw Error('Thiếu action '+a);
 // CutoutPlayer's legacy mandatory slots are aliases in the adapter only; source is untouched.
 for(const a of ['idle','walk','run','attack'])if(!spec.clips[a])spec.clips[a]=spec.clips[actions[a].clip];
 return {spec,actions};
}
