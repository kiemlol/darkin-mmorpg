import {loadNetherSheets,drawNetherSprites,netherMouth,type NetherSheets} from './nether-sprites';
import{NETHER_SKILL as S,NETHER_TIMING as T}from'../shared/nether-array';
import type{Actor,Snapshot}from'../shared/world';import type{SkillCast}from'../shared/skills';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v)};const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const noise=(n:number)=>{const k=Math.sin(n*127.1+41.7)*43758.5453;return k-Math.floor(k)};
type Point={x:number;y:number};export type NetherEffect={cast:SkillCast;age:number;targets:Point[]};
export class NetherArrayFX{
 sheets?:NetherSheets;async load(){this.sheets=await loadNetherSheets()}
 effects=new Map<string,NetherEffect>();clear(){this.effects.clear()}
 spawn(c:SkillCast,elapsed=0){if(this.effects.has(c.id)||elapsed>=T.end)return;this.effects.set(c.id,{cast:{...c},age:Math.max(0,elapsed),targets:[]})}
 update(snapshot:Snapshot,actors:Actor[],dt:number){const all=new Map(actors.map(a=>[a.id,a]));for(const[id,e]of this.effects){const owner=all.get(e.cast.casterId);if(!owner||owner.hp<=0||owner.teleportSeq!==e.cast.epoch){this.effects.delete(id);continue}const latest=snapshot.skillCasts?.find(c=>c.id===id);if(latest)e.cast={...latest};e.targets=(e.cast.prisonTargets||[]).map(id=>all.get(id)).filter((a):a is Actor=>!!a&&a.hp>0).map(a=>({x:a.x-e.cast.tx,y:a.y-e.cast.ty-30}));e.age+=Math.max(0,Math.min(.25,dt));if(e.age>=T.end)this.effects.delete(id)}}
 draw(c:CanvasRenderingContext2D,layer:'back'|'front'){for(const e of this.effects.values())drawNetherArray(c,e,layer,this.sheets)}
}
function line(c:CanvasRenderingContext2D,points:number[][],stroke:string,width=1){c.strokeStyle=stroke;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()}
function glow(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,alpha:number){c.save();c.globalAlpha*=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#07191a00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore()}
function flagPoint(i:number):Point{const a=-Math.PI/2+i*Math.PI/3;return{x:Math.cos(a)*S.radius,y:Math.sin(a)*S.radius*.5}}
/** Actual poles, cloth and talisman embroidery; every flag travels separately. */
function flag(c:CanvasRenderingContext2D,x:number,y:number,i:number,t:number,alpha:number){c.save();c.translate(x,y);c.globalAlpha*=alpha;const pole=c.createLinearGradient(-3,0,3,0);pole.addColorStop(0,'#1f2831');pole.addColorStop(.5,'#bcb393');pole.addColorStop(1,'#45434e');c.fillStyle=pole;c.fillRect(-2.5,-94,5,99);c.fillStyle='#e5c37b';c.beginPath();c.moveTo(0,-108);c.lineTo(5,-95);c.lineTo(-5,-95);c.closePath();c.fill();const flutter=Math.sin(t*7+i)*5;
 c.fillStyle='#231832';c.strokeStyle='#c6aa75';c.lineWidth=1.5;c.beginPath();c.moveTo(3,-91);c.bezierCurveTo(20,-94,37,-83,46,-88+flutter);c.lineTo(41,-45+flutter);c.lineTo(29,-50);c.lineTo(16,-42);c.lineTo(4,-49);c.closePath();c.fill();c.stroke();c.strokeStyle='#a5edcd';c.lineWidth=1.4;c.beginPath();c.moveTo(22,-82);c.lineTo(14,-71);c.lineTo(29,-66);c.lineTo(16,-61);c.lineTo(24,-53);c.stroke();c.fillStyle='#a5edcd';c.fillRect(32,-77,3,3);c.fillStyle='#a27bd0';c.beginPath();c.arc(0,-97,3,0,Math.PI*2);c.fill();c.restore()}
function ghost(c:CanvasRenderingContext2D,x:number,y:number,size:number,angle:number,alpha:number,t:number){c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;glow(c,-size*1.8,0,size*3,'#75dabb',.45);c.fillStyle='#9ae8d6';c.beginPath();c.moveTo(size*.5,-size*.72);c.bezierCurveTo(-size,-size,-size*2,-size*.1,-size*4,-size*.5);c.lineTo(-size*2.6,size*.25);c.lineTo(-size*3.7,size*.8);c.bezierCurveTo(-size*1.1,size*.4,-size,size,size*.5,size*.72);c.closePath();c.fill();c.fillStyle='#dcfff2';c.beginPath();c.ellipse(size*.3,0,size*.8,size,0,0,Math.PI*2);c.fill();c.fillStyle='#172f3a';for(const dy of [-.37,.37]){c.beginPath();c.ellipse(size*.6,dy*size,size*.19,size*.16,0,0,Math.PI*2);c.fill()}c.beginPath();c.ellipse(size*.93,0,size*.11,size*.2,0,0,Math.PI*2);c.fill();c.restore()}
export function drawNetherArray(c:CanvasRenderingContext2D,e:NetherEffect,layer:'back'|'front',sheets?:NetherSheets){
 const t=e.age;if(t<0||t>=T.end)return;const s=e.cast,fade=1-smooth((t-T.fade)/(T.end-T.fade));c.save();c.translate(s.tx,s.ty);c.globalAlpha=fade;
 if(layer==='back'){
  const progress=smooth((t-1.8)/(T.seal-1.8));if(progress>0){c.save();c.scale(1,.5);glow(c,0,0,S.radius*1.18,'#447d70',.35*progress);for(let i=0;i<3;i++){c.strokeStyle=['#b4ebcb','#6a8d9c','#bd9b69'][i];c.lineWidth=i===0?2:1;c.beginPath();c.arc(0,0,S.radius-9-i*13,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke()}
   if(progress>=.98){for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/2,b=a+Math.PI*2/3;line(c,[[Math.cos(a)*130,Math.sin(a)*130],[Math.cos(b)*130,Math.sin(b)*130]],'#8cb99d88',1.3)}for(let i=0;i<24;i++){const a=i*Math.PI/12;c.save();c.translate(Math.cos(a)*145,Math.sin(a)*145);c.rotate(a);line(c,[[-4,-5],[3,-5],[-1,1],[4,5],[-4,5]],'#c7d9ad',1.2);c.restore()}}
   c.restore()}
  if(t>=T.seal&&t<T.release)for(const p of e.targets){const x=p.x,y=p.y+30;c.strokeStyle='#96d9b6';c.lineWidth=1.5;for(let j=0;j<3;j++){c.globalAlpha=fade*(.25+.15*Math.sin(t*4+j));c.beginPath();c.ellipse(x,y-8-j*14,20,7,Math.sin(t+j)*.2,0,Math.PI*2);c.stroke()}c.globalAlpha=fade}
  c.restore();return;
 }
 // Six distinct planting trajectories from the fan in front of the caster to the six vertices.
 for(let i=0;i<6;i++){if(t<.08*i)continue;const p=flagPoint(i),start=T.plantFirst+i*T.plantStep,u=smooth((t-start)/.38),x0=s.x-s.tx+(i-2.5)*23,y0=s.y-s.ty-63-Math.sin(i/5*Math.PI)*28;flag(c,mix(x0,p.x,u),mix(y0,p.y,u)-Math.sin(u*Math.PI)*75,i,t,smooth((t-i*.08)/.15));if(u>=1&&t<start+.75){c.strokeStyle='#b4e9b6';c.globalAlpha=fade*(1-(t-start-.38)/.37);c.beginPath();c.ellipse(p.x,p.y,12+(t-start)*18,5+(t-start)*6,0,0,Math.PI*2);c.stroke();c.globalAlpha=fade}}
 if(sheets&&t>=T.tear)drawNetherSprites(c,sheets,t);
 if(t>=T.breath&&t<T.fade){const targets=e.targets;for(let wave=0;wave<T.waves;wave++){const u=(t-(T.breath+wave*T.waveStep))/T.flight;if(u<0||u>1.15)continue;for(let i=0;i<12;i++){const target=targets.length?targets[i%targets.length]:{x:Math.cos(i*Math.PI/6)*95,y:Math.sin(i*Math.PI/6)*45-12},v=clamp(u),off=Math.sin(v*Math.PI)*(i%2?-1:1)*(35+i*3),x=mix(netherMouth.x,target.x,v)+off,y=mix(netherMouth.y,target.y,v)-Math.sin(v*Math.PI)*(25+i*3),angle=Math.atan2(target.y-netherMouth.y,target.x-netherMouth.x-off);ghost(c,x,y,5+noise(i+wave*21)*3,angle,clamp((1.15-u)*5),t)}
   if(u>.92)for(const target of targets)glow(c,target.x,target.y,25,'#d1fff0',clamp((1.15-u)*3))}
 }
 c.restore();
}
