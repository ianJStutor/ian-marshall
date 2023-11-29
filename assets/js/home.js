import ParticleEngine from "./lib/ParticleEngine.js";
import Spline from "./lib/Spline.js";
import feedback from "../data/feedback.js";

function prefersReducedMotion() {
    return window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || 
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;
}

//pause/start button
const button = document.querySelector("header button");


/* CANVAS ANIMATION ************************/
if (!prefersReducedMotion()) {

    //settings
    const fgcolor = "#c2add6"; //"rgba(255, 255, 255, 0.5)";

    //canvas
    //CRITICAL: canvas cannot alter the size of its parent
    //  element (header), or the ResizeObserver will 
    //  trigger an infinite loop! In this case, the
    //  canvas element has CSS "position: absolute"
    //  and is sized only to the header's offsetWidth
    //  and offsetHeight, which is safe
    const header = document.querySelector("header");
    const canvas = header.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    let debounce;
    new ResizeObserver(() => {
        engine.stop();
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(() => {
            animate();
        }, 250);
    }).observe(header);

    //setup
    Spline.setupCanvas?.(canvas);
    const simplex = new SimplexNoise(); //from <script> tag in HTML
    const engine = new ParticleEngine(ctx, {pointEvents: true, useParentForPointEvents: true});

    //pause/start button
    button.addEventListener("click", () => {
        if (button.textContent.includes("Pause")) {
            button.textContent = "▶ Play";
            engine.stop();
        }
        else {
            button.textContent = "▐▐ Pause";
            animate();
        }
    });

    //run (first triggered by ResizeObserver)
    function animate() {
        engine.empty();
        canvas.width = header.offsetWidth;
        canvas.height = header.offsetHeight;
        if (button.textContent.includes("Pause") && !prefersReducedMotion()) {
            const points = Spline.getPointsArray(canvas.width, canvas.height, {radius: 5, marginTop: 10, marginLeft: 0});
            for (let {x, y} of points) {
                engine.addParticle(new Spline(ctx, simplex, {x, y, color: fgcolor, pointEventDistance: 50, pointEventMultiplier: 1, pointEventRecoverSpeed: 0.1}));
            }
            requestAnimationFrame(engine.start);
        }
    }

}

/* FEEDBACK ANIMATION ************************/
const fig = document.querySelector("#feedback #quote");
const q = fig.querySelector("q");
const address = fig.querySelector("address");
const delayInMS = 10000;

feedback.sort(() => Math.random() - 0.5);

function changeQuote(immediate = false) {
    if (immediate || (button.textContent.includes("Pause") && !prefersReducedMotion())) {
        const newQuote = feedback.shift();
        feedback.push(newQuote);
        if (!immediate) {
            fig.style.opacity = 0;
        }
        q.textContent = newQuote.text;
        address.textContent = `—${newQuote.byline}`;
        if (!immediate) {
            let interval = setInterval(() => {
                const opacity = Number(fig.style.opacity) + 0.05;
                fig.style.opacity = Math.min(opacity, 1);
                if (fig.style.opacity >= 1) clearInterval(interval);
            }, 10);
        }
    }
    fig.classList.contains("use-slider") && setTimeout(changeQuote, delayInMS);
}

changeQuote(true);