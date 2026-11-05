import type {Actor} from '../shared/world';
import {flightFrame,type SwordFlight} from '../shared/sword-flight';

// Draws the equipped image from the player's existing texture inventory. No new
// character, world, image download or mutable shared attachment is created.
export class SwordFlightVisual{
 age=0;landingAge=0;token=-1;frame:ReturnType<typeof flightFrame>|null=null;
 update(a:Actor,dt:number){const source=a.swordFlight;if(!source){this.frame=null;this.token=-1;return}
  // Own dir is already predicted by NetworkGameSession. Use it for visual yaw
  // as well, so the blade and face respond together without a snapshot delay.
  const f=source.phase==='riding'?{...source,heading:a.dir,facing:Math.abs(Math.cos(a.dir))>.15?(Math.cos(a.dir)<0?-1:1) as 1|-1:source.facing}:source;
  if(this.token!==f.id){this.token=f.id;this.age=f.elapsed;this.landingAge=f.landingElapsed}
  else{this.age=Math.min(f.elapsed+.1,Math.max(f.elapsed,this.age+dt));this.landingAge=f.phase==='landing'?Math.min(f.landingElapsed+.1,Math.max(f.landingElapsed,this.landingAge+dt)):0}
  this.frame=flightFrame({...f,landingElapsed:this.landingAge},a,this.age);
 }
 weapon(player:any,f:SwordFlight,scale:number){const nc=(window as any).NC,raw=nc.ITEMS[player.equip.top]?.attachments.find((a:any)=>a.accessoryId===f.weaponId);if(!raw)return null;
  const a=nc.resolveAttachment(raw,player.renderPose()),image=nc.SPR[a.sprite]?.img;if(!image)return null;
  const m=nc.attachmentMatrix(player.equip,{...player.renderPose(),sq:1,face:1,turn:0,rot:0},a,0,0,scale),k=Math.sqrt(Math.abs(m.a*m.d-m.b*m.c));
  return{image,w:a.w*k*this.frame!.size,h:a.h*k*this.frame!.size};
 }
 drawShadow(c:CanvasRenderingContext2D,w:{w:number;h:number}){const f=this.frame!;c.save();c.translate(f.x,f.y);c.scale(1,f.planeScaleY);c.rotate(f.heading);c.fillStyle='rgba(8,9,18,.34)';c.beginPath();c.ellipse(0,0,w.h*.48,Math.max(5,w.w*.42),0,0,Math.PI*2);c.fill();c.restore()}
 drawSword(c:CanvasRenderingContext2D,w:{image:CanvasImageSource;w:number;h:number}){const f=this.frame!;c.save();c.translate(f.x,f.y-f.height);c.scale(1,f.planeScaleY);c.rotate(f.heading-f.tipAngle);c.drawImage(w.image,-w.w/2,-w.h/2,w.w,w.h);c.restore()}
 bodyOrigin(player:any,a:Actor,scale:number){const f=this.frame!;if(f.phase==='orbit'||f.phase==='settle')return{x:a.x,y:a.y};
  const joints=(window as any).NC.rigJoints(player.equip,player.renderPose(),0,0,scale),blend=f.phase==='jump'?Math.min(1,f.jump*4):1;
  return{x:a.x-(joints.ftN[0]+joints.ftF[0])*.5*blend,y:a.y-f.riderHeight-(joints.ftN[1]+joints.ftF[1])*.5*blend};
 }
}
