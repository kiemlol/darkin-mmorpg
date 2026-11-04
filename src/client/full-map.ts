import {MapProjection,MapLayers,canvasSize,type View} from './map-view';import type {Actor} from '../shared/world';
export class FullMapPanel{
 root=document.createElement('section');canvas=document.createElement('canvas');title=document.createElement('h2');closeButton=document.createElement('button');status=document.createElement('p');open=false;zoom=1;cx=0;cy=0;points=new Map<number,{x:number;y:number}>();projection:MapProjection|null=null;actor:Actor|null=null;view:View={x:0,y:0,scale:1};
 constructor(private onToggle:(open:boolean)=>void){this.root.id='full-map';this.root.hidden=true;this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-label','Bản đồ khám phá');this.title.id='full-map-title';const head=document.createElement('div');head.className='full-map-head';this.closeButton.id='full-map-close';this.closeButton.textContent='Đóng ×';this.closeButton.onclick=()=>this.toggle(false);head.append(this.title,this.closeButton);
  const controls=document.createElement('div');controls.className='full-map-controls';for(const [id,text,action]of [['full-map-minus','−',()=>this.zoomAt(1/1.25)],['full-map-plus','+',()=>this.zoomAt(1.25)],['full-map-center','Về vị trí tôi',()=>{if(this.actor){this.cx=this.actor.x;this.cy=this.actor.y;this.zoom=Math.max(2,this.zoom)}}],['full-map-fit','Toàn map',()=>this.fit()]] as const){const b=document.createElement('button');b.id=id;b.textContent=text;b.onclick=action;controls.append(b)}this.canvas.id='full-map-canvas';this.status.className='full-map-status';this.root.append(head,controls,this.canvas,this.status);document.body.append(this.root);
  this.canvas.addEventListener('wheel',e=>{e.preventDefault();const r=this.canvas.getBoundingClientRect();this.zoomAt(Math.exp(-e.deltaY*.001),e.clientX-r.left,e.clientY-r.top)},{passive:false});
  this.canvas.addEventListener('pointerdown',e=>{e.preventDefault();this.canvas.setPointerCapture(e.pointerId);const r=this.canvas.getBoundingClientRect();this.points.set(e.pointerId,{x:e.clientX-r.left,y:e.clientY-r.top})});
  this.canvas.addEventListener('pointermove',e=>{if(!this.points.has(e.pointerId))return;const prev=[...this.points.values()],r=this.canvas.getBoundingClientRect();this.points.set(e.pointerId,{x:e.clientX-r.left,y:e.clientY-r.top});const now=[...this.points.values()];
   if(now.length===1){this.cx-=(now[0].x-prev[0].x)/this.view.scale;this.cy-=(now[0].y-prev[0].y)/this.view.scale}
   else if(now.length===2&&prev.length===2){const oldD=Math.hypot(prev[0].x-prev[1].x,prev[0].y-prev[1].y),newD=Math.hypot(now[0].x-now[1].x,now[0].y-now[1].y),ox=(prev[0].x+prev[1].x)/2,oy=(prev[0].y+prev[1].y)/2;this.zoomAt(newD/Math.max(1,oldD),ox,oy);this.cx-=((now[0].x+now[1].x)/2-ox)/this.view.scale;this.cy-=((now[0].y+now[1].y)/2-oy)/this.view.scale}
   this.clamp();this.refreshView();
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])this.canvas.addEventListener(event,(e:any)=>{this.points.delete(e.pointerId)});
 }
 toggle(open=!this.open){this.open=open;this.root.hidden=!open;document.body.classList.toggle('map-open',open);this.release();if(open){this.fit();this.closeButton.focus()}this.onToggle(open)}
 release(){for(const id of this.points.keys())if(this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);this.points.clear()}
 setMap(name:string,p:MapProjection){this.title.textContent=name;this.projection=p;this.actor=null;this.fit()}
 fit(){if(this.projection){this.zoom=1;this.cx=this.projection.worldWidth/2;this.cy=this.projection.worldHeight/2;this.refreshView()}}
 refreshView(){if(this.projection){const r=this.canvas.getBoundingClientRect();this.view=this.projection.fit(Math.max(1,r.width),Math.max(1,r.height),this.zoom,this.cx,this.cy)}}
 clamp(){if(this.projection){this.cx=Math.max(0,Math.min(this.projection.worldWidth,this.cx));this.cy=Math.max(0,Math.min(this.projection.worldHeight,this.cy))}}
 zoomAt(factor:number,x?:number,y?:number){if(!this.projection||!Number.isFinite(factor))return;const r=this.canvas.getBoundingClientRect(),px=x??r.width/2,py=y??r.height/2,world=this.projection.inverse(this.view,px,py);this.zoom=Math.max(1,Math.min(8,this.zoom*factor));const scale=this.projection.fit(r.width,r.height,this.zoom).scale;this.cx=world.x-(px-r.width/2)/scale;this.cy=world.y-(py-r.height/2)/scale;this.clamp();this.refreshView()}
 draw(layers:MapLayers,actor:Actor|null){this.actor=actor;if(!this.open||!this.projection)return;const {ctx,w,h}=canvasSize(this.canvas);this.view=this.projection.fit(w,h,this.zoom,this.cx,this.cy);layers.draw(ctx,w,h,this.view,actor)}
 destroy(){this.release();this.root.remove()}
}
