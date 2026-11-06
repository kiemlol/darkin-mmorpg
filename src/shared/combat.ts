import type {Actor} from './world';

export const COMBAT_SECONDS=1.5;
export const MELEE_RANGE=76;

// The authority selects the closest reachable living mob only when a player
// swings. No auto-walk, enlarged range, client target IDs or PvP are introduced.
export function nearestMeleeTarget(a:Actor,actors:Iterable<Actor>,clear:(b:Actor)=>boolean){
 if(a.kind!=='player'||a.hp<=0)return undefined;
 let target:Actor|undefined,best=Infinity;
 for(const b of actors){
  if(b.kind!=='mob'||b.hp<=0)continue;
  const distance=Math.hypot(b.x-a.x,b.y-a.y);
  if(distance>MELEE_RANGE||distance>best||!clear(b))continue;
  if(distance<best||!target||b.id<target.id){target=b;best=distance}
 }
 return target;
}
