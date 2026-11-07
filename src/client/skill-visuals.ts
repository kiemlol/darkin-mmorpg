import {SkillPlayer,loadSkillImages} from '../../public/game-data/skills/skill-runtime.mjs';
import {skills,skillCombat,skillImpactTime,skillVisualTarget} from '../shared/skills';import type {Snapshot,Actor} from '../shared/world';import type {CharacterVisual} from './visual';import {CutoutCharacterVisual} from './cutout-visual';import {assetWarning} from './assets';
export class SkillVisuals{
 animationOwners=new Map<string,CutoutCharacterVisual>();
 images=new Map();loaded=false;error='';mapKey='';seen=new Set<string>();players=new Map<string,{player:any;caster:{x:number;y:number};cast:any;age:number;updates:number}>();pending=new Map<string,{casterId:string;animation:string;direction:number}>();
 async load(){try{this.images=await loadSkillImages(skills.project);this.loaded=true}catch(e){this.error='Không tải được Skill & VFX: '+String(e);assetWarning(this.error)}}
 clear(){for(const[id,v]of this.animationOwners)v.cancelSkillAnimation(id);this.animationOwners.clear();for(const p of this.players.values())p.player.clear();this.players.clear();this.pending.clear();this.seen.clear();this.mapKey=''}
 update(snapshot:Snapshot|null,actors:Actor[],visuals:Map<string,CharacterVisual>,dt:number){
  if(!snapshot){this.clear();return}const key=(snapshot.instanceId||'')+':'+(snapshot.skillCasts?.[0]?.mapId||'');
  if(this.mapKey&&key.split(':').slice(0,-1).join(':')!==this.mapKey.split(':').slice(0,-1).join(':'))this.clear();this.mapKey=key;
  const records=new Map((snapshot.skillCasts||[]).map(c=>[c.id,c]));const live=new Set(records.keys());for(const id of this.seen)if(!live.has(id)&&!this.players.has(id))this.seen.delete(id);
  if(this.loaded)for(const c of snapshot.skillCasts||[]){if(this.seen.has(c.id))continue;this.seen.add(c.id);const age=Math.max(0,snapshot.time-c.startedAt);if(age>=skills.get(c.skillId).duration)continue;
   const caster={x:c.x,y:c.y};const player=new SkillPlayer(skills.project,{onEvent:(e?:any)=>{if(e.type==='cast'&&e.animation)this.pending.set(c.id,{casterId:c.casterId,animation:e.animation,direction:c.direction})}});player.cast(c.skillId,{caster,target:skillVisualTarget(c.skillId,{x:c.tx,y:c.ty})});this.players.set(c.id,{player,caster,cast:c,age:-1,updates:0});
  }
  for(const [id,p]of this.players){p.cast=records.get(id)||p.cast;const owner=actors.find(a=>a.id===p.cast.casterId);if(!owner||owner.hp<=0||owner.teleportSeq!==p.cast.epoch){p.player.clear();this.players.delete(id);this.pending.delete(id);this.animationOwners.get(id)?.cancelSkillAnimation(id);this.animationOwners.delete(id);continue}p.caster.x=owner.x;p.caster.y=owner.y;
   const authorityAge=Math.max(0,snapshot.time-p.cast.startedAt);if(authorityAge>=skills.get(p.cast.skillId).duration){p.player.clear();this.players.delete(id);this.pending.delete(id);this.animationOwners.get(id)?.cancelSkillAnimation(id);this.animationOwners.delete(id);continue}let desired=p.age<0?authorityAge:Math.min(authorityAge+.15,Math.max(authorityAge,p.age+dt));const impact=skillCombat[p.cast.skillId]?.impact;
   if(impact){const c=p.cast,mob=actors.find(a=>a.id===c.targetId),foot=!c.resolved&&mob&&mob.hp>0?mob:{x:c.tx,y:c.ty};const target=skillVisualTarget(c.skillId,foot);if(p.player.instances[0])Object.assign(p.player.instances[0].target,target);
    // Do not show contact before the authority has resolved this cast.
    if(!c.resolved)desired=Math.min(desired,skillImpactTime(c.skillId)-.00001);
   }
   const step=Math.max(0,desired-p.player.time);p.player.update(step);p.updates++;p.age=p.player.time;if(!p.player.instances.length){this.players.delete(id);this.pending.delete(id);this.animationOwners.get(id)?.cancelSkillAnimation(id);this.animationOwners.delete(id)}
  }
  for(const[id,p]of this.pending){const v=visuals.get(p.casterId);if(v instanceof CutoutCharacterVisual&&v.loaded){v.castAnimation(p.animation,id,p.direction);this.animationOwners.set(id,v);this.pending.delete(id)}}
 }
 draw(c:CanvasRenderingContext2D,layer:'low'|'high'|'glow'){for(const p of this.players.values())p.player.draw(c,this.images,{layer})}
 debug(){return{loaded:this.loaded,images:this.images.size,error:this.error,instances:[...this.players.values()].map(p=>({id:p.cast.id,skillId:p.cast.skillId,age:p.age,updates:p.updates,caster:{...p.caster},target:p.player.instances[0]?.target,aimFoot:{x:p.cast.tx,y:p.cast.ty},resolved:!!p.cast.resolved}))}}
}
