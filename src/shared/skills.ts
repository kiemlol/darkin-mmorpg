import kiemLai from '../../public/game-data/skills/kiem-lai.skill-pack.json';
import coThanChiLo from '../../public/game-data/skills/co-than-chi-lo.skill-pack.json';
import combat from '../../public/game-data/skills/combat.json';
import source from '../../public/game-data/skills/my_skills.skill-pack.json';
import manifest from '../../public/game-data/skills/index.json';
import {validateSkillProject,skillId} from '../../public/game-data/skills/skill-runtime.mjs';
export class SkillRegistry{
 project:any={format:'darkin-skill-project-v1',id:'game_skills',name:'Game skills',skills:{},effects:{}};
 register(pack:any){if(pack?.format!=='darkin-skill-pack-v1')throw Error('Cần darkin-skill-pack-v1');const p=validateSkillProject(pack),next={...this.project,skills:{...this.project.skills,...structuredClone(p.skills)},effects:{...this.project.effects,...structuredClone(p.effects)}};validateSkillProject(next);this.project=next;return Object.keys(p.skills)}
 registerMapped(pack:any,sourceId:string,gameId:string){if(!skillId(gameId))throw Error('ID adapter không hợp lệ');const p=validateSkillProject(pack);if(!Object.hasOwn(p.skills,sourceId))throw Error('Thiếu source skillId');const adapted={...p,skills:{[gameId]:{...structuredClone(p.skills[sourceId]),id:gameId}}};return this.register({format:'darkin-skill-pack-v1',project:adapted})}
 get(id:string):any{return Object.hasOwn(this.project.skills,id)?this.project.skills[id]:null}
}
export const skills=new SkillRegistry();skills.register(source);
const imports={'kiem-lai.skill-pack.json':kiemLai,'co-than-chi-lo.skill-pack.json':coThanChiLo};for(const entry of manifest.imports)if(Object.hasOwn(imports,entry.file))skills.registerMapped((imports as any)[entry.file],entry.sourceSkillId,entry.skillId);
export const skillManifest=manifest;
export type LearnedSkills={version:1;learned:string[];slots:(string|null)[];readyAt:Record<string,number>};
export const emptySkills=():LearnedSkills=>({version:1,learned:[],slots:[null,null,null,null],readyAt:{}});
export function normalizeSkills(raw:any):LearnedSkills{if(raw===undefined)return emptySkills();if(raw?.version!==1||!Array.isArray(raw.learned)||raw.learned.length>256||!raw.learned.every(skillId)||new Set(raw.learned).size!==raw.learned.length||!Array.isArray(raw.slots)||raw.slots.length!==4||raw.slots.some((id:any)=>id!==null&&(!skillId(id)||!raw.learned.includes(id)))||!raw.readyAt||typeof raw.readyAt!=='object'||Array.isArray(raw.readyAt)||Object.keys(raw.readyAt).length>256||Object.entries(raw.readyAt).some(([id,n])=>!skillId(id)||!Number.isFinite(n)||(n as number)<0))throw Error('Dữ liệu kỹ năng không hợp lệ');return structuredClone(raw)}
export type SkillCast={id:string;skillId:string;casterId:string;targetId?:string;mapId:string;instanceId:string;startedAt:number;x:number;y:number;tx:number;ty:number;direction:number;epoch:number;resolved?:boolean};
export function validSkillCasts(v:any):v is SkillCast[]{return Array.isArray(v)&&v.length<=128&&new Set(v.map(e=>e?.id)).size===v.length&&v.every(e=>e&&skills.get(e.skillId)&&[e.id,e.casterId,e.mapId,e.instanceId].every(s=>typeof s==='string'&&s.length>0&&s.length<=180)&&(!e.targetId||typeof e.targetId==='string'&&e.targetId.length<=128)&&[e.startedAt,e.x,e.y,e.tx,e.ty,e.direction,e.epoch].every(n=>Number.isFinite(n)&&Math.abs(n)<1e12)&&(e.resolved===undefined||typeof e.resolved==='boolean')&&Number.isSafeInteger(e.epoch)&&e.epoch>=0)}

export type SkillCombatRule={damage:number;target:'single_mob';impact:{eventId:string;frameIndex:number;point:{x:number;y:number};trackTarget:true}};
export const skillCombat:Record<string,SkillCombatRule>=combat.skills as Record<string,SkillCombatRule>;

// Combat metadata belongs to the game, never to an untrusted client or visual marker.
// Every damaging skill needs an explicit contact frame and point; no hitAt fallback.
export function validateSkillCombat(id:string,rule:any,project:any=skills.project):asserts rule is SkillCombatRule{
 const s=project.skills[id],i=rule?.impact,e=s?.events.find((e:any)=>e.id===i?.eventId),frames=e&&project.effects[e.effectId]?.frames;
 if(!s||!Number.isSafeInteger(rule?.damage)||rule.damage<=0||rule.damage>1000000||rule.target!=='single_mob'||!i||i.trackTarget!==true||!frames||!Number.isInteger(i.frameIndex)||i.frameIndex<0||i.frameIndex>=frames.length||!i.point||![i.point.x,i.point.y].every(Number.isFinite)||e.anchor!=='target'||e.motion!=='still')throw Error('Thiếu hoặc sai cấu hình va chạm skill: '+id);
 const time=contactTime(e,frames,i.frameIndex);
 if(!Number.isFinite(time)||time<=0||time>=s.duration||e.at+e.duration>s.duration+1e-8)throw Error('Mốc va chạm ngoài timeline skill: '+id);
}
function contactTime(e:any,frames:any[],index:number){
 const total=frames.reduce((n:number,f:any)=>n+f.duration,0),before=frames.slice(0,index).reduce((n:number,f:any)=>n+f.duration,0);
 return e.at+e.duration*before/total;
}
function contactDefinition(id:string){
 const s=skills.get(id),impact=skillCombat[id]?.impact;
 if(!s||!impact)throw Error('Skill chưa có cấu hình va chạm: '+id);
 const e=s.events.find((e:any)=>e.id===impact.eventId);return {impact,e,frames:skills.project.effects[e.effectId].frames};
}
export function skillImpactTime(id:string):number{const {impact,e,frames}=contactDefinition(id);return contactTime(e,frames,impact.frameIndex)}
// Frame pixels before native anchor, scale, rotation and offset; camera is applied later.
export function skillVisualTarget(id:string,foot:{x:number;y:number}){
 const {impact,e,frames}=contactDefinition(id),f=frames[impact.frameIndex];
 const x=(impact.point.x-f.ax*f.w)*e.scale,y=(impact.point.y-f.ay*f.h)*e.scale,r=e.rotation*Math.PI/180;
 return {x:foot.x-e.x-(x*Math.cos(r)-y*Math.sin(r)),y:foot.y-e.y-(x*Math.sin(r)+y*Math.cos(r))};
}
if(combat.version!==1)throw Error('Sai phiên bản cấu hình combat skill');
for(const[id,rule]of Object.entries(skillCombat))validateSkillCombat(id,rule);

// Share frame images/specs; override only the runtime marker time in a shallow adapter.
// World still validates/resolves damage independently. Original Studio exports stay intact.
let playbackSource:any,playback:any;
export function skillPlaybackProject(){
 if(playbackSource!==skills.project){playback={...skills.project,skills:Object.fromEntries(Object.entries(skills.project.skills).map(([id,s]:[string,any])=>[id,{...s,...(skillCombat[id]?{hitAt:skillImpactTime(id)}:{})}]))};playbackSource=skills.project}
 return playback;
}
