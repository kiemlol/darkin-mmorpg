import jumpPack from '../../public/game-data/animations/sword-flight/jump.animation-pack.json';
import {readAnimationPack} from '../../public/game-data/cutout-runtime/animation-identity.mjs';
import {gameCatalog} from './catalog';
import {resolveInventory,accessoryItems,type EquipmentState} from './equipment';

export type FlightConfig={animationResourceId:string;compatibleRigs:string[];orbitSeconds:number;settleSeconds:number;landingSeconds:number;hoverHeight:number;mountDistance:number;orbitRadius:number;planeScaleY:number;jumpArc:number;allPublishedWeapons?:boolean;defaults?:{sizeMultiplier:number;tipAngle:number};weapons:{accessoryId:string;sizeMultiplier:number;tipAngle:number}[]};
export type FlightPhase='orbit'|'settle'|'jump'|'riding'|'landing';
export type SwordFlight={id:number;weaponId:string;phase:FlightPhase;elapsed:number;heading:number;facing:1|-1;launchX:number;launchY:number;mountX:number;mountY:number;epoch:number;landingElapsed:number};
export const flightConfig=gameCatalog.swordFlight!;
// All published weapon-category items inherit the common flight contract.
// Overrides customize art orientation/size, never gameplay speed or collision.
export function flightWeaponDefinition(id:string,items=accessoryItems):{accessoryId:string;sizeMultiplier:number;tipAngle:number}|null{
 const item=items.find(a=>a.accessoryId===id&&a.category==='weapon');if(!item)return null;
 const override=flightConfig.weapons.find(w=>w.accessoryId===id);
 if(override)return override;return flightConfig.allPublishedWeapons&&flightConfig.defaults?{accessoryId:id,...flightConfig.defaults}:null;
}
export const flightJump=readAnimationPack(jumpPack);
export const JUMP_SECONDS=flightJump.dur;
if(!flightConfig||gameCatalog.resources.find(r=>r.id===flightConfig.animationResourceId)?.actions?.jump?.animationId!==flightJump.id)throw Error('Cấu hình nhảy phi kiếm không khớp animationId');
export const JUMP_AT=flightConfig.orbitSeconds+flightConfig.settleSeconds;
export const RIDE_AT=JUMP_AT+JUMP_SECONDS;
export const clamp01=(n:number)=>Math.max(0,Math.min(1,n));
export const smooth=(n:number)=>{const t=clamp01(n);return t*t*(3-2*t)};
export function phaseAt(elapsed:number):FlightPhase{return elapsed<flightConfig.orbitSeconds?'orbit':elapsed<JUMP_AT?'settle':elapsed<RIDE_AT?'jump':'riding'}
export function validSwordFlight(f:any):f is SwordFlight{
 return !!f&&Number.isSafeInteger(f.id)&&f.id>=0&&f.id<1e12&&!!flightWeaponDefinition(f.weaponId)&&['orbit','settle','jump','riding','landing'].includes(f.phase)&&[1,-1].includes(f.facing)&&Number.isSafeInteger(f.epoch)&&f.epoch>=0&&Number.isFinite(f.heading)&&Math.abs(f.heading)<=Math.PI*2&&['elapsed','landingElapsed','launchX','launchY','mountX','mountY'].every(k=>Number.isFinite(f[k])&&f[k]>=0&&f[k]<1e12);
}
// Metadata and published mounts are immutable. Avoid cloning image-bearing
// accessory packs every HUD frame / server tick; cache only fit eligibility.
const eligibility=new Map<string,string|null>();
export function equippedFlightWeapon(state:EquipmentState){
 const key=JSON.stringify([state.headId,state.bodyId,state.accessories]);if(eligibility.has(key))return eligibility.get(key)!;
 const id=state.accessories.find(a=>a.visible&&!!flightWeaponDefinition(a.accessoryId))?.accessoryId;
 const result=id&&resolveInventory(state).inventory.some(a=>a.accessoryId===id&&a.visible!==false)?id:null;
 if(eligibility.size>=64)eligibility.delete(eligibility.keys().next().value!);eligibility.set(key,result);return result;
}
// One projection for sword, ground shadow and rider. Gameplay coordinates remain
// ground XY; altitude is purely visual and never bypasses map collision.
export function flightFrame(f:SwordFlight,actor:{x:number;y:number},elapsed=f.elapsed){
 const phase=f.phase==='landing'?'landing':phaseAt(elapsed),jump=clamp01((elapsed-JUMP_AT)/JUMP_SECONDS),orbit=smooth(elapsed/flightConfig.orbitSeconds),heading=f.heading;
 let x=actor.x,y=actor.y,angle=Math.abs(Math.cos(heading))<.5?Math.atan2(Math.sin(heading),f.facing*.5):heading;
 const settledAngle=angle;
 if(phase==='orbit'){
  const theta=heading+orbit*Math.PI*2,r=flightConfig.orbitRadius+(flightConfig.mountDistance-flightConfig.orbitRadius)*orbit;
  x=f.launchX+Math.cos(theta)*r;y=f.launchY+Math.sin(theta)*r;angle=settledAngle+orbit*Math.PI*2;
 }else if(phase==='settle'||phase==='jump'){x=f.mountX;y=f.mountY}
 // The published rig has left/right views. Give a near-vertical blade a
 // slight diagonal yaw toward that view; its actual XY travel stays exact.
 const landing=phase==='landing'?1-smooth(f.landingElapsed/flightConfig.landingSeconds):1;
 const bob=(phase==='riding'?Math.sin((elapsed-RIDE_AT)*3)*.9:0)*landing;
 const height=flightConfig.hoverHeight*landing+bob;
 const riderHeight=phase==='jump'?flightConfig.hoverHeight*smooth(jump)+Math.sin(jump*Math.PI)*flightConfig.jumpArc:phase==='riding'||phase==='landing'?height:0;
 const weapon=flightWeaponDefinition(f.weaponId);if(!weapon)throw Error('Vũ khí bay chưa được phát hành');
 const size=1+(weapon.sizeMultiplier-1)*smooth((elapsed-flightConfig.orbitSeconds)/flightConfig.settleSeconds);
 return{phase,elapsed,jump,orbit,facing:f.facing,heading:angle,travelHeading:heading,x,y,height,riderHeight,size,tipAngle:weapon.tipAngle,planeScaleY:flightConfig.planeScaleY};
}
