import {MapRenderer} from '../../public/game-data/maps/map-runtime.mjs';
import type {Actor} from '../shared/world';import type {ExplorationStore} from '../shared/map-state';
export type View={x:number;y:number;scale:number};
export class MapProjection{
 constructor(public worldWidth:number,public worldHeight:number){}
 fit(w:number,h:number,zoom=1,cx=this.worldWidth/2,cy=this.worldHeight/2):View{const scale=Math.min(w/this.worldWidth,h/this.worldHeight)*zoom;return{x:w/2-cx*scale,y:h/2-cy*scale,scale}}
 mini(w:number,h:number,a:Actor,range:number):View{const scale=Math.max(w/Math.min(range*w/h,this.worldWidth),h/Math.min(range,this.worldHeight));const vw=w/scale,vh=h/scale,cx=Math.max(vw/2,Math.min(this.worldWidth-vw/2,a.x)),cy=Math.max(vh/2,Math.min(this.worldHeight-vh/2,a.y));return{x:w/2-cx*scale,y:h/2-cy*scale,scale}}
 point(v:View,x:number,y:number){return{x:v.x+x*v.scale,y:v.y+y*v.scale}}
 inverse(v:View,x:number,y:number){return{x:(x-v.x)/v.scale,y:(y-v.y)/v.scale}}
}
export class MapBaseCache{
 entries=new Map<string,HTMLCanvasElement>();builds=0;
 renderers=new Map<string,MapRenderer>();
 get(p:any,images:Map<string,HTMLImageElement>,revision:string,hidden:string[]=[]){const key=p.id+':'+revision+':'+hidden.join(',');if(this.entries.has(key))return this.entries.get(key)!;
  const rendererKey=p.id+':'+revision;let renderer=this.renderers.get(rendererKey);if(!renderer){const neutral=structuredClone(p);neutral.lighting={...neutral.lighting,mode:'day',hour:12,ambient:1,vignette:false,playerLight:false};renderer=new MapRenderer(neutral,images);this.renderers.set(rendererKey,renderer);if(this.renderers.size>2)this.renderers.delete(this.renderers.keys().next().value!)}
  const factor=Math.min(1/3,1536/Math.max(p.cols*p.cell,p.rows*p.cell)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(p.cols*p.cell*factor));canvas.height=Math.max(1,Math.ceil(p.rows*p.cell*factor));
  const inactive=new Set(hidden);renderer.draw(canvas.getContext('2d'),{x:0,y:0,width:canvas.width,height:canvas.height,zoom:factor,actor:null,actors:[],markers:false,grid:false,collision:false,time:0,objectState:(id:string)=>({hidden:inactive.has(id)})} as any);
  this.entries.set(key,canvas);this.builds++;if(this.entries.size>2)this.entries.delete(this.entries.keys().next().value!);return canvas;
 }
}
export class MapLayers{
 composite=document.createElement('canvas');fog=document.createElement('canvas');seenVersion=-1;elapsed=1;builds=0;
 constructor(public base:HTMLCanvasElement,public width:number,public height:number){this.composite.width=base.width;this.composite.height=base.height}
 update(store:ExplorationStore,dt:number){this.elapsed+=dt;if(this.seenVersion===store.version||this.elapsed<.1)return;
  this.elapsed=0;this.seenVersion=store.version;this.fog.width=store.cols;this.fog.height=store.rows;const fc=this.fog.getContext('2d')!,data=fc.createImageData(store.cols,store.rows);for(let i=0;i<store.seen.length;i++)data.data.set([22,19,34,store.seen[i]?0:150],i*4);fc.putImageData(data,0,0);
  const c=this.composite.getContext('2d')!;c.clearRect(0,0,c.canvas.width,c.canvas.height);c.drawImage(this.base,0,0);c.save();c.scale(this.base.width/this.width,this.base.height/this.height);c.beginPath();c.rect(0,0,this.width,this.height);c.clip();c.imageSmoothingEnabled=true;c.drawImage(this.fog,0,0,store.cols*store.cellSize,store.rows*store.cellSize);c.restore();this.builds++;
 }
 draw(ctx:CanvasRenderingContext2D,w:number,h:number,v:View,actor:Actor|null){ctx.save();ctx.fillStyle='#16211e';ctx.fillRect(0,0,w,h);ctx.translate(v.x,v.y);ctx.scale(v.scale,v.scale);ctx.drawImage(this.composite,0,0,this.width,this.height);ctx.restore();if(!actor)return;
  const x=v.x+actor.x*v.scale,y=v.y+actor.y*v.scale;ctx.save();ctx.translate(x,y);ctx.fillStyle='#fff2af';ctx.strokeStyle='#15302c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.rotate(actor.dir);ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(5,-4);ctx.lineTo(5,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 }
}
export function canvasSize(canvas:HTMLCanvasElement){const r=canvas.getBoundingClientRect(),dpr=Math.min(3,devicePixelRatio||1),w=Math.max(1,r.width),h=Math.max(1,r.height);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}const ctx=canvas.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{ctx,w,h}}
