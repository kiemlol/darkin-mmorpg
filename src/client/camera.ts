export type Bounds={x0:number;y0:number;x1:number;y1:number};
export class Camera2D{
 x=0;y=0;
 follow(x:number,y:number,dt:number){const k=1-Math.exp(-dt*15);this.x+=(x-this.x)*k;this.y+=(y-this.y)*k}
 viewport(w:number,h:number,zoom:number,b:Bounds){return{x:Math.max(b.x0,Math.min(b.x1-w/zoom,this.x-w/zoom*.5)),y:Math.max(b.y0,Math.min(b.y1-h/zoom,this.y-h/zoom*.57))}}
}
