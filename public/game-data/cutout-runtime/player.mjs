import {sample,validate,PARTS} from './model.mjs';
import {loadAttachmentSprites} from './wings.mjs';
import {validAnimationId,readAnimationPack} from './animation-identity.mjs';
import {validateAccessoryPack,equipAccessory} from './accessory-runtime.mjs';
import {targetSignature} from './accessory-runtime.mjs';
const NC=window.NC;
// Game extensions: decoded images are shared; each fork keeps its own clock/pose.
const imageCache=new Map(),imageRefs=new Map();
const releaseImages=urls=>{for(const src of urls||[]){const n=(imageRefs.get(src)||1)-1;if(n<=0){imageRefs.delete(src);imageCache.delete(src)}else imageRefs.set(src,n)}};
const loadImage=src=>{if(!imageCache.has(src))imageCache.set(src,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{imageCache.delete(src);reject(Error('Không tìm được ảnh: '+src.slice(0,100)))};img.src=src}));return imageCache.get(src)};
export class CutoutPlayer {
  static async load(spec, base=new URL('../',import.meta.url),{resolveSource}={}){
    const source=src=>resolveSource?resolveSource(src):src.startsWith('data:')?src:new URL(src,base).href,ownedImages=new Set();
    const image=src=>{if(!ownedImages.has(src)){ownedImages.add(src);imageRefs.set(src,(imageRefs.get(src)||0)+1)}return loadImage(src)};
    try{
    // Authored poses must not be overwritten by automatic weapon-grip correction.
    NC.GRIPFIX=false;
    if(spec.format!=='cutout-character-v1')throw Error('Không đúng định dạng nhân vật');
    spec=structuredClone(spec);for(const [key,clip]of Object.entries(spec.clips))if(!validAnimationId(clip.id))throw Error('Clip '+key+' chưa có animationId cố định; hãy đăng ký/migrate trước khi tải');
    for(const clip of Object.values(spec.clips))validate({format:'nightcamp-cutout-v1',rig:spec.rig,parts:spec.parts,attachments:spec.attachments,clip});
    for(const id of ['idle','walk','run','attack'])if(!spec.clips[id])throw Error('Thiếu clip '+id);
    // Texture/rig handles are per runtime instance, not animation identities.
    // Share the counter across bundled and direct-ESM copies using the same NC.
    const id='demo'+(NC.cutoutResourceSerial=(NC.cutoutResourceSerial||0)+1), equip={top:id+'_top',weapon:id+'_weapon'},sprites={};
    await Promise.all(PARTS.map(async part=>{const s=structuredClone(spec.parts[part]);s.name=`rig_${id}_${part}`;s.img=await image(source(s.src));sprites[s.name]=s}));
    const weapon=structuredClone(spec.weapon);if(weapon.spriteData){const s=weapon.spriteData;s.name=id+'_sword';s.img=await image(source(s.src));sprites[s.name]=s;weapon.sprite=s.name;delete weapon.spriteData}
    const attachmentSprites=[];
    const attachments=await loadAttachmentSprites(spec.attachments,src=>image(source(src)),(name,img)=>{attachmentSprites.push(name);sprites[name]={name,img}},id);
    Object.assign(NC.SPR,sprites);NC.ITEMS[equip.top]={rig:id,attachments};NC.ITEMS[equip.weapon]=weapon;
    const rig=NC.getRig(id),resource={refs:1,ownedImages,equip,attachmentSprites,rig};
    const player=new CutoutPlayer();Object.assign(player,{resource,ownedImages,resolveSource,spec:structuredClone(spec),assetBase:base,equip,attachmentSprites,rig,time:0,attachmentTime:0,name:'idle',face:1,blend:null,pose:structuredClone(spec.clips.idle.keys[0].P)});return player;
    }catch(e){releaseImages(ownedImages);throw e}
  }
  get animationId(){return this.spec.clips[this.name]?.id}
  fork(){if(this.disposed)throw Error('Bộ phát đã được giải phóng');this.resource.refs++;const player=new CutoutPlayer();Object.assign(player,{resource:this.resource,spec:this.spec,assetBase:this.assetBase,resolveSource:this.resolveSource,equip:this.equip,rig:this.rig,time:0,attachmentTime:0,name:'idle',face:1,blend:null,hitFired:false,pose:structuredClone(this.spec.clips.idle.keys[0].P),sharedInstance:true});return player}
  play(name,{restart=false}={}){name=Object.hasOwn(this.spec.clips,name)?name:Object.keys(this.spec.clips).find(k=>this.spec.clips[k].id===name);if(!name)throw Error('Thiếu hoạt ảnh / ID đã yêu cầu');if(name===this.name&&!restart)return;this.blend={from:structuredClone(this.pose),time:0};this.name=name;this.time=0;this.hitFired=false;}
  addAnimation(pack,{alias}={}){const clip=readAnimationPack(pack);validate({format:'nightcamp-cutout-v1',rig:this.spec.rig,parts:this.spec.parts,clip});const key=alias||Object.keys(this.spec.clips).find(k=>this.spec.clips[k].id===clip.id)||clip.id;if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(key)||['constructor','prototype','__proto__'].includes(key))throw Error('Tên ánh xạ hoạt ảnh không hợp lệ');if(this.spec.clips[key]&&this.spec.clips[key].id!==clip.id)throw Error('Alias đã thuộc animationId khác');const clips={...this.spec.clips};for(const name of Object.keys(clips))if(clips[name].id===clip.id)clips[name]=clip;clips[key]=clip;this.spec={...this.spec,clips};return clip.id;}
  async addAccessories(pack){
    validateAccessoryPack(pack);const generation=this.accessoryGeneration=(this.accessoryGeneration||0)+1;let items=this.spec.attachments||[];for(const item of pack.items)items=equipAccessory(items,item,this.spec);
    const next=await CutoutPlayer.load({...this.spec,attachments:items},this.assetBase,{resolveSource:this.resolveSource});
    if(this.disposed||generation!==this.accessoryGeneration){next.dispose();return false}
    const state=Object.fromEntries(['name','time','face','pose','blend','hitFired','attachmentTime'].map(key=>[key,structuredClone(this[key])]));
    next.spec={...next.spec,clips:this.spec.clips};this.dispose();Object.assign(this,next,state,{disposed:false,sharedInstance:false,accessoryGeneration:generation});return true;
  }
  update(dt,onHit=()=>{},attachmentDt=dt){
    this.attachmentTime+=Math.max(0,attachmentDt);
    const c=this.spec.clips[this.name],last=this.time;this.time+=dt;
    if(c.kind==='attack'&&!this.hitFired&&this.time>=c.hit){this.hitFired=true;onHit()}
    const loop=c.kind==='walk'||c.kind==='loop';
    if(loop)this.time%=c.dur;else this.time=Math.min(this.time,c.dur);
    this.pose=sample(c,this.time);
    if(this.blend){this.blend.time+=dt;const u=Math.min(1,this.blend.time/.12);for(const k of Object.keys(this.pose))if(typeof this.pose[k]==='number'&&Number.isFinite(this.blend.from[k]))this.pose[k]=this.blend.from[k]+(this.pose[k]-this.blend.from[k])*u;if(u===1)this.blend=null}
    return !loop&&this.time>=c.dur;
  }
  draw(ctx,x,y,scale,{bones=false,weapon=true}={}){
    const pose=this.renderPose(),hasAttachedWeapon=this.spec.attachments?.some(raw=>{const a=NC.resolveAttachment(raw,pose);return a.visible!==false&&a.socket.startsWith('hand')});NC.drawRig(ctx,this.rig,this.equip,pose,x,y,{scale,noWeapon:!weapon||hasAttachedWeapon,hideAttachedWeapons:!weapon});
    if(bones){const js=NC.rigJoints(this.equip,pose,x,y,scale);ctx.save();ctx.strokeStyle='#d9ed9c';ctx.fillStyle='#f4ffc9';ctx.lineWidth=1;for(const chain of [['pel','neck','headTop'],['shN','elN','haN'],['shF','elF','haF'],['hipN','knN','ftN'],['hipF','knF','ftF']]){ctx.beginPath();chain.forEach((k,i)=>ctx[i?'lineTo':'moveTo'](...js[k]));ctx.stroke()}for(const p of Object.values(js)){ctx.beginPath();ctx.arc(...p,3,0,7);ctx.fill()}ctx.restore()}
  }
  renderPose(){return{...this.pose,face:this.face,attachmentTime:this.attachmentTime,animationId:this.animationId,headId:this.spec.headId,bodyId:this.spec.bodyId,mountSignatures:{head:targetSignature(this.spec.parts.head),body:targetSignature(this.spec.parts.torso)}}}
  dispose(){if(this.disposed)return;this.disposed=true;this.accessoryGeneration=(this.accessoryGeneration||0)+1;this.blend=null;const r=this.resource;if(!r||--r.refs>0)return;for(const p of PARTS)delete NC.SPR[`rig_${r.rig.name}_${p}`];for(const id of r.attachmentSprites||[])delete NC.SPR[id];delete NC.SPR[r.equip.top.replace('_top','_sword')];delete NC.ITEMS[r.equip.top];delete NC.ITEMS[r.equip.weapon];NC.releaseRig?.(r.rig.name);releaseImages(r.ownedImages)}
}
