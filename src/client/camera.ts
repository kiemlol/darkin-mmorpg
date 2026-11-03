export type Bounds={x0:number;y0:number;x1:number;y1:number};
export class Camera2D{
 x=0;y=0;private target:{x:number;y:number}|null=null;
 reset(x:number,y:number){this.x=x;this.y=y;this.target={x,y}}
 follow(x:number,y:number,dt:number){
  if(!this.target||Math.hypot(x-this.target.x,y-this.target.y)>100){this.reset(x,y);return}
  if(dt<=0)return;
  // Exact first-order follow for a target moving linearly during this frame.
  // Unlike applying an exponential lerp to the final sample, this has the same
  // steady-state lag at 30/60/144 Hz and on frames with varying duration.
  const rate=15,decay=Math.exp(-dt*rate),ramp=1-(1-decay)/(dt*rate);
  this.x+=(this.target.x-this.x)*(1-decay)+(x-this.target.x)*ramp;
  this.y+=(this.target.y-this.y)*(1-decay)+(y-this.target.y)*ramp;
  this.target={x,y};
 }
 viewport(w:number,h:number,zoom:number,b:Bounds){return{x:Math.max(b.x0,Math.min(b.x1-w/zoom,this.x-w/zoom*.5)),y:Math.max(b.y0,Math.min(b.y1-h/zoom,this.y-h/zoom*.57))}}
}
