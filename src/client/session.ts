import {World,movement,validIntent,type Intent,type Snapshot,type Actor} from '../shared/world';
export interface GameSession {id:string;status:string;snapshot:Snapshot;input(i:Intent):void;update(dt:number):void;respawn():void;setAppearance(id:string):void;destroy():void}
const SAVE='darkin-frontier-mvp:offline:v1';
export class LocalGameSession implements GameSession{
 id='local';status='Offline';world:World;snapshot:Snapshot;acc=0;saveTime=0;
 constructor(p:any,name:string){
  this.world=new World(p);const a=this.world.join(this.id,name);
  try{
   const s=JSON.parse(localStorage.getItem(SAVE)||'null');
   if(s?.map===p.id){
    if(Number.isSafeInteger(s.kills)&&s.kills>=0)a.kills=s.kills;
    // A new offline session must be playable even if the previous tab saved a death.
    // Live deaths still require the explicit respawn action below.
    if(Number.isFinite(s.hp)&&s.hp>0&&Number.isFinite(s.x)&&Number.isFinite(s.y)){
     Object.assign(a,this.world.findSpawn(s.x,s.y),{hp:Math.min(a.maxHp,s.hp)});
    }
   }
  }catch{}
  this.snapshot=this.world.snapshot();
 }
 input(i:Intent){this.world.input(this.id,i)} update(dt:number){this.acc+=Math.min(dt,.25);while(this.acc>=.05){this.world.step();this.acc-=.05}this.snapshot=this.world.snapshot();this.saveTime+=dt;if(this.saveTime>2){this.save();this.saveTime=0}}
 save(){const a=this.world.actors.get(this.id)!;try{localStorage.setItem(SAVE,JSON.stringify({map:this.world.p.id,x:a.x,y:a.y,hp:a.hp,kills:a.kills}))}catch{}}
 setAppearance(id:string){this.world.setAppearance(this.id,id)}
 respawn(){this.world.respawn(this.id)}destroy(){this.save()} static reset(){localStorage.removeItem(SAVE)}
}
export class NetworkGameSession implements GameSession{
 id='';status='Đang kết nối…';snapshot:Snapshot={time:0,actors:[],events:[]};socket:WebSocket;pending:Intent[]=[];previous:Snapshot|null=null;received=0;lastReceived=performance.now();closed=false;predicted:Actor|null=null;
 constructor(public p:any,name:string,url:string){const u=new URL(url||`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`);if(!['ws:','wss:'].includes(u.protocol)||location.protocol==='https:'&&u.protocol!=='wss:')throw Error('Trang HTTPS yêu cầu địa chỉ wss://');this.socket=new WebSocket(u);this.socket.onopen=()=>this.socket.send(JSON.stringify({type:'join',name}));this.socket.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.type==='welcome'){if(m.map!==p.id){this.status='Server dùng map khác';this.socket.close();return}this.id=m.id;this.status='Online'}if(m.type==='error')this.status=m.message;if(m.type==='snapshot'){this.previous=this.snapshot;this.snapshot=m;this.received=performance.now();this.lastReceived=this.received;const a=m.actors.find((a:Actor)=>a.id===this.id);if(a){this.pending=this.pending.filter(i=>i.seq>a.ack);this.predicted={...a};for(const i of this.pending)movement(p,this.predicted!,i,.05)}}}catch{this.status='Dữ liệu server không hợp lệ'}};this.socket.onclose=()=>{this.status='Mất kết nối — bấm Thử lại';this.pending=[]};this.socket.onerror=()=>{this.status='Không kết nối được server — bấm Thử lại'}}
 input(i:Intent){if(this.socket.readyState!==1||!this.id||!validIntent(i))return;this.socket.send(JSON.stringify({type:'input',input:i}));this.pending.push(i);if(this.pending.length>20)this.pending.shift();if(this.predicted)movement(this.p,this.predicted,i,.05)}
 update(){if(this.socket.readyState===1&&performance.now()-this.lastReceived>5000){this.status='Server không phản hồi — bấm Thử lại';this.socket.close()}}
 renderActors(){const t=Math.min(1,(performance.now()-this.received)/100);return this.snapshot.actors.map(a=>{if(a.id===this.id&&this.predicted)return{...a,x:this.predicted.x,y:this.predicted.y,dir:this.predicted.dir};const prev=this.previous?.actors.find(b=>b.id===a.id);return prev?{...a,x:prev.x+(a.x-prev.x)*t,y:prev.y+(a.y-prev.y)*t}:a})}
 setAppearance(id:string){if(this.socket.readyState===1)this.socket.send(JSON.stringify({type:'appearance',appearanceId:id}))}
 respawn(){if(this.socket.readyState===1)this.socket.send(JSON.stringify({type:'respawn'}))}destroy(){this.closed=true;this.socket.onclose=null;this.socket.onmessage=null;this.socket.close();this.pending=[]}
}
