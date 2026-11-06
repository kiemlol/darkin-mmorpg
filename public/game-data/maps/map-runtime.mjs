// Game compatibility facade. Studio's supplied module remains byte-for-byte
// intact; never evaluate runtime.source from a bundle.
import * as Studio from './studio/map-runtime.mjs';
export * from './studio/map-runtime.mjs';
// Retain two game interaction extensions: zero reward and handler-only gather.
// Studio validates an isolated validation view; the original map is returned
// unchanged and the authoritative InteractionSystem still validates/handles it.
export function validateMap(project){
 let changed=false;
 const objects=project?.objects?.map(o=>{
  const i=o.interaction;if(!i)return o;let reward=i.reward;
  if(i.type==='custom'&&reward===undefined)reward=null;
  if(i.type==='gather'&&reward===undefined)reward={resourceId:'validation_only',min:1,max:1};
  if(reward&&reward.min===0&&Number.isSafeInteger(reward.max)&&reward.max>=0)reward={...reward,min:1,max:Math.max(1,reward.max)};
  if(reward===i.reward)return o;changed=true;return {...o,interaction:{...i,reward}};
 });
 Studio.validateMap(changed?{...project,objects}:project);return project;
}
const activity=new WeakMap();
export function setObjectActivity(project,isActive){if(isActive)activity.set(project,isActive);else activity.delete(project)}
const optionsFor=(project,options)=>({isObjectActive:activity.get(project)||(()=>true),...options});
export function pointWalkable(project,x,y,options={}){return Studio.pointWalkable(project,x,y,optionsFor(project,options))}
export function canWalk(project,x,y,r=12,options={}){return Studio.canWalk(project,x,y,r,optionsFor(project,options))}
export function moveActor(project,actor,dx,dy,dt,speed=180,options={}){return Studio.moveActor(project,actor,dx,dy,dt,speed,optionsFor(project,options))}
export class MapRenderer extends Studio.MapRenderer{
 draw(ctx,options={}){
  const {actors,drawActor,entities=[],...rest}=options;
  if(!Array.isArray(actors))return super.draw(ctx,options);
  // actor remains the local player's GROUND FOOT for mask tests and lighting.
  // Draw every entity through the supplied runtime's foot-Y depth pass.
  const mapped=actors.map(a=>({y:a.y,draw:c=>{if(drawActor)drawActor(c,a)}}));
  return super.draw(ctx,{...rest,entities:[...entities,...mapped],drawActor:()=>{}});
 }
}
export class DarkinMapPlayer extends Studio.DarkinMapPlayer{
 static async load(data,resolve=src=>src){const project=structuredClone(validateMap(data.format==='darkin-map-bundle-v1'?data.project:data)),images=new Map();await Promise.all(Object.entries(project.assets).map(async([id,s])=>{const img=new Image();img.crossOrigin='anonymous';await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no(Error('Không tải được ảnh map '+id));img.src=resolve(s.src)});images.set(id,img)}));return new DarkinMapPlayer(project,images)}
 constructor(project,images){super(project,images);this.renderer=new MapRenderer(project,images)}
 update(dt,dx=0,dy=0,options={}){this.time+=Math.max(0,dt);moveActor(this.project,this.actor,dx,dy,dt,180,options);return Studio.warpAt(this.project,this.actor.x,this.actor.y)}
}
