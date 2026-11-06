import {assets,type LoadedVisual} from './assets';
import type {Actor} from '../shared/world';
export class InventoryPreview{
 player:any=null;loaded:LoadedVisual|null=null;key='';generation=0;message='';
 async show(a:Actor){const state={headId:a.headId,bodyId:a.bodyId,accessories:a.accessories},key=assets.key(a.appearanceId,state);if(key===this.key)return;this.key=key;const generation=++this.generation;
  let loaded:LoadedVisual|null=null;
  try{loaded=await assets.acquire(a.appearanceId,state);if(generation!==this.generation){assets.release(loaded);return}const next=loaded.prototype.fork();next.play(loaded.actions.idle.animationId);const old=this.player,oldLoaded=this.loaded;this.player=next;this.loaded=loaded;loaded=null;old?.dispose();if(oldLoaded)assets.release(oldLoaded);this.message=''}catch(e){if(loaded)assets.release(loaded);if(generation===this.generation)this.message='Không nạp được hình nhân vật: '+String(e)+' · Giữ hình hợp lệ trước đó.'}
 }
 update(dt:number){if(this.player&&this.loaded)this.player.update(dt*this.loaded.actions.idle.rate,undefined,dt)}
 draw(c:CanvasRenderingContext2D){if(!this.player)return;this.player.draw(c,190,288,1.32,{weapon:true})}
 itemImage(id:string):HTMLImageElement|undefined{if(!this.player)return;const nc=(window as any).NC,a=nc.ITEMS[this.player.equip.top]?.attachments.find((a:any)=>a.accessoryId===id);return a?nc.SPR[a.sprite]?.img:undefined}
 destroy(){this.generation++;this.player?.dispose();if(this.loaded)assets.release(this.loaded);this.player=null;this.loaded=null;this.key='';this.message=''}
}
