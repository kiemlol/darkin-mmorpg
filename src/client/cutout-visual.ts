import {combatWeapon} from '../shared/weapons';
import type {Actor} from '../shared/world';
import type {CharacterVisual} from './visual';
import {PlaceholderCharacterVisual} from './visual';
import {assets,assetWarning,type LoadedVisual} from './assets';
import type {EquipmentState} from '../shared/equipment';
import {SwordFlightVisual} from './sword-flight-visual';
export class CutoutCharacterVisual implements CharacterVisual{
 flight=new SwordFlightVisual();
 previewToken=-1;previewAge=0;
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
   if(old){for(const key of ['time','face','pose','blend','hitFired','attachmentTime'])player[key]=structuredClone(old[key]);const key=Object.keys(player.spec.clips).find(key=>player.spec.clips[key].id===old.animationId);if(key)player.name=key;else player.play(next.actions[this.actor?.action]?.animationId||next.actions.idle.animationId,{restart:true})}
   else{this.attacking=false;this.lastAttack=this.actor?.attackSeq??0}
   this.player=player;this.loaded=next;candidate=null;old?.dispose();if(oldLoaded)assets.release(oldLoaded);
   if(next.warnings.length)assetWarning(next.warnings.join(' · '));
  }catch(e){if(candidate)assets.release(candidate);if(generation===this.generation&&!this.disposed)assetWarning('Lỗi ngoại hình '+id+': '+String(e)+(this.player?' · Giữ ngoại hình hợp lệ hiện tại.':' · Đang dùng hình tạm, chưa nạp được cutout.'))}
 }
 skillAnimation:{id:string;token:string;remaining:number;rate:number;face:1|-1}|null=null;
 cancelSkillAnimation(token:string){if(this.skillAnimation?.token===token)this.skillAnimation=null}
 castAnimation(reference:string,token:string,direction:number){
  if(!this.player||!this.loaded)return false;
  const binding=this.loaded.actions[reference],entry=Object.entries(this.player.spec.clips).find(([key,clip]:[string,any])=>key===reference||clip.name===reference),id=binding?.animationId||(entry?.[1] as any)?.id;
  if(!id){assetWarning('Skill thiếu clip nhân vật: '+reference);return false}
  const clip=Object.values(this.player.spec.clips).find((c:any)=>c.id===id) as any;
  if(!clip){assetWarning('Skill thiếu clip nhân vật: '+reference);return false}
  this.player.play(id,{restart:true});this.attacking=false;this.lastAttack=this.actor?.attackSeq??0;
  this.skillAnimation={id,token,remaining:clip.dur/(binding?.rate||1),rate:binding?.rate||1,face:Math.cos(direction)<0?-1:1};return true;
 }
 missingAnimations=new Set<string>();
 playAnimation(action:string,restart=false){const b=this.loaded?.actions[action];if(!this.player||!this.loaded)return false;try{if(!b?.animationId)throw Error('Chưa đăng ký animationId cho '+action);this.player.play(b.animationId,{restart});return true}catch(e){if(!this.missingAnimations.has(action)){this.missingAnimations.add(action);assetWarning(String(e)+' · Dùng idle.')}this.player.play(this.loaded.actions.idle.animationId);return false}}
 update(a:Actor,dt:number){this.actor=a;this.fallback.update(a,dt);if(a.appearanceId&&assets.key(a.appearanceId,a)!==this.requested)void this.setAppearance(a.appearanceId,a);if(!this.player||!this.loaded)return;
  this.flight.idleAnimationId=this.loaded.actions.idle.animationId!;this.flight.update(a,dt);
  if(Math.abs(Math.cos(a.dir))>.15)this.player.face=Math.cos(a.dir)<0?-1:1;
  if(a.hp<=0){this.skillAnimation=null;return;} // Demo has no death/hurt clips: retain real rig, no invented animation.
  if(this.skillAnimation){const s=this.skillAnimation;if(!Object.values(this.player.spec.clips).some((c:any)=>c.id===s.id)){assetWarning('Skill thiếu clip sau đổi ngoại hình: '+s.id);this.skillAnimation=null}else if(a.action==='hurt'||a.swordFlight)this.skillAnimation=null;else{this.player.face=s.face;this.player.play(s.id);this.player.update(dt*s.rate,undefined,dt);s.remaining-=dt;if(s.remaining<=0)this.skillAnimation=null;return}}
  if(a.swordFlight&&this.flight.frame){
   this.player.face=this.flight.frame.facing;this.attacking=false;this.lastAttack=a.attackSeq;
   if(this.flight.frame.phase==='jump'){
    this.playAnimation('jump');this.player.time=this.flight.frame.jump*this.player.spec.clips[this.player.name].dur;this.player.blend=null;this.player.update(0,undefined,dt);
   }else{this.playAnimation('idle');this.player.update(dt*this.loaded.actions.idle.rate,undefined,dt)}
   return;
  }
  const preview=a.animationPreview;
  if(preview&&this.loaded.actions[preview.actionId]){
   if(this.previewToken!==preview.sequence){this.previewToken=preview.sequence;this.previewAge=preview.elapsed;this.playAnimation(preview.actionId,true)}
   else this.previewAge=Math.min(preview.elapsed+.1,Math.max(preview.elapsed,this.previewAge+dt));
   this.attacking=false;this.lastAttack=a.attackSeq;
   this.playAnimation(preview.actionId);this.player.time=Math.min(this.player.spec.clips[this.player.name].dur,this.previewAge);this.player.blend=null;this.player.update(0,undefined,dt);return;
  }
  const weapon=combatWeapon(a);if(weapon.kind==='soul'){this.attacking=false;this.lastAttack=a.attackSeq;const action=a.action==='attack'&&this.loaded.actions[weapon.visualAction]?weapon.visualAction:this.loaded.actions[a.action]?a.action:'idle';const dir=a.action==='attack'?a.attackDir??a.dir:a.dir;if(Math.abs(Math.cos(dir))>.15)this.player.face=Math.cos(dir)<0?-1:1;this.playAnimation(action);this.player.update(dt*this.loaded.actions[action].rate,undefined,dt);return}
  const attack=a.attackSeq??0;
  if(attack!==this.lastAttack){this.lastAttack=attack;if(a.action==='attack'||a.cooldown>0)this.attacking=this.playAnimation('attack',true)}
  const action=this.attacking?'attack':this.loaded.actions[a.action]?a.action:'idle';
  if(action==='attack'){const dir=Number.isFinite(a.attackDir)?a.attackDir!:a.dir;if(Math.abs(Math.cos(dir))>.15)this.player.face=Math.cos(dir)<0?-1:1}
  if(!this.attacking)this.playAnimation(action);
  const finished=this.player.update(dt*this.loaded.actions[action].rate,undefined,dt); // wing clock uses real seconds
  if(this.attacking&&finished){this.attacking=false;this.playAnimation(['walk','run'].includes(a.action)?a.action:'idle')}
 }
 draw(c:CanvasRenderingContext2D){if(!this.player||!this.loaded){this.fallback.draw(c);return}const a=this.actor;c.save();if(a.hp<=0)c.globalAlpha=.35;else if(a.action==='hurt')c.globalAlpha=.65;
  const flight=this.flight.frame,weapon=a.swordFlight&&flight?this.flight.weapon(this.player,a.swordFlight,this.loaded.appearance.scale):null;
  if(flight&&weapon)this.flight.drawShadow(c,weapon);
  const front=flight?.phase==='orbit'&&flight.y>a.y;
  if(flight&&weapon&&!front)this.flight.drawSword(c,weapon);
  const origin=flight?this.flight.bodyOrigin(this.player,a,this.loaded.appearance.scale):a;
  const hideWeapon=Object.values(this.loaded.actions).some(b=>b.animationId===this.player.animationId&&b.hideWeapon);
  this.player.draw(c,origin.x,origin.y,this.loaded.appearance.scale,{weapon:!flight&&!hideWeapon});
  if(flight&&weapon&&front)this.flight.drawSword(c,weapon);c.restore();
  // UI only; no old body, weapon, shadow or temporary attack geometry is drawn.
  c.save();const y=a.y-(flight?.riderHeight||0)-160*this.loaded.appearance.scale-10;c.textAlign='center';c.font='600 12px system-ui';c.strokeStyle='#12201d';c.lineWidth=3;c.strokeText(a.name,a.x,y);c.fillStyle=a.color;c.fillText(a.name,a.x,y);c.fillStyle='#101923';c.fillRect(a.x-23,y+6,46,5);c.fillStyle='#a5ca9c';c.fillRect(a.x-22,y+7,44*a.hp/a.maxHp,3);c.restore();
 }
 emissionPoint(accessoryId:string,uv:number[]){if(!this.player||!this.loaded||!this.actor)return null;const nc=(window as any).NC,raw=nc.ITEMS[this.player.equip.top]?.attachments.find((a:any)=>a.accessoryId===accessoryId);if(!raw)return null;const pose=this.player.renderPose(),a=nc.resolveAttachment(raw,pose);if(a.visible===false)return null;const m=nc.attachmentMatrix(this.player.equip,pose,a,this.actor.x,this.actor.y,this.loaded.appearance.scale),x=(uv[0]-a.anchor[0])*a.w,y=(uv[1]-a.anchor[1])*a.h;return{x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}}
 destroy(){this.disposed=true;this.generation++;this.player?.dispose();if(this.loaded)assets.release(this.loaded);this.player=null;this.loaded=null;this.fallback.destroy()}
 debug(){const nc=(window as any).NC;return{type:'cutout',flight:this.flight.frame?{...this.flight.frame,weaponId:this.actor.swordFlight?.weaponId,bodyOrigin:this.player&&this.loaded?this.flight.bodyOrigin(this.player,this.actor,this.loaded.appearance.scale):null}:null,key:this.loaded?.key,headId:this.player?.spec.headId,bodyId:this.player?.spec.bodyId,mountSignatures:this.player?.spec.mountSignatures,attachments:this.player?(nc.ITEMS[this.player.equip.top]?.attachments||[]).map((raw:any)=>{const a=nc.resolveAttachment(raw,this.player.renderPose());return({accessoryId:a.accessoryId||a.id,visible:a.visible,socket:a.socket,layer:a.layer,w:a.w,h:a.h,scale:a.scale,x:a.x,y:a.y,rotation:a.rotation,anchor:a.anchor,loaded:a.wingRig?a.wingRig.spriteOrder.every((id:string)=>!!nc.SPR[a.wingRig.sprites[id].sprite]?.img):!!nc.SPR[a.sprite]?.img,matrix:nc.attachmentMatrix(this.player.equip,this.player.renderPose(),a,this.actor?.x||0,this.actor?.y||0,this.loaded?.appearance.scale)})}):[],appearance:this.loaded?.appearance.id,scale:this.loaded?.appearance.scale,clip:this.player?.name,animationId:this.player?.animationId,time:this.player?.time,attachmentTime:this.player?.attachmentTime,face:this.player?.face,foot:this.actor?{x:this.actor.x,y:this.actor.y}:null}}
}
