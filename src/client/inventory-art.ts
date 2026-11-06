import {clearWhiteMatte} from './ui-matte';
import atlas from '../../public/game-data/inventory-ui/atlas.json';
import {INVENTORY_LAYOUT as L,CATEGORY_SPRITES} from './inventory-layout';
export class InventoryArt{
 sprites=new Map<string,HTMLCanvasElement>();images=new Map<string,HTMLImageElement>();paths=new Map<string,Path2D>();ready=false;
 async load(){await Promise.all(Object.entries(atlas.sheets).filter(([id])=>id!=='reference').map(async([id,s])=>{const img=new Image();img.src='/game-data/inventory-ui/'+s.path;await img.decode();this.images.set(id,img)}));for(const[id,s]of Object.entries(atlas.sprites)){const [x,y,w,h]=s.rect,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d')!.drawImage(this.images.get(s.sheet)!,x,y,w,h,0,0,w,h);this.sprites.set(id,clearWhiteMatte(canvas));this.paths.set(id,new Path2D(s.clip))}this.ready=true}
 draw(c:CanvasRenderingContext2D,id:keyof typeof atlas.sprites,x:number,y:number,width:number,height?:number){if(!this.ready)return;const sprite=this.sprites.get(id)!;c.drawImage(sprite,x,y,width,height??width*sprite.height/sprite.width)}
 frame(c:CanvasRenderingContext2D){if(!this.ready)return;this.draw(c,'frame',0,0,1280);c.save();c.beginPath();c.rect(143,75,275,310);c.rect(847,110,305,276);c.clip();c.fillStyle='#2c1e22';c.fillRect(155,126,248,248);c.fillRect(858,117,282,257);c.restore()}
 categories(c:CanvasRenderingContext2D,selected:number){CATEGORY_SPRITES.forEach((ids,i)=>this.draw(c,ids[i===selected?1:0],L.categories.x+i*L.categories.step,L.categories.y,L.categories.width))}
 footer(c:CanvasRenderingContext2D){const p=L.pager;c.save();c.globalAlpha=.45;this.draw(c,'pagePrevious',p.left,p.y,p.width);this.draw(c,'pageNext',p.right,p.y,p.width);c.restore();for(let i=0;i<4;i++)this.draw(c,i===0?'pageActive':'pageIdle',p.dotX+i*p.dotStep,p.y+8,p.dotSize)}
}
