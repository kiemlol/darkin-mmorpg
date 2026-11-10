import type {CultSkill} from './cultivation';
/** One timeline for authoritative contact and client animation (seconds). */
export const RUYI_TIMING={rise:.75,grow:1.6,impact:2.1,fade:3.5,end:5.4};
export const RUYI_SKILL:CultSkill={id:'nhu_y_dinh_hai',name:'Như Ý Định Hải',path:'the',tier:0,cost:38,cooldown:14,range:360,coefficient:4.5,radius:150,hitAt:RUYI_TIMING.impact,lockAt:RUYI_TIMING.grow,duration:RUYI_TIMING.end,effect:'stun',fx:'ruyi_staff',color:'#f4cd63',description:'Tung Như Ý Kim Cô Bổng lên trời, hóa thành cự bổng rồi giáng xuống. Gây sát thương diện rộng trong bán kính 150 và làm choáng 1,5 giây. Vị trí rơi cố định khi gậy bắt đầu lao xuống; đất đá văng ra rồi mờ dần.',icon:'/skill-previews/nhu_y_dinh_hai.png'};
