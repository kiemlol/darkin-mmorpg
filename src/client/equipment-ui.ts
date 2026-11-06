import {accessoryItems,mountCatalog,changeEquipment,resolveInventory,type CosmeticCommand,type EquipmentState} from '../shared/equipment';
import {assets,type LoadedVisual} from './assets';
import type {GameSession} from './session';
export class EquipmentUI{
 root=document.createElement('fieldset');head=document.createElement('select');body=document.createElement('select');item=document.createElement('select');note=document.createElement('p');inventory=document.createElement('p');generation=0;lease:LoadedVisual|null=null;last='';
 draft:{session:GameSession;appearanceId:string;state:EquipmentState}|null=null;
 constructor(private session:()=>GameSession|null){
  const legend=document.createElement('legend');legend.textContent='Thử phụ kiện Studio';this.root.id='equipment-test';this.root.append(legend);
  const add=(title:string,select:HTMLSelectElement)=>{const label=document.createElement('label');label.textContent=title;label.append(select);this.root.append(label)};
  for(const c of mountCatalog.characters){this.head.add(new Option(c.name,c.headId));this.body.add(new Option(c.name,c.bodyId))}
  for(const a of accessoryItems)this.item.add(new Option(a.name,a.accessoryId));
  this.head.id='equipment-head';this.body.id='equipment-body';this.item.id='equipment-item';this.note.id='equipment-note';this.note.setAttribute('role','status');this.inventory.id='equipment-inventory';
  add('Đầu',this.head);add('Thân',this.body);add('Phụ kiện',this.item);
  for(const [id,text,operation]of [['equipment-equip','Đeo','equip'],['equipment-remove','Tháo','unequip']] as const){const button=document.createElement('button');button.id=id;button.textContent=text;button.onclick=()=>void this.apply({operation,accessoryId:this.item.value});this.root.append(button)}
  this.head.onchange=()=>void this.apply({operation:'mount',headId:this.head.value});this.body.onchange=()=>void this.apply({operation:'mount',bodyId:this.body.value});
  this.root.append(this.inventory,this.note);document.getElementById('pause')!.insertBefore(this.root,document.getElementById('resume'));
 }
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
  const key=assets.key(a.appearanceId,a);if(this.draft&&assets.key(a.appearanceId,this.draft.state)===key)this.draft=null;if(key===this.last)return;this.last=key;this.head.value=a.headId;this.body.value=a.bodyId;
  const resolved=resolveInventory(a);this.inventory.textContent=accessoryItems.map(item=>{const selected=a.accessories.find(i=>i.accessoryId===item.accessoryId)?.visible,visible=resolved.inventory.some(i=>(i.accessoryId||i.id)===item.accessoryId&&i.visible);return item.name+': '+(visible?'đang đeo':selected?'ẩn — thiếu cấu hình':'đã tháo')}).join(' · ');
 }
 reset(){this.generation++;if(this.lease)assets.release(this.lease);this.lease=null;this.draft=null;this.last='';this.note.textContent=''}
}
