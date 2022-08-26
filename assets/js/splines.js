export default class Spline {

    static className = "Spline";
    static desc = "splines";

    static setupCanvas(canvas) {
        canvas.classList.add(Spline.className);
    }

    static destroyCanvas(canvas) {
        canvas.classList.remove(Spline.className);
    }

    static getPointsArray(width, height, {radius = 10, margin = 5, inset = 0} = {}) {
        const w = width - margin * 2;
        const h = height - margin * 2;
        const colWidth = radius * 2 + margin;
        const rowHeight = radius * 2 + margin;
        const cols = Math.floor(w / colWidth);
        const rows = Math.floor(h / rowHeight);
        const startX = (width * 0.5) - (cols * colWidth * 0.5) + (colWidth * 0.5);
        const startY = (height * 0.5) - (rows * rowHeight * 0.5) + (rowHeight * 0.5);
        const points = [];
        for (let colIndex = 0; colIndex < cols; colIndex++) {
            const x = colIndex * colWidth + startX;
            for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
                const y = rowIndex * rowHeight + startY;
                points.push({x, y});
            }
        }
        return points;
    }

    constructor(ctx, simplex, options) {
        //dependency: SimplexNoise by Jonas Wagner
        //https://rawgit.com/jwagner/simplex-noise.js/master/simplex-noise.js
        if (!simplex) {
            return console.error("SimplexNoise required", "https://rawgit.com/jwagner/simplex-noise.js/master/simplex-noise.js");
        }

        ctx && this.setCtx(ctx);
        this.setSimplex(simplex);

        this.settings = Object.assign({
            x: null,
            y: null,
            vx: 0,
            vy: 0,
            color: "black",
            radius: 10,
            timestep: 0.001,
            intensity: 30,
            divisor: 500,
            margin: 5,
            inset: 0,
            startTime: 0,
            pointEventDistance:  100,
            pointEventMultiplier: 1.5,
            pointEventRecoverSpeed: 0.1
        }, options);

        //time for simplex noise
        this.time = this.settings.startTime;

        //position & radius
        this.x = this.originalX = this.settings.x ?? this.ctx?.canvas.width * 0.5;
        this.y = this.originalY = this.settings.y ?? this.ctx?.canvas.height * 0.5;
        this.radius = this.settings.radius;

        //movement
        this.vx = this.originalVx = this.settings.vx;
        this.vy = this.originalVy = this.settings.vy;

        //color
        this.color = this.settings.color;

    }

    setSimplex(simplex) {
        //for this to work well, all Flag particles need the SAME simplex
        this.simplex = simplex;
    }

    setCtx(ctx) {
        this.ctx = ctx;
    }

    update(dt) {
        //must have a context
        if (!this.ctx) return false;
        this.#draw(dt);
        this.#move(dt);
        this.time += this.settings.timestep;
        return true;
    }

    #draw(dt) {
        const {divisor, intensity} = this.settings;
        const ctx = this.ctx;
        const x = this.x + this.simplex.noise3D(this.x/divisor, this.y/divisor, this.time) * intensity * dt;
        const y = this.y + this.simplex.noise3D(this.y/divisor, this.x/divisor, this.time) * intensity * dt;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, Math.PI*2);
        ctx.fill();
    }

    #move(dt) {
        //resistance
        if (this.vx !== this.originalVx) {
            const diff = this.originalVx - this.vx;
            if (Math.abs(diff) < 0.5) this.vx = this.originalVx;
            else {
                this.vx += diff * this.settings.pointEventRecoverSpeed;
            }
        }
        if (this.vy !== this.originalVy) {
            const diff = this.originalVx - this.vy;
            if (Math.abs(diff) < 0.5) this.vy = this.originalVy;
            else {
                this.vy += diff * this.settings.pointEventRecoverSpeed;
            }
        }
        //normal move
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        //back to original position
        if (this.x !== this.originalX) {
            const diff = this.originalX - this.x;
            if (Math.abs(diff) < 1) this.x = this.originalX;
            else {
                this.x += diff * this.settings.pointEventRecoverSpeed;
            }
        }
        if (this.y !== this.originalY) {
            const diff = this.originalY - this.y;
            if (Math.abs(diff) < 1) this.y = this.originalY;
            else {
                this.y += diff * this.settings.pointEventRecoverSpeed;
            }
        }
    }

    pointEvent(x, y) {
        //flee the point
        const { pointEventDistance, pointEventMultiplier } = this.settings;
        const xDist = x - this.x;
        const yDist = y - this.y;
        const dist = Math.hypot(xDist, yDist);
        const maxDist = pointEventDistance;
        if (dist < maxDist) {
            const pushNorm = (maxDist - dist) / maxDist; //normalize
            const push = pushNorm * pointEventMultiplier;
            const angle = Math.atan2(yDist, xDist);
            const dx = Math.cos(angle) * push;
            const dy = Math.sin(angle) * push;
            this.vx -= dx;
            this.vy -= dy;
        }
    }

}
