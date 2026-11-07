import combat from '../../public/game-data/skills/combat.json';
import source from '../../public/game-data/skills/my_skills.skill-pack.json';
import manifest from '../../public/game-data/skills/index.json';
import {validateSkillProject,skillId} from '../../public/game-data/skills/skill-runtime.mjs';
export class SkillRegistry{
 project:any={format:'darkin-skill-project-v1',id:'game_skills',name:'Game skills',skills:{},effects:{}};
 register(pack:any){if(pack?.format!=='darkin-skill-pack-v1')throw Error('Cần darkin-skill-pack-v1');const p=validateSkillProject(pack),next={...this.project,skills:{...this.project.skills,...structuredClone(p.skills)},effects:{...this.project.effects,...structuredClone(p.effects)}};validateSkillProject(next);this.project=next;return Object.keys(p.skills)}
 get(id:string):any{return Object.hasOwn(this.project.skills,id)?this.project.skills[id]:null}
}
export const skills=new SkillRegistry();skills.register(source);
export const skillManifest=manifest;
export type LearnedSkills={version:1;learned:string[];slots:(string|null)[];readyAt:Record<string,number>};
export const emptySkills=():LearnedSkills=>({version:1,learned:[],slots:[null,null,null,null],readyAt:{}});
export function normalizeSkills(raw:any):LearnedSkills{if(raw===undefined)return emptySkills();if(raw?.version!==1||!Array.isArray(raw.learned)||raw.learned.length>256||!raw.learned.every(skillId)||new Set(raw.learned).size!==raw.learned.length||!Array.isArray(raw.slots)||raw.slots.length!==4||raw.slots.some((id:any)=>id!==null&&(!skillId(id)||!raw.learned.includes(id)))||!raw.readyAt||typeof raw.readyAt!=='object'||Array.isArray(raw.readyAt)||Object.keys(raw.readyAt).length>256||Object.entries(raw.readyAt).some(([id,n])=>!skillId(id)||!Number.isFinite(n)||(n as number)<0))throw Error('Dữ liệu kỹ năng không hợp lệ');return structuredClone(raw)}
export type SkillCast={id:string;skillId:string;casterId:string;targetId?:string;mapId:string;instanceId:string;startedAt:number;x:number;y:number;tx:number;ty:number;direction:number;epoch:number};
export function validSkillCasts(v:any):v is SkillCast[]{return Array.isArray(v)&&v.length<=128&&new Set(v.map(e=>e?.id)).size===v.length&&v.every(e=>e&&skills.get(e.skillId)&&[e.id,e.casterId,e.mapId,e.instanceId].every(s=>typeof s==='string'&&s.length>0&&s.length<=180)&&(!e.targetId||typeof e.targetId==='string'&&e.targetId.length<=128)&&[e.startedAt,e.x,e.y,e.tx,e.ty,e.direction,e.epoch].every(n=>Number.isFinite(n)&&Math.abs(n)<1e12)&&Number.isSafeInteger(e.epoch)&&e.epoch>=0)}

export const skillCombat:Record<string,{damage:number;target:string}>=combat.skills;
if(combat.version!==1||Object.entries(skillCombat).some(([id,r])=>!skills.get(id)||!Number.isSafeInteger(r.damage)||r.damage<0||r.damage>1000000||r.target!=='single_mob'))throw Error('Cấu hình sát thương skill không hợp lệ');
