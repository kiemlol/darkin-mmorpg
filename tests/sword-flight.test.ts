import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {World,movement,SPEED,RUN_SPEED,canWalk} from '../src/shared/world';
import {flightJump,flightConfig,flightFrame,phaseAt,RIDE_AT,JUMP_AT,JUMP_SECONDS,equippedFlightWeapon,validSwordFlight} from '../src/shared/sword-flight';
const p=JSON.parse(readFileSync('public/game-data/maps/forest.map-bundle.json','utf8')).project;
const flat=()=>({...structuredClone(p),objects:[],blocked:p.blocked.map(()=>0),terrain:p.terrain.map(()=> 'grass'),walkable:p.walkable.map(()=>0)});
const setup=(map=flat())=>{const w=new World(map);for(const [id,a]of w.actors)if(a.kind==='mob')w.actors.delete(id);const a=w.join('a','A');a.x=500;a.y=600;a.dir=0;let seq=0;const step=(n=1,dx=0,dy=0,run=false,attack=false)=>{for(let k=0;k<n;k++){w.input(a.id,{seq:++seq,dx,dy,run,attack});w.step(.05)}};return{w,a,step}};
test('uploaded jump remains byte exact with stable ID, authored keys and seconds',()=>{
 const bytes=readFileSync('public/game-data/animations/sword-flight/jump.animation-pack.json');assert.equal(createHash('sha256').update(bytes).digest('hex'),'3303010313e3b256c4d99d41bf59d3041e253acded38c6c13444f716eb631c5f');const raw=JSON.parse(bytes.toString());assert.deepEqual(flightJump,raw.clip);assert.equal(flightJump.id,raw.animationId);assert.equal(JUMP_SECONDS,.8);assert.equal(flightJump.kind,'loop');assert.equal(flightJump.keys[4].P.y,-20);
});
test('one full orbit, settle enlarges the same equipped sword, then automatic jump and idle riding',()=>{
 const {w,a,step}=setup();w.swordFlight(a.id,true,1);const f={...a.swordFlight!};const first=flightFrame(f,a,0),last=flightFrame(f,a,flightConfig.orbitSeconds-1e-8);assert.ok(Math.abs((last.heading-first.heading)-Math.PI*2)<1e-6);assert.equal(first.size,1);assert.equal(flightFrame(f,a,JUMP_AT).size,1.3);assert.equal(phaseAt(JUMP_AT+.01),'jump');assert.equal(phaseAt(RIDE_AT),'riding');
 step(20,1,0,true);assert.equal(a.x,500);assert.equal(a.y,600);step(10);assert.equal(a.swordFlight?.phase,'jump');assert.equal(a.action,'jump');step(16);assert.equal(a.swordFlight?.phase,'riding');assert.equal(a.action,'idle');assert.equal(a.x,532);assert.equal(a.y,600);assert.equal(a.accessories.find(a=>a.accessoryId===f.weaponId)?.visible,true);assert.equal(a.toolId,'combat');assert.equal(a.interactionTarget,undefined);
 const frame=flightFrame(a.swordFlight!,a);assert.equal(frame.x,a.x);assert.equal(frame.y,a.y);assert.ok(frame.height>=15&&frame.height<=17);
});
test('riding uses authoritative normal/diagonal speeds, ground collision and idle rather than walk/run',()=>{
 const {w,a,step}=setup();w.swordFlight(a.id,true,1);step(46);let x=a.x,y=a.y;step(1,1,0);assert.ok(Math.abs(a.x-x-SPEED*.05)<1e-8);assert.equal(a.action,'idle');x=a.x;y=a.y;step(1,1,1,true);assert.ok(Math.abs(Math.hypot(a.x-x,a.y-y)-RUN_SPEED*.05)<1e-8);assert.equal(a.swordFlight?.heading,a.dir);assert.equal(a.action,'idle');
 const cellX=7;w.p.blocked=w.p.blocked.map((_:number,i:number)=>i%p.cols===cellX?1:0);a.x=cellX*p.cell-20;a.y=600;const predicted=structuredClone(a);for(let i=0;i<100;i++)movement(w.p,predicted,{seq:i,dx:1,dy:0,run:true,attack:false},.1);assert.ok(predicted.x<cellX*p.cell);step(20,1,0,true);assert.ok(a.x<cellX*p.cell);assert.ok(canWalk(w.p,a.x,a.y,a.radius));
});
test('invalid/unarmed/dead/combat/blocked boarding commands are rejected; retries never restart orbit',()=>{
 const {w,a,step}=setup();assert.throws(()=>w.swordFlight(a.id,true,NaN));assert.throws(()=>w.swordFlight(a.id,'true' as any,0));w.cosmetic(a.id,{operation:'unequip',accessoryId:'sw_patchwork'});assert.equal(equippedFlightWeapon(a),null);assert.throws(()=>w.swordFlight(a.id,true,1));w.cosmetic(a.id,{operation:'equip',accessoryId:'sw_patchwork'});a.hp=0;assert.throws(()=>w.swordFlight(a.id,true,1));a.hp=100;a.combatUntil=10;assert.throws(()=>w.swordFlight(a.id,true,1));a.combatUntil=0;
 const bx=Math.floor((a.x+32)/p.cell);w.p.blocked[Math.floor(a.y/p.cell)*p.cols+bx]=1;assert.throws(()=>w.swordFlight(a.id,true,1));w.p.blocked=w.p.blocked.map(()=>0);w.swordFlight(a.id,true,1);step(4);const elapsed=a.swordFlight!.elapsed;w.swordFlight(a.id,true,1);w.swordFlight(a.id,true,2);assert.equal(a.swordFlight!.elapsed,elapsed);const snap=w.snapshot();step(2);assert.equal(snap.actors.find(v=>v.id===a.id)!.swordFlight!.elapsed,elapsed);
});
test('timeout stops riding, interrupts boarding; landing restores hand without changing HP/wallet/realm',()=>{
 const {w,a,step}=setup();a.wallet.spirit_stone=29;a.hp=72;const state=[a.hp,a.radius,a.wallet.spirit_stone,a.realmId,a.realmStageId];w.swordFlight(a.id,true,1);for(let k=0;k<9;k++)w.step(.05);assert.equal(w.snapshot().actors.find(v=>v.id===a.id)!.swordFlight,undefined);step(1);w.swordFlight(a.id,true,2);step(46);step(1,1,0);for(let k=0;k<10;k++)w.step(.05);const x=a.x;for(let k=0;k<10;k++)w.step(.05);assert.equal(a.x,x);assert.equal(a.swordFlight?.phase,'riding');w.swordFlight(a.id,false,3);assert.equal(a.swordFlight?.phase,'landing');step(6);assert.equal(a.swordFlight,undefined);assert.deepEqual([a.hp,a.radius,a.wallet.spirit_stone,a.realmId,a.realmStageId],state);assert.equal(equippedFlightWeapon(a),'sw_patchwork');
});
test('attack, hits, death, changed equipment/appearance, teleport and disconnect clear flight safely',()=>{
 for(const scenario of ['attack','hit','death','equipment','appearance','teleport','disconnect']){const {w,a,step}=setup();w.swordFlight(a.id,true,1);step(46);
  if(scenario==='attack'){step(1,0,0,false,true);assert.equal(a.attackSeq,1)}
  if(scenario==='hit'){const b=w.make('b','Mob','mob',{x:a.x+30,y:a.y});w.hit(b,a,9);assert.equal(a.hp,91)}
  if(scenario==='death'){a.hp=0;step()}
  if(scenario==='equipment')w.cosmetic(a.id,{operation:'unequip',accessoryId:'sw_patchwork'});
  if(scenario==='appearance')w.setAppearance(a.id,'shadow-knight-default');
  if(scenario==='teleport'){a.teleportSeq++;a.x=700;step()}
  if(scenario==='disconnect'){w.leave(a.id);assert.equal(w.actors.has(a.id),false);assert.equal(w.flightCommands.has(a.id),false);continue}
  assert.equal(a.swordFlight,undefined,scenario);
 }
});
test('interaction cannot use floating sword as mining hammer or award currency mid-flight',()=>{
 const {w,a,step}=setup(structuredClone(p));a.x=336.5124547636102;a.y=725;a.dir=Math.PI/2;w.swordFlight(a.id,true,1);step(46);assert.equal(a.interactionTarget,undefined);assert.equal(a.toolId,'combat');assert.throws(()=>w.interactions.start(a.id,{mapId:p.id,objectId:'linh_thach2',cycle:0,requestId:'flight-mining'}),/hạ phi kiếm/);assert.equal(a.wallet.spirit_stone,0);w.swordFlight(a.id,false,2);step(6);assert.ok(!a.swordFlight);
});
test('mounted sword keeps water and authored bridge walk rules',()=>{
 const map=flat(),tile=4*p.cols+5;map.terrain[tile]='water';const {w,a,step}=setup(map);w.swordFlight(a.id,true,1);step(46);a.x=620;a.y=600;step(8,1,0,true);assert.ok(a.x<640,'water still blocks a low hovering sword');
 w.p.objects.push({id:'flight-bridge-fixture',asset:'camp_oak',x:690,y:600,scale:1,rotation:0,flip:false,layer:'ground',collider:null,walk:{type:'rect',x:0,y:0,w:140,h:50}});step(8,1,0,true);assert.ok(a.x>680,'authored bridge walk surface remains traversable');assert.ok(canWalk(w.p,a.x,a.y,a.radius));
});
test('malformed network flight state is rejected before the renderer can consume it',()=>{
 const {w,a}=setup();w.swordFlight(a.id,true,1);assert.ok(validSwordFlight(a.swordFlight));for(const bad of [null,{}, {...a.swordFlight,weaponId:'unpublished'}, {...a.swordFlight,elapsed:NaN}, {...a.swordFlight,phase:'teleport'}, {...a.swordFlight,facing:0}, {...a.swordFlight,id:1e14}])assert.equal(validSwordFlight(bad),false);
});
