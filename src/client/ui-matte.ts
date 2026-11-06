// Decode the exterior white matte at load time, not every render. Original JPGs
// remain unchanged; enclosed white flowers/highlights are never flood-filled.
export function clearWhiteMatte(canvas:HTMLCanvasElement,seeds:{x:number;y:number}[]=[]){
 const c=canvas.getContext('2d',{willReadFrequently:true})!,{width:w,height:h}=canvas,image=c.getImageData(0,0,w,h),d=image.data,n=w*h,bg=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
 const add=(i:number)=>{if(i<0||i>=n||bg[i])return;const k=i*4,lo=Math.min(d[k],d[k+1],d[k+2]),hi=Math.max(d[k],d[k+1],d[k+2]);if(d[k+3]===0||lo>155&&hi-lo<65){bg[i]=1;queue[tail++]=i}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}for(const s of seeds)add(Math.floor(s.y)*w+Math.floor(s.x));
 while(head<tail){const i=queue[head++],x=i%w;add(i-w);add(i+w);if(x)add(i-1);if(x<w-1)add(i+1)}
 // Decontaminate the 2px antialiased outline against its white source matte.
 // The band is measured from connected exterior only, so white details inside
 // the gold/brown border remain fully opaque.
 const distance=new Uint8Array(n);distance.fill(255);for(let i=0;i<n;i++)if(bg[i])distance[i]=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;distance[i]=Math.min(distance[i],x?distance[i-1]+1:255,y?distance[i-w]+1:255)}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;distance[i]=Math.min(distance[i],x<w-1?distance[i+1]+1:255,y<h-1?distance[i+w]+1:255)}
 const original=new Uint8ClampedArray(d);
 for(let i=0;i<n;i++){const k=i*4;if(bg[i]){d[k]=d[k+1]=d[k+2]=d[k+3]=0;continue}if(distance[i]>2)continue;
  const x=i%w,y=Math.floor(i/w);let best=-1,luma=Infinity;
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const j=yy*w+xx;if(distance[j]<3)continue;const q=j*4,lum=original[q]+original[q+1]+original[q+2];if(lum<luma){luma=lum;best=q}}
  if(best<0)continue;const foreground=[original[best],original[best+1],original[best+2]],pixel=[original[k],original[k+1],original[k+2]];let num=0,den=0;for(let z=0;z<3;z++){num+=(255-pixel[z])*(255-foreground[z]);den+=(255-foreground[z])**2}const alpha=Math.max(0,Math.min(1,num/Math.max(1,den)));
  if(alpha<.98){for(let z=0;z<3;z++)d[k+z]=Math.max(0,Math.min(255,(pixel[z]-255*(1-alpha))/Math.max(.02,alpha)));d[k+3]=Math.round(original[k+3]*alpha)}
 }
 c.putImageData(image,0,0);return canvas;
}
