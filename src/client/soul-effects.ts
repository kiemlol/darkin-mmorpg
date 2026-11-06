import {weaponCombat,type SoulProjectile} from '../shared/weapons';
import type {Snapshot,Actor} from '../shared/world';
import type {CharacterVisual} from './visual';
type Ghost={source:SoulProjectile;origin:{x:number;y:number};age:number};
export class SoulEffects{
 ghosts=new Map<string,Ghost>();bursts=new Map<string,{x:number;y:number;age:number}>();frame:any[]=[];
 reset(){this.ghosts.clear();this.bursts.clear();this.frame=[]}
 update(snapshot:Snapshot|null,actors:Actor[],visuals:Map<string,CharacterVisual>,dt:number){
  if(!snapshot){this.reset();return}const live=new Set<string>();this.frame=[];
  for(const p of snapshot.projectiles||[]){live.add(p.id);const w=weaponCombat.find(w=>w.accessoryId===p.weaponId)!;let g=this.ghosts.get(p.id);const serverAge=Math.max(0,snapshot.time-p.bornAt);
   if(!g){const point=visuals.get(p.ownerId)?.emissionPoint?.(p.weaponId,w.visual!.sourceUV);g={source:p,origin:point||{x:p.startX,y:p.startY-70},age:0};this.ghosts.set(p.id,g)}
   else{g.source=p;g.age=Math.min(serverAge+.1,g.age+dt)}
   const ahead=Math.max(0,Math.min(.1,g.age-serverAge)),distance=Math.min(w.range,p.travelled+w.speed!*ahead),estimatedX=p.x+Math.cos(p.angle)*w.speed!*ahead,estimatedY=p.y+Math.sin(p.angle)*w.speed!*ahead;
   const birth=Math.min(1,g.age/Math.min(.1,w.minFlightSeconds!)),ramp=Math.min(1,g.age/w.minFlightSeconds!),t=Math.min(1,distance/Math.max(1,p.launchDistance))*ramp;
   const groundX=p.startX+(estimatedX-p.startX)*ramp,groundY=p.startY+(estimatedY-p.startY)*ramp;
   const x=groundX+(g.origin.x-p.startX)*(1-t),y=groundY+(g.origin.y-p.startY)*(1-t)-w.visual!.impactHeight*t;
   this.frame.push({kind:'soul',id:p.id,x:groundX,y:groundY,drawX:x,drawY:y,angle:p.angle,age:g.age,alpha:.45+.55*birth});
  }
  for(const id of this.ghosts.keys())if(!live.has(id))this.ghosts.delete(id);
  for(const e of snapshot.events)if(e.projectileId&&!this.bursts.has(e.projectileId)&&snapshot.time-e.time<.15)this.bursts.set(e.projectileId,{x:e.x,y:e.y+14,age:0});
  for(const [id,b]of this.bursts){b.age+=dt;if(b.age>.35){if(!snapshot.events.some(e=>e.projectileId===id))this.bursts.delete(id);continue}this.frame.push({kind:'soul',id:'burst:'+id,x:b.x,y:b.y+36,drawX:b.x,drawY:b.y,burst:b.age})}
  return this.frame;
 }
 draw(c:CanvasRenderingContext2D,a:any){c.save();c.translate(a.drawX,a.drawY);if(a.burst!==undefined){const t=a.burst/.35;c.globalAlpha=1-t;c.strokeStyle='#e6b3ff';c.lineWidth=2;c.beginPath();c.arc(0,0,5+t*18,0,Math.PI*2);c.stroke();c.restore();return}c.rotate(a.angle);c.globalAlpha=a.alpha;const pulse=1+Math.sin(a.age*18)*.08;c.scale(pulse,pulse);
  const glow=c.createRadialGradient(0,0,0,0,0,23);glow.addColorStop(0,'#e9bbff99');glow.addColorStop(1,'#a744ff00');c.fillStyle=glow;c.fillRect(-23,-23,46,46);
  c.fillStyle='#b97af0';c.beginPath();c.moveTo(2,-9);c.bezierCurveTo(-6,-10,-10,-5,-23,Math.sin(a.age*23)*5);c.quadraticCurveTo(-10,8,1,8);c.closePath();c.fill();c.fillStyle='#ebceff';c.beginPath();c.ellipse(2,0,9,8,0,0,Math.PI*2);c.fill();c.fillStyle='#4a225f';c.beginPath();c.ellipse(4,-3,1.8,2.2,0,0,Math.PI*2);c.ellipse(4,3,1.8,2.2,0,0,Math.PI*2);c.fill();c.restore();
 }
}
