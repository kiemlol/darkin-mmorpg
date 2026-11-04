import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { randomUUID,randomInt } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { World, validIntent } from '../shared/world.ts';
import {GuestStore} from './guest-store';
import {WORLD_ID,CLOCK_RATE,mapRevision,type ExplorationStore} from '../shared/map-state';
import {validateInteractionBundle} from '../shared/interactions';
const root = resolve('dist'), data = resolve('public/game-data/maps');
const catalog = JSON.parse(await readFile(resolve(data, 'index.json'), 'utf8'));
const b = JSON.parse(await readFile(resolve(data, catalog[0].bundle), 'utf8'));
if (b.format !== 'darkin-map-bundle-v1')
    throw Error('Sai bundle');
validateInteractionBundle(b);
const persistence=await GuestStore.open(resolve(process.env.GAME_STATE_FILE||'data/world-state-v1.json'));
const instanceId=WORLD_ID+':'+b.project.id;
const world = new World(b.project,{instanceId,book:persistence.maps[instanceId],nowSeconds:()=>Date.now()/1000,random:()=>randomInt(0,4294967296)/4294967296,commit:tx=>persistence.commitMining(tx)});
if(persistence.clockSeconds!==null)world.clockBaseSeconds=persistence.clockSeconds;
if(persistence.dirty)await persistence.flush(world.clockBaseSeconds);
const revision=mapRevision(b.project);
const server = createServer(async (req, res) => { try {
    const path = decodeURIComponent(new URL(req.url || '/', 'http://local').pathname);
    if (path === '/health') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, map: b.project.id }));
        return;
    }
    const f = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!f.startsWith(root + '/'))
        throw Error('path');
    const file = await readFile(f);
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.mjs': 'text/javascript', '.css': 'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml' } as any)[extname(f)] || 'application/octet-stream');
    res.end(file);
}
catch {
    res.writeHead(404);
    res.end('Not found');
} });
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 2048 });
const peers = new Map<WebSocket, {
    id: string;
    count: number;
    since: number;
    joined: boolean;
    exploration:ExplorationStore|null;
    guest:any;
    sentVersion:number;
}>();
function detachPeer(ws:WebSocket){const q=peers.get(ws);if(q?.joined){if(q.exploration)persistence.capture(q.guest,q.exploration);world.leave(q.id);q.joined=false}peers.delete(ws)}
wss.on('connection', ws => { ws.on('error', () => { }); if (peers.size >= 64) {
    ws.close(1013, 'Server full');
    return;
} const q = { id: randomUUID() as string, count: 0, since: Date.now(), joined: false,exploration:null as ExplorationStore|null,guest:null as any,sentVersion:-1 }; peers.set(ws, q); ws.on('message', raw => {if(!peers.has(ws)||ws.readyState!==WebSocket.OPEN)return; if (Date.now() - q.since > 1000) {
    q.count = 0;
    q.since = Date.now();
} if (++q.count > 50) {
    ws.close(1008, 'Rate limit');
    return;
} try {
    const m = JSON.parse(raw.toString());
    if (m.type === 'join' && !q.joined) {
        if (typeof m.name !== 'string' || !m.name.trim() || m.name.length > 24)
            throw Error('Tên 1–24 ký tự');
        if(m.resume===true){const guest=persistence.findGuest(m.resumeToken);if(guest)for(const [oldSocket,oldPeer]of peers)if(oldSocket!==ws&&oldPeer.joined&&oldPeer.id===guest.id){detachPeer(oldSocket);oldSocket.close(1000,'Phiên đã kết nối lại')}}
        const name=m.name.replace(/[<>\x00-\x1f]/g,'').slice(0,24),identity=persistence.identify(m.resumeToken,name,id=>world.actors.has(id));q.id=identity.guest.id;q.guest=identity.guest;
        const actor=world.join(q.id,name);world.setRealm(q.id,q.guest);actor.wallet=structuredClone(q.guest.wallet);q.exploration=persistence.exploration(q.guest,b.project);q.exploration.visit(actor.x,actor.y,world.time,actor.teleportSeq);persistence.capture(q.guest,q.exploration);
        q.joined = true;
        ws.send(JSON.stringify({ type: 'welcome',interactionProtocol:1,profileWarnings:identity.warnings, id: q.id,characterId:q.id,resumeToken:identity.resumeToken,worldId:WORLD_ID,mapRevision:revision, map: b.project.id,exploration:q.exploration.record() }));q.sentVersion=q.exploration.version;
    }
    else if(q.joined&&m.type==='interact'){try{world.interactions.start(q.id,m.intent)}catch(e){ws.send(JSON.stringify({type:'interactionError',message:String(e)}))}}
    else if(q.joined&&m.type==='cancelInteraction')world.interactions.cancel(q.id);
    else if (q.joined && m.type === 'input') {
        if (!validIntent(m.input))
            throw Error('Input không hợp lệ');
        world.input(q.id, m.input);
    }
    else if (q.joined && m.type === 'appearance')
        world.setAppearance(q.id, m.appearanceId);
    else if (q.joined && m.type === 'cosmetic') {
        if(!m.command||typeof m.command!=='object')throw Error('Thao tác phụ kiện không hợp lệ');
        world.cosmetic(q.id,m.command);
    }
    else if (q.joined && m.type === 'respawn')
        world.respawn(q.id);
    else
        throw Error('Message không hợp lệ');
}
catch (e) {
    ws.send(JSON.stringify({ type: 'error', message: String(e) }));
} }); ws.on('close', () => detachPeer(ws)); });
let ticks = 0;
const tickTimer=setInterval(() => { world.step(.05);persistence.captureReady(instanceId,world.interactions.publicStates());for(const q of peers.values()){const a=world.actors.get(q.id);if(q.joined&&a){persistence.captureCharacter(q.guest,a);if(q.exploration&&q.exploration.visit(a.x,a.y,world.time,a.teleportSeq))persistence.capture(q.guest,q.exploration)}} if (++ticks % 2 === 0) {
    const s = JSON.stringify({ type: 'snapshot', ...world.snapshot() });
    for (const [ws, q] of peers)
        if (q.joined && ws.readyState === 1) {
            const error=world.interactions.errors.get(q.id);if(error){ws.send(JSON.stringify({type:'interactionError',message:error}));world.interactions.errors.delete(q.id)}
            if (ws.bufferedAmount > 1e6)
                ws.close(1013, 'Slow client');
            else
                ws.send(s);
            if(q.exploration&&q.sentVersion!==q.exploration.version){ws.send(JSON.stringify({type:'exploration',record:q.exploration.record()}));q.sentVersion=q.exploration.version}
        }
} }, 50);
const persist=()=>persistence.flush(world.clockBaseSeconds+world.time*CLOCK_RATE).catch(e=>console.error('World save failed:',e.message));
const persistTimer=setInterval(persist,5000);
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{clearInterval(tickTimer);clearInterval(persistTimer);for(const id of world.actors.keys())world.interactions.cancel(id,'Server dừng');void persist().finally(()=>process.exit(0))});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Darkin HTTP + WS :' + (process.env.PORT || 3000)));
