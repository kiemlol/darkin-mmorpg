import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ExplorationStore,mapRevision,clockHour,daylight,CLOCK_RATE,WORLD_ID} from '../src/shared/map-state';
import {MapProjection} from '../src/client/map-view';
import {GuestStore} from '../src/server/guest-store';
import {World} from '../src/shared/world';
const scope={characterId:'alice',worldId:WORLD_ID,mapId:'rect',mapRevision:'r1'};
const make=(s=scope)=>new ExplorationStore(1500,500,10,35,s);
const seen=(s:ExplorationStore,x:number,y:number)=>s.seen[Math.floor(y/s.cellSize)*s.cols+Math.floor(x/s.cellSize)];
test('permanent exploration, continuous fast movement, teleport only destination, four corners',()=>{
 const s=make();s.visit(100,100,0);const first=s.record();for(let i=1;i<=10;i++)s.visit(100+i*22.5,100,i*.1);
 assert.equal(seen(s,100,100),1);for(let x=100;x<325;x+=10)assert.equal(seen(s,x,100),1,'no holes at run speed');
 s.visit(1300,100,1.1,1);assert.equal(seen(s,1300,100),1);assert.equal(seen(s,800,100),0,'teleport does not uncover connecting path');
 s.visit(1100,100,1.15,1);assert.equal(seen(s,1200,100),0,'unannounced implausible jump also does not sweep');
 for(const [x,y]of [[0,0],[1500,0],[1500,500],[0,500]])s.visit(x,y,2,2);
 for(const [x,y]of [[0,0],[1499,0],[1499,499],[0,499]])assert.equal(seen(s,x,y),1);
 const n=s.count();s.visit(NaN,0,3);s.visit(-1,20,3);assert.equal(s.count(),n);assert.ok(n>0&&n<s.seen.length);assert.notEqual(first.bits,s.record().bits);
});
test('versioned save/reload, map return and strict character/world/revision isolation',()=>{
 const a=make();a.visit(400,200,0);const data=a.record(),reload=make();assert.ok(reload.restore(JSON.parse(JSON.stringify(data))));assert.deepEqual(reload.seen,a.seen);
 for(const field of ['characterId','worldId','mapId','mapRevision'])assert.equal(make({...scope,[field]:'other'}).restore(data),false);
 assert.equal(make().restore({...data,version:2}),false);assert.equal(make().restore({...data,bits:'zz'}),false);
 assert.equal(make().restore({...data,radius:999}),false);assert.equal(make().restore({...data,scope:null}),false);
 const mapB=make({...scope,mapId:'second'});mapB.visit(900,200,0);assert.equal(seen(mapB,400,200),0);assert.ok(reload.restore(data));assert.equal(seen(reload,400,200),1);
});
test('same projection for terrain/fog/foot coordinates, non-square fit, zoom round trips and corners',()=>{
 const p=new MapProjection(1500,500),fit=p.fit(900,900);assert.equal(fit.scale,.6);assert.deepEqual(p.point(fit,0,0),{x:0,y:300});assert.deepEqual(p.point(fit,1500,500),{x:900,y:600});
 for(const [x,y]of [[0,0],[1500,0],[0,500],[1500,500],[720,231]])for(const v of [fit,p.fit(400,800,3,700,250),p.mini(120,110,{x,y} as any,600)]){const pixel=p.point(v,x,y),world=p.inverse(v,pixel.x,pixel.y);assert.ok(Math.abs(world.x-x)<1e-8&&Math.abs(world.y-y)<1e-8)}
});
test('clock comes from simulation, wraps days smoothly; revision changes with real data',async()=>{
 const {project:p}=JSON.parse(await readFile('public/game-data/maps/forest.map-bundle.json','utf8'));
 const w=new World(p),before=w.snapshot().clock!;w.step(.05);assert.equal(w.snapshot().clock!.gameSeconds-before.gameSeconds,.05*CLOCK_RATE);
 assert.equal(clockHour({gameSeconds:25*3600,rate:60}),1);assert.equal(daylight(0),0);assert.equal(daylight(12),1);assert.ok(daylight(6)>0&&daylight(6)<1);assert.ok(Math.abs(daylight(5.999)-daylight(6.001))<.01);
 assert.equal(mapRevision(p),mapRevision(structuredClone(p)));assert.notEqual(mapRevision(p),mapRevision({...p,name:'changed'}));
});
test('server-issued identities, private masks, durable restart and serialized shutdown flush',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'darkin-explore-'));try{
 const file=join(dir,'state.json'),store=await GuestStore.open(file),a=store.identify(null,'A',()=>false),b=store.identify(null,'B',()=>false);
 assert.notEqual(a.guest.id,b.guest.id);const p={id:'map',cols:20,rows:10,cell:100},ea=store.exploration(a.guest,p);ea.visit(500,500,0);store.capture(a.guest,ea);assert.equal(store.exploration(b.guest,p).count(),0);
 await Promise.all([store.flush(1000),store.flush(1200)]);const loaded=await GuestStore.open(file);assert.equal(loaded.clockSeconds,1200);
 const again=loaded.identify(a.resumeToken,'A',()=>false);assert.equal(again.guest.id,a.guest.id);assert.equal(loaded.exploration(again.guest,p).count(),ea.count());
 const concurrent=loaded.identify(a.resumeToken,'A',()=>true);assert.notEqual(concurrent.guest.id,a.guest.id);assert.equal(loaded.exploration(concurrent.guest,p).count(),0);
 assert.notEqual(loaded.identify('forged','A',()=>false).guest.id,a.guest.id);
 }finally{await rm(dir,{recursive:true,force:true})}
});
