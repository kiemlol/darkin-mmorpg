export const WORLD_ID='darkin-frontier-v1';
export const CLOCK_RATE=60; // game seconds per simulation second; a full day is 24 real minutes
export type ClockState={gameSeconds:number;rate:number};
export function initialClock(p:any){return Number.isFinite(p.lighting?.hour)?p.lighting.hour*3600:23*3600}
export function clockHour(c:ClockState){return ((c.gameSeconds/3600)%24+24)%24}
export function daylight(hour:number){const h=((hour%24)+24)%24;return h<5||h>=19.5?0:h<7?(h-5)/2:h>=17.5?(19.5-h)/2:1}
export function mapRevision(p:any){let h=2166136261;for(const c of JSON.stringify(p)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return 'map-'+(h>>>0).toString(16).padStart(8,'0')}
export type ExplorationScope={characterId:string;worldId:string;mapId:string;mapRevision:string};
export type ExplorationRecord={version:1;scope:ExplorationScope;cols:number;rows:number;cellSize:number;radius:number;bits:string};
export function explorationConfig(p:any){return{cellSize:p.cell*.5,radius:p.cell*2}}
export function scopeKey(s:ExplorationScope){return [s.characterId,s.worldId,s.mapId,s.mapRevision].map(encodeURIComponent).join(':')}
export class ExplorationStore{
 cols:number;rows:number;seen:Uint8Array;version=0;last:{x:number;y:number;time:number;epoch:number}|null=null;
 constructor(public width:number,public height:number,public cellSize:number,public radius:number,public scope:ExplorationScope){
  if(![width,height,cellSize,radius].every(n=>Number.isFinite(n)&&n>0))throw Error('Exploration dimensions');
  this.cols=Math.ceil(width/cellSize);this.rows=Math.ceil(height/cellSize);if(this.cols*this.rows>262144)throw Error('Exploration memory limit');this.seen=new Uint8Array(this.cols*this.rows);
 }
 reveal(x:number,y:number){let changed=false;const r=this.radius;
  for(let gy=Math.max(0,Math.floor((y-r)/this.cellSize));gy<=Math.min(this.rows-1,Math.floor((y+r)/this.cellSize));gy++)for(let gx=Math.max(0,Math.floor((x-r)/this.cellSize));gx<=Math.min(this.cols-1,Math.floor((x+r)/this.cellSize));gx++){
   const cx=Math.min(this.width,(gx+.5)*this.cellSize),cy=Math.min(this.height,(gy+.5)*this.cellSize),i=gy*this.cols+gx;
   if(!this.seen[i]&&Math.hypot(cx-x,cy-y)<=r){this.seen[i]=1;changed=true}
  }if(changed)this.version++;return changed;
 }
 visit(x:number,y:number,time:number,epoch=0){if(![x,y,time].every(Number.isFinite)||x<0||y<0||x>this.width||y>this.height)return false;
  const last=this.last,d=last?Math.hypot(x-last.x,y-last.y):0,dt=last?time-last.time:0;
  let changed=false;
  if(last&&epoch===last.epoch&&dt>=0&&dt<=1&&d<=225*dt+this.cellSize*1.5){const steps=Math.max(1,Math.ceil(d/Math.min(this.cellSize/2,this.radius/2)));for(let i=1;i<=steps;i++)changed=this.reveal(last.x+(x-last.x)*i/steps,last.y+(y-last.y)*i/steps)||changed}
  else changed=this.reveal(x,y);
  this.last={x,y,time,epoch};return changed;
 }
 record():ExplorationRecord{const bytes=new Uint8Array(Math.ceil(this.seen.length/8));for(let i=0;i<this.seen.length;i++)if(this.seen[i])bytes[i>>3]|=1<<(i&7);return{version:1,scope:{...this.scope},cols:this.cols,rows:this.rows,cellSize:this.cellSize,radius:this.radius,bits:Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}}
 restore(r:any){const expected=Math.ceil(this.seen.length/8)*2;if(r?.version!==1||scopeKey(r.scope||{})!==scopeKey(this.scope)||r.cols!==this.cols||r.rows!==this.rows||r.cellSize!==this.cellSize||r.radius!==this.radius||typeof r.bits!=='string'||r.bits.length!==expected||!/^[a-f0-9]*$/i.test(r.bits))return false;
  const bytes=new Uint8Array(r.bits.match(/../g).map((h:string)=>parseInt(h,16)));for(let i=0;i<this.seen.length;i++)this.seen[i]=(bytes[i>>3]>>(i&7))&1;this.version++;return true;
 }
 count(){return this.seen.reduce((a,b)=>a+b,0)}
}
