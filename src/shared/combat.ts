import type {Actor} from './world';

export const COMBAT_SECONDS=1.5;
export const MELEE_RANGE=76;

// The authority selects the closest reachable living mob only when a player
// attacks. Range comes from the server weapon registry, never a client target ID.
export function nearestTarget(a:Actor,actors:Iterable<Actor>,clear:(b:Actor)=>boolean,range=MELEE_RANGE){
 if(a.kind!=='player'||a.hp<=0)return undefined;
 let target:Actor|undefined,best=Infinity;
 for(const b of actors){
  if(b.kind!=='mob'||b.hp<=0)continue;
  const distance=Math.hypot(b.x-a.x,b.y-a.y);
  if(distance>range||distance>best||!clear(b))continue;
  if(distance<best||!target||b.id<target.id){target=b;best=distance}
 }
 return target;
}

export const nearestMeleeTarget=(a:Actor,actors:Iterable<Actor>,clear:(b:Actor)=>boolean)=>nearestTarget(a,actors,clear,MELEE_RANGE);
