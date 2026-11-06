import {MapRenderer,nightness} from '../../public/game-data/maps/map-runtime.mjs';
// Same Studio geometry/depth/lighting API. Only procedural terrain/road palettes
// use cached endpoints; fractional clock changes never compile noise textures.
export class SmoothMapRenderer extends MapRenderer{
 private palettes=[new Map(),new Map()];private overviews:any[]=[];
 private tiles=new WeakSet<object>();tileBuilds=0;roadBuilds=0;roadBlends=0;
 private roads=new Map<string,{day:CanvasPattern;night:CanvasPattern;canvas:HTMLCanvasElement;context:CanvasRenderingContext2D;pattern:CanvasPattern|null;mix:number}>();
 private palette<T>(n:0|1,fn:()=>T):T{
  const saved=this.project.lighting,cache=this.cache,overview=(this as any).overviewCache;
  this.project.lighting={...saved,mode:n?'night':'day'};this.cache=this.palettes[n];(this as any).overviewCache=this.overviews[n];
  try{return fn()}finally{this.overviews[n]=(this as any).overviewCache;this.project.lighting=saved;this.cache=cache;(this as any).overviewCache=overview}
 }
 tile(type:string,x:number,y:number,overview=false){const canvas=super.tile(type,x,y,overview);if(!this.tiles.has(canvas)){this.tiles.add(canvas);this.tileBuilds++}return canvas}
 drawTerrain(ctx:CanvasRenderingContext2D,view:any){const n=nightness(this.project),alpha=ctx.globalAlpha;ctx.save();this.palette(0,()=>super.drawTerrain(ctx,view));ctx.globalAlpha=alpha*n;this.palette(1,()=>super.drawTerrain(ctx,view));ctx.restore()}
 roadTexture(ctx:CanvasRenderingContext2D,material:string){
  const key=material+':'+this.project.seed;let entry=this.roads.get(key);if(!entry){const day=this.palette(0,()=>super.roadTexture(ctx,material)),night=this.palette(1,()=>super.roadTexture(ctx,material));if(!day||!night)return null;const canvas=document.createElement('canvas');canvas.width=300;canvas.height=210;entry={day,night,canvas,context:canvas.getContext('2d')!,pattern:null,mix:-1};this.roads.set(key,entry);this.roadBuilds+=2}
  // Subpixel color precision, with fewer native pattern allocations than RAF.
  const n=Math.round(nightness(this.project)*1024)/1024;if(entry.mix!==n){const c=entry.context;c.globalAlpha=1;c.fillStyle=entry.day;c.fillRect(0,0,300,210);c.globalAlpha=n;c.fillStyle=entry.night;c.fillRect(0,0,300,210);c.globalAlpha=1;entry.pattern=ctx.createPattern(entry.canvas,'repeat');entry.mix=n;this.roadBlends++}return entry.pattern;
 }
 diagnostics(){return{tileBuilds:this.tileBuilds,roadBuilds:this.roadBuilds,roadBlends:this.roadBlends,dayTiles:this.palettes[0].size,nightTiles:this.palettes[1].size,hour:this.project.lighting.hour,night:nightness(this.project)}}
}
