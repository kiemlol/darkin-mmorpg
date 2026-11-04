import { STEP, interpolateSnapshot, PredictedPresentation, SnapshotTimeline } from './presentation';
import type { CosmeticCommand } from '../shared/equipment';
import { createExploration, offlineCharacter, loadExploration, saveExploration, EXPLORE_PREFIX } from './map-session';
import { type ExplorationStore, type ClockState, CLOCK_RATE, initialClock, scopeKey, WORLD_ID, mapRevision } from '../shared/map-state';
import { World, movement, validIntent, type Intent, type Snapshot, type Actor } from '../shared/world';
import {normalizeRealm,validRealmState} from '../shared/realms';
export interface GameSession {
    id: string;
    characterId: string;
    exploration: ExplorationStore | null;
    status: string;
    dataWarnings?:string[];
    snapshot: Snapshot;
    clock(): ClockState;
    input(i: Intent, tick?: boolean): void;
    update(dt: number): void;
    renderActors(): Actor[];
    respawn(): void;
    setAppearance(id: string): void;
    cosmetic(command: CosmeticCommand): void;
    destroy(): void;
}
const SAVE = 'darkin-frontier-mvp:offline:v1';
export class LocalGameSession implements GameSession {
    id = 'local';
    status = 'Offline';
    dataWarnings:string[]=[];
    world: World;
    snapshot: Snapshot;
    previous: Snapshot;
    acc = 0;
    saveTime = 0;
    characterId: string;
    exploration: ExplorationStore;
    private lifetime = new AbortController();
    constructor(p: any, name: string) {
        this.characterId = offlineCharacter(name);
        this.exploration = createExploration(p, this.characterId);
        loadExploration(this.exploration);
        this.world = new World(p);
        const a = this.world.join(this.id, name);
        let migrate=false;
        try {
            const s = JSON.parse(localStorage.getItem(SAVE + ':' + this.characterId) || (name === 'Lữ khách' ? localStorage.getItem(SAVE) : null) || 'null');
            const profile=normalizeRealm(s);this.world.setRealm(this.id,profile.state);this.dataWarnings=profile.warnings;migrate=!!s&&(s.version!==2||profile.migrated);
            if (s?.map === p.id) {
                if (Number.isFinite(s.clockSeconds))
                    this.world.clockBaseSeconds = s.clockSeconds;
                if (Number.isSafeInteger(s.kills) && s.kills >= 0)
                    a.kills = s.kills;
                // A new offline session must be playable even if the previous tab saved a death.
                // Live deaths still require the explicit respawn action below.
                if (Number.isFinite(s.hp) && s.hp > 0 && Number.isFinite(s.x) && Number.isFinite(s.y)) {
                    Object.assign(a, this.world.findSpawn(s.x, s.y), { hp: Math.min(a.maxHp, s.hp) });
                }
            }
        }
        catch { }
        this.snapshot = this.world.snapshot();
        this.previous = this.snapshot;
        this.exploration.visit(a.x, a.y, this.world.time, a.teleportSeq);
        if(migrate)this.save();
        if (typeof window !== 'undefined') {
            window.addEventListener('pagehide', () => this.save(), {signal:this.lifetime.signal});
            document.addEventListener('visibilitychange', () => {if(document.hidden)this.save()}, {signal:this.lifetime.signal});
        }
    }
    input(i: Intent) { this.world.input(this.id, i); }
    update(dt: number) { this.acc += Math.min(dt, .25); while (this.acc + 1e-10 >= STEP) {
        this.previous = this.snapshot;
        this.world.step(STEP);
        this.snapshot = this.world.snapshot();
        const a = this.world.actors.get(this.id)!;
        this.exploration.visit(a.x, a.y, this.world.time, a.teleportSeq);
        this.acc = Math.max(0, this.acc - STEP);
    } this.saveTime += dt; if (this.saveTime > 2) {
        this.save();
        this.saveTime = 0;
    } }
    clock() { return { gameSeconds: this.world.clockBaseSeconds + (this.world.time + this.acc) * CLOCK_RATE, rate: CLOCK_RATE }; }
    renderActors() { return interpolateSnapshot(this.world.p, this.previous, this.snapshot, this.acc / STEP); }
    save() { const a = this.world.actors.get(this.id)!; saveExploration(this.exploration); try {
        localStorage.setItem(SAVE + ':' + this.characterId, JSON.stringify({ version: 2, characterId: this.characterId, realmId:a.realmId,realmStageId:a.realmStageId,map: this.world.p.id, x: a.x, y: a.y, hp: a.hp, kills: a.kills, clockSeconds: this.clock().gameSeconds }));
    }
    catch { } }
    setAppearance(id: string) { this.world.setAppearance(this.id, id); this.snapshot = this.world.snapshot(); this.previous = this.snapshot; }
    cosmetic(command: CosmeticCommand) { this.world.cosmetic(this.id, command); this.snapshot = this.world.snapshot(); this.previous = this.snapshot; }
    respawn() { this.world.respawn(this.id); const a = this.world.actors.get(this.id)!; this.exploration.visit(a.x, a.y, this.world.time, a.teleportSeq); this.snapshot = this.world.snapshot(); this.previous = this.snapshot; }
    destroy() { this.lifetime.abort(); this.save(); }
    static reset(name = 'Lữ khách') { const id = offlineCharacter(name); localStorage.removeItem(SAVE + ':' + id); if (name === 'Lữ khách')
        localStorage.removeItem(SAVE); for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(EXPLORE_PREFIX + encodeURIComponent(id) + ':'))
            localStorage.removeItem(key);
    } }
}
export class NetworkGameSession implements GameSession {
    id = '';
    status = 'Đang kết nối…';
    dataWarnings:string[]=[];
    snapshot: Snapshot = { time: 0, actors: [], events: [] };
    socket: WebSocket;
    pending: {
        input: Intent;
        dt: number;
    }[] = [];
    motion = new PredictedPresentation();
    timeline = new SnapshotTimeline();
    previous: Snapshot | null = null;
    received = 0;
    lastReceived = performance.now();
    closed = false;
    predicted: Actor | null = null;
    characterId = '';
    exploration: ExplorationStore | null = null;
    clockElapsed = 0;
    tokenKey = '';
    resumeToken = '';
    constructor(public p: any, name: string, url: string) { const u = new URL(url || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`); if (!['ws:', 'wss:'].includes(u.protocol) || location.protocol === 'https:' && u.protocol !== 'wss:')
        throw Error('Trang HTTPS yêu cầu địa chỉ wss://');this.tokenKey='darkin-frontier:online-guest:v1:'+encodeURIComponent(u.href)+':'+encodeURIComponent(name);try{this.resumeToken=sessionStorage.getItem(this.tokenKey)||localStorage.getItem(this.tokenKey)||''}catch{} this.socket = new WebSocket(u); this.socket.onopen = () => this.socket.send(JSON.stringify({ type: 'join', name,resumeToken:this.resumeToken })); this.socket.onmessage = e => { try {
        const m = JSON.parse(e.data);
        if (m.type === 'welcome') {
            if (m.map !== p.id) {
                this.status = 'Server dùng map khác';
                this.socket.close();
                return;
            }
            this.id = m.id;
            this.dataWarnings=Array.isArray(m.profileWarnings)?m.profileWarnings.filter((v:unknown)=>typeof v==='string').slice(0,4):[];
            if(!m.characterId||!m.worldId||m.mapRevision!==mapRevision(p)){this.status='Server cần cập nhật map/khám phá';this.socket.close();return}
            this.characterId=m.characterId;this.resumeToken=m.resumeToken;this.exploration=createExploration(p,m.characterId,m.worldId,m.mapRevision);this.exploration.restore(m.exploration);
            try{sessionStorage.setItem(this.tokenKey,m.resumeToken);if(!localStorage.getItem(this.tokenKey))localStorage.setItem(this.tokenKey,m.resumeToken)}catch{}
            this.status = 'Online';
        }
        if (m.type === 'error')
            this.status = m.message;
        if(m.type==='exploration'&&this.exploration)this.exploration.restore(m.record);
        if (m.type === 'snapshot') {
            if(!Array.isArray(m.actors)||m.actors.some((a:any)=>a.kind==='player'&&!validRealmState(a))){this.status='Dữ liệu cảnh giới server không hợp lệ';return}
            this.previous = this.snapshot;
            this.snapshot = m;
            this.clockElapsed=0;
            this.timeline.push(m);
            this.received = performance.now();
            this.lastReceived = this.received;
            const a = m.actors.find((a: Actor) => a.id === this.id);
            if (a) {
                this.pending = this.pending.filter(q => q.input.seq > a.ack);
                this.predicted = { ...a };
                for (const q of this.pending)
                    movement(p, this.predicted!, q.input, q.dt);
                this.motion.reconcile(this.predicted!);
            }
        }
    }
    catch {
        this.status = 'Dữ liệu server không hợp lệ';
    } }; this.socket.onclose = () => { this.status = 'Mất kết nối — bấm Thử lại'; this.pending = []; }; this.socket.onerror = () => { this.status = 'Không kết nối được server — bấm Thử lại'; }; }
    input(i: Intent, tick = true) { if (this.socket.readyState !== 1 || !this.id || !validIntent(i))
        return; this.socket.send(JSON.stringify({ type: 'input', input: i })); this.pending.push({ input: i, dt: tick ? STEP : 0 }); if (this.pending.length > 40)
        this.pending.shift(); if (this.predicted && tick) {
        const before = { ...this.predicted };
        movement(this.p, this.predicted, i, STEP);
        this.motion.tick(before, this.predicted);
    } }
    clock(){const c=this.snapshot.clock;return c?{gameSeconds:c.gameSeconds+Math.min(1,this.clockElapsed)*c.rate,rate:c.rate}:{gameSeconds:initialClock(this.p),rate:0}}
    update(dt: number) {this.clockElapsed+=Math.max(0,dt); this.motion.advance(dt); this.timeline.advance(dt); if (this.socket.readyState === 1 && performance.now() - this.lastReceived > 5000) {
        this.status = 'Server không phản hồi — bấm Thử lại';
        this.socket.close();
    } }
    renderActors() { return this.timeline.sample(this.p, this.snapshot).map(a => a.id === this.id && this.predicted ? this.motion.sample(this.p, { ...a, dir: this.predicted.dir }) : a); }
    setAppearance(id: string) { if (this.socket.readyState === 1)
        this.socket.send(JSON.stringify({ type: 'appearance', appearanceId: id })); }
    cosmetic(command: CosmeticCommand) { if (this.socket.readyState === 1)
        this.socket.send(JSON.stringify({ type: 'cosmetic', command })); }
    respawn() { if (this.socket.readyState === 1)
        this.socket.send(JSON.stringify({ type: 'respawn' })); }
    destroy() { this.closed = true; this.socket.onclose = null; this.socket.onmessage = null; this.socket.close(); this.pending = []; }
}
