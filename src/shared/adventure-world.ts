import {NPCS,STORY,DAILIES,SECT_SHOP,adventureMetric,storyProgress,resetDaily,petPower,petXpRequired,type AdventureAction} from './adventure';
import type {World,Actor} from './world';
const settlements=new WeakMap<World,ReturnType<typeof makeSettlement>>();
function makeSettlement(w:World){const spawn=w.safeSpawn||w.findSpawn(w.p.spawn.x,w.p.spawn.y);return NPCS.map(n=>({...n,...w.findSpawn(spawn.x+n.dx,spawn.y+n.dy)}))}
export function settlement(w:World){let points=settlements.get(w);if(!points){points=makeSettlement(w);settlements.set(w,points)}return points}
function near(w:World,a:Actor,npc:string){const n=settlement(w).find(n=>n.id===npc)!;if(Math.hypot(a.x-n.x,a.y-n.y)>145)throw Error('Hãy đến gặp '+n.name+' tại điểm xuất phát');if(w.inCombat(a)||a.swordFlight)throw Error('Hãy hạ kiếm và rời giao chiến trước')}
function take(a:Actor,id:string,count:number){const m=a.cultivation!.materials;if((m[id]||0)<count)throw Error('Không đủ nguyên liệu');m[id]-=count}
function pay(a:Actor,cost:number){if(a.wallet.spirit_stone<cost)throw Error('Không đủ linh thạch');a.wallet.spirit_stone-=cost}
export function adventureCommand(w:World,a:Actor,action:AdventureAction,id?:string){const c=a.cultivation!,s=c.adventure,now=w.interactions.now();resetDaily(c,now);
 switch(action){
 case 'story_accept':{near(w,a,'guide');const q=STORY[s.story.step];if(!q||s.story.active)throw Error('Không có nhiệm vụ mới');s.story.active=true;s.story.baseline=['kills','gathered','crafted','bossKills'].includes(q.metric)?adventureMetric(c,q.metric):0;break}
 case 'story_turnin':{near(w,a,'guide');const q=STORY[s.story.step];if(!q||!s.story.active||storyProgress(c)<q.goal)throw Error('Nhiệm vụ chưa hoàn thành');c.exp+=q.exp;a.wallet.spirit_stone+=q.stones;s.story.step++;s.story.active=false;s.story.baseline=0;break}
 case 'daily_claim':{near(w,a,'elder');const d=DAILIES.find(d=>d.id===id);if(!d||s.daily.claimed.includes(d.id)||(c.metrics[d.metric]||0)-(s.daily.baseline[d.metric]||0)<d.goal)throw Error('Ủy thác chưa đủ hoặc đã nhận hôm nay');s.daily.claimed.push(d.id);c.exp+=d.exp;a.wallet.spirit_stone+=d.stones;if(s.sect.joined){s.sect.contribution+=d.contribution;s.sect.earned+=d.contribution}break}
 case 'sect_join':near(w,a,'elder');if(s.sect.joined)throw Error('Đã gia nhập tông môn');if(c.tier<1)throw Error('Cần đạt Ngưng Khí Sơ kỳ');s.sect.joined=true;break;
 case 'sect_donate':near(w,a,'elder');if(!s.sect.joined)throw Error('Chưa gia nhập tông môn');if(s.sect.donated>=20)throw Error('Đã đủ 20 lần cung phụng; hãy làm ủy thác');take(a,'essence',3);s.sect.contribution+=10;s.sect.earned+=10;s.sect.donated++;break;
 case 'sect_buy':{near(w,a,'elder');const item=SECT_SHOP.find(v=>v.id===id);if(!item||!s.sect.joined||s.sect.contribution<item.cost||s.sect.earned<item.required)throw Error('Chưa đủ cống hiến');if((c.materials[item.id]||0)+item.count>99999)throw Error('Kho đã đầy');s.sect.contribution-=item.cost;c.materials[item.id]=(c.materials[item.id]||0)+item.count;break}
 case 'pet_adopt':near(w,a,'keeper');if(s.pet.owned)throw Error('Đã kết khế linh hồ');if((c.metrics.kills||0)<5)throw Error('Hãy hạ 5 yêu thú để được công nhận');pay(a,35);take(a,'essence',5);s.pet.owned=true;s.pet.active=true;s.pet.nextAttack=now+2;break;
 case 'pet_toggle':if(!s.pet.owned)throw Error('Chưa có linh thú');if(s.dispatch.endsAt&&!s.dispatch.claimed)throw Error('Linh thú đang vân du hoặc chờ nhận thưởng');s.pet.active=!s.pet.active;s.pet.nextAttack=now+2;break;
 case 'pet_feed':if(!s.pet.owned||s.pet.level>=20)throw Error('Linh thú chưa có hoặc đã đạt cấp tối đa');if(s.dispatch.endsAt&&!s.dispatch.claimed)throw Error('Hãy nhận thưởng vân du trước');take(a,'essence',2);s.pet.xp+=10;while(s.pet.level<20&&s.pet.xp>=petXpRequired(s.pet.level)){s.pet.xp-=petXpRequired(s.pet.level);s.pet.level++}break;
 case 'dispatch_start':near(w,a,'keeper');if(!s.pet.owned||!s.dispatch.claimed)throw Error('Chưa có linh thú hoặc đang vân du');take(a,'herb',2);s.pet.active=false;s.dispatch.endsAt=now+180;s.dispatch.claimed=false;break;
 case 'dispatch_claim':near(w,a,'keeper');if(s.dispatch.claimed||!s.dispatch.endsAt||now<s.dispatch.endsAt)throw Error('Vân du chưa hoàn tất');if((c.materials.ore||0)>99996||(c.materials.essence||0)>99997)throw Error('Kho đã đầy');s.dispatch.claimed=true;s.dispatch.count++;s.pet.active=true;s.pet.nextAttack=now+2;c.materials.ore=(c.materials.ore||0)+3;c.materials.essence=(c.materials.essence||0)+2;c.exp+=25;break;
 default:throw Error('Thao tác không hợp lệ');
 }
}
export function tickAdventure(w:World,a:Actor){const c=a.cultivation;if(!c||a.kind!=='player')return;const now=w.interactions.now();if(resetDaily(c,now))c.revision++;const p=c.adventure.pet;if(a.hp<=0||!p.owned||!p.active||now<p.nextAttack||!w.inCombat(a)||a.swordFlight)return;
 const target=[...w.actors.values()].filter(b=>b.kind==='mob'&&b.hp>0&&Math.hypot(b.x-a.x,b.y-a.y)<210&&w.clearLine(a,b)).sort((b,d)=>Math.hypot(b.x-a.x,b.y-a.y)-Math.hypot(d.x-a.x,d.y-a.y))[0];if(target){p.nextAttack=now+2;a.companionAttack={targetId:target.id,at:now};w.hit(a,target,petPower(p.level))}
}
