import {SkillVisuals} from './skill-visuals';
import {SkillUI} from './skill-ui';
import './style.css';
import {SoulEffects} from './soul-effects';
import { loadMap } from './map';
import { Camera2D } from './camera';
import { LocalGameSession, NetworkGameSession, type GameSession } from './session';
import { Input } from './input';
import { PlaceholderCharacterVisual, type CharacterVisual } from './visual';
import { CutoutCharacterVisual } from './cutout-visual';
import { assets, assetWarning } from './assets';
import {InventoryUI} from './inventory-ui';
import {EquipmentUI} from './equipment-ui';
import {MinimapHUD} from './map-hud';
import {PlayerHUD} from './player-hud';
import {InteractionUI} from './interaction-ui';
import {SwordFlightUI} from './sword-flight-ui';
import {DEFAULT_ZOOM} from './view-settings';
import {clockHour} from '../shared/map-state';
import type { Intent } from '../shared/world';
const $ = (id: string) => document.getElementById(id)!;
const canvas = $('game') as HTMLCanvasElement, c = canvas.getContext('2d')!;
let player: any, session: GameSession | null = null, input: Input | null = null, zoom = DEFAULT_ZOOM, seq = 0, acc = 0, last = performance.now(), mode = 'offline', visuals = new Map<string, CharacterVisual>(), bounds = { x0: -180, y0: -180, x1: 3300, y1: 2300 };
let currentIntent: Omit<Intent, 'seq'> = { dx: 0, dy: 0, run: false, attack: false };
const camera = new Camera2D();
const soulEffects=new SoulEffects(),skillVisuals=new SkillVisuals();
const skillUI=new SkillUI(()=>session,()=>!!session&&!dialog.open&&!mapHUD.panel.open&&!inventoryUI.open&&!document.hidden);
let ready = false;
const equipmentUI=new EquipmentUI(()=>session);
const inventoryUI=new InventoryUI(()=>session,equipmentUI,()=>{mapHUD.close();input?.clear();stop();session?.cancelInteraction()});
const mapHUD=new MinimapHUD(()=>{input?.clear();stop()});
const playerHUD=new PlayerHUD(mapHUD.root);
const interactionUI=new InteractionUI($('attack'));
const flightUI=new SwordFlightUI($('sword-flight') as HTMLButtonElement);
window.addEventListener('blur',()=>session?.cancelInteraction());
document.addEventListener('visibilitychange',()=>{if(document.hidden)session?.cancelInteraction()});
let sceneHour=-1;
function setZoom(f: number) { zoom = camera.fitZoom(Math.max(.35, Math.min(2, zoom * f)), innerWidth, innerHeight, bounds); $('zoom-label').textContent = Math.round(zoom * 100) + '%'; }
$('plus').onclick = () => setZoom(1.15);
$('minus').onclick = () => setZoom(1 / 1.15);
function stop() { interactionUI.release();currentIntent = { dx: 0, dy: 0, run: false, attack: false }; session?.input({ ...currentIntent, seq: ++seq }, false); }
function cleanup() { skillVisuals.clear();skillUI.reset(); soulEffects.reset();inventoryUI.reset(); $('preview-notice').hidden=true;flightUI.reset();mapHUD.close();interactionUI.reset();playerHUD.reset();equipmentUI.reset(); $('death-screen').hidden = true; document.body.classList.remove('is-dead'); input?.destroy(); input = null; session?.destroy(); session = null; for (const v of visuals.values())
    v.destroy(); visuals.clear(); acc = 0; seq = 0; currentIntent = { dx: 0, dy: 0, run: false, attack: false }; }
