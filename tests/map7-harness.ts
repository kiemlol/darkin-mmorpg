import {loadMap} from '../src/client/map';import {MapRenderer,assetGeometry,objectOccludesActor,objectGroundPoint,objectBounds,lightingSettings} from '../public/game-data/maps/map-runtime.mjs';
const check=(v:any,m:string)=>{if(!v)throw Error(m)};
(window as any).runMap7Checks=async()=>{
 const {player}=await loadMap(),p=player.project,renderer=player.renderer as any,c=(document.getElementById('c') as HTMLCanvasElement).getContext('2d')!;
 const source=JSON.stringify(p),o=p.objects.find((o:any)=>p.assets[o.asset].occlusionMask&&p.assets[o.asset].fadeBehind),image=renderer.images.get(o.asset),g=assetGeometry(p.assets[o.asset],image);check(g,'exported mask decoded');
 const fixture=structuredClone(p);fixture.objects=[structuredClone(o)];fixture.lighting={...p.lighting,mode:'day',vignette:false,playerLight:false};const fr=new MapRenderer(fixture,renderer.images),obj=fixture.objects[0],draw=c.drawImage.bind(c);let alpha:number[]=[];
 (c as any).drawImage=(...args:any[])=>{if(args[0]===image)alpha.push(c.globalAlpha);(draw as any)(...args)};
 let cases=0;
 for(const rotation of [0,.5])for(const flip of [false,true])for(const scale of [.7,1.4]){
  Object.assign(obj,{rotation,flip,scale});const b=objectBounds(fixture,obj),foot=objectGroundPoint(fixture,obj,g);let inside:any=null,outside:any=null;
  for(let y=b.y0;y<foot.y;y+=8)for(let x=b.x0;x<b.x1;x+=8){const actor={id:'local',x,y,radius:12,occlusionHeight:110};if(objectOccludesActor(fixture,obj,actor,g))inside??=actor;else outside??=actor}
  check(inside&&outside,'both opaque foliage and transparent margin fixtures exist');
  for(const actor of [inside,outside,{x:foot.x,y:foot.y+2,radius:12,occlusionHeight:110}]){alpha=[];let actors=0;c.setTransform(1,0,0,1,0,0);fr.draw(c,{x:b.x0-20,y:b.y0-20,width:900,height:600,zoom:1,actor,actors:[{...actor,id:'local'},{id:'peer',x:actor.x+20,y:actor.y+20}],drawActor:()=>actors++});check(actors===2,'two actors use same supplied depth pass');const expected=objectOccludesActor(fixture,obj,actor,g)?.5:1;check(alpha.length===1&&Math.abs(alpha[0]-expected)<.001,'actual image fade follows mask, transformed foot and body samples');cases++}
 }
 (c as any).drawImage=draw;check(JSON.stringify(p)===source,'occlusion never rewrites source map');
 p.lighting={...p.lighting,mode:'time',hour:5.8};const point=p.roads[0].points[1],view={x:point.x-450,y:point.y-300,width:900,height:600,zoom:1,time:0,dt:1/60,actor:null,actors:[]}as any;
 renderer.draw(c,view);const cache=renderer.cache,warm=renderer.diagnostics(),roadCache=(renderer as any).roadTextures,light=(renderer as any).lightCanvas;let last:number[]|null=null,maxStep=0;
 for(let i=0;i<180;i++){p.lighting.hour=5.8+i*.002;renderer.draw(c,{...view,time:i/60});const pixel=Array.from(c.getImageData(450,300,1,1).data);if(last)for(let k=0;k<3;k++)maxStep=Math.max(maxStep,Math.abs(pixel[k]-last[k]));last=pixel}
 const after=renderer.diagnostics();check(renderer.cache===cache&&(renderer as any).roadTextures===roadCache,'same cache objects through clock ticks');check(after.tileBuilds===warm.tileBuilds&&after.roadBuilds===warm.roadBuilds,'zero terrain/road rebuilds during dawn');check((renderer as any).lightCanvas===light,'light canvas reused');check(maxStep<=3,'no visible step at clock boundaries');
 const reference=new MapRenderer(structuredClone(p),renderer.images),other=document.createElement('canvas');other.width=900;other.height=600;reference.lightingTransition.reset();renderer.lightingTransition.reset();renderer.draw(c,view);reference.draw(other.getContext('2d'),view);const a=c.getImageData(0,0,900,600).data,b=other.getContext('2d')!.getImageData(0,0,900,600).data;let delta=0;for(let i=0;i<a.length;i++)delta=Math.max(delta,Math.abs(a[i]-b[i]));check(delta===0,'renderer preserves supplied runtime pixels for roads, terrain and lighting');
 return{pass:true,maskCases:cases,cacheBefore:warm,cacheAfter:after,maxPixelStep:maxStep,suppliedRendererDelta:delta};
};
