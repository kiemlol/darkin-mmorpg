// Rendering masks only: the supplied JPEG files stay byte-for-byte unchanged.
const cache=new Map<string,Promise<HTMLCanvasElement>>();
export function hudArt(src:string,avatarHole=false){const key=src+':'+avatarHole;if(cache.has(key))return cache.get(key)!;
 const promise=(async()=>{const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(img,0,0);
  const image=ctx.getImageData(0,0,c.width,c.height),d=image.data,n=c.width*c.height,visited=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
  const add=(i:number)=>{if(i<0||i>=n||visited[i])return;visited[i]=1;const k=i*4;if(d[k]>=238&&d[k+1]>=238&&d[k+2]>=238){queue[tail++]=i;d[k+3]=0}};
  for(let x=0;x<c.width;x++){add(x);add((c.height-1)*c.width+x)}for(let y=0;y<c.height;y++){add(y*c.width);add(y*c.width+c.width-1)}
  if(avatarHole)add(180*c.width+170);
  while(head<tail){const i=queue[head++],x=i%c.width;add(i-c.width);add(i+c.width);if(x>0)add(i-1);if(x<c.width-1)add(i+1)}
  // Only connected exterior/portrait whites are removed; enclosed flowers/highlights survive.
  ctx.putImageData(image,0,0);return c;
 })();cache.set(key,promise);return promise;
}
