export class Input {
    keys = new Set<string>();
    dx = 0;
    dy = 0;
    attack = false;
    actionPresses=0;
    abort = new AbortController();
    stickId: number | null = null;
    points = new Map<number, PointerEvent>();
    pinch = 0;
    attackId: number | null = null;
    constructor(public canvas: HTMLCanvasElement, public zoom: (factor: number) => void, public stop: () => void) {
        const opt = { signal: this.abort.signal };
        window.addEventListener('keydown', e => {if(e.code==='Space'&&!e.repeat&&!this.keys.has(e.code))this.actionPresses++; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
            e.preventDefault(); this.keys.add(e.code); }, opt);
        window.addEventListener('keyup', e => this.keys.delete(e.code), opt);
        window.addEventListener('blur', () => this.clear(), opt);
        document.addEventListener('visibilitychange', () => { if (document.hidden)
            this.clear(); }, opt);
        canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(-e.deltaY * .001)); }, { ...opt, passive: false });
        const stick = document.querySelector<HTMLElement>('#joystick')!, knob = stick.firstElementChild as HTMLElement;
        const release = () => { this.stickId = null; this.dx = this.dy = 0; knob.style.transform = 'translate(0,0)'; };
        stick.addEventListener('pointerdown', e => { if (this.stickId !== null)
            return; this.stickId = e.pointerId; stick.setPointerCapture(e.pointerId); move(e); }, opt);
        const move = (e: PointerEvent) => { if (e.pointerId !== this.stickId)
            return; const r = stick.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2, l = Math.max(36, Math.hypot(x, y)); this.dx = x / l; this.dy = y / l; knob.style.transform = `translate(${this.dx * 33}px,${this.dy * 33}px)`; };
        stick.addEventListener('pointermove', move, opt);
        for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
            stick.addEventListener(event, release, opt);
        const attack = document.querySelector<HTMLElement>('#attack')!;
        attack.addEventListener('pointerdown', e => {if(!this.attack)this.actionPresses++; this.attackId=e.pointerId;attack.setPointerCapture(e.pointerId); this.attack = true; }, opt);
        for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
            attack.addEventListener(event, (e) => {if(e.type==='pointercancel')this.actionPresses=0;this.attack=false;this.attackId=null}, opt);
        canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); this.points.set(e.pointerId, e); this.pinch = 0; }, opt);
        canvas.addEventListener('pointermove', e => { if (!this.points.has(e.pointerId))
            return; this.points.set(e.pointerId, e); if (this.points.size === 2) {
            const [a, b] = [...this.points.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            if (this.pinch > 0)
                zoom(d / this.pinch);
            this.pinch = d;
        } }, opt);
        for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
            canvas.addEventListener(event, (e: any) => { this.points.delete(e.pointerId); this.pinch = 0; }, opt);
    }
    sample() { return { dx: this.dx || Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')), dy: this.dy || Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) - Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')), run: this.keys.has('ShiftLeft') || (this.stickId !== null && Math.hypot(this.dx, this.dy) > .75), attack: this.attack || this.keys.has('Space') }; }
    clear() { this.actionPresses=0;this.keys.clear(); this.dx = this.dy = 0; this.attack = false; const stick = document.querySelector<HTMLElement>('#joystick')!, attack = document.querySelector<HTMLElement>('#attack')!; if (this.stickId !== null && stick.hasPointerCapture(this.stickId))
        stick.releasePointerCapture(this.stickId); if (this.attackId !== null && attack.hasPointerCapture(this.attackId))
        attack.releasePointerCapture(this.attackId); for (const id of this.points.keys())
        if (this.canvas.hasPointerCapture(id))
            this.canvas.releasePointerCapture(id); this.points.clear(); this.stickId = null; this.attackId = null; (stick.firstElementChild as HTMLElement).style.transform = 'translate(0,0)'; this.stop(); }
    destroy() { this.clear(); this.abort.abort(); }
    consumeActionPress(){const pressed=this.actionPresses>0;this.actionPresses=0;return pressed}
}
