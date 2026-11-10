import{NETHER_SKILL as S,NETHER_TIMING as T}from'./nether-array';
import{cultivationStats}from'./cultivation';
import type{World}from'./world';import type{SkillCast}from'./skills';
/** World owns captures, restraint and four distinct contact moments; visuals grant nothing. */
export function advanceNetherArray(w:World,c:SkillCast){const a=w.actors.get(c.casterId);if(!a||a.hp<=0||a.teleportSeq!==c.epoch||c.mapId!==w.p.id||!a.cultivation)return;const age=w.time-c.startedAt,eligible=(id:string)=>{const b=w.actors.get(id);return b?.kind==='mob'&&b.hp>0&&Math.hypot(b.x-c.tx,b.y-c.ty)<=S.radius&&Math.hypot(b.x-a.x,b.y-a.y)<=S.range+S.radius&&w.clearLine(a,b)?b:undefined};
 if(age+1e-9>=T.seal&&!c.prisonTargets)c.prisonTargets=[...w.actors.values()].filter(b=>eligible(b.id)).map(b=>b.id).sort();
 if(age+1e-9>=T.seal&&age<T.release)for(const id of c.prisonTargets||[]){const b=eligible(id);if(b)b.prisonUntil=Math.max(b.prisonUntil||0,w.time+.12)}
 while((c.soulWaves||0)<T.waves&&age+1e-9>=T.breath+T.flight+(c.soulWaves||0)*T.waveStep){c.soulWaves=(c.soulWaves||0)+1;for(const id of c.prisonTargets||[]){const b=eligible(id);if(b)w.hit(a,b,Math.round(cultivationStats(a.cultivation).power*S.coefficient))}if(c.soulWaves===T.waves)c.resolved=true}
}
