import {REALMS,REALM_STAGES} from './realms';
import {PATHS,PROFESSIONS,CULT_SKILLS,MATERIALS,RECIPES,QUESTS,cultSkill,freshCultivation,normalizeCultivation,cultivationStats,expRequired,realmAtTier,type CultCommand} from './cultivation';
import {emptySkills} from './skills';
import type {World,Actor} from './world';
const take=(a:Actor,id:string,n:number)=>{const c=a.cultivation!;if((c.materials[id]||0)<n)throw Error('Thiếu '+(MATERIALS[id]?.name||id));c.materials[id]-=n};
const pay=(a:Actor,n:number)=>{if(a.wallet.spirit_stone<n)throw Error('Không đủ linh thạch');a.wallet.spirit_stone-=n};
export function initializeCultivator(w:World,a:Actor){a.cultivation=normalizeCultivation(a.cultivation);if(a.cultivation.tier===0&&a.realmId!=='mortal')a.cultivation.tier=1+Math.max(0,REALMS.findIndex(r=>r.id===a.realmId)-1)*4+Math.max(0,REALM_STAGES.findIndex(r=>r.id===a.realmStageId));applyCultivationStats(a);if(!a.skills)a.skills=emptySkills();}
export function applyCultivationStats(a:Actor){if(!a.cultivation)return;const stats=cultivationStats(a.cultivation);a.maxHp=stats.maxHp;a.hp=Math.min(a.hp,a.maxHp);a.maxMp=stats.maxMp;a.mp=Math.min(a.cultivation.mp,a.maxMp);a.professionName=(PATHS.find(p=>p.id===a.cultivation?.path)?.name||'Tán Tu')+' · '+(PROFESSIONS.find(p=>p.id===a.cultivation?.profession)?.name||'Chưa chọn nghề');Object.assign(a,realmAtTier(a.cultivation.tier));}
export function cultivationCommand(w:World,id:string,cmd:CultCommand){const a=w.actors.get(id);if(!a?.cultivation||a.kind!=='player'||!cmd||typeof cmd.action!=='string')throw Error('Không có nhân vật tu luyện');if(a.hp<=0)throw Error('Hãy hồi sinh trước');const c=a.cultivation,now=w.interactions.now();
 // Work on a detached copy so failed recipes or purchases spend nothing.
 const original=structuredClone({cultivation:c,wallet:a.wallet,skills:a.skills,hp:a.hp,inventory:a.inventory,potentialPoints:a.potentialPoints});
 try{switch(cmd.action){
 case 'expand_bag':if(a.inventory.capacity>=16)throw Error('Túi đã mở đủ 16 ô');pay(a,a.inventory.capacity*10);a.inventory={...a.inventory,capacity:a.inventory.capacity+4,revision:a.inventory.revision+1,slots:[...a.inventory.slots,...Array(4).fill(null)]};break;
 case 'attribute':if(!['vigor','power','spirit'].includes(cmd.id!)||a.potentialPoints<1)throw Error('Đột phá để nhận điểm tiềm năng');a.potentialPoints--;c.attributes[cmd.id!]++;break;
 case 'path':{const p=PATHS.find(p=>p.id===cmd.id);if(!p||c.path)throw Error('Đạo phái chỉ chọn một lần');c.path=p.id;w.learnSkill(id,p.skills[0],0);break}
 case 'profession':if(c.profession||!PROFESSIONS.some(p=>p.id===cmd.id))throw Error('Nghề chỉ chọn một lần');c.profession=cmd.id!;c.materials.herb=(c.materials.herb||0)+4;c.materials.ore=(c.materials.ore||0)+3;c.materials.paper=(c.materials.paper||0)+4;break;
 case 'meditate':if(w.inCombat(a)||w.interactions.channels.has(id)||a.swordFlight)throw Error('Cần đứng trên đất và rời giao chiến');c.meditating=!c.meditating;w.inputs.delete(id);break;
 case 'breakthrough':{if(w.inCombat(a))throw Error('Hãy rời giao chiến');if(c.tier>=16)throw Error('Đã đạt Nguyên Anh Viên mãn');const cost=15+15*c.tier;if(c.exp<expRequired(c.tier))throw Error('Chưa đủ tu vi');pay(a,cost);if(c.tier>0&&c.tier%4===0)take(a,'break_pill',1);c.exp-=expRequired(c.tier);c.tier++;a.potentialPoints+=3;applyCultivationStats(a);a.hp=a.maxHp;c.mp=a.maxMp!;break}
 case 'learn':{const s=cultSkill(cmd.id!);if(!s||s.path!==c.path)throw Error('Bí pháp không thuộc đạo phái');if(c.tier<s.tier)throw Error('Cảnh giới chưa đủ');if(a.skills?.learned.includes(s.id))throw Error('Đã lĩnh ngộ');pay(a,15+s.tier*12);w.learnSkill(id,s.id);break}
 case 'slot':if(!Number.isInteger(cmd.slot)||cmd.slot!<0||cmd.slot!>3||!a.skills?.learned.includes(cmd.id!)||!cultSkill(cmd.id!))throw Error('Kỹ năng hoặc ô không hợp lệ');a.skills.slots[cmd.slot!]=cmd.id!;break;
 case 'gather':{if(w.inCombat(a)||a.swordFlight||c.gatherUntil>now)throw Error('Chưa thể thu hái');if(now-c.lastGather<8)throw Error('Linh thảo cần thời gian hồi phục');const d=Math.hypot(a.x-(w.safeSpawn||w.p.spawn).x,a.y-(w.safeSpawn||w.p.spawn).y);if(d>180)throw Error('Hãy tới vườn linh thảo cạnh điểm xuất phát');c.meditating=false;c.gatherUntil=now+3;w.inputs.delete(id);break}
 case 'craft':{const r=RECIPES.find(r=>r.id===cmd.id);if(!r||r.profession!==c.profession)throw Error('Cần đúng nghề chế tác');if(w.inCombat(a))throw Error('Không thể chế tác khi giao chiến');for(const[k,n]of Object.entries(r.ingredients))take(a,k,n);pay(a,r.cost);c.materials[r.id]=(c.materials[r.id]||0)+1;c.craftXp+=r.xp;c.metrics.crafted++;break}
 case 'forge':{if(c.profession!=='khi')throw Error('Cần nghề Khí Sư');if(c.weaponLevel>=10)throw Error('Linh khí đã đạt cấp tối đa');if(w.inCombat(a))throw Error('Hãy rời giao chiến');take(a,'ore',2+c.weaponLevel);pay(a,20+c.weaponLevel*20);c.weaponLevel++;c.craftXp+=20;c.metrics.crafted++;break}
 case 'buy':{const prices:Record<string,number>={hp_pill:12,mp_pill:12,herb:5,ore:8,essence:10,paper:4,break_pill:120};const price=prices[cmd.id!];if(!Object.hasOwn(prices,cmd.id!)||!Number.isSafeInteger(price))throw Error('Vật phẩm không bán');if((c.materials[cmd.id!]||0)>=99999)throw Error('Kho đã đầy');pay(a,price);c.materials[cmd.id!]=(c.materials[cmd.id!]||0)+1;break}
 case 'sell':if(!['herb','ore','essence','paper'].includes(cmd.id!))throw Error('Không thể bán món này');take(a,cmd.id!,1);a.wallet.spirit_stone+=2;break;
 case 'use':{if(now<c.potionAt)throw Error('Đan dược/phù đang hồi');if(!['hp_pill','mp_pill','ward','cultivation_talisman'].includes(cmd.id!))throw Error('Không thể sử dụng');take(a,cmd.id!,1);c.potionAt=now+8;if(cmd.id==='hp_pill')a.hp=Math.min(a.maxHp,a.hp+a.maxHp*.5);if(cmd.id==='mp_pill')c.mp=Math.min(a.maxMp!,c.mp+a.maxMp!*.6);if(cmd.id==='ward'){c.shield=100;c.shieldUntil=now+12}if(cmd.id==='cultivation_talisman')c.buffUntil=now+180;break}
 case 'quest':{const q=QUESTS.find(q=>q.id===cmd.id);if(!q||c.claimed.includes(q.id)||(q.metric==='tier'?c.tier:c.metrics[q.metric]||0)<q.goal)throw Error('Nhiệm vụ chưa hoàn thành hoặc đã nhận');c.claimed.push(q.id);c.exp+=q.exp;a.wallet.spirit_stone+=q.stones;break}
 default:throw Error('Thao tác không được hỗ trợ');
 }c.revision++;applyCultivationStats(a);if(cmd.action==='path'){a.hp=a.maxHp;c.mp=a.maxMp!;a.mp=c.mp}}catch(e){Object.assign(a,original);throw e}
}
export function tickCultivation(w:World,a:Actor,dt:number){const c=a.cultivation;if(!c||a.kind!=='player')return;const now=w.interactions.now();if(a.hp<=0){c.meditating=false;c.gatherUntil=0;return}const i=w.inputs.get(a.id)?.i;const moving=!!i&&(Math.hypot(i.dx,i.dy)>.01||i.attack);
 if(moving||w.inCombat(a)||a.swordFlight){c.meditating=false;c.gatherUntil=0}
 if(c.meditating){c.exp+=dt*(now<c.buffUntil?2.25:1.5);a.hp=Math.min(a.maxHp,a.hp+dt*3)}
 c.mp=Math.min(a.maxMp||100,c.mp+dt*(c.meditating?9:3));a.mp=c.mp;
 if(c.gatherUntil&&now>=c.gatherUntil){c.gatherUntil=0;c.lastGather=now;c.materials.herb=(c.materials.herb||0)+2;c.metrics.gathered++;c.exp+=4;c.revision++}
 if(c.shieldUntil<=now)c.shield=0;
}
export function rewardCultivation(a:Actor,b:Actor){const c=a.cultivation;if(!c)return;const boss=!!b.boss;c.metrics.kills++;if(boss)c.metrics.bossKills++;const level=b.mobLevel||1;c.exp+=(boss?90:9)*level;a.wallet.spirit_stone+=(boss?35:3)*level;c.materials.essence=(c.materials.essence||0)+(boss?4:1);if(c.metrics.kills%2===0)c.materials.ore=(c.materials.ore||0)+1;if(c.metrics.kills%3===0)c.materials.paper=(c.materials.paper||0)+1;c.revision++;}
