"""Read-only atlas analysis: originals remain byte-identical JPGs.
Writes sprite rectangles and vector clipping geometry, never edited rasters.
"""
from PIL import Image
import numpy as np
from collections import deque
from pathlib import Path
import json,hashlib
root=Path('public/game-data/inventory-ui')
sheets={'layout':'layout-and-slots.jpg','states':'states.jpg','reference':'layout-reference.jpg','frame':'frame-v2.jpg','pagination':'pagination-v2.jpg','categories':'categories-v2.jpg'}
rects={'frame':('frame',[0,0,1280,448]),'head':('layout',[470,465,89,88]),'body':('layout',[470,554,89,87]),'hands':('layout',[470,643,89,88]),'feet':('layout',[471,733,88,87]),'weapon':('layout',[719,465,90,88]),'shield':('layout',[719,554,90,88]),'ring':('layout',[719,643,90,88]),'neck':('layout',[719,733,90,88]),'statActive':('states',[21,19,316,54]),'statIdle':('states',[20,84,316,49]),'itemActive':('states',[542,0,125,126]),'itemIdle':('states',[396,4,119,119])}
for i,name in enumerate(['Bag','Equipment','Outfit','Material','Currency']):
 left,right=[(40,282),(286,524),(525,764),(766,1003),(1005,1243)][i]
 rects['tab'+name+'Idle']=('categories',[left,170,right-left,165])
 left,right=[(17,276),(276,522),(522,769),(769,1014),(1014,1265)][i]
 rects['tab'+name+'Active']=('categories',[left,382,right-left,176])
rects.update({'pagePrevious':('pagination',[43,121,148,180]),'pageNext':('pagination',[1094,121,145,180]),'pageActive':('pagination',[286,158,120,118]),'pageIdle':('pagination',[464,160,102,106])})
result={'version':2,'width':1280,'height':448,'sheets':{},'sprites':{}}
for key,name in sheets.items():
 p=root/name;im=Image.open(p);result['sheets'][key]={'path':name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'width':im.width,'height':im.height}
for key,(sheet,r)in rects.items():
 x,y,w,h=r;a=np.array(Image.open(root/sheets[sheet]))[y:y+h,x:x+w];white=(a.min(2)>230)&((a.max(2)-a.min(2))<30);seen=np.zeros((h,w),bool);q=deque()
 for xx in range(w):
  for yy in (0,h-1):
   if white[yy,xx]and not seen[yy,xx]:seen[yy,xx]=1;q.append((yy,xx))
 for yy in range(h):
  for xx in (0,w-1):
   if white[yy,xx]and not seen[yy,xx]:seen[yy,xx]=1;q.append((yy,xx))
 while q:
  yy,xx=q.popleft()
  for ry,rx in ((yy-1,xx),(yy+1,xx),(yy,xx-1),(yy,xx+1)):
   if 0<=ry<h and 0<=rx<w and white[ry,rx]and not seen[ry,rx]:seen[ry,rx]=1;q.append((ry,rx))
 # Merge consecutive identical scan spans into rectangles; this is a vector mask.
 active={};shapes=[]
 for yy in range(h+1):
  spans=[]
  if yy<h:
   row=np.r_[False,~seen[yy],False];changes=np.flatnonzero(row[1:]!=row[:-1]);spans=list(zip(changes[::2].tolist(),changes[1::2].tolist()))
  current=set(spans)
  for span,start in list(active.items()):
   if span not in current:
    left,right=span;shapes.append(f'M{left} {start}h{right-left}v{yy-start}h-{right-left}Z');del active[span]
  for span in spans:
   if span not in active:active[span]=yy
 result['sprites'][key]={'sheet':sheet,'rect':r,'clip':''.join(shapes)}
(root/'atlas.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
print('Registered original JPGs and',len(rects),'vector-masked sprites')
