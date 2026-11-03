import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,CORPSE_SECONDS,MOB_RESPAWN_SECONDS,canWalk,movement,playBounds} from '../src/shared/world';
import {LocalGameSession} from '../src/client/session';
import {Camera2D} from '../src/client/camera';
import {gameCatalog} from '../src/shared/catalog';
const p=JSON.parse(readFileSync('public/game-data/maps/forest.map-bundle.json','utf8')).project;
test('corpse expires and mob respawns without player death/respawn or session reset',()=>{
 const w=new World(p),a=w.join('me','Me'),mob=w.actors.get('mob0')!;
 w.hit(a,mob,100);const killed=mob.deadAt;assert.equal(mob.hp,0);
 assert.ok(w.snapshot().actors.some(x=>x.id===mob.id));
 // A dead player remains dead: cleanup must not require their respawn button.
 a.hp=0;
 while(w.time-killed<CORPSE_SECONDS+.1)w.step();
 assert.ok(!w.snapshot().actors.some(x=>x.id===mob.id));
 assert.equal(w.actors.get(mob.id)!.hp,0);assert.equal(a.hp,0);
 while(w.time-killed<MOB_RESPAWN_SECONDS+.1)w.step();
 const reborn=w.snapshot().actors.find(x=>x.id===mob.id)!;
 assert.equal(reborn.hp,reborn.maxHp);assert.equal(reborn.corpseOpacity,1);
 assert.ok(canWalk(p,reborn.x,reborn.y));assert.equal(a.hp,0);
});
test('Offline presentation removes corpse on schedule while player stays alive',()=>{
 const s=new LocalGameSession(p,'Test'),a=s.world.actors.get(s.id)!,mob=s.world.actors.get('mob0')!;
 for(const id of [...s.world.actors.keys()])if(id!==s.id&&id!==mob.id)s.world.leave(id);
 s.world.hit(a,mob,100);s.update(.05);
 assert.ok(s.renderActors().some(x=>x.id===mob.id));
 for(let n=0;n<32;n++)s.update(.05);
 assert.ok(!s.renderActors().some(x=>x.id===mob.id));assert.equal(a.hp,100);
});
test('camera covers only terrain at all edges, sizes and zoom levels',()=>{
 const b={x0:0,y0:0,x1:p.cols*p.cell,y1:p.rows*p.cell},c=new Camera2D();
 for(const [w,h] of [[390,844],[844,390],[1440,900],[3840,2160]])for(const requested of [.35,.5,1,1.15,2])for(const [x,y] of [[0,0],[b.x1,0],[0,b.y1],[b.x1,b.y1],[1500,900]]){
  c.reset(x,y);const zoom=c.fitZoom(requested,w,h,b),view=c.viewport(w,h,zoom,b);
  assert.ok(view.x>=-1e-7&&view.y>=-1e-7);
  assert.ok(view.x+w/zoom<=b.x1+1e-7&&view.y+h/zoom<=b.y1+1e-7);
 }
});
test('default player visuals grow exactly 15 percent with unchanged physical radius',()=>{
 const appearance=gameCatalog.appearances.find(a=>a.id===gameCatalog.defaults.appearance)!;
 assert.ok(Math.abs(appearance.scale/.6-1.15)<1e-9);
 const w=new World(p),a=w.join('me','Me');assert.equal(a.radius,12);
});
test('movement respects safe terrain border and still slides along it',()=>{
 const flat={...p,objects:[],blocked:p.blocked.map(()=>0)},w=new World(flat),a=w.join('me','Me'),b=playBounds(flat);
 a.x=b.x0;a.y=b.y0;
 movement(flat,a,{seq:1,dx:-1,dy:-1,run:true,attack:false},.1);
 assert.equal(a.x,b.x0);assert.equal(a.y,b.y0);
 movement(flat,a,{seq:2,dx:-1,dy:1,run:true,attack:false},.1);
 assert.equal(a.x,b.x0);assert.ok(a.y>b.y0);assert.ok(canWalk(flat,a.x,a.y));
});
