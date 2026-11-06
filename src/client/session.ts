import {validSoulProjectiles} from '../shared/weapons';
import {SOUL_BANNER_ID} from '../shared/inventory';
import { STEP, interpolateSnapshot, PredictedPresentation, SnapshotTimeline } from './presentation';
import type { CosmeticCommand } from '../shared/equipment';
import { createExploration, offlineCharacter, loadExploration, saveExploration, EXPLORE_PREFIX } from './map-session';
import { type ExplorationStore, type ClockState, CLOCK_RATE, initialClock, scopeKey, WORLD_ID, mapRevision } from '../shared/map-state';
import { World, movement, validIntent, type Intent, type Snapshot, type Actor } from '../shared/world';
import {normalizeRealm,validRealmState} from '../shared/realms';
import {normalizeWallet,addReward,type Wallet} from '../shared/resources';
import {activeNodes,type InteractionIntent,type MiningBook,type Transaction} from '../shared/interactions';
import {validSwordFlight,equippedFlightWeapon,flightConfig} from '../shared/sword-flight';
import {validAnimationPreview} from '../shared/animation-previews';
import {normalizeCharacterProfile,profileRecord} from '../shared/character-profile';
import {validInventory,type InventoryMove} from '../shared/inventory';
export interface GameSession {
    id: string;
    characterId: string;
    exploration: ExplorationStore | null;
    status: string;
    dataWarnings?:string[];
    interactionMessage:string;
    inventoryMessage:string;
    moveInventory(command:InventoryMove):void;
    flightMessage:string;
    previewMessage:string;
    previewAnimation(actionId:string):void;
    snapshot: Snapshot;
    clock(): ClockState;
    input(i: Intent, tick?: boolean): void;
    update(dt: number): void;
    renderActors(): Actor[];
    respawn(): void;
    setAppearance(id: string): void;
    cosmetic(command: CosmeticCommand): void;
    interact(intent:InteractionIntent):void;
    cancelInteraction():void;
    setSwordFlight(enabled:boolean):void;
    destroy(): void;
}
const SAVE = 'darkin-frontier-mvp:offline:v1';
export class LocalGameSession implements GameSession {
    id = 'local';
    status = 'Offline';
    dataWarnings:string[]=[];
    interactionMessage='';
    inventoryMessage='';
    previewMessage='';previewSeq=0;
    flightMessage='';flightSeq=0;
    interactionMaps:Record<string,MiningBook>={};
    private savedExtras:Record<string,unknown>={};
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
        let saved:any=null;try{saved=JSON.parse(localStorage.getItem(SAVE+':'+this.characterId)||(name==='Lữ khách'?localStorage.getItem(SAVE):null)||'null')}catch{}
        if(saved&&typeof saved==='object'&&!Array.isArray(saved))this.savedExtras=saved;
        this.interactionMaps=saved?.interactionMaps||{};
        this.world = new World(p,{instanceId:'offline:'+this.characterId+':'+p.id,book:this.interactionMaps[p.id],nowSeconds:()=>Date.now()/1000});
        const a = this.world.join(this.id, name);
        let migrate=false;
        try {
            const s = saved;
            const profile=normalizeRealm(s),balance=normalizeWallet(s?.wallet);this.world.setRealm(this.id,profile.state);a.wallet=balance.wallet;this.dataWarnings=[...profile.warnings,...balance.warnings];migrate=!!s&&(s.version!==3||profile.migrated||!s.wallet);
            try{const profile=normalizeCharacterProfile(s);Object.assign(a,profile.state);this.dataWarnings.push(...profile.warnings);migrate ||= profile.migrated}catch(e){this.dataWarnings.push(String(e)+' · Đã giữ bản lỗi trong inventoryRecovery.');this.savedExtras.inventoryRecovery=s?.inventory;migrate=true}
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
        this.world.interactions.commit=tx=>this.commitMining(tx);
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
        const message=this.world.interactions.errors.get(this.id);if(message){this.interactionMessage=message;this.world.interactions.errors.delete(this.id)}
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
    private record(wallet?:Wallet,book?:MiningBook){const a=this.world.actors.get(this.id)!;return{...this.savedExtras,version:3,...profileRecord(a),characterId:this.characterId,realmId:a.realmId,realmStageId:a.realmStageId,wallet:wallet||a.wallet,map:this.world.p.id,x:a.x,y:a.y,hp:a.hp,kills:a.kills,clockSeconds:this.clock().gameSeconds,interactionMaps:{...this.interactionMaps,[this.world.p.id]:book||this.world.interactions.durable()}}}
    private commitMining(tx:Transaction){const a=this.world.actors.get(this.id)!,book=this.world.interactions.durable();if(book.ledger[tx.key])return{wallet:structuredClone(a.wallet)};const wallet=tx.resourceId?addReward(a.wallet,tx.resourceId,tx.amount):structuredClone(a.wallet);book.nodes[tx.objectId]=structuredClone(tx.node);book.ledger[tx.key]=structuredClone(tx);localStorage.setItem(SAVE+':'+this.characterId,JSON.stringify(this.record(wallet,book)));return{wallet}}
    save() { saveExploration(this.exploration); try {
        localStorage.setItem(SAVE + ':' + this.characterId, JSON.stringify(this.record()));
    }
    catch { } }
    setAppearance(id: string) { this.world.setAppearance(this.id, id); this.snapshot = this.world.snapshot(); this.previous = this.snapshot; this.save(); }
    moveInventory(command:InventoryMove){try{this.world.moveInventory(this.id,command);this.inventoryMessage='';this.snapshot=this.world.snapshot();this.previous=this.snapshot;this.save()}catch(e){this.inventoryMessage=String(e)}}
    cosmetic(command: CosmeticCommand) { this.world.cosmetic(this.id, command); this.snapshot = this.world.snapshot(); this.previous = this.snapshot; this.save(); }
    respawn() { this.world.respawn(this.id); const a = this.world.actors.get(this.id)!; this.exploration.visit(a.x, a.y, this.world.time, a.teleportSeq); this.snapshot = this.world.snapshot(); this.previous = this.snapshot; }
    interact(intent:InteractionIntent){try{this.world.interactions.start(this.id,intent);this.interactionMessage='';this.snapshot=this.world.snapshot()}catch(e){this.interactionMessage=String(e)}}
    cancelInteraction(){this.world.interactions.cancel(this.id);this.snapshot=this.world.snapshot();this.previous=this.snapshot}
    previewAnimation(actionId:string){try{this.world.previewAnimation(this.id,actionId,++this.previewSeq);this.previewMessage='';this.snapshot=this.world.snapshot();this.previous=this.snapshot}catch(e){this.previewMessage=String(e)}}
    setSwordFlight(enabled:boolean){try{this.world.swordFlight(this.id,enabled,++this.flightSeq);this.flightMessage='';this.snapshot=this.world.snapshot();this.previous=this.snapshot}catch(e){this.flightMessage=String(e)}}
    destroy() { this.lifetime.abort();this.cancelInteraction(); this.save(); }
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
    interactionMessage='';
    inventoryMessage='';
    previewMessage='';previewSeq=0;
    flightMessage='';flightSeq=0;flightSupported=false;previewSupported=false;allWeaponFlightSupported=false;inventorySupported=false;rangedCombatSupported=false;
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
    resumeSession=false;
    constructor(public p: any, name: string, url: string) { const u = new URL(url || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`); if (!['ws:', 'wss:'].includes(u.protocol) || location.protocol === 'https:' && u.protocol !== 'wss:')
        throw Error('Trang HTTPS yêu cầu địa chỉ wss://');this.tokenKey='darkin-frontier:online-guest:v1:'+encodeURIComponent(u.href)+':'+encodeURIComponent(name);try{const tabToken=sessionStorage.getItem(this.tokenKey);this.resumeSession=!!tabToken;this.resumeToken=tabToken||localStorage.getItem(this.tokenKey)||''}catch{} this.socket = new WebSocket(u); this.socket.onopen = () => this.socket.send(JSON.stringify({ type: 'join', name,resumeToken:this.resumeToken,resume:this.resumeSession })); this.socket.onmessage = e => { try {
        const m = JSON.parse(e.data);
        if (m.type === 'welcome') {
            this.allWeaponFlightSupported=m.weaponFlightProtocol===1;this.rangedCombatSupported=m.rangedCombatProtocol===1;this.inventorySupported=m.inventoryProtocol===1;this.flightSupported=m.swordFlightProtocol===1;this.previewSupported=m.animationPreviewProtocol===1;
            if(m.interactionProtocol!==1){this.status='Server cần cập nhật tương tác/ví';this.socket.close();return}
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
        if(m.type==='interactionError')this.interactionMessage=m.message;
        if(m.type==='inventoryError')this.inventoryMessage=String(m.message);
        if(m.type==='previewError')this.previewMessage=String(m.message);
        if(m.type==='flightError')this.flightMessage=String(m.message);
        if(m.type==='exploration'&&this.exploration)this.exploration.restore(m.record);
        if (m.type === 'snapshot') {
            if(m.projectiles!==undefined&&!validSoulProjectiles(m.projectiles)){this.status='Server gửi linh hồn không hợp lệ';this.socket.close();return}
            if(Array.isArray(m.actors)&&m.actors.some((a:any)=>a.kind==='player'&&a.inventory!==undefined&&!validInventory(a.inventory))){this.status='Server gửi túi đồ không hợp lệ';this.socket.close();return}
            if(Array.isArray(m.actors)&&m.actors.some((a:any)=>a.animationPreview!==undefined&&!validAnimationPreview(a.animationPreview))){this.status='Server gửi dữ liệu hoạt ảnh không hợp lệ';this.socket.close();return}
            if(Array.isArray(m.actors)&&m.actors.some((a:any)=>a.swordFlight!==undefined&&!validSwordFlight(a.swordFlight))){this.status='Server gửi dữ liệu phi kiếm không hợp lệ';this.socket.close();return}
            if(!Array.isArray(m.actors)||m.actors.some((a:any)=>a.kind==='player'&&!validRealmState(a))){this.status='Dữ liệu cảnh giới server không hợp lệ';return}
            this.previous = this.snapshot;
            this.snapshot = m;
            activeNodes(this.p,m.nodes||[]);
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
    } }; this.socket.onclose = () => { if(!this.status.startsWith('Server '))this.status = 'Mất kết nối — bấm Thử lại'; this.pending = []; }; this.socket.onerror = () => { this.status = 'Không kết nối được server — bấm Thử lại'; }; }
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
    moveInventory(command:InventoryMove){if(!this.inventorySupported){this.inventoryMessage='Server chưa hỗ trợ túi đồ; hãy cập nhật backend.';return}if(this.socket.readyState===1){this.inventoryMessage='';this.socket.send(JSON.stringify({type:'inventoryMove',command}))}}
    cosmetic(command: CosmeticCommand) { if(!this.rangedCombatSupported&&(command.accessoryId===SOUL_BANNER_ID||command.accessoryIds?.includes(SOUL_BANNER_ID)))throw Error('Server cần cập nhật Tôn Hồn Phiên trước khi trang bị');if (this.socket.readyState === 1)
        this.socket.send(JSON.stringify({ type: 'cosmetic', command })); }
    respawn() { if (this.socket.readyState === 1)
        this.socket.send(JSON.stringify({ type: 'respawn' })); }
    interact(intent:InteractionIntent){if(this.socket.readyState===1){this.interactionMessage='';this.socket.send(JSON.stringify({type:'interact',intent}))}}
    cancelInteraction(){if(this.socket.readyState===1)this.socket.send(JSON.stringify({type:'cancelInteraction'}))}
    previewAnimation(actionId:string){if(!this.previewSupported){this.previewMessage='Backend cần cập nhật hoạt ảnh';return}if(this.socket.readyState===1){this.previewMessage='';this.socket.send(JSON.stringify({type:'animationPreview',actionId,seq:++this.previewSeq}))}}
    setSwordFlight(enabled:boolean){const a=this.snapshot.actors.find(a=>a.id===this.id),id=a&&equippedFlightWeapon(a);if(enabled&&id&&!this.allWeaponFlightSupported&&!flightConfig.weapons.some(w=>w.accessoryId===id)){this.flightMessage='Backend cần cập nhật phi kiếm cho mọi vũ khí';return}if(!this.flightSupported){this.flightMessage='Backend cần cập nhật phi kiếm';return}if(this.socket.readyState===1){this.flightMessage='';this.socket.send(JSON.stringify({type:'swordFlight',enabled,seq:++this.flightSeq}))}}
    destroy() { this.closed = true; this.socket.onclose = null; this.socket.onmessage = null; this.socket.close(); this.pending = []; }
}
