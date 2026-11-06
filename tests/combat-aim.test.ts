import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {World,RANGE,COOLDOWN} from '../src/shared/world';import {COMBAT_SECONDS} from '../src/shared/combat';
const source=JSON.parse(readFileSync('public/game-data/maps/forest.map-bundle.json','utf8')).project;
const setup=(objects:any[]=[])=>{const w=new World({...structuredClone(source),objects,terrain:source.terrain.map(()=> 'grass'),blocked:source.blocked.map(()=>0),walkable:source.walkable.map(()=>0)});w.actors.clear();const a=w.join('p','Player');a.x=1000;a.y=1000;a.dir=0;return{w,a}};
const mob=(w:World,id:string,x:number,y:number,hp=60)=>{const b=w.make(id,id,'mob',{x,y});b.hp=hp;w.actors.set(id,b);return b};
test('only positive real damage starts/refills combat for exactly 1.5s on both sides',()=>{
 const {w,a}=setup(),b=mob(w,'near',1040,1000);w.hit(a,b,22);assert.equal(COMBAT_SECONDS,1.5);assert.equal(a.combatUntil,1.5);assert.equal(b.combatUntil,1.5);assert.equal(w.inCombat(a),true);w.time=1.499;assert.equal(w.inCombat(a),true);w.time=1.5;assert.equal(w.inCombat(a),false);assert.equal(w.inCombat(b),false);assert.equal(b.hp,38);
 w.time=2;w.hit(b,a,9);assert.equal(a.combatUntil,3.5);w.time=3;w.hit(a,b,1);assert.equal(a.combatUntil,4.5);const events=w.events.length;for(const damage of [0,-1,NaN,Infinity])w.hit(a,b,damage);assert.equal(a.combatUntil,4.5);assert.equal(w.events.length,events);w.time=4.5;assert.equal(w.inCombat(a),false,'nearby living mob cannot retain combat');
});
test('misses and held empty swings never enter combat or refresh an existing damage timer',()=>{
 const {w,a}=setup();w.attack(a);assert.equal(a.combatUntil,0);assert.equal(w.inCombat(a),false);assert.equal(a.attackSeq,1);assert.equal(a.cooldown,COOLDOWN);assert.equal(w.events.length,0);
 a.combatUntil=1.5;for(let k=0;k<10;k++){w.time+=.2;a.cooldown=0;w.attack(a)}assert.equal(a.combatUntil,1.5);assert.equal(w.inCombat(a),false);assert.equal(w.events.length,0);
 const far=mob(w,'far',a.x+RANGE+1,a.y);a.cooldown=0;w.attack(a);assert.equal(far.hp,60);assert.equal(a.combatUntil,1.5);
});
test('auto aim selects nearest live mob behind the player, keeps range/cooldown and never hits players',()=>{
 const {w,a}=setup(),front=mob(w,'front',1060,1000),behind=mob(w,'behind',960,1000);mob(w,'dead-near',990,1000,0);const other=w.join('other','Other');other.x=1005;other.y=1000;
 assert.equal(a.dir,0);assert.equal(w.nearestAttackTarget(a)?.id,behind.id);assert.equal(a.dir,0,'selection does not turn or auto-walk before a swing');w.attack(a);assert.equal(a.attackTargetId,behind.id);assert.equal(a.dir,Math.PI);assert.equal(a.attackDir,Math.PI);assert.equal(behind.hp,38);assert.equal(front.hp,60);assert.equal(other.hp,100);assert.equal(a.x,1000);assert.equal(a.y,1000);
 const timer=a.combatUntil,seq=a.attackSeq;for(let k=0;k<100;k++)w.attack(a);assert.equal(a.attackSeq,seq);assert.equal(behind.hp,38);assert.equal(a.combatUntil,timer);
});
test('occluded nearest mob is skipped, including a thin collider, without hitting through walls',()=>{
 const asset=Object.keys(source.assets).find(k=>source.assets[k].kind!=='ground')!;
 const wall={id:'thin-wall-fixture',asset,x:984,y:1000,scale:1,rotation:0,flip:false,layer:'sorted',walk:null,collider:{type:'rect',x:0,y:0,w:2,h:80}};
 const {w,a}=setup([wall]),hidden=mob(w,'hidden',968,1000),visible=mob(w,'visible',1060,1000);assert.equal(w.nearestAttackTarget(a)?.id,visible.id);w.attack(a);assert.equal(a.attackTargetId,visible.id);assert.equal(hidden.hp,60);assert.equal(visible.hp,38);
 w.actors.delete(visible.id);a.cooldown=0;w.time=2;w.attack(a);assert.equal(a.attackTargetId,undefined);assert.equal(hidden.hp,60);assert.equal(w.inCombat(a),false,'wall-blocked swing cannot extend combat');
});
test('equal-distance tie is stable, dead targets are replaced and old directional cleave is preserved',()=>{
 const {w,a}=setup(),b=mob(w,'z-last',1040,1000,22),c=mob(w,'a-first',960,1000,22);w.attack(a);assert.equal(a.attackTargetId,c.id);assert.equal(c.hp,0);a.cooldown=0;w.time=.55;w.attack(a);assert.equal(a.attackTargetId,b.id);assert.equal(b.hp,0);
 const d=mob(w,'near',1040,1000),e=mob(w,'cleave',1055,1010);a.cooldown=0;w.attack(a);assert.equal(a.attackTargetId,d.id);assert.equal(d.hp,38);assert.equal(e.hp,38,'existing multi-target cone damage stays unchanged');
});
test('after 1.5s mining and sword flight unlock even with a living mob 85 units away',()=>{
 const ore=structuredClone(source.objects.find((o:any)=>o.id==='linh_thach2'));ore.x=1000;ore.y=950;const {w,a}=setup([ore]),b=mob(w,'outside-melee',1085,1000);w.hit(b,a,9);assert.throws(()=>w.swordFlight(a.id,true,1),/giao chiến/);const intent={mapId:w.p.id,objectId:ore.id,cycle:0,requestId:'after-combat'};assert.throws(()=>w.interactions.start(a.id,intent),/giao chiến/);w.time=1.5;assert.equal(w.inCombat(a),false);assert.equal(w.interactions.nearest(a)?.objectId,ore.id);w.interactions.start(a.id,intent);assert.ok(w.interactions.channels.has(a.id));w.interactions.cancel(a.id);a.dir=Math.PI;w.swordFlight(a.id,true,1);assert.equal(a.swordFlight?.phase,'orbit');assert.equal(a.wallet.spirit_stone,0);
});
test('attackable nearby mobs keep attack-button priority without creating combat; misses do not lock flight',()=>{
 const ore=structuredClone(source.objects.find((o:any)=>o.id==='linh_thach2'));ore.x=1000;ore.y=950;const {w,a}=setup([ore]);mob(w,'attackable',1060,1000);assert.equal(w.inCombat(a),false);assert.equal(w.interactions.nearest(a),null);assert.throws(()=>w.interactions.start(a.id,{mapId:w.p.id,objectId:ore.id,cycle:0,requestId:'priority'}),/tầm đánh/);assert.equal(a.combatUntil,0);
 w.actors.delete('attackable');a.dir=Math.PI;w.attack(a);assert.equal(w.inCombat(a),false);w.swordFlight(a.id,true,1);assert.equal(a.swordFlight?.phase,'orbit','a miss can be interrupted by flight without a fake combat delay');
});
