import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {LocalGameSession} from '../src/client/session';import {Camera2D} from '../src/client/camera';import {PredictedPresentation,SnapshotTimeline,STEP} from '../src/client/presentation';import {World,movement,canWalk,type Intent} from '../src/shared/world';
const original=JSON.parse(readFileSync('public/game-data/maps/forest.map-bundle.json','utf8')).project;
const flat={...original,objects:[],terrain:original.terrain.map(()=> 'grass'),blocked:original.blocked.map(()=>0)};
for(const fps of [30,60,144])test(`render motion is continuous at ${fps} FPS while simulation stays 20 Hz`,()=>{
 const s=new LocalGameSession(flat,'Test');for(const id of [...s.world.actors.keys()])if(id!==s.id)s.world.leave(id);const camera=new Camera2D();camera.reset(flat.spawn.x,flat.spawn.y);let acc=0,seq=0,lastX=flat.spawn.x,lastScreen=0,minScreen=Infinity,maxSpeedError=0;
 for(let n=0;n<fps*2;n++){const dt=1/fps;acc+=dt;while(acc+1e-10>=STEP){s.input({seq:++seq,dx:1,dy:0,run:false,attack:false});acc=Math.max(0,acc-STEP)}s.update(dt);const render=s.renderActors().find(a=>a.id===s.id)!;camera.follow(render.x,render.y,dt);const screen=render.x-camera.x;if(n>fps/4){maxSpeedError=Math.max(maxSpeedError,Math.abs((render.x-lastX)/dt-155));minScreen=Math.min(minScreen,screen-lastScreen)}lastX=render.x;lastScreen=screen}
 assert.ok(maxSpeedError<1e-6,'no 20 Hz stop/jump frames');assert.ok(minScreen>-.001,'screen-space foot never oscillates backwards');assert.ok(Math.abs(s.world.time-2)<1e-7);const before=JSON.stringify(s.world.snapshot());s.renderActors();s.renderActors();assert.equal(JSON.stringify(s.world.snapshot()),before,'presentation cannot alter authority');
});
test('variable frame duration does not change camera lag or movement speed',()=>{
 const c=new Camera2D();c.reset(0,0);let t=0;for(let n=0;n<300;n++){const dt=[1/144,1/60,1/30,.05][n%4];t+=dt;c.follow(155*t,0,dt);if(t>1)assert.ok(Math.abs((155*t-c.x)-155/15)<.001)}
});
test('predicted visual correction is continuous; no double integration per draw',()=>{
 const w=new World(flat),a=w.join('local','Me'),motion=new PredictedPresentation();motion.reconcile(a);const input:Intent={seq:1,dx:1,dy:0,run:false,attack:false};const before={...a};movement(flat,a,input,STEP);motion.tick(before,a);motion.advance(1/60);const first=motion.sample(flat,a);const authority={...a,x:a.x-2};motion.reconcile(authority);assert.ok(Math.abs(motion.sample(flat,a).x-first.x)<1e-7,'snapshot cannot jump visible foot');const unchanged=motion.sample(flat,a);assert.deepEqual(motion.sample(flat,a),unchanged);motion.advance(1/60);assert.ok(motion.sample(flat,a).x>first.x,'continuous forward progression');
});
test('remote snapshot buffer keeps time moving forward with jittered arrival',()=>{
 const w=new World(flat),a=w.join('remote','Other'),timeline=new SnapshotTimeline();let time=0,latest=w.snapshot(),lastX=a.x;for(let n=0;n<120;n++){time+=1/60;if(n%6===0||n%13===0){latest={time,actors:[{...a,x:a.x+time*155}],events:[]};timeline.push(latest)}timeline.advance(1/60);const value=timeline.sample(flat,latest)[0];assert.ok(value.x>=lastX-1e-7,'no rewind on packet arrival');lastX=value.x}
});
test('collision-safe rendering, stop and respawn do not leave old motion trails',()=>{
 const s=new LocalGameSession(original,'Me');s.input({seq:1,dx:0,dy:1,run:true,attack:false});for(let n=0;n<6;n++){s.update(1/60);for(const a of s.renderActors())assert.ok(canWalk(original,a.x,a.y,a.radius))}s.input({seq:2,dx:0,dy:0,run:false,attack:false});for(let n=0;n<6;n++)s.update(1/60);const stopped=s.renderActors().find(a=>a.id===s.id)!;s.update(.05);assert.equal(s.renderActors().find(a=>a.id===s.id)!.y,stopped.y);const a=s.world.actors.get(s.id)!;a.hp=0;s.respawn();const visible=s.renderActors().find(a=>a.id===s.id)!;assert.equal(visible.x,a.x);assert.equal(visible.y,a.y);assert.equal(visible.hp,100)
});

test('prediction does not replay its last segment when input stops/disconnects',()=>{const w=new World(flat),a=w.join('x','Me'),m=new PredictedPresentation();m.reconcile(a);const before={...a};movement(flat,a,{seq:1,dx:1,dy:0,run:true,attack:false},STEP);m.tick(before,a);let last=before.x;for(let n=0;n<60;n++){m.advance(1/60);const x=m.sample(flat,a).x;assert.ok(x>=last-1e-7);last=x}assert.ok(Math.abs(last-a.x)<1e-7)});
