// Home only (CR-04). Everything here is an extra: without it the hero shows its poster photo and every
// section is visible. The video collage loads only on screens 720px and wider, never with reduced motion
// or Save-Data, and has a pause button (WCAG 2.2.2). Sections fade up once as they scroll into view.
const motionOK = !matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection?.saveData === true;

const video = document.querySelector('.cine-hero-video');
const pause = document.querySelector('.cine-pause');
if (video && pause && motionOK && !saveData && matchMedia('(min-width: 720px)').matches) {
  const label = pause.querySelector('.cine-pause-label');
  const setPaused = (paused) => {
    pause.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? 'Play video' : 'Pause video';
  };
  // WebM (VP9) where it plays, else MP4 (H.264) for Safari.
  video.src = video.canPlayType('video/webm; codecs="vp9"') ? video.dataset.webm : video.dataset.mp4;
  video.addEventListener('playing', () => { video.classList.add('is-playing'); pause.hidden = false; }, { once: true });
  video.play().catch(() => {}); // autoplay refused: the poster stays
  pause.addEventListener('click', () => {
    if (video.paused) { video.play(); setPaused(false); } else { video.pause(); setPaused(true); }
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