async function start(m: string) { if (!ready)
    return; cleanup(); mode = m;zoom=DEFAULT_ZOOM;setZoom(1); try {
    const name = ($('name') as HTMLInputElement).value.trim() || 'Lữ khách';
    session = m === 'offline' ? new LocalGameSession(player.sourceProject||player.project, name) : new NetworkGameSession(player.sourceProject||player.project, name, ($('server') as HTMLInputElement).value.trim());
    const initial=session.renderActors().find(a=>a.id===session!.id);camera.reset(initial?.x??player.project.spawn.x,initial?.y??player.project.spawn.y);playerHUD.update(initial||null,true);
    input = new Input(canvas, setZoom, stop);
    $('lobby').hidden = true;
    $('hud').hidden = false;
    $('controls').hidden = false;
    document.body.classList.add('playing');
    $('error').textContent = '';
}
catch (e) {
    $('error').textContent = String(e);
} }
const appearanceSelect = $('appearance') as HTMLSelectElement;
appearanceSelect.onchange = () => {equipmentUI.reset();session?.setAppearance(appearanceSelect.value)};
$('offline').onclick = () => start('offline');
$('online').onclick = () => start('online');
$('retry').onclick = () => start('online');
const respawn = () => { stop(); session?.respawn(); };
$('respawn').onclick = respawn;
$('death-respawn').onclick = respawn;
const dialog = $('pause') as HTMLDialogElement;
$('menu').onclick = () => { if (session) {
    input?.clear();
    dialog.showModal();
} };
$('resume').onclick = () => dialog.close();
$('preview-bow').onclick=()=>{if(session){input?.clear();session.previewAnimation('bow_shoot');dialog.close()}};
$('exit').onclick = () => { dialog.close(); cleanup(); document.body.classList.remove('playing'); $('lobby').hidden = false; $('hud').hidden = true; $('controls').hidden = true; };
$('reset').onclick = () => { dialog.close(); cleanup(); LocalGameSession.reset(($('name') as HTMLInputElement).value.trim()||'Lữ khách'); start('offline'); };
try {
    const loaded = await loadMap();await skillVisuals.load();
    try {
        await assets.init();
        await assets.load(assets.catalog.defaults.appearance);
    }
    catch (e) {
        assetWarning(String(e));
    }
    player = loaded.player;
    bounds = loaded.bounds;
    camera.reset(player.project.spawn.x, player.project.spawn.y);
    if (assets.catalog)
        for (const a of assets.catalog.appearances) {
            const o = document.createElement('option');
            o.value = a.id;
            o.textContent = a.name;
            appearanceSelect.append(o);
        }
    ready = true;
}
catch (e) {
    $('error').textContent = 'Không tải được map: ' + e;
}
function frame(now: number) { const dt = Math.min((now - last) / 1000, .25); last = now; const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 3); if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
} c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, canvas.width, canvas.height); c.setTransform(dpr, 0, 0, dpr, 0, 0); if (player) {
    zoom = camera.fitZoom(zoom, w, h, bounds);
    $('zoom-label').textContent = Math.round(zoom * 100) + '%';
    let actors = session?.renderActors() || [];
    if (session) {
        const flightPressed=input!.consumeFlightPress();
        if(flightPressed&&!dialog.open&&!mapHUD.panel.open&&!inventoryUI.open&&!document.hidden){input!.clear();flightUI.toggle(session,actors.find(a=>a.id===session!.id))}
        if (!dialog.open && !mapHUD.panel.open && !inventoryUI.open && !document.hidden)
            currentIntent = interactionUI.intent(session,actors.find(a=>a.id===session!.id),input!.sample(),input!.consumeActionPress(),()=>session!.input({seq:++seq,dx:0,dy:0,run:false,attack:false},false));
        else
            currentIntent = { dx: 0, dy: 0, run: false, attack: false };
        acc += dt;
        while (acc + 1e-10 >= .05) {
            session.input({ ...currentIntent, seq: ++seq });
            interactionUI.sent();
            acc = Math.max(0, acc - .05);
        }
        if (!(session instanceof LocalGameSession && (dialog.open || inventoryUI.open || document.hidden)))
            session.update(dt);
        actors = session.renderActors();
        const me = actors.find(a => a.id === session!.id);
        if (me) {
            camera.follow(me.x, me.y, dt);
            $('respawn').hidden = me.hp > 0;
            $('death-screen').hidden = me.hp > 0;
            document.body.classList.toggle('is-dead', me.hp <= 0);
            $('stats').textContent = `${me.kills} quái hạ gục${mode === 'online' ? ' · ' + actors.filter(a => a.kind === 'player').length + ' người chơi' : ''}`;
        }
        $('status').textContent = session.status;
        const previewNote=$('preview-notice');previewNote.textContent=session.previewMessage;previewNote.hidden=!session.previewMessage;
        const notice=$('profile-notice');notice.hidden=!session.dataWarnings?.length;notice.textContent=session.dataWarnings?.join(' ')||'';
        $('retry').hidden = mode !== 'online' || session.status === 'Online' || session.status === 'Đang kết nối…';
    }
    const { x, y } = camera.viewport(w, h, zoom, bounds);
    for (const a of actors) {
        let v = visuals.get(a.id);
        if (!v) {
            v = a.kind === 'player' ? new CutoutCharacterVisual() : new PlaceholderCharacterVisual();
            void v.load({ appearanceId: a.appearanceId,equipment:a });
            visuals.set(a.id, v);
        }
        v.update(a, dt);
        if(a.id===session?.id)equipmentUI.update(v instanceof CutoutCharacterVisual?v.loaded?.key:undefined);
    }
    for (const [id, v] of visuals)
        if (!actors.some(a => a.id === id)) {
            v.destroy();
            visuals.delete(id);
        }
    if(session){sceneHour=clockHour(session.clock());player.project.lighting??={};player.project.lighting.mode='time';player.project.lighting.hour=sceneHour;}
    const skillSnapshot=session instanceof NetworkGameSession&&session.socket.readyState!==WebSocket.OPEN?null:session?.snapshot||null;
    skillVisuals.update(skillSnapshot,actors,visuals,session instanceof LocalGameSession&&(dialog.open||inventoryUI.open||document.hidden)?0:dt);
    const occlusionActor=actors.find(a=>a.id===session?.id),occlusionVisual=occlusionActor&&visuals.get(occlusionActor.id);const bodyHeight=occlusionVisual instanceof CutoutCharacterVisual?160*(occlusionVisual.loaded?.appearance.scale||.7452)+(occlusionVisual.flight.frame?.riderHeight||0):32;const focus=occlusionActor?{...occlusionActor,occlusionHeight:bodyHeight}:null;
    const souls=soulEffects.update(session instanceof NetworkGameSession&&session.socket.readyState!==WebSocket.OPEN?null:session?.snapshot||null,actors,visuals,dt)||[];
    player.renderer.draw(c, { width: w, height: h, x, y, zoom, time: now / 1000, actor: focus, dt, beforeEntities:(ctx:CanvasRenderingContext2D)=>skillVisuals.draw(ctx,'low'),afterEntities:(ctx:CanvasRenderingContext2D)=>{skillVisuals.draw(ctx,'high');skillVisuals.draw(ctx,'glow')}, actors:[...actors,...souls], objectState:(id:string)=>{const n=session?.snapshot.nodes?.find(n=>n.objectId===id);return n?{hidden:n.hidden,shakeX:n.status==='mining'?Math.sin(now/1000*36)*1.5:0,shakeAngle:n.status==='mining'?Math.sin(now/1000*31)*.008:0}:undefined},drawActor: (ctx: CanvasRenderingContext2D,a:any) => a.kind==='soul'?soulEffects.draw(ctx,a):visuals.get(a.id)?.draw(ctx) } as any);
    if (session) {
        c.save();
        c.scale(zoom, zoom);
        c.translate(-x, -y);
        c.textAlign = 'center';
        c.font = 'bold 21px system-ui';
        for (const e of session.snapshot.events) {
            const age = session.snapshot.time - e.time;
            c.globalAlpha = Math.max(0, 1 - age / 1.2);
            c.fillStyle = '#ffe6ae';
            c.strokeStyle = '#352630';
            c.lineWidth = 3;
            c.strokeText('-' + e.damage, e.x, e.y - age * 35);
            c.fillText('-' + e.damage, e.x, e.y - age * 35);
        }
        c.restore();
    }
    const me=actors.find(a=>a.id===session?.id)||null,visual=me?visuals.get(me.id):null,portrait=visual instanceof CutoutCharacterVisual?()=>visual.portrait():undefined;playerHUD.update(me,!!session,portrait);mapHUD.update(player,session,me,dt,portrait);interactionUI.update(session,me,dt);flightUI.update(session,me,dt);inventoryUI.update(dt);skillUI.update(session,me,dt,skillVisuals.loaded);
} requestAnimationFrame(frame); }
requestAnimationFrame(frame);
// Read-only diagnostics for acceptance tests; no gameplay authority.
Object.defineProperty(window, 'darkinDebug', { get: () => ({ skillVFX:skillVisuals.debug(),souls:soulEffects.frame.map(s=>({...s})),lighting:player?.renderer?.diagnostics?.(),inventoryUI:inventoryUI.debug(),playerUI:playerHUD.debug(),mapUI:mapHUD.debug(),exploration:session?.exploration?{scope:session.exploration.scope,count:session.exploration.count(),version:session.exploration.version,seen:Array.from(session.exploration.seen)}:null,characterId:session?.characterId,input: input?.sample(), mode, status: session?.status, id: session?.id, snapshot: session?.snapshot, zoom, camera: { x: camera.x, y: camera.y }, map: player?.project.id, visuals: [...visuals.entries()].map(([id, v]) => ({ id, ...(v instanceof CutoutCharacterVisual ? v.debug() : { type: 'placeholder' }) })) }) });
