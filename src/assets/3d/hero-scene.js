// RIPS Home hero: a slow gold-and-glass DNA helix on deep navy (motion storyboard S1, S2).
// Loaded only after the page has rendered, on capable devices (see the site's 3D loader);
// everyone else keeps the still poster. Decorative: the canvas is aria-hidden and the
// headline beside it carries the meaning.
//
// Usage: const hero = mountHero(canvas, THREE); hero.setScroll(0..1); hero.destroy();
// THREE is passed in so the site can bundle one copy of three.js for the hero and the explorer.

export const HERO_COLORS = { background: 0x071726, navy: 0x0d2740, gold: 0xe1c482, glass: 0x9ec7ea };

export function mountHero(canvas, THREE, { pixelRatioCap = 1.75 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // Procedural environment for reflections: no HDR file to download.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.background = new THREE.Color(HERO_COLORS.navy);
  const warm = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfff0cc }));
  warm.position.set(4, 3, 2); warm.scale.setScalar(2.6); env.add(warm);
  const top = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xe1c482 }));
  top.position.set(0, 6, 0); top.scale.setScalar(2.4); env.add(top);
  const cool = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0x6fa8dc }));
  cool.position.set(-5, -1, -2); cool.scale.setScalar(2.2); env.add(cool);
  const envTexture = pmrem.fromScene(env, 0.04).texture;
  scene.environment = envTexture;

  const gold = new THREE.MeshStandardMaterial({ color: HERO_COLORS.gold, metalness: 0.75, roughness: 0.28, emissive: 0x3a2a08, envMapIntensity: 1.6 });
  // "Glass" without transmission (an extra render pass): low roughness, cool tint, partial opacity.
  const glass = new THREE.MeshPhysicalMaterial({
    color: HERO_COLORS.glass, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
    transparent: true, opacity: 0.55, envMapIntensity: 1.4,
  });
  const rungMaterial = new THREE.MeshPhysicalMaterial({ color: 0x2c5f8f, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.7 });

  const helix = new THREE.Group();
  scene.add(helix);
  const PAIRS = 28, TURNS = 2.2, LENGTH = 9, RADIUS = 1.05;
  const sphere = new THREE.SphereGeometry(0.17, 28, 20);
  const goldBeads = new THREE.InstancedMesh(sphere, gold, PAIRS);
  const glassBeads = new THREE.InstancedMesh(sphere, glass, PAIRS);
  const rungs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 10), rungMaterial, PAIRS);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3(), dir = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const strandA = [], strandB = [];
  const point = (t, sign, out) => {
    const angle = t * TURNS * Math.PI * 2;
    return out.set((t - 0.5) * LENGTH, sign * Math.cos(angle) * RADIUS, sign * Math.sin(angle) * RADIUS);
  };
  for (let i = 0; i < PAIRS; i++) {
    const t = i / (PAIRS - 1);
    point(t, 1, a); point(t, -1, b);
    goldBeads.setMatrixAt(i, m.compose(a, q.identity(), s.set(1, 1, 1)));
    glassBeads.setMatrixAt(i, m.compose(b, q.identity(), s.set(0.85, 0.85, 0.85)));
    mid.addVectors(a, b).multiplyScalar(0.5);
    dir.subVectors(b, a);
    const length = dir.length();
    q.setFromUnitVectors(up, dir.normalize());
    rungs.setMatrixAt(i, m.compose(mid, q, s.set(1, length, 1)));
  }
  for (let i = 0; i <= 140; i++) {
    strandA.push(point(i / 140, 1, new THREE.Vector3()));
    strandB.push(point(i / 140, -1, new THREE.Vector3()));
  }
  const backboneA = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strandA), 260, 0.045, 8), gold);
  const backboneB = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strandB), 260, 0.045, 8), glass);
  helix.add(goldBeads, glassBeads, rungs, backboneA, backboneB);

  const dustGeometry = new THREE.BufferGeometry();
  const DUST = 220, positions = new Float32Array(DUST * 3);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // deterministic, so posters match
  for (let i = 0; i < DUST; i++) {
    positions[i * 3] = (rand() - 0.5) * 16;
    positions[i * 3 + 1] = (rand() - 0.5) * 8;
    positions[i * 3 + 2] = (rand() - 0.5) * 6 - 2;
  }
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: HERO_COLORS.gold, size: 0.025, transparent: true, opacity: 0.5 }));
  scene.add(dust);

  scene.add(new THREE.AmbientLight(0x1b3654, 0.6));
  const key = new THREE.DirectionalLight(0xfff1d6, 1.6); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fa8dc, 0.8); rim.position.set(-4, -2, -3); scene.add(rim);

  // Layout: the helix sits to the right on wide screens and behind the top of the hero on phones.
  function layout() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w / h > 1.1;
    // Wide: to the right of the headline. Narrow: in the empty band below the buttons.
    helix.position.set(wide ? 3.4 : 0.2, wide ? -0.1 : -2.3, 0);
    helix.scale.setScalar(wide ? 0.85 : 0.5);
    baseZ = wide ? -0.38 : -0.22;
  }
  let baseZ = -0.38;

  // Gentle reactions: pointer tilt (lerp 0.06, ≤ ~6°) and scroll-driven rotation and dolly.
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0, scroll = 0, scrollTarget = 0;
  const onPointer = (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let running = false, raf = 0, last = performance.now(), elapsed = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    pointerX += (targetX - pointerX) * 0.06;
    pointerY += (targetY - pointerY) * 0.06;
    scroll += (scrollTarget - scroll) * 0.1;
    helix.rotation.x = elapsed * 0.18 + scroll * 2.4;
    helix.rotation.y = pointerX * 0.1;
    helix.rotation.z = baseZ + pointerY * 0.06;
    camera.position.z = 11 + scroll * 3;
    dust.rotation.y = elapsed * 0.01;
    renderer.render(scene, camera);
  }
  function start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  // Pause when the hero is off screen or the tab is hidden.
  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()));
  io.observe(canvas);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);
  const ro = new ResizeObserver(layout);
  ro.observe(canvas);
  layout();
  renderer.render(scene, camera);

  return {
    setScroll(p) { scrollTarget = Math.max(0, Math.min(1, p)); },
    renderOnce() { renderer.render(scene, camera); },
    destroy() {
      stop(); io.disconnect(); ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      scene.traverse((o) => { o.geometry?.dispose?.(); });
      [gold, glass, rungMaterial, dust.material].forEach((mat) => mat.dispose());
      envTexture.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}
