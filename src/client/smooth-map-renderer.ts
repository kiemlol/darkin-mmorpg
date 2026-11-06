import {MapRenderer,nightness,lightingSettings} from '../../public/game-data/maps/map-runtime.mjs';
// Same Studio geometry/depth/lighting API. Only procedural terrain/road palettes
// use cached endpoints; fractional clock changes never compile noise textures.
export class SmoothMapRenderer extends MapRenderer{
 private palettes=[new Map(),new Map()];private overviews:any[]=[];
 private tiles=new WeakSet<object>();tileBuilds=0;roadBuilds=0;roadBlends=0;tileBlends=0;
 private pairs=new Map<string,[HTMLCanvasElement,HTMLCanvasElement]>();
 private mixed=new WeakMap<HTMLCanvasElement,{night:HTMLCanvasElement;canvas:HTMLCanvasElement;context:CanvasRenderingContext2D;mix:number}>();
 private roads=new Map<string,{day:CanvasPattern;night:CanvasPattern;canvas:HTMLCanvasElement;context:CanvasRenderingContext2D;pattern:CanvasPattern|null;mix:number}>();
 private palette<T>(n:0|1,fn:()=>T):T{
  const saved=this.project.lighting,cache=this.cache,overview=(this as any).overviewCache;
  this.project.lighting={...saved,mode:n?'night':'day'};this.cache=this.palettes[n];(this as any).overviewCache=this.overviews[n];
  try{return fn()}finally{this.overviews[n]=(this as any).overviewCache;this.project.lighting=saved;this.cache=cache;(this as any).overviewCache=overview}
 }
 // Blend to opaque textures BEFORE the original +.2px tile overdraw. Applying
 // alpha to overlapping world tiles twice leaves dark grid lines at dawn.
 private blend(day:HTMLCanvasElement,night:HTMLCanvasElement,n:number){
  let entry=this.mixed.get(day);if(!entry||entry.night!==night){const canvas=document.createElement('canvas');canvas.width=day.width;canvas.height=day.height;entry={night,canvas,context:canvas.getContext('2d')!,mix:-1};this.mixed.set(day,entry)}
  if(n===0)return day;if(n===1)return night;
  const sample=Math.round(n*1024)/1024;if(entry.mix!==sample){const c=entry.context;c.globalAlpha=1;c.clearRect(0,0,entry.canvas.width,entry.canvas.height);c.drawImage(day,0,0);c.globalAlpha=sample;c.drawImage(night,0,0);c.globalAlpha=1;entry.mix=sample;this.tileBlends++}return entry.canvas;
 }
 tile(type:string,x:number,y:number,overview=false){
  const p=this.project,l=lightingSettings(p),i=y*p.cols+x,key=[type,x,y,overview,p.cell,p.seed,l.blend,l.details,this.images.size,p.terrain[i-1],p.terrain[i],p.terrain[i+1],p.terrain[i-p.cols],p.terrain[i+p.cols]].join(':');let pair=this.pairs.get(key);
  if(!pair){pair=[this.palette(0,()=>super.tile(type,x,y,overview)),this.palette(1,()=>super.tile(type,x,y,overview))];this.pairs.set(key,pair);if(this.pairs.size>1200)this.pairs.delete(this.pairs.keys().next().value!);for(const canvas of pair)if(!this.tiles.has(canvas)){this.tiles.add(canvas);this.tileBuilds++}}
  if(p.assets[type]?.kind==='ground'&&this.images.has(type))return pair[0];return this.blend(pair[0],pair[1],nightness(p));
 }
 overview(){const n=nightness(this.project),day=this.palette(0,()=>super.overview()),night=this.palette(1,()=>super.overview());return this.blend(day,night,n)}
 roadTexture(ctx:CanvasRenderingContext2D,material:string){
  const key=material+':'+this.project.seed;let entry=this.roads.get(key);if(!entry){const day=this.palette(0,()=>super.roadTexture(ctx,material)),night=this.palette(1,()=>super.roadTexture(ctx,material));if(!day||!night)return null;const canvas=document.createElement('canvas');canvas.width=300;canvas.height=210;entry={day,night,canvas,context:canvas.getContext('2d')!,pattern:null,mix:-1};this.roads.set(key,entry);this.roadBuilds+=2}
  // Subpixel color precision, with fewer native pattern allocations than RAF.
  const n=Math.round(nightness(this.project)*1024)/1024;if(entry.mix!==n){const c=entry.context;c.globalAlpha=1;c.fillStyle=entry.day;c.fillRect(0,0,300,210);c.globalAlpha=n;c.fillStyle=entry.night;c.fillRect(0,0,300,210);c.globalAlpha=1;entry.pattern=ctx.createPattern(entry.canvas,'repeat');entry.mix=n;this.roadBlends++}return entry.pattern;
 }
 diagnostics(){return{tileBuilds:this.tileBuilds,tileBlends:this.tileBlends,roadBuilds:this.roadBuilds,roadBlends:this.roadBlends,dayTiles:this.palettes[0].size,nightTiles:this.palettes[1].size,hour:lightingSettings(this.project).hour,night:nightness(this.project)}}
}
