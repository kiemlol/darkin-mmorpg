import {LocalGameSession,NetworkGameSession,type GameSession} from './session';
import {profileRecord} from '../shared/character-profile';
import type {Intent,Actor} from '../shared/world';
import type {CultCommand} from '../shared/cultivation';
import type {CosmeticCommand} from '../shared/equipment';
import type {InventoryMove} from '../shared/inventory';
import type {InteractionIntent} from '../shared/interactions';
/** Local simulation stays playable during handshakes. Online authority never accepts offline wealth. */
export class AdaptiveGameSession implements GameSession{
 local:LocalGameSession;network:NetworkGameSession|null=null;active:GameSession;destroyed=false;attemptAt=0;attemptStarted=0;lastCheckpoint=0;notice='Đang tìm kết nối tới tiên giới…';wasOnline=false;private lifetime=new AbortController();
 constructor(public p:any,public name:string,public url:string){let offlineName=name;try{offlineName=localStorage.getItem('tien-do:branch:'+encodeURIComponent(url)+':'+name)||name}catch{}this.local=new LocalGameSession(p,offlineName);this.active=this.local;window.addEventListener('online',()=>{this.attemptAt=0;this.connect()},{signal:this.lifetime.signal});window.addEventListener('offline',()=>this.fallback(),{signal:this.lifetime.signal});this.connect()}
 get id(){return this.active.id}get characterId(){return this.active.characterId}get exploration(){return this.active.exploration}get snapshot(){return this.active.snapshot}get status(){return this.active instanceof NetworkGameSession?'Online':'Offline'}get dataWarnings(){return this.active.dataWarnings}get interactionMessage(){return this.active.interactionMessage}get inventoryMessage(){return this.active.inventoryMessage}get flightMessage(){return this.active.flightMessage}get previewMessage(){return this.active.previewMessage}get skillMessage(){return this.active.skillMessage}get cultivationMessage(){return this.active.cultivationMessage}
 private checkpoint(){const a=this.network?.snapshot.actors.find(a=>a.id===this.network!.id);if(!a)return;try{localStorage.setItem('tien-do:online-checkpoint:'+encodeURIComponent(this.url)+':'+this.name,JSON.stringify({actor:a,at:Date.now(),map:this.p.id}))}catch{this.notice='Bộ nhớ thiết bị đầy; chưa lưu được mốc online.'}}
 connect(){if(this.destroyed||navigator.onLine===false||this.network)return;this.attemptAt=performance.now()+15000;this.attemptStarted=performance.now();try{this.network=new NetworkGameSession(this.p,this.name,this.url)}catch{this.notice='Tiếp tục ngoại tuyến · sẽ tự kết nối lại.'}}
 private fallback(){if(this.active instanceof NetworkGameSession){this.checkpoint();const a=this.active.snapshot.actors.find(a=>a.id===this.active.id);this.local.destroy();this.local=new LocalGameSession(this.p,this.name+' · Vân du');try{localStorage.setItem('tien-do:branch:'+encodeURIComponent(this.url)+':'+this.name,this.name+' · Vân du')}catch{}if(a){const target=this.local.world.actors.get(this.local.id)!;Object.assign(target,profileRecord(a),{...structuredClone(a),id:this.local.id,home:{x:a.x,y:a.y},ack:-1});delete (target as any).equipment;this.local.world.initializeCultivator(this.local.id);this.local.snapshot=this.local.world.snapshot();this.local.previous=this.local.snapshot;this.local.save()}this.active=this.local;this.notice='Đã chuyển ngoại tuyến. Tiến trình vân du lưu trên thiết bị; tài sản online được giữ tại máy chủ.'}this.network?.destroy();this.network=null;this.attemptAt=performance.now()+15000;}
 input(i:Intent,tick=true){this.active.input(i,tick)}
 update(dt:number){this.active.update(dt);if(this.network&&this.network!==this.active)this.network.update(dt);
  const net=this.network;
  if(net&&net.status==='Online'&&net.snapshot.actors.some(a=>a.id===net.id)){if(this.active!==net){this.local.save();this.active=net;this.wasOnline=true;this.notice='Đã kết nối tiên giới. Bản vân du ngoại tuyến vẫn được giữ riêng trên thiết bị.'}if(performance.now()-this.lastCheckpoint>2000){this.checkpoint();this.lastCheckpoint=performance.now()}}
  else if(net&&(net.socket.readyState===WebSocket.CLOSED||performance.now()-this.attemptStarted>6500&&net.status!=='Online')){this.fallback()}
  if(!this.network&&performance.now()>=this.attemptAt)this.connect();
 }
 renderActors(){return this.active.renderActors()}clock(){return this.active.clock()}respawn(){this.active.respawn()}setAppearance(id:string){this.active.setAppearance(id)}cosmetic(c:CosmeticCommand){this.active.cosmetic(c)}moveInventory(c:InventoryMove){this.active.moveInventory(c)}interact(c:InteractionIntent){this.active.interact(c)}cancelInteraction(){this.active.cancelInteraction()}setSwordFlight(v:boolean){this.active.setSwordFlight(v)}previewAnimation(v:string){this.active.previewAnimation(v)}castSkill(slot:number,targetId?:string){this.active.castSkill(slot,targetId)}cultivate(c:CultCommand){this.active.cultivate(c)}
 destroy(){this.destroyed=true;this.lifetime.abort();this.network?.destroy();this.local.destroy()}
}
