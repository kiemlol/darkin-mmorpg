import catalog from '../shared/content-assets.json';
export type ContentAsset={src:string;frameWidth?:number;frameHeight?:number;columns?:number;frames?:number;fps?:number;width?:number;height?:number;anchorX?:number;anchorY?:number;filter?:string};
export const contentAssets=catalog.assets as Record<string,ContentAsset>;
const images=new Map<string,HTMLImageElement>();
export function contentImage(id:string){const asset=contentAssets[id];if(!asset)return;let image=images.get(asset.src);if(!image){image=new Image();image.src=asset.src;images.set(asset.src,image)}return image}
export function drawContent(ctx:CanvasRenderingContext2D,id:string,x:number,y:number,time:number,flip=false,startFrame=0){const spec=contentAssets[id],image=contentImage(id);if(!spec||!image?.complete||!image.naturalWidth)return;const width=spec.width||image.naturalWidth,height=spec.height||image.naturalHeight;ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);if(spec.filter)ctx.filter=spec.filter;const ax=spec.anchorX??width/2,ay=spec.anchorY??height;if(spec.frameWidth&&spec.frameHeight){const frame=startFrame+Math.floor(time*(spec.fps||5))%(spec.frames||1),cols=spec.columns||1;ctx.drawImage(image,frame%cols*spec.frameWidth,Math.floor(frame/cols)*spec.frameHeight,spec.frameWidth,spec.frameHeight,-ax,-ay,width,height)}else ctx.drawImage(image,-ax,-ay,width,height);ctx.restore()}

export function contentIcon(id:string){const spec=contentAssets[id];return spec?`<img class="content-item-icon" src="${spec.src}" alt=""${spec.filter?` style="filter:${spec.filter}"`:""}>`:""}
