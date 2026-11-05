const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(String(e));console.log('Page error',String(e))});
 const bundle=require('../public/game-data/maps/forest.map-bundle.json').project;
 const width=bundle.cols*bundle.cell,height=bundle.rows*bundle.cell;
 await page.goto('http://localhost:4173');await page.waitForFunction(()=>window.darkinDebug?.map);
 process.on('SIGTERM',()=>void browser.close().then(()=>process.exit(0)));
 for(const [edge,x,y]of [['north',1500,12],['south',1500,height-12],['west',12,1000],['east',width-12,1000]]){
  await page.evaluate(({edge,x,y})=>{const name='Edge '+edge,id='offline-edge-'+edge;localStorage.setItem('darkin-frontier:character:v1:'+encodeURIComponent(name),id);localStorage.setItem('darkin-frontier-mvp:offline:v1:'+id,JSON.stringify({version:3,map:'spawn_map',x,y,hp:100,kills:0}))},{edge,x,y});await page.fill('#name','Edge '+edge);
  await page.click('#offline');await page.waitForFunction(()=>darkinDebug.visuals.some(v=>v.scale===.7452));
  // Inspect the actual renderer transform for all screen corners: each pixel must map inside terrain.
  const seen=await page.evaluate(()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('No map frame: '+window.edgeLastFill)),6000);
   const proto=CanvasRenderingContext2D.prototype,original=proto.fillRect;
   proto.fillRect=function(x,y,w,h){if(this.canvas.id==='game')window.edgeLastFill=this.fillStyle;if(this.canvas.id==='game'&&this.fillStyle==='#0d1520'){
    const inverse=this.getTransform().inverse(),r=this.canvas.getBoundingClientRect(),sx=this.canvas.width/r.width,sy=this.canvas.height/r.height;
    const corners=[[0,0],[this.canvas.width,0],[0,this.canvas.height],[this.canvas.width,this.canvas.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(inverse));
    clearTimeout(timer);proto.fillRect=original;resolve(corners.map(p=>({x:p.x,y:p.y})));
   }return original.call(this,x,y,w,h)};
  }));
  for(const point of seen)assert.ok(point.x>=-.01&&point.y>=-.01&&point.x<=width+.01&&point.y<=height+.01,edge+' outside terrain');
  console.log('Checked edge',edge,await page.evaluate(()=>darkinDebug.snapshot.actors.find(a=>a.id===darkinDebug.id).y));await page.screenshot({path:`tests/edge-${edge}.png`,scale:'css'});await page.click('#menu');await page.click('#exit');
 }
 await page.click('#offline');for(let n=0;n<20;n++)await page.click('#minus');
 assert.ok(await page.evaluate(()=>darkinDebug.zoom)>=844/height-1e-7);
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);
 assert.ok(await page.evaluate(()=>darkinDebug.zoom)>=844/width-1e-7);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS production mobile: four terrain edges, actual Canvas viewport within map, further 8% scale, zoom floor and landscape resize');
})().catch(e=>{console.error(e);process.exit(1)});
