import ParticleEngine from "./particle-engine.js";
import Spline from "./splines.js";

//settings
const fgcolor = "rgba(255, 255, 255, 0.75)";

//canvas
const canvas = document.querySelector("canvas");
canvas.width = document.body.offsetWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

//setup
Spline.setupCanvas?.(canvas);
const simplex = new SimplexNoise(); //from <script> tag in HTML
const engine = new ParticleEngine(ctx, {pointEvents: true, useParentForPointEvents: true});

//particles
const points = Spline.getPointsArray(canvas.width, canvas.height, {radius: 15, divisor: 200});
for (let {x, y} of points) {
    engine.addParticle(new Spline(ctx, simplex, {x, y, color: fgcolor}));
}

//run
engine.start();
