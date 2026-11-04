import type {Actor} from '../shared/world';
import type {CharacterVisual} from './visual';
import {PlaceholderCharacterVisual} from './visual';
import {assets,assetWarning,type LoadedVisual} from './assets';
import type {EquipmentState} from '../shared/equipment';
export class CutoutCharacterVisual implements CharacterVisual{
 portraitKey='';portraitCanvas:HTMLCanvasElement|null=null;
 portrait(){if(!this.loaded||!this.player)return null;if(this.portraitKey===this.loaded.key&&this.portraitCanvas)return{key:this.portraitKey,image:this.portraitCanvas};
  const temporary=document.createElement('canvas');temporary.width=temporary.height=320;const c=temporary.getContext('2d')!,fork=this.loaded.prototype.fork(),head=fork.rig.P.head.img,draw=c.drawImage.bind(c);let box:any=null;
  (c as any).drawImage=(...args:any[])=>{if(args[0]===head){const [x,y,w,h]=args.slice(-4),m=c.getTransform(),pts=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));box={x:Math.min(...pts.map(p=>p.x)),y:Math.min(...pts.map(p=>p.y)),w:Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x)),h:Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y))}};(draw as any)(...args)};
  fork.draw(c,160,300,1.8,{weapon:false});fork.dispose();const out=document.createElement('canvas');out.width=out.height=192;const target=out.getContext('2d')!;if(box){const side=Math.max(box.w,box.h)+8;target.drawImage(temporary,box.x+box.w/2-side/2,box.y+box.h/2-side/2,side,side,0,0,192,192)}this.portraitKey=this.loaded.key;this.portraitCanvas=out;return{key:this.portraitKey,image:out};
 }
 actor!:Actor;player:any=null;loaded:LoadedVisual|null=null;requested='';generation=0;disposed=false;lastAttack=-1;attacking=false;fallback=new PlaceholderCharacterVisual();
 async load(config:any={}){return this.setAppearance(config.appearanceId||assets.catalog.defaults.appearance,config.equipment)}
 async setAppearance(id:string,equipment?:EquipmentState){
  this.requested=assets.key(id,equipment);const generation=++this.generation;
  let candidate:LoadedVisual|null=null;
  try{const next=await assets.acquire(id,equipment);candidate=next;if(this.disposed||generation!==this.generation){assets.release(next);return}
   const player=next.prototype.fork(),old=this.player,oldLoaded=this.loaded;
   if(old){for(const key of ['name','time','face','pose','blend','hitFired','attachmentTime'])player[key]=structuredClone(old[key]);if(!player.spec.clips[player.name])throw Error('Clip đang phát không tồn tại trong rig mới')}
   else{this.attacking=false;this.lastAttack=this.actor?.attackSeq??0}
   this.player=player;this.loaded=next;candidate=null;old?.dispose();if(oldLoaded)assets.release(oldLoaded);
   if(next.warnings.length)assetWarning(next.warnings.join(' · '));
  }catch(e){if(candidate)assets.release(candidate);if(generation===this.generation&&!this.disposed)assetWarning('Lỗi ngoại hình '+id+': '+String(e)+(this.player?' · Giữ ngoại hình hợp lệ hiện tại.':' · Đang dùng hình tạm, chưa nạp được cutout.'))}
 }
 playAnimation(action:string){const b=this.loaded?.actions[action];if(b&&this.player)this.player.play(b.clip)}
 update(a:Actor,dt:number){this.actor=a;this.fallback.update(a,dt);if(a.appearanceId&&assets.key(a.appearanceId,a)!==this.requested)void this.setAppearance(a.appearanceId,a);if(!this.player||!this.loaded)return;
  if(Math.abs(Math.cos(a.dir))>.15)this.player.face=Math.cos(a.dir)<0?-1:1;
  if(a.hp<=0)return; // Demo has no death/hurt clips: retain real rig, no invented animation.
  const attack=a.attackSeq??0;
  if(attack!==this.lastAttack){this.lastAttack=attack;if(a.action==='attack'||a.cooldown>0){const b=this.loaded.actions.attack;this.player.play(b.clip,{restart:true});this.attacking=true}}
  const action=this.attacking?'attack':this.loaded.actions[a.action]?a.action:'idle';
  if(!this.attacking)this.playAnimation(action);
  const finished=this.player.update(dt*this.loaded.actions[action].rate,undefined,dt); // wing clock uses real seconds
  if(this.attacking&&finished){this.attacking=false;this.playAnimation(['walk','run'].includes(a.action)?a.action:'idle')}
 }
 draw(c:CanvasRenderingContext2D){if(!this.player||!this.loaded){this.fallback.draw(c);return}const a=this.actor;c.save();if(a.hp<=0)c.globalAlpha=.35;else if(a.action==='hurt')c.globalAlpha=.65;
  this.player.draw(c,a.x,a.y,this.loaded.appearance.scale,{weapon:true});c.restore();
  // UI only; no old body, weapon, shadow or temporary attack geometry is drawn.
  c.save();const y=a.y-160*this.loaded.appearance.scale-10;c.textAlign='center';c.font='600 12px system-ui';c.strokeStyle='#12201d';c.lineWidth=3;c.strokeText(a.name,a.x,y);c.fillStyle=a.color;c.fillText(a.name,a.x,y);c.fillStyle='#101923';c.fillRect(a.x-23,y+6,46,5);c.fillStyle='#a5ca9c';c.fillRect(a.x-22,y+7,44*a.hp/a.maxHp,3);c.restore();
 }
 destroy(){this.disposed=true;this.generation++;this.player?.dispose();if(this.loaded)assets.release(this.loaded);this.player=null;this.loaded=null;this.fallback.destroy()}
 debug(){const nc=(window as any).NC;return{type:'cutout',key:this.loaded?.key,headId:this.player?.spec.headId,bodyId:this.player?.spec.bodyId,mountSignatures:this.player?.spec.mountSignatures,attachments:this.player?(nc.ITEMS[this.player.equip.top]?.attachments||[]).map((a:any)=>({accessoryId:a.accessoryId||a.id,visible:a.visible,socket:a.socket,layer:a.layer,w:a.w,h:a.h,scale:a.scale,x:a.x,y:a.y,rotation:a.rotation,anchor:a.anchor,loaded:a.wingRig?a.wingRig.spriteOrder.every((id:string)=>!!nc.SPR[a.wingRig.sprites[id].sprite]?.img):!!nc.SPR[a.sprite]?.img,matrix:nc.attachmentMatrix(this.player.equip,{...this.player.pose,face:this.player.face},a,this.actor?.x||0,this.actor?.y||0,this.loaded?.appearance.scale)})):[],appearance:this.loaded?.appearance.id,scale:this.loaded?.appearance.scale,clip:this.player?.name,time:this.player?.time,attachmentTime:this.player?.attachmentTime,face:this.player?.face,foot:this.actor?{x:this.actor.x,y:this.actor.y}:null}}
}
