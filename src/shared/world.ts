import { gameCatalog, allowedAppearance } from './catalog';
import {defaultEquipment,changeEquipment,resolveInventory,type EquipmentState,type CosmeticCommand} from './equipment';
import {CLOCK_RATE,initialClock,type ClockState} from './map-state';
import {DEFAULT_REALM,validRealmState,type RealmState} from './realms';
import {InteractionSystem,type Definition,type MiningBook,type Transaction,type Receipt} from './interactions';
import {normalizeWallet,type Wallet} from './resources';
import {equippedFlightWeapon,flightConfig,phaseAt,smooth,JUMP_AT,JUMP_SECONDS,type SwordFlight} from './sword-flight';
import { validateMap, canWalk as mapCanWalk, moveActor } from '../../public/game-data/maps/map-runtime.mjs';
export { moveActor };
// Keep full character artwork inside terrain when the camera reaches a hard map edge.
// The map's authored collision shapes remain unchanged.
export function playBounds(p:any){return{x0:44,y0:144,x1:p.cols*p.cell-44,y1:p.rows*p.cell-24}}
export function canWalk(p:any,x:number,y:number,r=12){const b=playBounds(p);return x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1&&mapCanWalk(p,x,y,r)}
export type Intent = {
    seq: number;
    dx: number;
    dy: number;
    run: boolean;
    attack: boolean;
};
export type Actor = EquipmentState & RealmState & {
    swordFlight?:SwordFlight;
    wallet:Wallet;
    combatUntil:number;
    toolId:'combat'|'mining_hammer';
    interactionTarget?:{objectId:string;actionId:string;type:string;label:string;cycle:number};
    teleportSeq:number;
    equipmentWarnings: string[];
    corpseOpacity?: number;
    appearanceId: string;
    attackSeq: number;
    id: string;
    name: string;
    kind: 'player' | 'mob';
    x: number;
    y: number;
    radius: number;
    hp: number;
    maxHp: number;
    dir: number;
    action: string;
    color: string;
    ack: number;
    cooldown: number;
    anim: number;
    deadAt: number;
    home: {
        x: number;
        y: number;
    };
    kills: number;
};
export type Hit = {
    id: number;
    x: number;
    y: number;
    damage: number;
    target: string;
    time: number;
};
export const SPEED = 155, RUN_SPEED = 225, COOLDOWN = .55, RANGE = 76;
export const CORPSE_SECONDS = 1.5, MOB_RESPAWN_SECONDS = 8;
export function validIntent(v: any): v is Intent { return v && Number.isSafeInteger(v.seq) && v.seq >= 0 && v.seq < 1e12 && Number.isFinite(v.dx) && Math.abs(v.dx) <= 1 && Number.isFinite(v.dy) && Math.abs(v.dy) <= 1 && typeof v.run === 'boolean' && typeof v.attack === 'boolean'; }
export function movement(p: any, a: Actor, i: Intent, dt: number) { if (a.hp <= 0)
    return; if(a.swordFlight&&a.swordFlight.phase!=='riding')return; const speed=i.run?RUN_SPEED:SPEED,t=Math.max(0,Math.min(.1,dt)),distance=t*speed,b=playBounds(p),len=Math.max(1,Math.hypot(i.dx,i.dy));
    if(distance>0){const x=Math.max(b.x0,Math.min(b.x1,a.x+i.dx/len*distance)),y=Math.max(b.y0,Math.min(b.y1,a.y+i.dy/len*distance));moveActor(p,a,(x-a.x)/distance,(y-a.y)/distance,t,speed)} if (Math.hypot(i.dx, i.dy) > .01)
    a.dir = Math.atan2(i.dy, i.dx); }
