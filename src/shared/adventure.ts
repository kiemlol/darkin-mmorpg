/** Progression content uses semantic asset IDs; rendering is supplied by content-assets.json. */
export const NPCS=[
 {id:'guide',name:'Vân Nương',role:'Tiếp dẫn · Chính tuyến',asset:'npc.guide',dx:-75,dy:20,dialogue:'Thanh Vân Cốc đang bị yêu khí bao phủ. Chọn đạo phái, học một nghề rồi giúp dân trong cốc trước khi đối đầu Sơn Quân.'},
 {id:'elder',name:'Chấp Sự Thanh Vân',role:'Tông môn · Ủy thác',asset:'npc.elder',dx:65,dy:25,dialogue:'Người có đạo tâm đều có thể nhập Thanh Vân Tông. Hoàn thành ủy thác để tích cống hiến, đổi đan dược và thăng chức.'},
 {id:'keeper',name:'Linh Thú Sứ',role:'Linh thú · Dưỡng thành',asset:'npc.keeper',dx:0,dy:105,dialogue:'Ngân Mao Hồ sẽ kết khế sau khi ngươi chứng minh khả năng trừ yêu. Yêu đan giúp nó lớn mạnh; nó sẽ hỗ trợ ngươi khi giao chiến.'},
] as const;
export type Metric='path'|'profession'|'gathered'|'kills'|'crafted'|'tier'|'bossKills'|'sect'|'pet';
export const STORY=[
 {id:'arrival',name:'Duyên khởi Thanh Vân',text:'Chọn một đạo phái trong Tiên đồ.',metric:'path',goal:1,exp:20,stones:20},
 {id:'trade',name:'Một nghề bên mình',text:'Theo học Đan Sư, Khí Sư hoặc Phù Sư.',metric:'profession',goal:1,exp:20,stones:20},
 {id:'medicine',name:'Linh thảo cứu dân',text:'Thu hái 3 lượt linh thảo cạnh điểm xuất phát sau khi nhận nhiệm vụ.',metric:'gathered',goal:3,exp:35,stones:25},
 {id:'wolves',name:'Yêu khí ngoài cốc',text:'Hạ 5 yêu thú sau khi nhận nhiệm vụ.',metric:'kills',goal:5,exp:45,stones:40},
 {id:'craft',name:'Tự luyện linh vật',text:'Chế tác hoặc rèn linh khí 1 lần sau khi nhận nhiệm vụ.',metric:'crafted',goal:1,exp:35,stones:30},
 {id:'realm',name:'Phá phàm nhập đạo',text:'Đột phá tới Ngưng Khí Sơ kỳ.',metric:'tier',goal:1,exp:45,stones:50},
 {id:'sect',name:'Tìm về sơn môn',text:'Gặp Chấp Sự và gia nhập Thanh Vân Tông.',metric:'sect',goal:1,exp:40,stones:40},
 {id:'companion',name:'Khế ước linh hồ',text:'Đến Linh Thú Sứ kết khế Ngân Mao Hồ.',metric:'pet',goal:1,exp:50,stones:50},
 {id:'guardian',name:'Bình định Thanh Vân',text:'Đánh bại Sơn Quân sau khi nhận nhiệm vụ.',metric:'bossKills',goal:1,exp:220,stones:180},
] as const;
export const DAILIES=[
 {id:'hunt',name:'Tuần sơn trừ yêu',metric:'kills',goal:12,stones:60,exp:65,contribution:15},
 {id:'herbs',name:'Dược viên thường nhật',metric:'gathered',goal:5,stones:30,exp:40,contribution:10},
 {id:'work',name:'Bách nghệ phụng tông',metric:'crafted',goal:3,stones:45,exp:50,contribution:15},
 {id:'boss',name:'Trấn áp Sơn Quân',metric:'bossKills',goal:1,stones:100,exp:100,contribution:30},
] as const;
export const SECT_SHOP=[{id:'hp_pill',cost:10,count:2,required:0},{id:'mp_pill',cost:10,count:2,required:0},{id:'break_pill',cost:80,count:1,required:200},{id:'essence',cost:15,count:3,required:0},{id:'ward',cost:25,count:1,required:60}] as const;
export const PET={id:'silver_fox',name:'Ngân Mao Hồ',asset:'pet.silver_fox',maxLevel:20};
export type Adventure={version:1;story:{step:number;active:boolean;baseline:number};daily:{day:number;baseline:Record<string,number>;claimed:string[]};sect:{joined:boolean;contribution:number;earned:number;donated:number};pet:{owned:boolean;active:boolean;level:number;xp:number;nextAttack:number};dispatch:{endsAt:number;claimed:boolean;count:number}};
export function freshAdventure():Adventure{return{version:1,story:{step:0,active:false,baseline:0},daily:{day:-1,baseline:{},claimed:[]},sect:{joined:false,contribution:0,earned:0,donated:0},pet:{owned:false,active:false,level:1,xp:0,nextAttack:0},dispatch:{endsAt:0,claimed:true,count:0}}}
const n=(v:any,max=1e9)=>Number.isSafeInteger(v)&&v>=0?Math.min(max,v):0;
export function normalizeAdventure(raw:any):Adventure{const v=freshAdventure();if(raw?.version!==1)return v;v.story={step:n(raw.story?.step,STORY.length),active:raw.story?.active===true,baseline:n(raw.story?.baseline)};v.daily={day:Number.isSafeInteger(raw.daily?.day)?raw.daily.day:-1,baseline:{},claimed:Array.isArray(raw.daily?.claimed)?[...new Set<string>(raw.daily.claimed.filter((id:any)=>DAILIES.some(d=>d.id===id)))]:[]};for(const key of ['kills','gathered','crafted','bossKills'])v.daily.baseline[key]=n(raw.daily?.baseline?.[key]);v.sect={joined:raw.sect?.joined===true,contribution:n(raw.sect?.contribution),earned:n(raw.sect?.earned),donated:n(raw.sect?.donated)};v.pet={owned:raw.pet?.owned===true,active:raw.pet?.active===true,level:Math.max(1,n(raw.pet?.level,20)),xp:n(raw.pet?.xp,999),nextAttack:0};if(!v.pet.owned)v.pet.active=false;v.dispatch={endsAt:typeof raw.dispatch?.endsAt==='number'&&Number.isFinite(raw.dispatch.endsAt)&&raw.dispatch.endsAt>=0?Math.min(1e12,raw.dispatch.endsAt):0,claimed:raw.dispatch?.claimed!==false,count:n(raw.dispatch?.count)};if(!v.dispatch.claimed&&v.dispatch.endsAt===0)v.dispatch.claimed=true;if(!v.dispatch.claimed)v.pet.active=false;return v}
export function adventureMetric(c:{path:string;profession:string;tier:number;metrics:Record<string,number>;adventure:Adventure},metric:string){if(metric==='path')return c.path?1:0;if(metric==='profession')return c.profession?1:0;if(metric==='tier')return c.tier;if(metric==='sect')return c.adventure.sect.joined?1:0;if(metric==='pet')return c.adventure.pet.owned?1:0;return c.metrics[metric]||0}
export function storyProgress(c:Parameters<typeof adventureMetric>[0]){const s=c.adventure.story,q=STORY[s.step];return q?Math.max(0,adventureMetric(c,q.metric)-s.baseline):0}
export function resetDaily(c:Parameters<typeof adventureMetric>[0],now:number){const d=c.adventure.daily,day=Math.floor(now/86400);if(day>d.day){d.day=day;d.baseline={...c.metrics};d.claimed=[];return true}return false}
export const petPower=(level:number)=>6+level*3;
export const petXpRequired=(level:number)=>10+level*5;
export const sectRank=(earned:number)=>earned>=500?'Chân truyền':earned>=200?'Nội môn':earned>=60?'Ngoại môn':'Ký danh';
export type AdventureAction='story_accept'|'story_turnin'|'daily_claim'|'sect_join'|'sect_donate'|'sect_buy'|'pet_adopt'|'pet_toggle'|'pet_feed'|'dispatch_start'|'dispatch_claim';
export const ADVENTURE_ACTIONS:readonly string[]=['story_accept','story_turnin','daily_claim','sect_join','sect_donate','sect_buy','pet_adopt','pet_toggle','pet_feed','dispatch_start','dispatch_claim'];
