// Home only (CR-05). Everything here is an extra: without it the hero shows its three poster photos with
// the crest, name and buttons, and every section is visible. The three videos load only without reduced
// motion or Save-Data, and one button pauses them all (WCAG 2.2.2). Sections fade up once as they
// scroll into view.
const motionOK = !matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection?.saveData === true;

const videos = [...document.querySelectorAll('.isl-panel video')];
const pause = document.querySelector('.isl-pause');
if (videos.length && pause && motionOK && !saveData) {
  const label = pause.querySelector('.isl-pause-label');
  // WebM (VP9) where it plays, else MP4 (H.264) for Safari.
  const webm = videos[0].canPlayType('video/webm; codecs="vp9"') !== '';
  for (const v of videos) {
    v.src = webm ? v.dataset.webm : v.dataset.mp4;
    v.addEventListener('playing', () => { v.classList.add('is-playing'); pause.hidden = false; }, { once: true });
    v.play().catch(() => {}); // autoplay refused: the poster stays
  }
  pause.addEventListener('click', () => {
    const paused = pause.getAttribute('aria-pressed') !== 'true';
    for (const v of videos) { if (paused) v.pause(); else v.play().catch(() => {}); }
    pause.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? 'Play videos' : 'Pause videos';
  });
}

const reveals = document.querySelectorAll('.reveal');
if (motionOK && 'IntersectionObserver' in window && reveals.length) {
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach((el) => io.observe(el));
}
