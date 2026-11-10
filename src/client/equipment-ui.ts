import {changeEquipment,type CosmeticCommand,type EquipmentState} from '../shared/equipment';
import {assets,type LoadedVisual} from './assets';
import type {GameSession} from './session';
export class EquipmentUI{
 note=document.createElement('p');generation=0;lease:LoadedVisual|null=null;last='';
 draft:{session:GameSession;appearanceId:string;state:EquipmentState}|null=null;
 constructor(private session:()=>GameSession|null){this.note.setAttribute('role','status')}
 async apply(command:CosmeticCommand){const session=this.session(),actor=session?.snapshot.actors.find(a=>a.id===session.id);if(!session||!actor)return;
  const generation=++this.generation;this.note.textContent='Đang kiểm tra cấu hình và nạp ảnh…';
  try{const prior=this.draft?.session===session&&this.draft.appearanceId===actor.appearanceId?this.draft.state:actor;
   const next=changeEquipment(prior,command);this.draft={session,appearanceId:actor.appearanceId,state:next};const loaded=await assets.acquire(actor.appearanceId,next);
   if(generation!==this.generation||this.session()!==session){assets.release(loaded);return}
   const selected=loaded.prototype.spec.attachments.find((a:any)=>(a.accessoryId||a.id)===command.accessoryId);
   if(command.operation==='equip'&&(!selected||selected.visible===false)){assets.release(loaded);throw Error(loaded.warnings.join(' · ')||'Phụ kiện không có cấu hình hiển thị phù hợp')}
   if(this.lease)assets.release(this.lease);this.lease=loaded;
   session.cosmetic({operation:'set',headId:next.headId,bodyId:next.bodyId,accessoryIds:next.accessories.filter(a=>a.visible).map(a=>a.accessoryId)});this.note.textContent=loaded.warnings.length?loaded.warnings.join(' · '):'Đã áp dụng trang bị lên nhân vật.';
  }catch(e){if(generation===this.generation){this.draft=null;this.note.textContent=String(e)+' · Giữ phụ kiện đang dùng.';this.last=''}}
 }
 update(committedKey?:string){const s=this.session(),a=s?.snapshot.actors.find(a=>a.id===s.id);if(!a)return;if(this.lease&&this.lease.key===committedKey){assets.release(this.lease);this.lease=null}
  const key=assets.key(a.appearanceId,a);if(this.draft&&assets.key(a.appearanceId,this.draft.state)===key)this.draft=null;if(key===this.last)return;this.last=key;
 }
 reset(){this.generation++;if(this.lease)assets.release(this.lease);this.lease=null;this.draft=null;this.last='';this.note.textContent=''}
}
