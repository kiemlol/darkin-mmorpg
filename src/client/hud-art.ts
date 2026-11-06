import {clearWhiteMatte} from './ui-matte';
// Decode/cache an exterior matte once; never recolor the original files.
const cache=new Map<string,Promise<HTMLCanvasElement>>();
export function hudArt(src:string,avatarHole=false){const key=src+':'+avatarHole;if(cache.has(key))return cache.get(key)!;
 const promise=(async()=>{const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d')!.drawImage(img,0,0);return clearWhiteMatte(c,avatarHole?[{x:170,y:180}]:[]);})();cache.set(key,promise);return promise;
}
