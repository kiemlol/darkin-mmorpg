const{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await browser.newPage({viewport:{width:1100,height:700}});await p.goto('http://localhost:5173/tests/map-ui-harness.html');await p.waitForFunction(()=>window.runMapUIChecks);console.log(await p.evaluate(()=>runMapUIChecks()));await p.screenshot({path:'tests/map-ui-checkerboard.png'});
 await p.evaluate(()=>{hudFixture.root.style.background='#fff'});await p.screenshot({path:'tests/map-ui-white.png'});await p.evaluate(()=>{hudFixture.root.style.background='#000'});await p.screenshot({path:'tests/map-ui-black.png'});
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
