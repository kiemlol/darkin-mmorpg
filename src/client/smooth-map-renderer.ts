import {MapRenderer,nightness,lightingSettings} from '../../public/game-data/maps/map-runtime.mjs';
// Runtime v8 already blends complete day/night ground layers continuously.
// Observe its endpoint caches; never invalidate them because the clock advanced.
export class SmoothMapRenderer extends MapRenderer{
 private tiles=new WeakSet<object>();private patterns=new WeakSet<object>();private overviews=new WeakSet<object>();
 tileBuilds=0;roadBuilds=0;overviewBuilds=0;
 tile(type:string,x:number,y:number,overview=false,n=nightness(this.project)){
  const canvas=super.tile(type,x,y,overview,n);if(!this.tiles.has(canvas)){this.tiles.add(canvas);this.tileBuilds++}return canvas;
 }
 roadTexture(ctx:CanvasRenderingContext2D,material:string,n=nightness(this.project)){
  const pattern=super.roadTexture(ctx,material,n);if(pattern&&!this.patterns.has(pattern)){this.patterns.add(pattern);this.roadBuilds++}return pattern;
 }
 overview(n=nightness(this.project)){const canvas=super.overview(n);if(!this.overviews.has(canvas)){this.overviews.add(canvas);this.overviewBuilds++}return canvas}
 diagnostics(){return{tileBuilds:this.tileBuilds,roadBuilds:this.roadBuilds,overviewBuilds:this.overviewBuilds,tileCache:this.cache.size,roadCache:(this as any).roadTextures?.size||0,hour:lightingSettings(this.project).hour,night:this.displayLighting?.n??nightness(this.project)}}
}
