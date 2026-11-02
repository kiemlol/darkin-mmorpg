const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:3000');await page.waitForFunction(()=>window.darkinDebug?.map);
 await page.evaluate(()=>localStorage.setItem('darkin-frontier-mvp:offline:v1',JSON.stringify({map:'spawn_map',x:2076,y:993.75,hp:0,kills:7})));
 await page.click('#offline');const own=()=>page.evaluate(()=>darkinDebug.snapshot.actors.find(a=>a.id===darkinDebug.id));const before=await own();assert.equal(before.hp,100);assert.equal(before.kills,7);
 const mobs=await page.evaluate(()=>darkinDebug.snapshot.actors.filter(a=>a.kind==='mob'));
 await page.keyboard.down('KeyS');await page.waitForTimeout(900);await page.keyboard.up('KeyS');const after=await own();assert.ok(after.y-before.y>100,'keyboard changes real player position after dead-save recovery');
 assert.ok(await page.evaluate(old=>darkinDebug.snapshot.actors.some(a=>a.kind==='mob'&&old.some(b=>a.id===b.id&&Math.hypot(a.x-b.x,a.y-b.y)>15)),mobs),'mob AI changes real mob positions');
 await page.click('#menu');const paused=await page.evaluate(()=>darkinDebug.snapshot.time);await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>darkinDebug.snapshot.time),paused,'menu freezes offline simulation');await page.click('#resume');
 await page.waitForFunction(()=>darkinDebug.snapshot.actors.find(a=>a.id===darkinDebug.id).hp===0,{},{timeout:20000});await page.locator('#death-screen').waitFor({state:'visible'});await page.screenshot({path:'tests/death-recovery.png'});await page.click('#death-respawn');await page.waitForFunction(()=>darkinDebug.snapshot.actors.find(a=>a.id===darkinDebug.id).hp===100);await page.locator('#death-screen').waitFor({state:'hidden'});
 const r=await page.locator('#joystick').boundingBox();const start=await own();await page.mouse.move(r.x+58,r.y+58);await page.mouse.down();await page.mouse.move(r.x+58,r.y+105);await page.waitForTimeout(500);await page.mouse.up();const end=await own();assert.ok(end.y-start.y>40,'joystick changes actual player position after respawn');assert.equal(await page.evaluate(()=>darkinDebug.input.dy),0);assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS movement regression: dead save restored alive, keyboard and joystick positions advance, mobs chase, offline menu pauses, live death overlay & respawn recover movement');
})().catch(e=>{console.error(e);process.exit(1)});
