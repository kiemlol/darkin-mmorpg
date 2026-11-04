import {assets} from '../src/client/assets';import {CutoutCharacterVisual} from '../src/client/cutout-visual';import {World} from '../src/shared/world';
import {accessoryItems,changeEquipment,defaultEquipment,resolveInventory,mountCatalog,validateAccessoryPack} from '../src/shared/equipment';
const check=(b:unknown,m:string)=>{if(!b)throw Error(m)};
(window as any).runAccessoryChecks=async()=>{
 await assets.init();const map=await(await fetch('/game-data/maps/forest.map-bundle.json')).json(),world=new World(map.project),actor=world.join('me','Test'),id=actor.appearanceId;
 const v=new CutoutCharacterVisual();await v.load({appearanceId:id,equipment:actor});v.update(actor,.11);
 const baselineSprites=Object.keys((window as any).NC.SPR).length;
 actor.action='attack';actor.attackSeq++;v.update(actor,.08);const old=v.player,pose=JSON.stringify(old.pose),time=old.time,face=old.face;
 const square=changeEquipment(actor,{operation:'equip',accessoryId:'glasses_square'});await v.setAppearance(id,square);
 check(v.player.name===old.name&&v.player.time===time&&v.player.face===face&&JSON.stringify(v.player.pose)===pose,'swap preserves actual playing clip, phase, pose and facing');
 const nc=(window as any).NC,attachment=nc.ITEMS[v.player.equip.top].attachments.find((a:any)=>a.accessoryId==='glasses_square'&&a.visible);
 const ctx=(document.getElementById('c') as HTMLCanvasElement).getContext('2d')!,draw=ctx.drawImage.bind(ctx);let captured:any=null;
 (ctx as any).drawImage=(...args:any[])=>{if(args[0]===nc.SPR[attachment.sprite].img)captured={matrix:ctx.getTransform(),args:args.slice(1)};(draw as any)(...args)};
 v.draw(ctx);const expected=nc.attachmentMatrix(v.player.equip,{...v.player.pose,face:v.player.face},attachment,actor.x,actor.y,v.loaded!.appearance.scale);
 check(captured,'accessory pixels are actually drawn');for(const k of ['a','b','c','d','e','f'])check(Math.abs(captured.matrix[k]-expected[k])<1e-4,'actual draw matrix matches rig mount '+k+' '+captured.matrix[k]+' vs '+expected[k]);
 check(JSON.stringify(captured.args)===JSON.stringify([-attachment.anchor[0]*attachment.w,-attachment.anchor[1]*attachment.h,attachment.w,attachment.h]),'actual image rect uses exact Studio anchor and dimensions');(ctx as any).drawImage=draw;
 const round=changeEquipment(actor,{operation:'equip',accessoryId:'glasses_round'});await v.setAppearance(id,round);const stable=v.player;
 const src=accessoryItems[0].src;accessoryItems[0].src='data:image/png;base64,AAAA';await v.setAppearance(id,square);check(v.player===stable,'image decode failure retains real previous renderer');check(!document.getElementById('asset-status')!.hidden,'load failure is visible');accessoryItems[0].src=src;
 const reader=assets.readBundle.bind(assets);assets.readBundle=async path=>{const data=structuredClone(await reader(path));if(path===mountCatalog.characters[0].path)data.project.parts.head.w+=1;return data};
 await v.setAppearance(id,square);check(v.loaded!.warnings.some(w=>w.includes('Chưa có cấu hình')),'actual changed geometry is rechecked, not only metadata');check(!v.debug().attachments.some((a:any)=>a.accessoryId==='glasses_square'&&a.visible),'incompatible accessory really hidden');assets.readBundle=reader;
 await v.setAppearance(id,defaultEquipment(id));check(Object.keys(nc.SPR).length===baselineSprites,'replaced variant textures and rig records released');
 // Wing fixture only: supplied files contain glasses, no actual wing pack.
 const wing:any={format:'nightcamp-pet-cutout-v1',id:'test_wing',name:'Test wing',scale:1,sprites:{near:{src,w:40,h:30},far:{src,w:40,h:30}},spriteOrder:['near','far'],bones:[{id:'root',name:'Root',parent:null,sprite:'near',pivot:[.5,.5],at:[0,0],scale:1,rotation:0,visible:true},{id:'tip',name:'Tip',parent:'root',sprite:'far',pivot:[.5,.5],at:[10,0],scale:1,rotation:0,visible:true}],clip:{name:'Flap',kind:'loop',dur:1,hit:0,keys:[{t:0,curve:'lin',P:{'tip:rot':0}},{t:1,curve:'lin',P:{'tip:rot':1}}]}};
 const c=mountCatalog.characters[0],transform={socket:'back',layer:'back',w:1,h:1,scale:1,x:0,y:0,rotation:0,anchor:[0,0]};const item:any={...structuredClone(accessoryItems[0]),...transform,id:'wing-fixture',accessoryId:'wing-fixture',name:'Wing fixture',category:'wings',wingRig:wing,mountProfiles:[{target:'body',bodyId:c.bodyId,signature:c.mountSignatures.body,transform}]};
 validateAccessoryPack({format:'darkin-accessory-pack-v1',version:1,items:[item]});accessoryItems.push(item);const wingState=defaultEquipment(id);wingState.accessories.find(a=>a.accessoryId===item.accessoryId)!.visible=true;
 await v.setAppearance(id,wingState);const v2=new CutoutCharacterVisual();await v2.load({appearanceId:id,equipment:wingState});actor.action='walk';Object.assign(actor,wingState);const wingBefore=v.player.attachmentTime;v.update(actor,.1);v2.update(actor,.2);
 check(v.debug().attachments.some((a:any)=>a.accessoryId===item.accessoryId&&a.layer==='back'&&a.loaded),'all wingRig images loaded in actual renderer');check(Math.abs(v.player.attachmentTime-wingBefore-.1)<1e-8,'wing uses raw seconds independently of walk clip rate');check(v.player.attachmentTime!==v2.player.attachmentTime,'independent wing clocks');v.draw(ctx);v2.draw(ctx);v2.destroy();v.destroy();accessoryItems.pop();
 return 'PASS exact Studio draw transform/anchor, animation-preserving swap, image failure rollback, geometry re-resolve/hide, texture release, wing image tree and independent clocks';
};
