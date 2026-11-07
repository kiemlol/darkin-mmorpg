import type { Actor } from '../shared/world';
export const animationClips: Record<string, {
    clip: string;
    loop: boolean;
}> = { idle: { clip: 'rest', loop: true }, walk: { clip: 'travel', loop: true }, run: { clip: 'sprint', loop: true }, attack: { clip: 'meleeSwing', loop: false }, hurt: { clip: 'impact', loop: false }, death: { clip: 'fall', loop: false } };
export interface CharacterVisual {
    load(config: unknown): Promise<void>;
    update(actor: Actor, dt: number): void;
    playAnimation(action: string): void;
    draw(ctx: CanvasRenderingContext2D): void;
    handCenter?():{x:number;y:number}|null;
    emissionPoint?(accessoryId:string,uv:number[]):{x:number;y:number}|null;
    destroy(): void;
}
export class PlaceholderCharacterVisual implements CharacterVisual {
    a!: Actor;
    t = 0;
    clip = 'rest';
    async load(_: unknown) { }
    update(a: Actor, dt: number) { this.a = a; this.t += dt; this.playAnimation(a.action); }
    playAnimation(action: string) { this.clip = animationClips[action]?.clip || 'rest'; }
    destroy() { }
    draw(c: CanvasRenderingContext2D) { const a = this.a, mob = a.kind === 'mob', moving = ['walk', 'run'].includes(a.action), bob = moving ? Math.sin(this.t * (a.action === 'run' ? 17 : 11)) * 3 : Math.sin(this.t * 2) * .8; c.save(); c.translate(a.x, a.y); c.fillStyle = '#0006'; c.beginPath(); c.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2); c.fill(); if (!a.hp) {
        c.rotate(-1.3);
        c.globalAlpha *= (a.corpseOpacity ?? .5);
    } c.translate(0, bob); const face = Math.cos(a.dir), dy = Math.sin(a.dir); c.strokeStyle = '#263138'; c.lineWidth = 7; c.lineCap = 'round'; for (const k of [-1, 1]) {
        c.beginPath();
        c.moveTo(k * 7, -16);
        c.lineTo(k * 8 + (moving ? Math.sin(this.t * 12 + k) * 5 : 0), -3);
        c.stroke();
    } c.fillStyle = a.action === 'hurt' ? '#fff' : a.color; c.beginPath(); c.ellipse(0, -26, mob ? 20 : 13, mob ? 18 : 19, -.15, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#ffffff55'; c.lineWidth = 2; c.stroke(); c.fillStyle = mob ? '#d4b4e4' : '#f0c6a0'; c.beginPath(); c.ellipse(face * 2, -48, mob ? 13 : 10, mob ? 10 : 12, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#26313c'; c.beginPath(); c.ellipse(0, -54, 11, 7, -.2, Math.PI, Math.PI * 2); c.fill(); c.fillStyle = '#20242a'; c.fillRect(face * 5 - 2, -49 + dy * 2, 3, 3); c.strokeStyle = '#e5dfc7'; c.lineWidth = 4; const angle = a.dir + (a.action === 'attack' ? Math.sin(this.t * 27) * .8 : 0); c.beginPath(); c.moveTo(face * 10, -30); c.lineTo(face * 10 + Math.cos(angle) * 25, -30 + Math.sin(angle) * 18); c.stroke(); if (a.action === 'attack') {
        c.strokeStyle = '#ffe3a4';
        c.lineWidth = 4;
        c.beginPath();
        c.ellipse(0, -20, 55, 32, 0, a.dir - .8, a.dir + .8);
        c.stroke();
    } c.restore(); if (mob && a.hp <= 0) return; c.save(); c.textAlign = 'center'; c.font = '600 12px system-ui'; c.lineWidth = 3; c.strokeStyle = '#121c20'; c.strokeText(a.name, a.x, a.y - 72); c.fillStyle = a.kind === 'mob' ? '#e2c8ef' : '#fff0cd'; c.fillText(a.name, a.x, a.y - 72); c.fillStyle = '#101923'; c.fillRect(a.x - 23, a.y - 65, 46, 5); c.fillStyle = a.kind === 'mob' ? '#c285af' : '#9dc9a0'; c.fillRect(a.x - 22, a.y - 64, 44 * a.hp / a.maxHp, 3); c.restore(); }
}
