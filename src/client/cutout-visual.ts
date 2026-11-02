import type {Actor} from '../shared/world';
import type {CharacterVisual} from './visual';
import {PlaceholderCharacterVisual} from './visual';
import {assets,assetWarning,type LoadedVisual} from './assets';
export class CutoutCharacterVisual implements CharacterVisual{
 actor!:Actor;player:any=null;loaded:LoadedVisual|null=null;requested='';generation=0;disposed=false;lastAttack=-1;attacking=false;fallback=new PlaceholderCharacterVisual();
 async load(config:any={}){return this.setAppearance(config.appearanceId||assets.catalog.defaults.appearance)}
 async setAppearance(id:string){
  this.requested=id;const generation=++this.generation;
  try{const next=await assets.load(id);if(this.disposed||generation!==this.generation)return;
   const player=next.prototype.fork();this.player?.dispose();this.player=player;this.loaded=next;this.attacking=false;this.lastAttack=this.actor?.attackSeq??0;
  }catch(e){if(generation===this.generation&&!this.disposed)assetWarning('Lỗi ngoại hình '+id+': '+String(e)+(this.player?' · Giữ ngoại hình hợp lệ hiện tại.':' · Đang dùng hình tạm, chưa nạp được cutout.'))}
 }
 playAnimation(action:string){const b=this.loaded?.actions[action];if(b&&this.player)this.player.play(b.clip)}
 update(a:Actor,dt:number){this.actor=a;this.fallback.update(a,dt);if(a.appearanceId&&a.appearanceId!==this.requested)void this.setAppearance(a.appearanceId);if(!this.player||!this.loaded)return;
  if(Math.abs(Math.cos(a.dir))>.15)this.player.face=Math.cos(a.dir)<0?-1:1;
  if(a.hp<=0)return; // Demo has no death/hurt clips: retain real rig, no invented animation.
  const attack=a.attackSeq??0;
  if(attack!==this.lastAttack){this.lastAttack=attack;if(a.action==='attack'||a.cooldown>0){const b=this.loaded.actions.attack;this.player.play(b.clip,{restart:true});this.attacking=true}}
  const action=this.attacking?'attack':this.loaded.actions[a.action]?a.action:'idle';
  if(!this.attacking)this.playAnimation(action);
  const finished=this.player.update(dt*this.loaded.actions[action].rate); // seconds, no combat callback
  if(this.attacking&&finished){this.attacking=false;this.playAnimation(['walk','run'].includes(a.action)?a.action:'idle')}
 }
 draw(c:CanvasRenderingContext2D){if(!this.player||!this.loaded){this.fallback.draw(c);return}const a=this.actor;c.save();if(a.hp<=0)c.globalAlpha=.35;else if(a.action==='hurt')c.globalAlpha=.65;
  this.player.draw(c,a.x,a.y,this.loaded.appearance.scale,{weapon:true});c.restore();
  // UI only; no old body, weapon, shadow or temporary attack geometry is drawn.
  c.save();const y=a.y-160*this.loaded.appearance.scale-10;c.textAlign='center';c.font='600 12px system-ui';c.strokeStyle='#12201d';c.lineWidth=3;c.strokeText(a.name,a.x,y);c.fillStyle=a.color;c.fillText(a.name,a.x,y);c.fillStyle='#101923';c.fillRect(a.x-23,y+6,46,5);c.fillStyle='#a5ca9c';c.fillRect(a.x-22,y+7,44*a.hp/a.maxHp,3);c.restore();
 }
 destroy(){this.disposed=true;this.generation++;this.player?.dispose();this.player=null;this.loaded=null;this.fallback.destroy()}
 debug(){return{type:'cutout',appearance:this.loaded?.appearance.id,clip:this.player?.name,time:this.player?.time,attachmentTime:this.player?.attachmentTime,face:this.player?.face,foot:this.actor?{x:this.actor.x,y:this.actor.y}:null}}
}
