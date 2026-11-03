const {WebSocket}=require('ws');const assert=require('node:assert/strict');
(async()=>{
 const sockets=[];
 try{
  async function connect(name){const ws=new WebSocket('ws://localhost:3000/ws');sockets.push(ws);const peer={ws,id:null,state:null};ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='welcome')peer.id=m.id;if(m.type==='snapshot')peer.state=m});await new Promise(r=>ws.once('open',r));ws.send(JSON.stringify({type:'join',name}));return peer}
  const fighter=await connect('Corpse fighter'),observer=await connect('Corpse observer');let seq=0,deadId=null,deadTime=0,vanished=false;const start=Date.now();
  await new Promise((resolve,reject)=>{const timer=setInterval(()=>{try{
   if(Date.now()-start>20000)throw Error('Combat/corpse timeout');
   if(!fighter.state||!fighter.id||!observer.state)return;
   const me=fighter.state.actors.find(a=>a.id===fighter.id);if(!me)return;
   if(!deadId){const mob=fighter.state.actors.find(a=>a.id==='mob1');if(mob?.hp===0){deadId=mob.id;deadTime=fighter.state.time;return}
    if(me.hp<=0)throw Error('Fighter died before test kill');
    if(mob){const dx=mob.x-me.x,dy=mob.y-me.y,d=Math.hypot(dx,dy),m=d>55?1:.02;fighter.ws.send(JSON.stringify({type:'input',input:{seq:++seq,dx:dx/Math.max(d,1)*m,dy:dy/Math.max(d,1)*m,run:true,attack:true}}))}
   }else{
    fighter.ws.send(JSON.stringify({type:'input',input:{seq:++seq,dx:0,dy:0,run:false,attack:false}}));
    const mob=observer.state.actors.find(a=>a.id===deadId),age=observer.state.time-deadTime;
    if(age>1.7&&age<7){assert.ok(!mob,'observer must not keep corpse');vanished=true}
    if(age>8.2&&mob?.hp>0){assert.ok(vanished);clearInterval(timer);resolve()}
   }
  }catch(e){clearInterval(timer);reject(e)}},50)});
  console.log('PASS real WebSocket combat: two clients observe corpse removed after 1.5s and mob respawn after 8s, without player respawn or session reset');
 }finally{for(const ws of sockets)ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
