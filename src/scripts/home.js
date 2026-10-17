// Home motion (motion storyboard S1–S4): smooth scrolling, section reveals, program-card tilt and
// the "students at work" 3D journey behind the hero and the "Your path at RIPS" chapters.
// Rules (CR-01 against NFR-PERF-02): 3D only on capable devices, loaded after the page is ready;
// everyone else, and anyone who asks for reduced motion, gets still posters of the same scenes.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STOPS = 6; // hero + five chapters, matching the scene's camera stops
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const force = params.get('3d'); // ?3d=0 or ?3d=1 for testing
const capture = params.has('capture'); // frame-by-frame recordings (docs/3d/record-journey.mjs)
const root = document.documentElement;

function capable() {
  if (force) return force === '1';
  if (reduce) return false;
  const c = navigator.connection;
  if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return false;
  if ((navigator.deviceMemory ?? 8) < 4 || (navigator.hardwareConcurrency ?? 4) < 4) return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    // A software renderer (no GPU) can't keep the scene smooth: keep the posters.
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return false;
  } catch { return false; }
  return true;
}

// ---------- Smooth scroll (motion allowed only) ----------
if (!reduce && !capture) {
  const lenis = new Lenis({ lerp: 0.12, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ---------- Section reveals ----------
if (!reduce && !capture) {
  for (const el of document.querySelectorAll('[data-reveal]')) {
    gsap.from(el, { y: 36, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  }
  for (const list of document.querySelectorAll('[data-reveal-stagger]')) {
    gsap.from(list.children, { y: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
  }
}

// ---------- Program cards 01–06: a slight tilt towards the pointer ----------
if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  for (const card of document.querySelectorAll('[data-tilt]')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
      card.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -8}deg`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  }
}

// ---------- The 3D journey ----------
const journey = document.querySelector('[data-journey]');
if (journey) {
  const stage = journey.querySelector('.journey-stage');
  const canvas = stage.querySelector('canvas');
  const posters = [stage.querySelector('[data-poster]')]; // stop 0; the rest are made on first use
  let study = null, progress = 0, shown = 0;

  // Posters: swap to the scene of the chapter in view (a cut, never an animation, if motion is reduced).
  const tall = matchMedia('(max-aspect-ratio: 11/10)');
  const showPoster = (i) => {
    if (i === shown) return;
    shown = i;
    if (!posters[i]) {
      const img = new Image();
      img.className = 'poster';
      img.alt = '';
      img.src = stage.dataset.posters.replace('{stop}', i).replace('{crop}', tall.matches ? 'tall' : 'wide');
      canvas.before(img);
      posters[i] = img;
      img.decode().catch(() => {}).then(() => { if (shown === i) img.classList.add('is-shown'); });
    }
    posters.forEach((p, k) => p?.classList.toggle('is-shown', k === i && p.complete));
  };

  ScrollTrigger.create({
    trigger: journey, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => {
      progress = self.progress * (STOPS - 1);
      if (study) study.setProgress(progress);
      else showPoster(Math.round(progress));
    },
  });

  // The scene starts on the visitor's first scroll, touch, pointer move or key press: until then
  // the poster (the same frame) is on screen, and the page's first load stays light.
  if (!reduce || force === '1') {
    const boot = async () => {
      if (!capable()) return;
      try {
        const { mountStudy } = await import('./study-3d.js');
        study = mountStudy(canvas, { reducedMotion: reduce });
        study.setProgress(progress);
        if (capture) window.__study = study;
        requestAnimationFrame(() => root.classList.add('has-3d'));
      } catch (err) {
        console.warn('3D scene unavailable, keeping the posters', err);
      }
    };
    const events = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown'];
    const first = () => { events.forEach((e) => removeEventListener(e, first)); boot(); };
    events.forEach((e) => addEventListener(e, first, { once: true, passive: true }));
    if (force === '1' || capture) first();
  }
}
