import{INVENTORY_LAYOUT as L}from'./inventory-layout';
export type BagRect={x:number;y:number;width:number;height:number};
export type PortraitPage='character'|'stats';
export const PORTRAIT_BAG={width:400,height:730,sections:{
 ornament:{source:{x:430,y:0,width:400,height:55},target:{x:0,y:0,width:400,height:38}},
 character:{source:{x:430,y:55,width:400,height:330},target:{x:0,y:38,width:400,height:330}},
 stats:{source:{x:140,y:65,width:280,height:320},target:{x:10,y:38,width:380,height:330}},
 bag:{source:{x:840,y:50,width:330,height:380},target:{x:35,y:380,width:330,height:350}},
}} as const;
export function portraitPlacement(rect:BagRect,page:PortraitPage):BagRect|null{for(const key of [page,'bag']as const){const{source:s,target:d}=PORTRAIT_BAG.sections[key],cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;if(cx>=s.x&&cx<=s.x+s.width&&cy>=s.y&&cy<=s.y+s.height)return{x:d.x+(rect.x-s.x)*d.width/s.width,y:d.y+(rect.y-s.y)*d.height/s.height,width:rect.width*d.width/s.width,height:rect.height*d.height/s.height}}return null}
/** Crop existing Darkin art; same rectangles place all live DOM hit targets. */
export function composePortrait(ctx:CanvasRenderingContext2D,source:CanvasImageSource,ratio:number,page:PortraitPage){for(const key of ['ornament',page,'bag']as const){const{source:s,target:d}=PORTRAIT_BAG.sections[key];ctx.drawImage(source,(s.x-L.origin.x)*ratio,s.y*ratio,s.width*ratio,s.height*ratio,d.x,d.y,d.width,d.height);if(key==='bag'){ctx.fillStyle='#2c1e22';ctx.fillRect(d.x+(1100-s.x)*d.width/s.width,d.y,70*d.width/s.width,56*d.height/s.height)}}}
export const portraitInventory=(width:number,height:number)=>height>width;
