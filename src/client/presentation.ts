import {canWalk,type Actor,type Snapshot} from '../shared/world';
export const STEP=.05;
export type Position={x:number;y:number};
const position=(a:Position):Position=>({x:a.x,y:a.y});
const discontinuity=(a:Actor,b:Actor)=>Math.hypot(a.x-b.x,a.y-b.y)>100||a.hp<=0&&b.hp>0;
// Presentation only. Authoritative actors, collision, HP and combat are never mutated.
export function interpolateActor(p:any,from:Actor|undefined,to:Actor,alpha:number):Actor{
 if(!from||discontinuity(from,to))return{...to};
 const t=Math.max(0,Math.min(1,alpha)),x=from.x+(to.x-from.x)*t,y=from.y+(to.y-from.y)*t;
 return canWalk(p,x,y,to.radius)?{...to,x,y}:{...to};
}
export function interpolateSnapshot(p:any,from:Snapshot,to:Snapshot,alpha:number):Actor[]{
 const prior=new Map(from.actors.map(a=>[a.id,a]));return to.actors.map(a=>interpolateActor(p,prior.get(a.id),a,alpha));
}
// Predicted movement still advances exactly once per outgoing 20 Hz input.
// Display the interval at render rate; reconcile with a separate, short-lived visual offset.
export class PredictedPresentation{
 from:Actor|null=null;target:Actor|null=null;phase=0;age=STEP;private tickPending=false;offset:Position={x:0,y:0};
 advance(dt:number){this.phase+=Math.max(0,dt);while(this.phase+1e-10>=STEP)this.phase=Math.max(0,this.phase-STEP);if(this.tickPending){this.age=this.phase;this.tickPending=false}else this.age+=Math.max(0,dt);const decay=Math.exp(-Math.max(0,dt)/.08);this.offset.x*=decay;this.offset.y*=decay}
 tick(before:Actor,after:Actor){this.from={...before};this.target={...after};this.tickPending=true}
 reconcile(next:Actor){
  if(!this.target||discontinuity(this.target,next)){this.from={...next};this.target={...next};this.offset={x:0,y:0};return}
  const dx=next.x-this.target.x,dy=next.y-this.target.y;
  this.from={...(this.from||next),x:(this.from?.x??next.x)+dx,y:(this.from?.y??next.y)+dy};
  this.target={...next};this.offset.x-=dx;this.offset.y-=dy;
 }
 sample(p:any,meta:Actor):Actor{
  if(!this.target)return{...meta};const base=interpolateActor(p,this.from||undefined,this.target,Math.min(1,this.age/STEP));
  const x=base.x+this.offset.x,y=base.y+this.offset.y;
  return canWalk(p,x,y,meta.radius)?{...meta,x,y}:{...meta,...position(base)};
 }
}
// Server-time playback buffer. Arrival jitter does not restart interpolation from an old snapshot.
export class SnapshotTimeline{
 frames:Snapshot[]=[];time:number|null=null;sinceLatest=0;
 push(s:Snapshot){if(this.frames.length&&s.time<=this.frames.at(-1)!.time)return;this.frames.push(s);if(this.frames.length>32)this.frames.shift();this.sinceLatest=0;if(this.time===null)this.time=s.time-.1}
 advance(dt:number){if(this.time===null||!this.frames.length)return;this.sinceLatest+=Math.max(0,dt);const latest=this.frames.at(-1)!,desired=latest.time+this.sinceLatest-.1,gap=desired-this.time;
  if(Math.abs(gap)>.5)this.time=desired;else this.time+=Math.max(0,dt)*Math.max(.9,Math.min(1.1,1+gap*2));
 }
 sample(p:any,latest:Snapshot):Actor[]{
  if(this.time===null||!this.frames.length)return latest.actors.map(a=>({...a}));
  let from=this.frames[0],to=from;for(const frame of this.frames){to=frame;if(frame.time>=this.time)break;from=frame}
  const alpha=to.time>from.time?(this.time-from.time)/(to.time-from.time):1;
  const positions=new Map(interpolateSnapshot(p,from,to,alpha).map(a=>[a.id,a]));
  return latest.actors.map(a=>{const v=positions.get(a.id);return v&&!discontinuity(v,a)?{...a,x:v.x,y:v.y}:{...a}});
 }
}
