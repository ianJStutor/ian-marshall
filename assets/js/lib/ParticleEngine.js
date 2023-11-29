export default class ParticleEngine {

    constructor(ctx, options) {
        this.settings = Object.assign({
            particles: [],
            animate: true,
            stopWhenNoParticles: true,
            clearEveryFrame: true,
            bgcolor: null,
            fgcolor: "black",
            bounds: null,
            targetFps: 60,
            pointEvents: false,
            useParentForPointEvents: false
        }, options);
        this.ctx = ctx;
        this.canvas = this.ctx.canvas;
        this.particles = [...this.settings.particles];
        this.animate = this.settings.animate;
        this.bounds = this.settings.bounds;
        this.targetFps = 1000 / this.settings.targetFps;
        this.t = null;
        this.setSize();
        if (this.settings.pointEvents) {
            const el = this.settings.useParentForPointEvents ? this.ctx.canvas.parentElement : this.ctx.canvas;
            el.addEventListener("mousemove", (e) => this.handlePointEvents(e));
            el.addEventListener("touchmove", (e) => this.handlePointEvents(e));
            el.addEventListener("pointermove", (e) => this.handlePointEvents(e));
        }
    }

    setSize() {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.setBounds();
    }

    setBounds() {
        this.bounds = this.settings.bounds ?? {
            left: 0, top: 0, right: this.width, bottom: this.height
        };
        this.particles.forEach(p => p.setBounds?.(this.bounds));
    }

    addParticle(p, beginning = false) {
        p.setCtx?.(this.ctx);
        p.setBounds?.(this.bounds);
        p.referenceEngine?.(this);
        if (beginning) this.particles.unshift(p);
        else this.particles.push(p);
    }

    empty() {
        this.particles.length = 0;
    }

    #loop(t) {
        if (!this.t) this.t = t - this.targetFps;
        const dt = (t - this.t) / this.targetFps;
        this.t = t;
        //vars
        const { clearEveryFrame, stopWhenNoParticles } = this.settings;
        //resized canvas?
        if (this.width !== this.canvas.width || this.height !== this.canvas.height) {
            this.setSize();
        }
        //repaint?
        if (clearEveryFrame) {
            this.erase();
        }
        //update particles
        this.particles = this.particles.filter(p => p.update?.(dt, this.particles));
        //repeat loop?
        if (!this.animate || (stopWhenNoParticles && !this.particles.length)) return;
        requestAnimationFrame(this.#loop.bind(this));
    }

    erase() {
        if (this.bgcolor) {
            this.ctx.fillStyle = this.bgcolor;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        else {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    }

    start = () => {
        requestAnimationFrame((t) => {
            this.animate = true;
            this.#loop(t);
        });
    }

    stop = () => {
        this.animate = false;
        requestAnimationFrame(() => {
            this.empty();
            this.t = null;
            this.erase();
        });
    }

    pause() {
        this.animate = false;
    }

    isRunning() {
        return this.animate;
    }

    handlePointEvents(e) {
        if (!this.animate) return;
        const {left, top} = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX ?? e.touches[0].clientX) - left;
        const y = (e.clientY ?? e.touches[0].clientY) - top;
        this.particles.forEach(p => p.pointEvent?.(x, y));
    }

}
