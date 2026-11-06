import {loadMap} from '../src/client/map';
import {MapRenderer} from '../public/game-data/maps/map-runtime.mjs';
import {InventoryArt} from '../src/client/inventory-art';
import {hudArt} from '../src/client/hud-art';
const check=(condition:unknown,message:string)=>{if(!condition)throw Error(message)};
(window as any).runPolishChecks=async()=>{
 const art=new InventoryArt();await art.load();let translucent=0,brightFringe=0;
 for(const [id,s]of art.sprites){const data=s.getContext('2d')!.getImageData(0,0,s.width,s.height).data;for(let i=0;i<data.length;i+=4){if(data[i+3]>0&&data[i+3]<255)translucent++;if(data[i+3]>60&&data[i+3]<240&&Math.min(data[i],data[i+1],data[i+2])>200)brightFringe++}check(data[3]===0,'sprite exterior alpha clear: '+id)}
 check(translucent>100,'soft alpha outline replaces hard JPEG clipping');check(brightFringe<translucent*.02,'white matte removed from antialiased outline');
 const frame=await hudArt('/game-data/player-hud/player-frame.jpg',true),fc=frame.getContext('2d')!;check(fc.getImageData(170,180,1,1).data[3]===0,'portrait hole clear');
 // Draw actual sprites on three backgrounds. Interior white petals/highlights
 // must survive; only exterior matte/outline is decoded.
 for(const color of ['#161219','#80a655','#fff']){const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const c=canvas.getContext('2d')!;c.fillStyle=color;c.fillRect(0,0,1280,720);art.draw(c,'frame',0,0,1280);for(let i=0;i<4;i++)art.draw(c,'itemIdle',160+i*160,480,130);art.draw(c,'head',850,480,130);art.draw(c,'pagePrevious',1060,480,100);canvas.dataset.color=color;document.body.append(canvas)}
 const {player}=await loadMap(),p=player.project,renderer=player.renderer as any,reference=new MapRenderer(structuredClone(p),renderer.images),canvas=document.createElement('canvas'),ref=document.createElement('canvas');canvas.width=ref.width=800;canvas.height=ref.height=450;const c=canvas.getContext('2d')!,rc=ref.getContext('2d')!,road=p.roads[0].points[1],view={x:road.x-400,y:road.y-225,width:800,height:450,zoom:1,time:0,actor:null,actors:[]} as any;
 let endpointDelta=0;
 for(const hour of [12,0]){p.lighting={...p.lighting,mode:'time',hour};reference.project.lighting={...p.lighting};renderer.draw(c,view);reference.draw(rc,view);const a=c.getImageData(0,0,800,450).data,b=rc.getImageData(0,0,800,450).data;for(let i=0;i<a.length;i++)endpointDelta=Math.max(endpointDelta,Math.abs(a[i]-b[i]))}check(endpointDelta<=2,'day/night endpoint images match original Studio runtime');
 const warm=renderer.diagnostics(),times:number[]=[];let last:number[]|null=null,maxStep=0;
 for(let i=0;i<240;i++){p.lighting.hour=5.5+i/240;const start=performance.now();renderer.draw(c,view);times.push(performance.now()-start);const pixel=Array.from(c.getImageData(400,225,1,1).data);if(last)for(let j=0;j<3;j++)maxStep=Math.max(maxStep,Math.abs(pixel[j]-last[j]));last=pixel}
 check(renderer.diagnostics().tileBuilds===warm.tileBuilds,'no terrain recompiles during dawn');check(renderer.diagnostics().roadBuilds===warm.roadBuilds,'no procedural road recompiles during dawn');check(maxStep<=3,'no visible light jump at former 5-minute boundary');
 // Sunset and overview cache must also reuse both endpoint palettes.
 for(const hour of [17.5,18,18.5,19,19.5]){p.lighting.hour=hour;renderer.draw(c,view)}check(renderer.diagnostics().tileBuilds===warm.tileBuilds,'sunset also uses existing tiles');
 renderer.draw(c,{...view,zoom:.1});const overviewWarm=renderer.diagnostics();for(const hour of [5,5.5,6,6.5,7]){p.lighting.hour=hour;renderer.draw(c,{...view,zoom:.1})}check(renderer.diagnostics().tileBuilds===overviewWarm.tileBuilds,'zoomed-out endpoint cache stable');
 times.sort((a,b)=>a-b);return{translucent,brightFringe,endpointDelta,maxStep,drawMedianMs:times[120],drawP95Ms:times[228],warm,after:renderer.diagnostics()};
};
