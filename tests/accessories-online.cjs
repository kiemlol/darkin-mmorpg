const{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage();const errors=[];let wire='';
 for(const p of[a,b]){p.on('pageerror',e=>errors.push(String(e)));p.on('websocket',s=>s.on('framereceived',e=>wire+=e.payload.toString()));await p.goto('http://localhost:3000');await p.waitForFunction(()=>window.darkinDebug?.map);await p.locator('summary').click();await p.fill('#server','ws://localhost:3000/ws');await p.click('#online');await p.waitForFunction(()=>darkinDebug.status==='Online')}
 const id=await a.evaluate(()=>darkinDebug.id);await a.bringToFront();await a.click('#menu');await a.selectOption('#equipment-item','glasses_square');await a.click('#equipment-equip');
 await b.waitForFunction(id=>darkinDebug.visuals.some(v=>v.id===id&&v.attachments?.some(a=>a.accessoryId==='glasses_square'&&a.visible&&a.loaded)),id);
 await a.selectOption('#equipment-head','nightcamp-head-shadow_knight-v1');await a.selectOption('#equipment-body','custom-body-e851fa74');
 await b.waitForFunction(id=>darkinDebug.visuals.some(v=>v.id===id&&v.headId==='nightcamp-head-shadow_knight-v1'&&v.bodyId==='custom-body-e851fa74'&&v.attachments?.some(a=>a.accessoryId==='glasses_square'&&a.visible)),id);
 await a.click('#equipment-remove');await b.waitForFunction(id=>darkinDebug.visuals.some(v=>v.id===id&&!v.attachments?.some(a=>a.socket==='face'&&a.visible)),id);
 const packets=wire.split('data:image');assert.equal(packets.length,1,'never send image data over WS');assert.ok(!wire.includes('mountProfiles')&&!wire.includes('parts'),'no full bundle/pose fits over WS');assert.deepEqual(errors,[]);
 console.log('PASS two real Online browsers: accessoryId/headId/bodyId sync, observer loads/draws exact gear, rapid head/body change and unequip, no image or pose payload');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
