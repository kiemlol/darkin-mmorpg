import {MapBaseCache,MapProjection,MapLayers,canvasSize} from './map-view';import {FullMapPanel} from './full-map';
import {clockHour,daylight,type ClockState} from '../shared/map-state';import type {Actor} from '../shared/world';import type {GameSession} from './session';
const ASSETS='/game-data/map-ui-v2/';
// Measured from the central alpha-connected holes of the supplied PNGs, in original pixels.
export const FRAME_WINDOWS={clock:{w:799,h:914,cx:397,cy:437,rx:259,ry:259},map:{w:885,h:908,cx:450,cy:445,rx:294,ry:271}};
const rgb=(a:number[],b:number[],t:number)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
export class MinimapHUD{
 visibilitySig='';
 root=document.createElement('section');stage=document.createElement('div');mini=document.createElement('canvas');sky=document.createElement('canvas');time=document.createElement('span');name=document.createElement('span');portrait=document.createElement('canvas');
 panel:FullMapPanel;baseCache=new MapBaseCache();layers:MapLayers|null=null;projection:MapProjection|null=null;project:any=null;revision='';generation=0;icons=new Map<string,HTMLImageElement>();mapName='';lastClock:ClockState={gameSeconds:0,rate:0};headKey='';backgroundErrors:string[]=[];abort=new AbortController();
 constructor(private stopInput:()=>void){this.root.id='map-hud';this.root.hidden=true;this.stage.className='map-hud-stage';this.root.append(this.stage);document.body.append(this.root);
  this.panel=new FullMapPanel(()=>this.stopInput());
  const frame=(kind:'clock'|'map',canvas:HTMLCanvasElement,file:string)=>{const cfg=FRAME_WINDOWS[kind],group=document.createElement('div');group.className='map-hud-'+kind;const image=document.createElement('img');image.src=ASSETS+file;image.width=cfg.w;image.height=cfg.h;image.alt='';image.draggable=false;
   canvas.style.cssText=`left:${cfg.cx-cfg.rx}px;top:${cfg.cy-cfg.ry}px;width:${cfg.rx*2}px;height:${cfg.ry*2}px;clip-path:ellipse(50% 50%)`;canvas.className='map-hud-content';canvas.id=kind==='map'?'minimap-canvas':'world-clock-canvas';
   const button=document.createElement('button');button.className='map-hud-hit';button.style.cssText=canvas.style.cssText;button.setAttribute('aria-label',kind==='map'?'Mở bản đồ khám phá':'Đồng hồ thế giới — mở bản đồ');button.id=kind==='map'?'minimap-open':'clock-open';button.onclick=()=>this.panel.toggle();group.append(canvas,image,button);this.stage.append(group)};
  frame('clock',this.sky,'khung_trai_AI_goc.png');frame('map',this.mini,'khung_phai_AI_goc.png');
  const plaque=(className:string,file:string,label:HTMLElement)=>{const d=document.createElement('div');d.className=className;const img=document.createElement('img');img.src=ASSETS+file;img.alt='';img.draggable=false;d.append(img,label);this.stage.append(d)};
  this.time.id='world-clock-time';this.name.id='minimap-name';plaque('map-clock-plaque','bang_ten_220x112.png',this.time);plaque('map-name-ribbon','dai_ruy_bang_420x164.png',this.name);
  this.portrait.className='map-head-badge';this.portrait.width=this.portrait.height=64;this.stage.append(this.portrait);
  window.addEventListener('keydown',e=>{if((document.getElementById('inventory') as HTMLDialogElement|null)?.open)return;if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return;if(e.code==='KeyM'||this.panel.open&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&!this.root.hidden)this.panel.toggle(e.code==='Escape'?false:!this.panel.open)}else if(this.panel.open){e.stopImmediatePropagation();if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault()}},{capture:true,signal:this.abort.signal});
  void Promise.all(['khung_trai_AI_goc.png','khung_phai_AI_goc.png','bang_ten_220x112.png','dai_ruy_bang_420x164.png','sky_sun.png','sky_moon.png'].map(async name=>{try{const img=new Image();await new Promise<void>((ok,no)=>{img.onload=()=>ok();img.onerror=()=>no(Error('Thiếu ảnh HUD '+name));img.src=ASSETS+name});this.icons.set(name,img)}catch(e){this.backgroundErrors.push(String(e));this.root.dataset.error=this.backgroundErrors.join('; ');let warning=this.root.querySelector('.map-ui-error');if(!warning){warning=document.createElement('p');warning.className='map-ui-error';warning.setAttribute('role','alert');this.root.append(warning)}warning.textContent='Lỗi tải giao diện bản đồ. Hãy tải lại trang.'}}));
 }
 async bindMap(player:any,revision:string,hidden:string[]=[]){const generation=++this.generation,sameMap=this.project===player.project&&this.revision===revision;this.visibilitySig=hidden.join(',');this.layers=null;this.project=player.project;this.revision=revision;this.mapName=this.project.name;this.name.textContent=this.mapName;this.name.title=this.mapName;if(!sameMap||!this.projection){this.projection=new MapProjection(this.project.cols*this.project.cell,this.project.rows*this.project.cell);this.panel.setMap(this.mapName,this.projection)}
  const base=await Promise.resolve(this.baseCache.get(this.project,player.renderer.images,revision,hidden));if(generation!==this.generation)return;this.layers=new MapLayers(base,this.projection.worldWidth,this.projection.worldHeight);
 }
 update(player:any,session:GameSession|null,actor:Actor|null,dt:number,portrait?:()=>{key:string;image:HTMLCanvasElement}|null){
  this.root.hidden=!session;if(!session){if(this.panel.open)this.panel.toggle(false);return}
  this.stage.style.transform=`scale(${this.root.getBoundingClientRect().width/1500})`;
  const store=session.exploration;if(store&&player.project.id!==store.scope.mapId){this.generation++;this.layers=null;this.project=null;this.projection=null;this.mapName=player.project.name;this.name.textContent=this.mapName;this.panel.title.textContent=this.mapName;this.panel.actor=null;this.panel.projection=null}
  const hidden=(session.snapshot.nodes||[]).filter(n=>n.hidden).map(n=>n.objectId).sort();if(store&&player.project.id===store.scope.mapId&&(this.project!==player.project||this.revision!==store.scope.mapRevision||this.visibilitySig!==hidden.join(',')))void this.bindMap(player,store.scope.mapRevision,hidden);
  this.lastClock=session.clock();this.drawSky(this.lastClock);const hour=clockHour(this.lastClock),h=Math.floor(hour),minute=Math.floor((hour-h)*60);this.time.textContent=`${h%12||12}:${minute.toString().padStart(2,'0')} ${h<12?'AM':'PM'}`;
  if(!store||player.project.id!==store.scope.mapId||!this.layers||!this.projection||store.scope.mapId!==this.project?.id||store.scope.mapRevision!==this.revision){canvasSize(this.mini);canvasSize(this.panel.canvas);this.panel.status.textContent='Đang nhận dữ liệu bản đồ từ phiên chơi…';return}
  this.layers.update(store,dt);const {ctx,w,h:height}=canvasSize(this.mini);ctx.save();ctx.beginPath();ctx.ellipse(w/2,height/2,w/2,height/2,0,0,Math.PI*2);ctx.clip();const view=actor?this.projection.mini(w,height,actor,this.project.cell*8):this.projection.fit(w,height);this.layers.draw(ctx,w,height,view,actor);ctx.restore();
  this.panel.status.textContent=`${this.mapName} · Đã khám phá ${Math.round(store.count()/store.seen.length*100)}% · Kéo để di chuyển, cuộn/pinch để zoom`;
  this.panel.draw(this.layers,actor);
  if(portrait){const head=portrait();if(head&&head.key!==this.headKey){this.headKey=head.key;const c=this.portrait.getContext('2d')!;c.clearRect(0,0,64,64);c.drawImage(head.image,0,0,64,64)}}
 }
 drawSky(clock:ClockState){const {ctx:c,w,h}=canvasSize(this.sky),hour=clockHour(clock),day=daylight(hour),warm=day*(1-day)*1.7;
  const top=rgb(rgb([8,16,44],[65,157,224],day),[210,119,129],warm),bottom=rgb(rgb([32,40,78],[178,222,244],day),[247,181,127],warm),g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,`rgb(${top})`);g.addColorStop(1,`rgb(${bottom})`);c.fillStyle=g;c.fillRect(0,0,w,h);
  c.fillStyle=`rgba(239,243,255,${1-day})`;for(let i=0;i<27;i++){const x=((i*47+11)%101)/101*w,y=((i*29+5)%83)/100*h;c.fillRect(x,y,Math.max(.7,w/140),Math.max(.7,w/140))}
  c.fillStyle=`rgba(255,255,255,${day*.45})`;for(let i=0;i<3;i++){const x=((clock.gameSeconds/120+i*.37)%1.5-.25)*w,y=h*(.25+i*.15);c.beginPath();c.ellipse(x,y,w*.18,h*.045,0,0,Math.PI*2);c.fill()}
  const sun=hour>=5&&hour<19.5,phase=sun?(hour-5)/14.5:((hour+24-19.5)%24)/9.5,img=this.icons.get(sun?'sky_sun.png':'sky_moon.png');if(img){const size=w*.2,x=w/2-Math.cos(phase*Math.PI)*w*.35,y=h*.7-Math.sin(phase*Math.PI)*h*.5;c.drawImage(img,x-size/2,y-size*img.height/img.width/2,size,size*img.height/img.width)}
 }
 close(){this.panel.toggle(false);this.root.hidden=true;this.headKey=''}
 debug(){return{open:this.panel.open,mapId:this.project?.id,revision:this.revision,name:this.mapName,baseBuilds:this.baseCache.builds,maskBuilds:this.layers?.builds,zoom:this.panel.zoom,pan:{x:this.panel.cx,y:this.panel.cy},clock:this.lastClock,hour:clockHour(this.lastClock),frameWindows:FRAME_WINDOWS,errors:this.backgroundErrors,pointers:this.panel.points.size}}
 destroy(){this.generation++;this.abort.abort();this.panel.destroy();this.root.remove()}
}
