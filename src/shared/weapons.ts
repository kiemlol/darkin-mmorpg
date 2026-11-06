import manifest from '../../public/game-data/weapons/combat.json';
import {gameCatalog} from './catalog';
import {ownsItem} from './inventory';
import type {Actor} from './world';
export type WeaponCombat={id:string;accessoryId?:string;kind:'melee'|'soul';range:number;damage:number;cooldown:number;visualAction:string;speed?:number;lifetime?:number;minFlightSeconds?:number;compatibleRigs?:string[];visual?:{sourceUV:number[];impactHeight:number}};
export function validateCombatRegistry(data:any):WeaponCombat[]{
 const fail=()=>{throw Error('Cấu hình combat vũ khí không hợp lệ')},id=(v:any)=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v),positive=(n:any,max:number)=>Number.isFinite(n)&&n>0&&n<=max;
 if(data?.version!==1||data.default?.kind!=='melee'||!Array.isArray(data.weapons)||data.weapons.length>64)return fail();
 const list=[data.default,...data.weapons] as WeaponCombat[];
 if(new Set(list.map(w=>w?.id)).size!==list.length||new Set(data.weapons.map((w:any)=>w?.accessoryId)).size!==data.weapons.length)return fail();
 for(const w of list){
  if(!w||!id(w.id)||!['melee','soul'].includes(w.kind)||!positive(w.range,600)||!positive(w.damage,100)||!positive(w.cooldown,5)||w.cooldown<.2||!id(w.visualAction))return fail();
  if(w!==data.default&&(!id(w.accessoryId)||!Array.isArray(w.compatibleRigs)||!w.compatibleRigs.length||w.compatibleRigs.some(r=>!gameCatalog.rigs.some(v=>v.id===r))))return fail();
  if(w.kind==='soul'&&(!positive(w.speed,800)||!positive(w.lifetime,3)||!positive(w.minFlightSeconds,w.lifetime!)||!Array.isArray(w.visual?.sourceUV)||w.visual!.sourceUV.length!==2||!w.visual!.sourceUV.every(n=>Number.isFinite(n)&&n>=0&&n<=1)||!positive(w.visual?.impactHeight,150)))return fail();
 }
 return list;
}
export const weaponCombat=validateCombatRegistry(manifest);
export function combatWeapon(a:Actor):WeaponCombat{
 if(a.kind==='player'){const rig=gameCatalog.appearances.find(v=>v.id===a.appearanceId)?.rig;for(const w of weaponCombat)if(w.accessoryId&&a.accessories.some(v=>v.accessoryId===w.accessoryId&&v.visible)&&ownsItem(a.inventory,w.accessoryId)&&(!w.compatibleRigs||w.compatibleRigs.includes(rig||'')))return w}return weaponCombat[0];
}
export type SoulProjectile={id:string;ownerId:string;weaponId:string;attackSeq:number;targetId?:string;x:number;y:number;startX:number;startY:number;angle:number;travelled:number;launchDistance:number;bornAt:number;epoch:number};
export function validSoulProjectiles(v:any):v is SoulProjectile[]{return Array.isArray(v)&&v.length<=128&&new Set(v.map(p=>p?.id)).size===v.length&&v.every(p=>p&&[p.id,p.ownerId,p.weaponId].every(s=>typeof s==='string'&&s.length>0&&s.length<=160)&&weaponCombat.some(w=>w.kind==='soul'&&w.accessoryId===p.weaponId)&&(!p.targetId||typeof p.targetId==='string'&&p.targetId.length<=128)&&[p.x,p.y,p.startX,p.startY,p.angle,p.travelled,p.launchDistance,p.bornAt].every(n=>Number.isFinite(n)&&Math.abs(n)<1e9)&&p.travelled>=0&&p.travelled<=600&&p.launchDistance>0&&p.launchDistance<=600&&Number.isSafeInteger(p.attackSeq)&&p.attackSeq>=0&&Number.isSafeInteger(p.epoch)&&p.epoch>=0)}
export function segmentContact(ax:number,ay:number,bx:number,by:number,cx:number,cy:number,r:number){const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((cx-ax)*dx+(cy-ay)*dy)/len)):0;return Math.hypot(ax+dx*t-cx,ay+dy*t-cy)<=r?t:null}
