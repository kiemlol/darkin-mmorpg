import {RUYI_SKILL,RUYI_TIMING as T} from '../shared/ruyi-staff';
import type {Actor,Snapshot} from '../shared/world';
import type {SkillCast} from '../shared/skills';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};
const rand=(i:number,seed:number)=>{const n=Math.sin(i*127.1+seed*311.7)*43758.5453;return n-Math.floor(n)};
export type StaffEffect={cast:SkillCast;age:number;seed:number};
/** Procedural material artwork: solid red/gold staff, earth fragments, dust and impact rings. */
export class RuyiStaffFX{
 effects=new Map<string,StaffEffect>();
 clear(){this.effects.clear()}
 spawn(c:SkillCast,elapsed=0){if(this.effects.has(c.id)||elapsed>=T.end)return;let seed=0;for(const ch of c.id)seed=(seed*31+ch.charCodeAt(0))>>>0;this.effects.set(c.id,{cast:{...c},age:Math.max(0,elapsed),seed})}
 update(snapshot:Snapshot,actors:Actor[],dt:number){const owners=new Map(actors.map(a=>[a.id,a]));for(const[id,e]of this.effects){const owner=owners.get(e.cast.casterId);if(!owner||owner.hp<=0||owner.teleportSeq!==e.cast.epoch){this.effects.delete(id);continue}const latest=snapshot.skillCasts?.find(c=>c.id===id);if(latest){e.cast.tx=latest.tx;e.cast.ty=latest.ty}e.age+=Math.max(0,Math.min(.25,dt));if(e.age>=T.end)this.effects.delete(id)}}
 draw(ctx:CanvasRenderingContext2D,layer:'back'|'front'){for(const e of this.effects.values())drawStaffEffect(ctx,e,layer)}
}
export function drawStaffEffect(c:CanvasRenderingContext2D,e:StaffEffect,layer:'back'|'front'){
 const {age:t,cast:s,seed}=e;if(t<0||t>=T.end)return;const fade=1-smooth((t-T.fade)/(T.end-T.fade)),hit=t-T.impact;
 c.save();c.translate(s.tx,s.ty);c.globalAlpha=fade;
 if(layer==='back'){
  // Telegraph is a ground mark: its center becomes fixed before the fall.
  if(hit<0){c.globalAlpha*=.25+.25*smooth(t/T.grow);c.strokeStyle='#ebc978';c.lineWidth=1.5;c.setLineDash([7,6]);c.beginPath();c.ellipse(0,0,RUYI_SKILL.radius,RUYI_SKILL.radius*.48,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle='#0007';c.beginPath();c.ellipse(0,0,18+18*smooth(t/T.grow),8+6*smooth(t/T.grow),0,0,Math.PI*2);c.fill()}
  if(hit>=0){const open=smooth(hit/.15);c.fillStyle='#241b16';c.beginPath();c.ellipse(0,1,48*open,19*open,0,0,Math.PI*2);c.fill();c.strokeStyle='#6e5140';c.lineWidth=5;c.stroke();
   for(let i=0;i<13;i++){const a=rand(i,seed)*Math.PI*2,r=(55+rand(i+20,seed)*96)*open;c.strokeStyle=i%2?'#211b18':'#a87a4b';c.lineWidth=i%3===0?3:1.5;c.beginPath();c.moveTo(Math.cos(a)*18,Math.sin(a)*7);c.lineTo(Math.cos(a+.09)*r*.6,Math.sin(a+.09)*r*.3);c.lineTo(Math.cos(a)*r,Math.sin(a)*r*.5);c.stroke()}
   for(let i=0;i<3;i++){const u=clamp((hit-i*.09)/.9);if(u<=0||u>=1)continue;c.globalAlpha=fade*(1-u);c.strokeStyle=i?'#c29a63':'#ffe8a3';c.lineWidth=(6-i)*(1-u)+1;c.beginPath();c.ellipse(0,0,18+u*175,8+u*80,0,0,Math.PI*2);c.stroke()}
  }
  c.restore();return;
 }
 // Launch from the caster, arc overhead, enlarge while hovering, then plunge vertically.
 let x=0,bottom=0,length=260,width=36,rotation=0;
 if(t<T.rise){const u=smooth(t/T.rise);x=(s.x-s.tx)*(1-u);bottom=(s.y-s.ty-45)*(1-u)-160*u;length=95;width=12;rotation=Math.sin(u*Math.PI)*.7}
 else if(t<T.grow){const u=smooth((t-T.rise)/(T.grow-T.rise));bottom=-160+Math.sin(t*5)*4;length=95+165*u;width=12+24*u}
 else if(t<T.impact){const u=clamp((t-T.grow)/(T.impact-T.grow));bottom=-160+184*u*u*u;length=260;width=36;
  c.save();c.globalAlpha=fade*(.3+.5*u);c.fillStyle='#f1c568';for(let j=0;j<4;j++){c.globalAlpha=fade*(.07-j*.012);c.fillRect(-width/2-j*5,bottom-length-35-j*20,width+j*10,length+30)}c.restore();
 }else bottom=24;
 c.save();c.translate(x,bottom);c.rotate(rotation);c.globalAlpha=fade;drawGoldenStaff(c,width,length);c.restore();
 if(hit>=0){
  // Ballistic chunks have distinct faces, angular velocity and ground shadows.
  for(let i=0;i<44;i++){const a=rand(i,seed)*Math.PI*2,v=65+rand(i+100,seed)*150,life=1.1+rand(i+200,seed)*1.8;if(hit>life+.65)continue;const u=Math.min(hit,life),x=Math.cos(a)*v*u,y=Math.sin(a)*v*u*.42,z=Math.max(0,(95+rand(i+300,seed)*190)*u-175*u*u),size=3+rand(i+400,seed)*9,alpha=fade*(1-smooth((hit-life)/.65));c.save();c.globalAlpha=alpha;c.fillStyle='#0004';c.beginPath();c.ellipse(x,y,size*.8,size*.3,0,0,Math.PI*2);c.fill();c.translate(x,y-z);c.rotate(i+u*(rand(i+500,seed)-.5)*10);c.fillStyle=['#8c6b49','#b68b57','#665043','#c4aa7d'][i%4];c.beginPath();c.moveTo(-size,-size*.4);c.lineTo(size*.3,-size);c.lineTo(size,size*.2);c.lineTo(size*.3,size*.7);c.lineTo(-size*.7,size);c.closePath();c.fill();c.fillStyle='#dfbb85';c.beginPath();c.moveTo(-size,-size*.4);c.lineTo(size*.3,-size);c.lineTo(size*.1,0);c.closePath();c.fill();c.restore()}
  // Dust expands, loses opacity and completely clears after the strike.
  if(hit<2.4){for(let i=0;i<17;i++){const a=i/17*Math.PI*2,r=(35+hit*70)*(1+rand(i+600,seed)*.6),x=Math.cos(a)*r,y=Math.sin(a)*r*.4-hit*8,sz=13+hit*15+rand(i+700,seed)*12;c.save();c.globalAlpha=fade*(.32*(1-hit/2.4));const g=c.createRadialGradient(x,y,0,x,y,sz);g.addColorStop(0,'#bfa176');g.addColorStop(.65,'#927955aa');g.addColorStop(1,'#92795500');c.fillStyle=g;c.fillRect(x-sz,y-sz,sz*2,sz*2);c.restore()}}
 }
 c.restore();
}
export function drawGoldenStaff(c:CanvasRenderingContext2D,w:number,h:number){
 const band=h*.2;c.save();const gold=c.createLinearGradient(-w/2,0,w/2,0);gold.addColorStop(0,'#77501b');gold.addColorStop(.2,'#d2a038');gold.addColorStop(.44,'#fff4b4');gold.addColorStop(.6,'#f6cf66');gold.addColorStop(1,'#8c5719');const red=c.createLinearGradient(-w/2,0,w/2,0);red.addColorStop(0,'#360f0e');red.addColorStop(.3,'#a12d24');red.addColorStop(.48,'#df5c3b');red.addColorStop(.72,'#94261d');red.addColorStop(1,'#2b100e');
 c.fillStyle=red;c.fillRect(-w/2,-h,w,h);c.strokeStyle='#251610';c.lineWidth=1.5;c.strokeRect(-w/2,-h,w,h);c.fillStyle=gold;c.fillRect(-w*.56,-h,w*1.12,band);c.fillRect(-w*.56,-band,w*1.12,band);
 c.strokeStyle='#83551c';c.lineWidth=Math.max(1,w*.045);for(const y of [-h,-band]){for(let i=0;i<4;i++){const yy=y+band*(i+.5)/4;c.beginPath();c.moveTo(-w*.43,yy);c.bezierCurveTo(-w*.2,yy-band*.2,w*.15,yy+band*.2,w*.43,yy);c.stroke()}c.fillStyle=gold;c.fillRect(-w*.65,y,w*1.3,h*.02);c.fillRect(-w*.65,y+band-h*.02,w*1.3,h*.02)}
 c.strokeStyle='#e8be60';c.lineWidth=Math.max(.7,w*.025);for(let i=0;i<6;i++){const y=-h+band+(h-2*band)*(i+.5)/6;c.beginPath();c.moveTo(0,y-8);c.lineTo(w*.2,y);c.lineTo(0,y+8);c.lineTo(-w*.2,y);c.closePath();c.stroke()}c.restore();
}
