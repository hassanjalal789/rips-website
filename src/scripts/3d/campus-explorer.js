// Campus Explorer (motion storyboard S5): the placeholder campus GLB in an orbit viewer with
// hotspots. Loads only when the visitor asks for it ("Explore the campus"), on capable devices.
// The hotspot buttons live in the page HTML as a plain list, so the places are readable and
// usable without JavaScript or WebGL; this module only moves them over the model.
//
// Usage:
//   const explorer = await mountCampus(container, { THREE, GLTFLoader, OrbitControls }, hotspotData,
//     { reducedMotion, onSelect: (hotspot) => {} });
//   explorer.focus('library'); explorer.destroy();
// The container holds a <canvas> and one <button data-hotspot="id"> per hotspot.

export async function mountCampus(container, { THREE, GLTFLoader, OrbitControls }, data, { reducedMotion = false, onSelect } = {}) {
  const canvas = container.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071726);
  scene.fog = new THREE.Fog(0x071726, 140, 260);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 600);
  camera.position.fromArray(data.camera.position);

  scene.add(new THREE.HemisphereLight(0xdfe9f5, 0x1b2a33, 1.1));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(40, 70, 50);
  sun.castShadow = true;
  const big = Math.max(window.innerWidth, window.innerHeight) >= 1000;
  sun.shadow.mapSize.set(big ? 2048 : 1024, big ? 2048 : 1024);
  Object.assign(sun.shadow.camera, { left: -52, right: 52, top: 42, bottom: -42, near: 20, far: 170 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.06; // no stair-step acne on the parapets
  scene.add(sun);

  const gltf = await new GLTFLoader().loadAsync(data.model);
  const campus = gltf.scene;
  campus.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone(); // own copy, so one building can glow on its own
    o.userData.emissive = o.material.emissive.getHex();
    o.castShadow = !/Ground|Pav/.test(o.material.name);
    o.receiveShadow = true;
  });
  scene.add(campus);

  const controls = new OrbitControls(camera, canvas);
  controls.target.fromArray(data.camera.target);
  Object.assign(controls, {
    enableDamping: !reducedMotion, dampingFactor: 0.08, enablePan: false,
    minDistance: 25, maxDistance: 170, maxPolarAngle: Math.PI / 2 - 0.08, minPolarAngle: 0.2,
  });
  controls.update();
  const openingOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
  let touched = false;
  controls.addEventListener('start', () => { touched = true; });

  // Keyboard: arrows orbit, + and - zoom, when the canvas has focus.
  const spherical = new THREE.Spherical();
  const offset = new THREE.Vector3();
  function nudge(dTheta, dPhi, zoom) {
    offset.subVectors(camera.position, controls.target);
    spherical.setFromVector3(offset);
    spherical.theta += dTheta;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + dPhi, controls.minPolarAngle, controls.maxPolarAngle);
    spherical.radius = THREE.MathUtils.clamp(spherical.radius * zoom, controls.minDistance, controls.maxDistance);
    offset.setFromSpherical(spherical);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }
  const onKey = (e) => {
    const step = 0.12;
    const moves = { ArrowLeft: [-step, 0, 1], ArrowRight: [step, 0, 1], ArrowUp: [0, -step, 1], ArrowDown: [0, step, 1], '+': [0, 0, 0.88], '=': [0, 0, 0.88], '-': [0, 0, 1.14] };
    if (!moves[e.key]) return;
    e.preventDefault();
    touched = true;
    nudge(...moves[e.key]);
  };
  canvas.addEventListener('keydown', onKey);

  // Hotspots: project each 3D point to the canvas and move its button there.
  const spots = data.hotspots.map((h) => ({ ...h, point: new THREE.Vector3().fromArray(h.position), el: container.querySelector(`[data-hotspot="${h.id}"]`) }));
  const buildingMeshes = (name) => campus.getObjectByName(name)?.children.filter((o) => o.isMesh) ?? [];
  let selected = null;
  const projected = new THREE.Vector3();
  function placeHotspots() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    for (const s of spots) {
      if (!s.el) continue;
      projected.copy(s.point).project(camera);
      const visible = projected.z < 1 && Math.abs(projected.x) <= 1.05 && Math.abs(projected.y) <= 1.05;
      s.el.style.transform = `translate(${((projected.x + 1) / 2) * w}px, ${((1 - projected.y) / 2) * h}px) translate(-50%, -50%)`;
      s.el.dataset.offscreen = String(!visible);
    }
  }

  // Selecting a hotspot glides the view to it (or jumps, with reduced motion) and lights its building.
  let tween = null;
  function focus(id) {
    const s = spots.find((x) => x.id === id);
    if (!s) return;
    touched = true;
    for (const m of selected ? buildingMeshes(selected.building) : []) m.material.emissive.setHex(m.userData.emissive);
    selected = s;
    for (const m of buildingMeshes(s.building)) if (!m.material.transparent) m.material.emissive.setHex(0x3a2a08);
    const toTarget = s.point.clone().setY(Math.max(3, s.point.y * 0.6));
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    const portrait = Math.min(1, camera.aspect);
    const toPos = toTarget.clone().addScaledVector(dir, 70 / Math.sqrt(portrait)); // step back further on phones
    toPos.y = Math.max(toPos.y, 18);
    if (reducedMotion) {
      controls.target.copy(toTarget); camera.position.copy(toPos); controls.update();
    } else {
      tween = { t: 0, fromT: controls.target.clone(), fromP: camera.position.clone(), toT: toTarget, toP: toPos };
    }
    spots.forEach((x) => x.el?.setAttribute('aria-pressed', String(x === s)));
    onSelect?.(s);
  }
  const clicks = spots.map((s) => {
    const fn = () => focus(s.id);
    s.el?.addEventListener('click', fn);
    return [s.el, fn];
  });

  function layout() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 48 : 35;
    camera.updateProjectionMatrix();
    // Phones are tall: start further back so the whole site fits, until the visitor takes over.
    if (!touched) camera.position.copy(controls.target).addScaledVector(openingOffset, w / h < 1 ? Math.min(2.2, (h / w) ** 0.8) : 1);
  }

  let running = false, raf = 0;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  function frame() {
    raf = requestAnimationFrame(frame);
    if (tween) {
      tween.t = Math.min(1, tween.t + 1 / 60);
      const k = ease(tween.t);
      controls.target.lerpVectors(tween.fromT, tween.toT, k);
      camera.position.lerpVectors(tween.fromP, tween.toP, k);
      if (tween.t === 1) tween = null;
    }
    controls.update();
    placeHotspots();
    renderer.render(scene, camera);
  }
  function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()));
  io.observe(canvas);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);
  const ro = new ResizeObserver(layout);
  ro.observe(canvas);
  layout();
  controls.update();
  placeHotspots();
  renderer.render(scene, camera);

  return {
    focus,
    renderOnce() { controls.update(); placeHotspots(); renderer.render(scene, camera); },
    destroy() {
      stop(); io.disconnect(); ro.disconnect(); controls.dispose();
      canvas.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      clicks.forEach(([el, fn]) => el?.removeEventListener('click', fn));
      campus.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      renderer.dispose();
    },
  };
}
