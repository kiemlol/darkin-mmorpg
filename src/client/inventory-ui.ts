import './inventory.css';
import {InventoryArt} from './inventory-art';
import {InventoryPreview} from './inventory-preview';
import {itemDefinition,MAX_STACK,type Inventory} from '../shared/inventory';
import {SPEED,RUN_SPEED,RANGE,PLAYER_DAMAGE,type Actor} from '../shared/world';
import {realmLabels} from '../shared/realms';
import {mountCatalog,resolveInventory} from '../shared/equipment';
import {assets} from './assets';
import type {GameSession} from './session';
import type {EquipmentUI} from './equipment-ui';
const names=['Mũ / Kính','Trang phục','Găng tay','Giày','Vũ khí','Khiên','Nhẫn','Dây chuyền'];
const sprites=['head','body','hands','feet','weapon','shield','ring','neck'] as const;
export class InventoryUI{
 panel=document.createElement('dialog');viewport=document.createElement('div');surface=document.createElement('div');stage=document.createElement('div');canvas=document.createElement('canvas');previewCanvas=document.createElement('canvas');details=document.createElement('div');notice=document.createElement('p');art=new InventoryArt();preview=new InventoryPreview();scale=1;compact=false;selected=-1;stat=-1;gear=-1;filter=0;moveFrom=-1;quantity=1;detailKey='';message='';artError='';lastActor:Actor|null=null;
 constructor(private session:()=>GameSession|null,private equipment:EquipmentUI,private stop:()=>void){
  this.panel.id='inventory';this.panel.setAttribute('aria-label','Nhân vật và túi đồ');
  const top=document.createElement('div');top.className='bag-top';top.append(Object.assign(document.createElement('strong'),{textContent:'NHÂN VẬT & TÚI ĐỒ'}),this.button('Đóng ×',()=>this.close()));
  const nav=document.createElement('nav');nav.className='bag-nav';['Chỉ số','Nhân vật','Túi đồ'].forEach((name,i)=>nav.append(this.button(name,()=>this.scroll(i))));
  this.viewport.className='bag-viewport';this.surface.className='bag-surface';this.stage.className='bag-stage';this.canvas.className='bag-art';this.previewCanvas.className='bag-preview';this.place(this.previewCanvas,402,85,380,320);this.stage.append(this.canvas,this.previewCanvas);
  this.label('Thông tin',155,93,224,38,'bag-heading');this.label('',500,91,200,32,'bag-character-name');
  for(let i=0;i<7;i++){const b=this.hot('',154,149+i*36,226,35,()=>{this.stat=i;this.selected=-1;this.gear=-1;this.moveFrom=-1;this.detailKey=''});b.classList.add('bag-stat');b.dataset.stat=String(i)}
  names.forEach((name,i)=>{const left=i<4,x=left?430:710,y=102+(i%4)*73;const b=this.hot(name,x-6,y-6,70,70,()=>{this.gear=i;this.selected=-1;this.stat=-1;this.moveFrom=-1;this.detailKey=''});b.classList.add('bag-gear');b.textContent='';b.title=name});
  for(let i=0;i<16;i++){const x=826+i%4*78,y=139+Math.floor(i/4)*60;const b=this.hot('Ô '+(i+1),x-6,y-6,70,60,()=>this.selectSlot(i));b.textContent='';b.dataset.slot=String(i);b.classList.add('bag-slot');if(i>=4){b.disabled=true;b.setAttribute('aria-label','Ô khóa '+(i+1))}}
  ['Tất cả','Trang bị','Tiêu hao','Nguyên liệu','Tiền tệ'].forEach((name,i)=>{const b=this.hot(name,800+i*69,84,68,47,()=>{this.filter=i;this.moveFrom=-1;this.selected=-1;this.gear=-1;this.stat=-1;this.detailKey=''});b.classList.add('bag-category');b.textContent='';b.title=name;b.dataset.category=String(i)});
  this.hot('Đóng túi đồ',1115,25,69,69,()=>this.close()).textContent='';
  this.surface.append(this.stage);this.viewport.append(this.surface);this.details.className='bag-details';this.notice.className='bag-notice';this.notice.setAttribute('role','status');this.panel.append(top,nav,this.viewport,this.details,this.notice);document.body.append(this.panel);
  this.panel.addEventListener('close',()=>{document.body.classList.remove('inventory-open');this.stop();this.preview.destroy();this.lastActor=null});this.panel.addEventListener('cancel',()=>this.stop());
  this.panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key.toLowerCase()==='i'){e.preventDefault();this.close()}});
  window.addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='i'||e.repeat||/INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement)?.tagName))return;if(!this.session())return;e.preventDefault();this.open?this.close():this.show()});
  window.addEventListener('resize',()=>{if(this.open)this.layout()});
  const menu=this.button('Nhân vật / Túi đồ  [I]',()=>this.show());menu.id='open-inventory';document.getElementById('pause')!.insertBefore(menu,document.getElementById('resume'));
  void this.art.load().catch(e=>{this.artError='Không tải được khung túi: '+e});
 }
 get open(){return this.panel.open}
 button(text:string,fn:()=>void){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;return b}
 place(el:HTMLElement,x:number,y:number,w:number,h:number){Object.assign(el.style,{position:'absolute',left:x-81+'px',top:y-5+'px',width:w+'px',height:h+'px'})}
 hot(text:string,x:number,y:number,w:number,h:number,fn:()=>void){const b=this.button(text,fn);b.setAttribute('aria-label',text);b.className='bag-hot';this.place(b,x,y,w,h);this.stage.append(b);return b}
 label(text:string,x:number,y:number,w:number,h:number,cls:string){const e=document.createElement('div');e.textContent=text;e.className=cls;this.place(e,x,y,w,h);this.stage.append(e);return e}
 show(){if(!this.session())return;(document.getElementById('pause') as HTMLDialogElement).close();this.stop();this.message='';this.detailKey='';this.selected=-1;this.stat=-1;this.gear=-1;this.moveFrom=-1;this.panel.showModal();document.body.classList.add('inventory-open');this.layout();this.scroll(1)}
 close(){this.panel.close()}
 reset(){if(this.open)this.close();else this.preview.destroy();this.lastActor=null}
 layout(){this.compact=innerWidth<700;this.panel.classList.toggle('compact',this.compact);this.scale=this.compact?.82:Math.min(1.05,(innerWidth-24)/1125,(innerHeight-145)/436);this.scale=Math.max(.3,this.scale);const width=1125*this.scale,height=436*this.scale;this.surface.style.width=width+'px';this.surface.style.height=height+'px';this.stage.style.transform=`scale(${this.scale})`;this.panel.style.width=(this.compact?innerWidth-12:width)+'px';this.viewport.style.height=Math.min(height,innerHeight-(this.compact?220:140))+'px';this.detailKey='';if(this.compact)this.scroll(1)}
 scroll(i:number){const center=[270,592,975][i]-81;this.viewport.scrollLeft=center*this.scale-this.viewport.clientWidth/2}
 selectSlot(i:number){const bag=this.lastActor?.inventory;if(!bag||i>=bag.capacity)return;if(this.moveFrom>=0){this.session()?.moveInventory({from:this.moveFrom,to:i,quantity:this.quantity,revision:bag.revision});this.moveFrom=-1;this.message='';this.detailKey=''}this.selected=i;this.stat=-1;this.gear=-1;this.detailKey=''}
 stats(a:Actor){return['HP  '+a.hp+' / '+a.maxHp,'Cận chiến: '+PLAYER_DAMAGE,`Tốc độ  ${SPEED} / ${RUN_SPEED}`,`Tầm đánh  ${RANGE}`,'MP  Chưa kích hoạt',realmLabels(a).realm,'Tiềm năng: '+(a.potentialPoints??0)]}
 worn(a:Actor,id:string){return resolveInventory(a).inventory.some(s=>(s.accessoryId||s.id)===id&&s.visible!==false)}
 drawImage(c:CanvasRenderingContext2D,id:string,x:number,y:number,size:number){const img=this.preview.itemImage(id);if(!img)return;const k=Math.min(size/img.width,size/img.height);c.drawImage(img,x+(size-img.width*k)/2,y+(size-img.height*k)/2,img.width*k,img.height*k)}
 update(dt:number){if(!this.open)return;const session=this.session(),a=session?.snapshot.actors.find(a=>a.id===session.id);if(!a||!session)return;this.lastActor=a;this.stage.querySelector('.bag-character-name')!.textContent=a.name;void this.preview.show(a);this.preview.update(dt);
  const ratio=Math.min(devicePixelRatio||1,3)*this.scale,bag=a.inventory;
  for(const [canvas,w,h]of [[this.canvas,1125,436],[this.previewCanvas,380,320]] as const){if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}const ctx=canvas.getContext('2d')!;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(ratio,0,0,ratio,0,0)}
  const c=this.canvas.getContext('2d')!;c.translate(-81,-5);this.art.frame(c);this.preview.draw(this.previewCanvas.getContext('2d')!);
  this.stats(a).forEach((text,i)=>{this.art.draw(c,this.stat===i?'statActive':'statIdle',154,149+i*36,226);const b=this.stage.querySelector<HTMLButtonElement>(`[data-stat="${i}"]`)!;b.textContent=text;b.classList.toggle('active',this.stat===i);b.setAttribute('aria-pressed',String(this.stat===i))});
  sprites.forEach((s,i)=>{const x=i<4?430:710,y=102+i%4*73;this.art.draw(c,s,x,y,58);if(this.gear===i){c.strokeStyle='#ffdf83';c.lineWidth=3;c.strokeRect(x-2,y-2,62,62)}if(i===0||i===4){const item=bag?.slots.find(s=>s&&itemDefinition(s.itemId)?.slot===(i===4?'weapon':'head')&&this.worn(a,s.itemId));if(item)this.drawImage(c,item.itemId,x+5,y+5,48)}});
  for(let i=0;i<16;i++){const x=826+i%4*78,y=139+Math.floor(i/4)*60,s=bag?.slots[i],visible=this.filter<2||this.moveFrom>=0;this.art.draw(c,this.selected===i?'itemActive':'itemIdle',x,y,58,58);c.textAlign='center';c.font='bold 20px system-ui';if(i>=4){c.fillStyle='#130f14bb';c.fillRect(x+5,y+5,48,48);c.fillStyle='#8f7760';c.fillText('×',x+29,y+35)}else if(s&&visible){this.drawImage(c,s.itemId,x+6,y+3,46);c.textAlign='right';c.fillStyle='#fff2c9';c.strokeStyle='#1b111a';c.lineWidth=3;c.strokeText(String(s.quantity),x+51,y+51);c.fillText(String(s.quantity),x+51,y+51);if(this.worn(a,s.itemId)){c.textAlign='left';c.font='bold 12px system-ui';c.fillStyle='#ffe091';c.fillText('ĐEO',x+6,y+13)}}const b=this.stage.querySelector<HTMLButtonElement>(`[data-slot="${i}"]`)!;b.disabled=i>=4||!bag;b.setAttribute('aria-label',i>=4?'Ô khóa':s&&visible?`${itemDefinition(s.itemId)?.name} × ${s.quantity}`:'Ô trống '+(i+1));b.setAttribute('aria-pressed',String(this.selected===i))}
  this.art.footer(c);c.font='bold 17px system-ui';c.textAlign='center';c.fillStyle='#f5d897';c.fillText(this.filter===4?`${a.wallet.spirit_stone} Linh thạch`:`${bag?.slots.filter(Boolean).length??0}/4 ô · tối đa ${MAX_STACK}/ô`,975,398);
  this.stage.querySelectorAll<HTMLElement>('[data-category]').forEach(b=>b.classList.toggle('active',Number(b.dataset.category)===this.filter));
  const key=JSON.stringify([this.selected,this.stat,this.gear,this.filter,this.moveFrom,bag?.revision,a.hp,a.maxHp,a.appearanceId,a.headId,a.bodyId,a.accessories,a.potentialPoints,a.realmId,a.realmStageId]);if(key!==this.detailKey){this.detailKey=key;this.renderDetails(a,bag)}
  this.notice.textContent=this.artError||session.inventoryMessage||this.message||this.preview.message||(!bag?'Backend chưa hỗ trợ túi đồ; hãy cập nhật backend.':'');
 }
 renderDetails(a:Actor,bag:Inventory|undefined){this.details.replaceChildren();const text=document.createElement('div');text.className='bag-description';this.details.append(text);const session=this.session()!;
  if(this.moveFrom>=0){text.textContent='Chọn ô đích để chuyển / gộp. Ô khóa chưa dùng được.';this.details.append(this.button('Hủy',()=>{this.moveFrom=-1;this.detailKey=''}));return}
  if(this.stat>=0){text.textContent=this.stats(a)[this.stat]+' · Chưa thiết lập quy tắc cộng điểm.';const b=this.button('+ Cộng điểm',()=>{});b.disabled=true;this.details.append(b);return}
  const stack=bag?.slots[this.selected],def=stack?itemDefinition(stack.itemId):undefined;
  if(def&&stack){text.textContent=`${def.name} · ${stack.quantity}/${MAX_STACK} — ${def.description}`;this.details.append(this.button(this.worn(a,def.id)?'Tháo':'Đeo',()=>{void this.equip(def.accessoryId!,!this.worn(a,def.id))}));
   const quantity=document.createElement('select');quantity.setAttribute('aria-label','Số lượng chuyển');for(let i=1;i<=stack.quantity;i++)quantity.add(new Option(String(i),String(i)));quantity.value=String(stack.quantity);this.details.append(quantity,this.button('Chuyển ô',()=>{this.quantity=Number(quantity.value);this.moveFrom=this.selected;this.filter=0;this.detailKey=''}));return}
  if(this.gear>=0){text.textContent=names[this.gear]+': '+(this.gear===0?'Phụ kiện đầu phải khớp cấu hình Studio.':this.gear===4?'Chọn kiếm trong túi để đeo hoặc tháo.':this.gear===1||this.gear===2||this.gear===3?'Các bộ phận liền trang phục; chọn ngoại hình đã phát hành.':'Chưa có vật phẩm được phát hành cho ô này.');
   if([1,2,3].includes(this.gear)){const s=document.createElement('select');s.setAttribute('aria-label','Chọn trang phục');for(const appearance of assets.catalog.appearances)s.add(new Option(appearance.name,appearance.id));s.value=a.appearanceId;s.onchange=()=>{this.equipment.reset();session.setAppearance(s.value)};this.details.append(s)}
   if(this.gear===0){const s=document.createElement('select');s.setAttribute('aria-label','Chọn đầu');for(const mount of mountCatalog.characters)s.add(new Option(mount.name,mount.headId));s.value=a.headId;s.onchange=()=>{void this.equipment.apply({operation:'mount',headId:s.value}).then(()=>{this.message=this.equipment.note.textContent||''})};this.details.append(s)}return}
  text.textContent=this.filter===4?`${a.wallet.spirit_stone} Linh thạch · Số dư ví, không chiếm ô túi.`:this.filter>1?'Chưa có vật phẩm trong nhóm này.':'Chọn chỉ số, ô trang bị hoặc vật phẩm. Túi có 4 ô; mỗi chồng tối đa 10. Điểm tiềm năng chưa kích hoạt.';
 }
 async equip(id:string,enabled:boolean){this.message='Đang nạp trang bị…';await this.equipment.apply({operation:enabled?'equip':'unequip',accessoryId:id});this.message=this.equipment.note.textContent||'';this.detailKey=''}
 debug(){return{open:this.open,selected:this.selected,moveFrom:this.moveFrom,previewKey:this.preview.loaded?.key||'',requestedKey:this.preview.key,previewTime:this.preview.player?.time,previewReady:!!this.preview.player,scale:this.scale,capacity:this.lastActor?.inventory?.capacity}}
}
