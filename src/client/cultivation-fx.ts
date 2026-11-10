import {NetherArrayFX} from './nether-array-fx';
import {NETHER_SKILL} from '../shared/nether-array';
import {RuyiStaffFX} from './ruyi-staff-fx';
import {RUYI_SKILL} from '../shared/ruyi-staff';
import type {Actor,Snapshot} from '../shared/world';
import {cultSkill} from '../shared/cultivation';
import type {SkillCast} from '../shared/skills';
type View={x:number;y:number;width:number;height:number};
/** Native Tu Tiên visual simulation. Ghost casts never own Darkin damage or inventory. */
export class CultivationFX{
 nether=new NetherArrayFX();staff=new RuyiStaffFX();p:any;loaded=false;errors:string[]=[];seen=new Set<string>();actors=new Map<string,any>();forms=new Map<string,{id:string;left:number}>();scope='';pending=new Map<string,Promise<void>>();images=new Map<string,HTMLImageElement|null>();view:View={x:0,y:0,width:1280,height:720};
 async load(){
  this.p={};(window as any).PNTT=this.p;
  await new Promise<void>((ok,no)=>{const script=document.createElement('script');script.src='/game-data/cultivation/native/runtime.js';script.onload=()=>ok();script.onerror=()=>no(Error('Không tải được bộ hiệu ứng Tu Tiên'));document.head.append(script)});
  const p=this.p;const trim=p.ASSET_TRIM||{};
  const loadImage=(key:string):Promise<void>=>{if(this.images.has(key))return Promise.resolve();if(this.pending.has(key))return this.pending.get(key)!;const file=trim[key]?.pack||key;if(p.ASSET_MANIFEST&&!Object.hasOwn(p.ASSET_MANIFEST,file))return Promise.resolve();
   if(!/^assets\/[\w./-]+\.(png|webp|jpg)$/.test(file)||file.split('/').includes('..'))return Promise.resolve();
   const task=new Promise<void>(resolve=>{const img=new Image();img.onload=()=>{this.images.set(key,img);p.Assets.images[key]=img;if(this.forms.size)p.SpriteFactory?.clear();this.pending.delete(key);resolve()};img.onerror=()=>{this.images.set(key,null);this.pending.delete(key);this.errors.push('Thiếu ảnh hiệu ứng: '+file);resolve()};img.src='/'+file});this.pending.set(key,task);return task;
  };
  Object.assign(p.Assets,{get:(key:string)=>{if(!this.images.has(key))void loadImage(key);return this.images.get(key)||null},loadImage,fxTrim:(key:string)=>trim[key]||null,PRIO:{CRITICAL:0,NORMAL:1,PREFETCH:2},images:{}});
  p.Quality={tier:2,keepVfx:()=>true,vfxCap:()=>600,isDecor:()=>false,veNguoiKhac(){},detail:()=>2};p.Renderer={w:1280,h:720,gfx:1,view:()=>({step:0})};p.Camera={x:0,y:0,shake(){},shakeAt(){}};p.Gateway={connected:false};p.Net={online:false};p.Game={time:0};p.SceneWorld={player:null,enemies:[]};p.Game.scene=p.SceneWorld;
  p.Progress={realmId:p.REALMS[0].id,realm:()=>p.REALMS[0]};p.Inventory={owns:()=>true,count:()=>1,bonus:()=>0,equipped:()=>({id:p.SceneWorld.player?.cfg?.weapon||'kim_quang_kiem'})};
  p.Audio?.init();p.Audio?.setMusicOn(false);const used:string[]=await fetch('/game-data/cultivation/native/used-assets.json').then(r=>r.json());for(let i=0;i<used.length;i+=4){await Promise.all(used.slice(i,i+4).map(loadImage));const label=document.getElementById('error');if(label)label.textContent='Đang tải hình kỹ năng… '+Math.min(i+4,used.length)+'/'+used.length;}if(this.errors.length)throw Error(this.errors.join(' · '));this.loaded=true;
 }
 clear(){this.nether.clear();this.staff.clear();this.seen.clear();this.actors.clear();this.forms.clear();this.scope='';this.p?.VFX?.clear();this.p?.Skills?.reset()}
 private actor(a:Actor){let v=this.actors.get(a.id);if(!v){v={...this.p.DEFAULT_CHARACTER,cfg:{...this.p.DEFAULT_CHARACTER,weapon:'kim_quang_kiem'},flyRise:0,animTime:0,hpMax:a.maxHp,bpMax:100,sp:100,mp:100};this.actors.set(a.id,v)}Object.assign(v,{id:a.id,kind:a.kind,x:a.x,y:a.y,hp:a.kind==='player'?a.hp:Math.max(1,a.hp),hpMax:a.maxHp,dead:a.kind==='player'&&a.hp<=0,downed:a.kind==='player'&&a.hp<=0,state:a.action==='walk'||a.action==='run'?a.action:'idle',dir:Math.abs(Math.cos(a.dir))>.6?(Math.cos(a.dir)<0?1:2):(Math.sin(a.dir)<0?3:0),def:{barY:a.boss?65:42},flying:!!a.swordFlight});return v}
 private spawn(c:SkillCast){const p=this.p,def=p.Skills.DEFS[c.skillId],owner=this.actors.get(c.casterId);if(!def||!owner)return;let target=this.actors.get(c.targetId||'');if(!target)target={id:c.id+':aim',x:c.tx,y:c.ty,hp:1000,hpMax:1000,dead:false,def:{barY:45}};
  // The published definition and its dispatcher select the sprite/module. No generic substitute.
  owner.cfg.weapon=def.boostWeapon||'kim_quang_kiem';p.SceneWorld.player=owner;p.SceneWorld.enemies=[...this.actors.values()].filter(a=>a.kind==='mob');p.Skills.update(0,p.SceneWorld.enemies,{});const visualDef={...def,range:Math.max(def.range||0,Math.hypot(c.tx-owner.x,c.ty-owner.y)+20)};
  if(def.bienHinh){p.Player.giveForm(owner,def);this.forms.set(c.casterId,{id:def.id,left:Math.min(20,def.bienHinh.time||12)})}
  p.Skills.cast(owner,visualDef,{x:c.tx,y:c.ty,target},true);p.Audio?.playSkill(def);
 }
 update(snapshot:Snapshot|null,actors:Actor[],dt:number,view?:View){if(!this.loaded||!snapshot){this.clear();return}if(this.scope&&this.scope!==snapshot.instanceId)this.clear();this.scope=snapshot.instanceId||'';if(view)this.view=view;const p=this.p;p.Camera.x=this.view.x;p.Camera.y=this.view.y;p.Renderer.w=this.view.width;p.Renderer.h=this.view.height;
  const ids=new Set(actors.map(a=>a.id));for(const id of this.actors.keys())if(!ids.has(id))this.actors.delete(id);for(const a of actors)this.actor(a);for(const c of snapshot.skillCasts||[])if(cultSkill(c.skillId)&&!this.seen.has(c.id)){this.seen.add(c.id);try{if(c.skillId===NETHER_SKILL.id)this.nether.spawn(c,snapshot.time-c.startedAt);else if(c.skillId===RUYI_SKILL.id)this.staff.spawn(c,snapshot.time-c.startedAt);else this.spawn(c)}catch(e){this.errors.push(c.skillId+': '+String(e))}}
  this.staff.update(snapshot,actors,dt);this.nether.update(snapshot,actors,dt);
  // First-use image loads pause only the visual clock, so short sprites do not expire before decoding.
  const step=this.pending.size||(p.NuongTruoc?.con?.()||0)>0?0:dt;p.Game.time+=step;for(const a of this.actors.values())a.animTime+=step;
  for(const[id,f]of this.forms){f.left-=step;const a=this.actors.get(id);if(a){a.hinhT=f.left;a.hinhTuoi=(a.hinhTuoi||0)+step}if(f.left<=0||a?.downed){p.Player.endForm(a);this.forms.delete(id)}}
  try{p.Skills.update(step,[...this.actors.values()].filter(a=>a.kind==='mob'),{});p.VFX.update(step)}catch(e){this.errors.push(String(e))}
  if(p.VFX.list.length>600)p.VFX.list.splice(0,p.VFX.list.length-600);
  const live=new Set((snapshot.skillCasts||[]).map(c=>c.id));for(const id of this.seen)if(!live.has(id))this.seen.delete(id);
 }
 draw(ctx:CanvasRenderingContext2D,layer:'back'|'front'){if(!this.loaded)return;this.staff.draw(ctx,layer);this.nether.draw(ctx,layer);const p=this.p,{x,y}=this.view;ctx.save();try{ctx.translate(x,y);if(layer==='front'){p.VFX.draw(ctx,x,y,'base');p.Skills.draw(ctx,x,y)}p.VFX.draw(ctx,x,y,layer)}finally{ctx.restore()}}
 drawForm(ctx:CanvasRenderingContext2D,id:string){const f=this.forms.get(id),a=this.actors.get(id);if(!f||!a)return false;const p=this.p;ctx.save();try{const cfg=p.Player.cfgHinh(a,f.id),fx=p.Player.hinhFX(f.id);fx?.aura?.(ctx,a.x,a.y,a,a.animTime,'back',0);if(!cfg){fx?.aura?.(ctx,a.x,a.y,a,a.animTime,'front',0);return false}const frame=Math.floor(a.animTime*3)%4,sheet=p.SpriteFactory.getPose(cfg,a.dir,[0,1,2,3]),scale=p.Player.hinhTo(a)||1,x=a.x-p.CONFIG.CHAR_ANCHOR_X,y=a.y-p.CONFIG.CHAR_ANCHOR_Y;if(scale!==1)p.Player.phongHinh(ctx,a.x,a.y,scale);p.Player.veVienHinh?.(ctx,a,sheet,a.dir,frame,x,y,a.animTime);p.SpriteFactory.drawBody(ctx,sheet,a.dir,frame,x,y,cfg);fx?.aura?.(ctx,a.x,a.y,a,a.animTime,'front',0);return true}catch(e){this.errors.push(f.id+': '+String(e));return false}finally{ctx.restore()}}
 debug(){return{netherEffects:this.nether.effects.size,staffEffects:this.staff.effects.size,loaded:this.loaded,pending:this.pending.size,images:this.images.size,errors:this.errors.slice(-20),bolts:this.p?.Skills?.bolts.length||0,grounds:this.p?.Skills?.grounds.length||0,effects:this.p?.VFX?.list.map((v:any)=>v.type)||[],forms:[...this.forms.values()].map(f=>f.id)}}
}
