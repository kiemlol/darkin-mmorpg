import {skills,skillCombat,skillImpactTime,type SkillCast} from './skills';
import type {World,Actor} from './world';
import {segmentContact} from './weapons';
export type SkillMissile={id:string;castId:string;skillId:string;ownerId:string;targetId:string;mapId:string;epoch:number;wave:number;index:number;bornAt:number;startX:number;startY:number;x:number;y:number;angle:number;flightSeconds:number;lane:number;progress:number};
export function validSkillMissiles(v:any):v is SkillMissile[]{return Array.isArray(v)&&v.length<=256&&new Set(v.map(p=>p?.id)).size===v.length&&v.every(p=>p&&skillCombat[p.skillId]?.volley&&[p.id,p.castId,p.ownerId,p.targetId,p.mapId].every(s=>typeof s==='string'&&s.length>0&&s.length<=240)&&[p.bornAt,p.startX,p.startY,p.x,p.y,p.angle,p.flightSeconds,p.lane,p.progress].every(n=>Number.isFinite(n)&&Math.abs(n)<1e9)&&p.bornAt>=0&&p.flightSeconds>=.25&&p.flightSeconds<=3&&p.progress>=0&&p.progress<=1&&Math.abs(p.lane)<=24&&Number.isSafeInteger(p.epoch)&&p.epoch>=0&&Number.isInteger(p.wave)&&p.wave>=0&&p.wave<2&&Number.isInteger(p.index)&&p.index>=0&&p.index<4)}
export function missilePosition(p:SkillMissile,target:{x:number;y:number},time:number){const u=Math.max(0,Math.min(1,(time-p.bornAt)/p.flightSeconds)),dx=target.x-p.startX,dy=target.y-p.startY,d=Math.hypot(dx,dy)||1,bend=p.lane*Math.sin(Math.PI*u);return{x:p.startX+dx*u-dy/d*bend,y:p.startY+dy*u+dx/d*bend,progress:u}}
export function advanceVolley(w:World,c:SkillCast){const rule=skillCombat[c.skillId],v=rule.volley!,a=w.actors.get(c.casterId),b=c.targetId&&w.actors.get(c.targetId);if(!a||a.hp<=0||a.teleportSeq!==c.epoch||a.swordFlight||w.interactions.channels.has(a.id)||c.mapId!==w.p.id){c.closeAt??=w.time;c.wavesEmitted=v.waves;return}if(c.closeAt!==undefined)return;
 if(!b||b.hp<=0){c.wavesEmitted=v.waves;c.closeAt=w.time;return}c.tx=b.x;c.ty=b.y;
 while((c.wavesEmitted||0)<v.waves&&w.time-c.startedAt+1e-9>=skillImpactTime(c.skillId)+(c.wavesEmitted||0)*v.interval){const wave=c.wavesEmitted||0;c.wavesEmitted=wave+1;if(Math.hypot(b.x-a.x,b.y-a.y)>skills.get(c.skillId).range||!w.clearLine(a,b))continue;
  const x=a.x+Math.cos(c.direction)*18,y=a.y+Math.sin(c.direction)*10,d=Math.hypot(b.x-x,b.y-y),flightSeconds=Math.max(v.minFlight,Math.min(v.lifetime,d/v.speed));
  for(let k=0;k<v.count;k++)w.skillMissiles.push({id:c.id+':wave:'+wave+':soul:'+k,castId:c.id,skillId:c.skillId,ownerId:a.id,targetId:b.id,mapId:c.mapId,epoch:c.epoch,wave,index:k,bornAt:w.time,startX:x,startY:y,x,y,angle:Math.atan2(b.y-y,b.x-x),flightSeconds:Math.min(v.lifetime,flightSeconds+k*.04),lane:v.lanes[k],progress:0});
 }
}
export function advanceSkillMissiles(w:World,dt:number){const next:SkillMissile[]=[];
 for(const p of w.skillMissiles){const a=w.actors.get(p.ownerId),b=w.actors.get(p.targetId),rule=skillCombat[p.skillId],v=rule?.volley;if(!v||!a||a.hp<=0||a.teleportSeq!==p.epoch||a.swordFlight||w.interactions.channels.has(a.id)||p.mapId!==w.p.id||!b||b.kind!=='mob'||b.hp<=0||w.time-p.bornAt>v.lifetime||!w.skillCasts.some(c=>c.id===p.castId))continue;
  // Follow the live target. Substeps sweep the curved route, never trust client hit markers.
  const steps=Math.max(1,Math.ceil(dt/.02));let ended=false;
  for(let k=1;k<=steps;k++){const q=missilePosition(p,b,w.time-dt+dt*k/steps),from={x:p.x,y:p.y},to={x:q.x,y:q.y};if(!w.canStand({...to,radius:2} as Actor)||!w.clearLine(from as Actor,to as Actor)){ended=true;break}const hit=segmentContact(p.x,p.y,q.x,q.y,b.x,b.y,b.radius+2);p.angle=Math.atan2(q.y-p.y,q.x-p.x);Object.assign(p,q);if(hit!==null&&w.time-p.bornAt+1e-9>=v.minFlight){w.hit(a,b,rule.damage);w.events.at(-1)!.projectileId=p.id;ended=true;break}if(q.progress>=1){ended=true;break}}
  if(!ended)next.push(p);
 }w.skillMissiles=next;
 for(const c of w.skillCasts){const v=skillCombat[c.skillId]?.volley;if(v&&(c.wavesEmitted||0)>=v.waves&&!w.skillMissiles.some(p=>p.castId===c.id)){c.closeAt??=w.time;c.resolved=true}}
}
