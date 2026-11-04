import type {Actor} from '../shared/world';
import {realmLabels,type RealmState} from '../shared/realms';
import {hudArt} from './hud-art';
export function resourceView(value:unknown,max:unknown){const m=typeof max==='number'&&Number.isFinite(max)?Math.max(0,max):0,v=typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(m,value)):0;return{ratio:m>0?v/m:0,text:`${Math.round(v)}/${Math.round(m)}`,current:v,max:m}}
// Measured in the original 1280×426 image, not viewport percentages.
export const PLAYER_WINDOWS={avatar:{x:55,y:65,w:228,h:228},hp:{x:371,y:133,w:816,h:36},mp:{x:371,y:211,w:816,h:34},stage:{x:96,y:309,w:152,h:40},realm:{x:349,y:283,w:322,h:53}};
export class PlayerHUD{
 top=document.createElement('div');root=document.createElement('section');stage=document.createElement('div');frame=document.createElement('canvas');avatar=document.createElement('canvas');plaque=document.createElement('canvas');name=document.createElement('strong');profession=document.createElement('span');hp=document.createElement('div');hpFill=document.createElement('i');hpText=document.createElement('span');mp=document.createElement('div');mpFill=document.createElement('i');mpText=document.createElement('span');realm=document.createElement('span');realmStage=document.createElement('span');headKey='';artReady=false;error='';lastLayout='';
 constructor(mapHUD:HTMLElement){
  this.top.id='top-hud';this.top.hidden=true;this.root.id='player-hud';this.root.setAttribute('aria-label','Thông tin nhân vật');this.stage.className='player-hud-stage';this.root.append(this.stage);this.top.append(this.root,mapHUD);document.body.append(this.top);
  const place=(e:HTMLElement,r:{x:number;y:number;w:number;h:number})=>{e.style.cssText=`left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`};
  this.frame.className='player-frame-art';this.frame.width=1280;this.frame.height=426;this.frame.setAttribute('aria-hidden','true');this.avatar.id='player-avatar';this.avatar.width=this.avatar.height=192;place(this.avatar,PLAYER_WINDOWS.avatar);
  this.name.id='player-name';this.profession.id='player-profession';this.hp.id='hp-track';this.hpFill.id='hp-bar';this.hpText.id='hp-text';this.hpText.textContent='—';this.hp.className='hud-resource';this.hp.setAttribute('role','meter');this.hp.setAttribute('aria-label','Máu HP');this.hp.append(this.hpFill,this.hpText);place(this.hp,PLAYER_WINDOWS.hp);
  this.mp.id='mp-track';this.mp.className='hud-resource hud-mp';this.mpFill.id='mp-bar';this.mpText.id='mp-text';this.mp.append(this.mpFill,this.mpText);place(this.mp,PLAYER_WINDOWS.mp);this.mp.title='Game chưa có cơ chế MP/Năng lượng';
  this.plaque.id='realm-plaque';this.plaque.width=1280;this.plaque.height=426;this.plaque.setAttribute('aria-hidden','true');this.realm.id='realm-name';this.realmStage.id='realm-stage';place(this.realm,PLAYER_WINDOWS.realm);place(this.realmStage,PLAYER_WINDOWS.stage);
  this.stage.append(this.avatar,this.frame,this.name,this.profession,this.hp,this.mp,this.plaque,this.realm,this.realmStage);
  void Promise.all([hudArt('/game-data/player-hud/player-frame.jpg',true),hudArt('/game-data/player-hud/realm-plaque.jpg')]).then(([frame,plaque])=>{this.frame.getContext('2d')!.drawImage(frame,0,0);this.plaque.getContext('2d')!.drawImage(plaque,0,0);this.artReady=true}).catch(e=>{this.error=String(e);const warning=document.createElement('p');warning.className='hud-art-error';warning.setAttribute('role','alert');warning.textContent='Không tải được ảnh HUD nhân vật. Hãy tải lại trang.';this.root.append(warning)});
 }
 update(actor:(Actor&{professionName?:string;mp?:number;maxMp?:number})|null,active:boolean,portrait?:()=>{key:string;image:HTMLCanvasElement}|null){
  this.top.hidden=!active;if(!active)return;const rect=this.root.getBoundingClientRect(),key=`${rect.width}:${innerHeight}:${this.top.getBoundingClientRect().top}`;if(key!==this.lastLayout){this.lastLayout=key;this.stage.style.transform=`scale(${rect.width/1280})`;document.documentElement.style.setProperty('--top-hud-bottom',this.top.getBoundingClientRect().bottom+'px')}
  if(!actor)return;
  this.name.textContent=actor.name;this.name.title=actor.name;this.profession.textContent=actor.professionName||'Lữ khách · Cận chiến';this.profession.title=this.profession.textContent;
  const hp=resourceView(actor.hp,actor.maxHp);this.hpFill.style.width=hp.ratio*100+'%';this.hpText.textContent='HP '+hp.text;this.hp.setAttribute('aria-valuemin','0');this.hp.setAttribute('aria-valuemax',String(hp.max));this.hp.setAttribute('aria-valuenow',String(hp.current));
  const hasMP=Number.isFinite(actor.mp)&&Number.isFinite(actor.maxMp);this.mp.dataset.active=String(hasMP);this.mp.setAttribute('aria-disabled',String(!hasMP));const mp=resourceView(actor.mp,actor.maxMp);this.mpFill.style.width=hasMP?mp.ratio*100+'%':'0%';this.mpText.textContent=hasMP?'MP '+mp.text:'MP · Chưa kích hoạt';
  this.updateRealm(actor);
  if(portrait){const head=portrait();if(head&&head.key!==this.headKey){this.headKey=head.key;const c=this.avatar.getContext('2d')!;c.clearRect(0,0,192,192);c.drawImage(head.image,0,0,192,192)}}
 }
 updateRealm(state:RealmState){if(this.root.dataset.realm===state.realmId&&this.root.dataset.realmStage===state.realmStageId)return;const labels=realmLabels(state);this.realm.textContent=labels.realm;this.realm.title=labels.realm;this.realmStage.textContent=labels.stage;this.realmStage.hidden=!labels.stage;this.root.dataset.realm=state.realmId;this.root.dataset.realmStage=state.realmStageId;
  const c=this.avatar.getContext('2d')!;for(const [element,label,max,min,width]of [[this.realm,labels.realm,45,36,310],[this.realmStage,labels.stage,44,32,150]] as const){let font:number=max;c.font=`750 ${font}px system-ui`;while(font>min&&c.measureText(label).width>width){font--;c.font=`750 ${font}px system-ui`}element.style.fontSize=font+'px'}
 }
 reset(){this.top.hidden=true;this.headKey='';this.avatar.getContext('2d')!.clearRect(0,0,192,192)}
 debug(){return{artReady:this.artReady,error:this.error,portraitKey:this.headKey,realmId:this.root.dataset.realm,realmStageId:this.root.dataset.realmStage,realm:this.realm.textContent,stage:this.realmStage.textContent,windows:PLAYER_WINDOWS}}
}
