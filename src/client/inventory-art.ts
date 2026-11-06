import atlas from '../../public/game-data/inventory-ui/atlas.json';
export class InventoryArt{
 images=new Map<string,HTMLImageElement>();paths=new Map<string,Path2D>();ready=false;
 async load(){await Promise.all(Object.entries(atlas.sheets).filter(([id])=>id!=='reference').map(async([id,s])=>{const img=new Image();img.src='/game-data/inventory-ui/'+s.path;await img.decode();this.images.set(id,img)}));for(const[id,s]of Object.entries(atlas.sprites))this.paths.set(id,new Path2D(s.clip));this.ready=true}
 draw(c:CanvasRenderingContext2D,id:keyof typeof atlas.sprites,x:number,y:number,width:number,height?:number){if(!this.ready)return;const s=atlas.sprites[id],[sx,sy,w,h]=s.rect;c.save();c.translate(x,y);c.scale(width/w,(height??width*h/w)/h);c.clip(this.paths.get(id)!);c.drawImage(this.images.get(s.sheet)!,sx,sy,w,h,0,0,w,h);c.restore()}
 frame(c:CanvasRenderingContext2D){this.draw(c,'frame',0,0,1280,450);c.save();c.clip(this.paths.get('frame')!);c.fillStyle='#2c1e22';c.fillRect(154,144,226,261);c.fillRect(806,137,334,237);c.restore()}
 footer(c:CanvasRenderingContext2D){c.save();c.clip(this.paths.get('frame')!);c.drawImage(this.images.get('layout')!,800,375,350,39,800,375,350,39);c.fillStyle='#2d1f23';c.fillRect(922,380,103,23);c.restore()}
}
