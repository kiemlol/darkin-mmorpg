import layout from '../shared/nether-sprites.json';
import{NETHER_TIMING as T}from'../shared/nether-array';
export {layout as netherSpriteLayout};
export type NetherSheets={portal:HTMLCanvasElement;demon:HTMLCanvasElement};
type CanvasFactory=(w:number,h:number)=>HTMLCanvasElement;
const canvasFactory:CanvasFactory=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
/** Rendering-only white matte removal. Uploaded JPEGs are retained byte for byte.
 * Inverse white compositing preserves the transparency already baked into fading frames.
 * The result is cached once; no pixel readback occurs in the animation loop.
 */
export function removeWhiteMatte(rgba:Uint8ClampedArray){for(let i=0;i<rgba.length;i+=4){const r=rgba[i],g=rgba[i+1],b=rgba[i+2],minimum=Math.min(r,g,b),difference=255-minimum;
 // Near-white JPEG noise belongs to the background, including the fractional frame edges.
 if(difference<=13){rgba[i]=rgba[i+1]=rgba[i+2]=rgba[i+3]=0;continue}
 const alpha=Math.min(1,(difference-13)/67),white=255*(1-alpha);rgba[i]=Math.max(0,(r-white)/alpha);rgba[i+1]=Math.max(0,(g-white)/alpha);rgba[i+2]=Math.max(0,(b-white)/alpha);rgba[i+3]=Math.round(rgba[i+3]*alpha);
}return rgba}
export function prepareNetherSheet(image:CanvasImageSource&{width:number;height:number},create:CanvasFactory=canvasFactory){const c=create(image.width,image.height),ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height);removeWhiteMatte(data.data);ctx.putImageData(data,0,0);return c}
let prepared:Promise<NetherSheets>|undefined;
export function loadNetherSheets():Promise<NetherSheets>{if(prepared)return prepared;prepared=Promise.all(Object.entries(layout).map(async([id,spec])=>{const image=new Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Không tải được sprite U Đô: '+spec.src));image.src=spec.src});return[id,prepareNetherSheet(image)] as const})).then(pairs=>Object.fromEntries(pairs) as NetherSheets).catch(e=>{prepared=undefined;throw e});return prepared}
const bound=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
export function netherSpriteFrames(age:number){let portal:number,demon=-1;if(age<T.tear||age>=T.end)return{portal:-1,demon};if(age<T.open)portal=bound(Math.floor((age-T.tear)/(T.open-T.tear)*12),0,11);else if(age<T.fade)portal=[9,10,11,10][Math.floor((age-T.open)*6)%4];else portal=bound(11-Math.floor((age-T.fade)/(T.end-T.fade)*12),0,11);
 if(age>=T.open&&age<T.head)demon=bound(Math.floor((age-T.open)/(T.head-T.open)*8),0,7);else if(age>=T.head&&age<T.breath)demon=7;else if(age>=T.breath&&age<T.fade)demon=[7,8,9,8][Math.floor((age-T.breath)*6)%4];else if(age>=T.fade&&age<T.end)demon=bound(10+Math.floor((age-T.fade)/(T.end-T.fade)*6),10,15);return{portal,demon}}
export const netherMouth={x:(layout.demon.mouthX-.5)*layout.demon.width,y:layout.demon.centerY+(layout.demon.mouthY-.5)*layout.demon.height};
export function drawNetherSprites(ctx:CanvasRenderingContext2D,sheets:NetherSheets,age:number){const frames=netherSpriteFrames(age);for(const id of ['portal','demon'] as const){const index=frames[id];if(index<0)continue;const image=sheets[id],spec=layout[id],col=index%spec.columns,row=Math.floor(index/spec.columns),sx=Math.round(col*image.width/spec.columns),sy=Math.round(row*image.height/spec.rows),right=Math.round((col+1)*image.width/spec.columns),bottom=Math.round((row+1)*image.height/spec.rows);ctx.drawImage(image,sx,sy,right-sx,bottom-sy,-spec.width/2,spec.centerY-spec.height/2,spec.width,spec.height)}}
