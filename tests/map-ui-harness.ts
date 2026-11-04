import '../src/client/style.css';
import {MinimapHUD,FRAME_WINDOWS} from '../src/client/map-hud';
import {loadMap} from '../src/client/map';
import {createExploration} from '../src/client/map-session';
import {mapRevision} from '../src/shared/map-state';
const check=(b:unknown,msg:string)=>{if(!b)throw Error(msg)};
(window as any).runMapUIChecks=async()=>{
 const {player}=await loadMap(),p=player.project;let stopped=0;const hud=new MinimapHUD(()=>stopped++),store=createExploration(p,'fixture-a'),a={id:'a',x:400,y:400,dir:0} as any;
 store.visit(a.x,a.y,0);const session:any={exploration:store,clock:()=>({gameSeconds:12*3600,rate:60})};hud.update(player,session,a,.2);await new Promise(r=>setTimeout(r,50));hud.update(player,session,a,.2);
 check(hud.baseCache.builds===1,'one base build');const fog=hud.layers!.fog.getContext('2d')!;check(JSON.stringify([...fog.getImageData(40,20,1,1).data])===JSON.stringify([22,19,34,150]),'exact unseen color/alpha');check(fog.getImageData(6,6,1,1).data[3]===0,'seen alpha clear');
 const base=hud.layers!.base;for(const hour of [0,6,12,18,23]){session.clock=()=>({gameSeconds:hour*3600,rate:60});hud.update(player,session,a,.2);check(hud.layers!.base===base,'clock does not rebuild terrain or reset seen')}
 const first=store.record(),count=store.count();hud.panel.toggle(true);const initial=hud.panel.view;hud.panel.zoomAt(2,150,170);const pixel={x:150,y:170},before=hud.projection!.inverse(initial,pixel.x,pixel.y),after=hud.projection!.inverse(hud.panel.view,pixel.x,pixel.y);check(Math.hypot(before.x-after.x,before.y-after.y)<1e-6,'cursor zoom preserves world point');
 const p2=structuredClone(p);p2.id='fixture-rect-second';p2.name='Bản đồ kiểm thử dài';const player2={...player,project:p2};hud.update(player2,session,a,.2);check(hud.layers===null&&hud.panel.actor===null,'no stale map or marker while new mask pending');
 session.exploration=createExploration(p2,'fixture-a');session.exploration.visit(1500,1000,0);hud.update(player2,session,a,.2);await Promise.resolve();hud.update(player2,session,a,.2);check(hud.name.textContent===p2.name&&hud.layers!.base!==base,'map switch changes name, background and own mask');check(session.exploration.count()!==count||session.exploration.record().bits!==first.bits,'independent map mask');
 session.exploration=store;hud.update(player,session,a,.2);await Promise.resolve();hud.update(player,session,a,.2);check(hud.layers!.base===base&&store.record().bits===first.bits,'return map reuses base and permanent exploration');check(hud.baseCache.builds===2,'cache reused');
 const saved=getComputedStyle(hud.root).background;hud.root.style.background='repeating-conic-gradient(#ddd 0% 25%,#777 0% 50%) 0 0/20px 20px';hud.panel.toggle(false);await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));(window as any).hudFixture=hud;
 return {result:'PASS actual MapRenderer base caching, exact fog RGBA, day/night no reset, cursor zoom, map load gap/switch/return, immutable scopes',frameWindows:FRAME_WINDOWS,revision:mapRevision(p),stopped};
};