export class World {
    flightCommands=new Map<string,{seq:number;time:number}>();
    interactions:InteractionSystem;
    p: any;
    actors = new Map<string, Actor>();
    inputs = new Map<string, {
        i: Intent;
        time: number;
    }>();
    time = 0;
    clockBaseSeconds=0;
    events: Hit[] = [];
    serial = 0;
    constructor(p: any,options:{instanceId?:string;book?:MiningBook;epochSeconds?:number;nowSeconds?:()=>number;random?:()=>number;commit?:(tx:Transaction)=>Receipt|Promise<Receipt>}={}) { this.p = validateMap(p);this.clockBaseSeconds=initialClock(p);this.interactions=new InteractionSystem(this,options.instanceId||'darkin-frontier-v1:'+p.id,options); for (let k = 0; k < 6; k++) {
        const h = this.findSpawn(p.spawn.x + Math.cos(k * 2.4) * (150 + k * 75), p.spawn.y + Math.sin(k * 2.4) * (150 + k * 75),true);
        const a = this.make('mob' + k, 'Mầm bóng tối', 'mob', h);
        this.actors.set(a.id, a);
    } }
    findSpawn(x: number, y: number,staticProps=false) { for (let r = 0; r < 5000; r += 24)
        for (let k = 0; k < Math.max(1, Math.ceil(r / 12)); k++) {
            const n = Math.max(1, Math.ceil(r / 12)), xx = x + Math.cos(k / n * Math.PI * 2) * r, yy = y + Math.sin(k / n * Math.PI * 2) * r;
            if (canWalk(this.p, xx, yy, 12)&&(!staticProps||mapCanWalk(this.p,xx,yy,12,{isObjectActive:()=>true})))
                return { x: xx, y: yy };
        } throw Error('Map không có spawn hợp lệ'); }
    make(id: string, name: string, kind: Actor['kind'], h: {
        x: number;
        y: number;
    }): Actor { return { wallet:normalizeWallet(null).wallet,combatUntil:0,toolId:'combat',...DEFAULT_REALM,teleportSeq:0,...(kind==='player'?defaultEquipment(gameCatalog.defaults.appearance):{headId:'',bodyId:'',accessories:[]}),equipmentWarnings:[],appearanceId: kind === 'player' ? gameCatalog.defaults.appearance : '', attackSeq: 0, id, name, kind, ...h, radius: 12, hp: kind === 'mob' ? 60 : 100, maxHp: kind === 'mob' ? 60 : 100, dir: Math.PI / 2, action: 'idle', color: kind === 'mob' ? '#c08bda' : ['#e7ba6b', '#7ecfce', '#b4a1ee', '#e7958c'][this.serial++ % 4], ack: -1, cooldown: 0, anim: 0, deadAt: 0, home: { ...h }, kills: 0 }; }
    // Internal simulation operation only. There is deliberately no client message/API for this.
    setRealm(id:string,state:RealmState){if(!validRealmState(state))throw Error('Cảnh giới/bậc không hợp lệ');const a=this.actors.get(id);if(a?.kind==='player'){a.realmId=state.realmId;a.realmStageId=state.realmStageId}}
    inCombat(a:Actor){if(a.combatUntil>this.time)return true;return [...this.actors.values()].some(b=>b.kind!==a.kind&&b.hp>0&&Math.hypot(a.x-b.x,a.y-b.y)<116&&this.clearLine(a,b))}
    clearLine(a:Actor,b:Actor){for(let t=.1;t<1;t+=.1)if(!canWalk(this.p,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,2))return false;return true}
    canStand(a:Actor){return canWalk(this.p,a.x,a.y,a.radius)}
    cancelSwordFlight(a:Actor){if(!a.swordFlight)return;delete a.swordFlight;a.action=a.hp>0?'idle':'death';a.anim=0}
    swordFlight(id:string,enabled:boolean,seq:number){
        if(typeof enabled!=='boolean'||!Number.isSafeInteger(seq)||seq<0||seq>=1e12)throw Error('Lệnh phi kiếm không hợp lệ');
        const a=this.actors.get(id);if(a?.kind!=='player')throw Error('Không có phiên nhân vật');
        const prior=this.flightCommands.get(id);if(prior&&seq<=prior.seq)return;
        if(enabled&&a.swordFlight&&a.swordFlight.phase!=='landing'){this.flightCommands.set(id,{seq,time:prior?.time??this.time});return}
        if(!enabled){this.flightCommands.set(id,{seq,time:prior?.time??this.time});if(a.swordFlight?.phase==='riding'){a.swordFlight.phase='landing';a.swordFlight.landingElapsed=0}else this.cancelSwordFlight(a);return}
        if(prior&&this.time-prior.time<.35)throw Error('Hãy chờ kiếm ổn định');
        const weaponId=equippedFlightWeapon(a),appearance=gameCatalog.appearances.find(p=>p.id===a.appearanceId);
        if(a.hp<=0||!weaponId||!appearance||!flightConfig.compatibleRigs.includes(appearance.rig))throw Error('Cần còn sống và đeo kiếm tương thích');
        if(this.inCombat(a)||a.anim>0)throw Error('Hãy rời giao chiến trước khi gọi phi kiếm');
        if(this.interactions.channels.get(id)?.transaction)throw Error('Đang lưu lượt đào, hãy đợi');
        if(!this.canStand(a))throw Error('Vị trí chân không hợp lệ');
        const x=a.x+Math.cos(a.dir)*flightConfig.mountDistance,y=a.y+Math.sin(a.dir)*flightConfig.mountDistance;
        for(let t=0;t<=flightConfig.mountDistance;t+=2)if(!canWalk(this.p,a.x+Math.cos(a.dir)*t,a.y+Math.sin(a.dir)*t,a.radius))throw Error('Cần khoảng trống trước mặt để lên kiếm');
        this.interactions.cancel(id,'Đã hủy đào để gọi phi kiếm');this.inputs.delete(id);
        a.swordFlight={id:seq,weaponId,phase:'orbit',elapsed:0,heading:a.dir,facing:Math.cos(a.dir)<-.15?-1:1,launchX:a.x,launchY:a.y,mountX:x,mountY:y,epoch:a.teleportSeq,landingElapsed:0};a.toolId='combat';a.interactionTarget=undefined;a.action='idle';a.anim=0;
        this.flightCommands.set(id,{seq,time:this.time});
    }
    private advanceSwordFlight(a:Actor,i:Intent,dt:number){
        const f=a.swordFlight;if(!f)return false;
        if(a.hp<=0||a.teleportSeq!==f.epoch||equippedFlightWeapon(a)!==f.weaponId||i.attack){this.cancelSwordFlight(a);return false}
        if(f.phase==='landing'){f.landingElapsed+=dt;if(f.landingElapsed>=flightConfig.landingSeconds)this.cancelSwordFlight(a);return true}
        if(f.phase!=='riding'&&this.time-(this.inputs.get(a.id)?.time??this.flightCommands.get(a.id)?.time??this.time)>.35){this.cancelSwordFlight(a);return true}
        const previous=f.phase;f.elapsed+=dt;f.phase=phaseAt(f.elapsed);
        if(f.phase==='jump'){
            const u=smooth((f.elapsed-JUMP_AT)/JUMP_SECONDS),x=f.launchX+(f.mountX-f.launchX)*u,y=f.launchY+(f.mountY-f.launchY)*u;
            if(!canWalk(this.p,x,y,a.radius)){this.cancelSwordFlight(a);return true}a.x=x;a.y=y;
        }
        if(f.phase==='riding'){
            if(previous!=='riding'){if(!canWalk(this.p,f.mountX,f.mountY,a.radius)){this.cancelSwordFlight(a);return true}a.x=f.mountX;a.y=f.mountY}
            return false;
        }
        a.dir=f.heading;a.action=f.phase==='jump'?'jump':'idle';return true;
    }
    setAppearance(id: string, appearanceId: string) { if (!allowedAppearance(appearanceId))
        throw Error('Ngoại hình không được phép'); const a = this.actors.get(id); if (a?.kind === 'player')
        {const next=defaultEquipment(appearanceId);next.accessories=structuredClone(a.accessories);this.cancelSwordFlight(a);Object.assign(a,next,{appearanceId,equipmentWarnings:resolveInventory(next).warnings});} }
    cosmetic(id:string,command:CosmeticCommand){const a=this.actors.get(id);if(a?.kind!=='player')return;const next=changeEquipment(a,command);this.cancelSwordFlight(a);Object.assign(a,next,{equipmentWarnings:resolveInventory(next).warnings})}
    join(id: string, name: string) { if ([...this.actors.values()].filter(a => a.kind === 'player').length >= 32)
        throw Error('Map đầy (32 người)'); const a = this.make(id, name, 'player', this.findSpawn(this.p.spawn.x, this.p.spawn.y)); this.actors.set(id, a); return a; }
    leave(id: string) { this.flightCommands.delete(id);this.interactions.cancel(id,'Mất kết nối / rời map');this.interactions.errors.delete(id);this.actors.delete(id); this.inputs.delete(id); }
    input(id: string, i: Intent) { const a = this.actors.get(id); if (!a || !validIntent(i) || i.seq <= Math.max(a.ack, this.inputs.get(id)?.i.seq ?? -1))
        return false; if(Math.hypot(i.dx,i.dy)>.01||i.attack)this.interactions.cancel(id);this.inputs.set(id, { i, time: this.time }); return true; }
    respawn(id: string) { const a = this.actors.get(id); if (a && a.hp <= 0) {this.cancelSwordFlight(a);
        Object.assign(a, this.findSpawn(this.p.spawn.x, this.p.spawn.y), { hp: a.maxHp, action: 'idle', anim: 0,teleportSeq:a.teleportSeq+1 });
        this.inputs.delete(id);
    } }
    hit(a: Actor, b: Actor, damage: number) { if (b.hp <= 0)
        return; this.cancelSwordFlight(a);this.cancelSwordFlight(b);a.combatUntil=b.combatUntil=this.time+3;this.interactions.cancel(a.id,'Đang giao chiến');this.interactions.cancel(b.id,'Bị tấn công');b.hp = Math.max(0, b.hp - damage); b.action = b.hp ? 'hurt' : 'death'; b.anim = b.hp ? .22 : 0; b.deadAt = this.time; if (!b.hp && a.kind === 'player')
        a.kills++; this.events.push({ id: ++this.serial, x: b.x, y: b.y - 50, damage, target: b.id, time: this.time }); }
    attack(a: Actor) { if (a.cooldown > 0 || a.hp <= 0)
        return; this.cancelSwordFlight(a);this.interactions.cancel(a.id,'Đang đánh');a.combatUntil=this.time+3;a.attackSeq++; a.cooldown = a.kind === 'mob' ? .95 : COOLDOWN; a.action = 'attack'; a.anim = .24; for (const b of this.actors.values()) {
        if (b.kind === a.kind || b.hp <= 0)
            continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d > RANGE || Math.cos(Math.atan2(dy, dx) - a.dir) < .3)
            continue;
        let clear = true;
        for (let t = .15; t < 1; t += .15)
            if (!canWalk(this.p, a.x + dx * t, a.y + dy * t, 2)) {
                clear = false;
                break;
            }
        if (clear)
            this.hit(a, b, a.kind === 'mob' ? 9 : 22);
    } }
    step(dt = .05) { this.time += dt; for (const a of this.actors.values()) {
        a.cooldown = Math.max(0, a.cooldown - dt);
        a.anim = Math.max(0, a.anim - dt);
        if (a.hp <= 0) {
            this.cancelSwordFlight(a);a.action = 'death';
            if (a.kind === 'mob' && this.time - a.deadAt >= MOB_RESPAWN_SECONDS)
                Object.assign(a, this.findSpawn(a.home.x, a.home.y), { hp: a.maxHp, action: 'idle', cooldown: 0, anim: 0 });
            continue;
        }
        let i: Intent = { seq: 0, dx: 0, dy: 0, run: false, attack: false };
        if (a.kind === 'player') {
            const q = this.inputs.get(a.id);
            if (q && this.time - q.time < .3) {
                i = q.i;
                a.ack = q.i.seq;
            }
        }
        else {
            const targets = [...this.actors.values()].filter(b => b.kind === 'player' && b.hp > 0).sort((b, c) => Math.hypot(b.x - a.x, b.y - a.y) - Math.hypot(c.x - a.x, c.y - a.y));
            const b = targets[0];
            let tx = a.home.x, ty = a.home.y;
            if (b && Math.hypot(b.x - a.x, b.y - a.y) < 300 && Math.hypot(b.x - a.home.x, b.y - a.home.y) < 430) {
                tx = b.x;
                ty = b.y;
                if (Math.hypot(tx - a.x, ty - a.y) < 62) {
                    a.dir = Math.atan2(ty - a.y, tx - a.x);
                    i.attack = true;
                    tx = a.x;
                    ty = a.y;
                }
            }
            const d = Math.hypot(tx - a.x, ty - a.y);
            if (d > 6) {
                i.dx = (tx - a.x) / d * .62;
                i.dy = (ty - a.y) / d * .62;
            }
        }
        if(this.advanceSwordFlight(a,i,dt))continue;
        if(this.interactions.channels.has(a.id)){a.action=this.interactions.presentation(this.interactions.definitions.get(this.interactions.channels.get(a.id)!.intent.objectId)!).action;continue}
        movement(this.p, a, i, dt);
        if (!a.anim)
            a.action = Math.hypot(i.dx, i.dy) > .01 ? (i.run ? 'run' : 'walk') : 'idle';
        if (i.attack)
            this.attack(a);
        if(a.swordFlight){a.swordFlight.heading=a.dir;if(Math.abs(Math.cos(a.dir))>.15)a.swordFlight.facing=Math.cos(a.dir)<0?-1:1;a.action='idle'}
    }this.interactions.step();for(const a of this.actors.values())if(a.kind==='player'){const c=this.interactions.channels.get(a.id),d=c?this.interactions.definitions.get(c.intent.objectId):this.interactions.nearest(a);a.interactionTarget=d?{objectId:d.objectId,actionId:d.actionId,type:d.type,label:d.label,cycle:this.interactions.states.get(d.objectId)!.cycle}:undefined;a.toolId=d&&a.hp>0?this.interactions.presentation(d).toolId:'combat'} this.events = this.events.filter(e => this.time - e.time < 1.2); }
    snapshot(): {time:number;actors:Actor[];events:Hit[];clock?:ClockState;nodes?:ReturnType<InteractionSystem['publicStates']>;instanceId?:string} { return { nodes:this.interactions.publicStates(),instanceId:this.interactions.instanceId,clock:{gameSeconds:this.clockBaseSeconds+this.time*CLOCK_RATE,rate:CLOCK_RATE},time: this.time, actors: [...this.actors.values()].filter(a => a.kind !== 'mob' || a.hp > 0 || this.time - a.deadAt < CORPSE_SECONDS).map(a => ({ ...a, swordFlight:a.swordFlight?{...a.swordFlight}:undefined,corpseOpacity: a.kind === 'mob' && a.hp <= 0 ? Math.max(0, 1 - (this.time - a.deadAt) / CORPSE_SECONDS) : 1 })), events: this.events }; }
}
export type Snapshot = ReturnType<World['snapshot']>;
