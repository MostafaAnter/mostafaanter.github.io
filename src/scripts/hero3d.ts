// Lazy 3D hero. Everything heavy (three.js) is dynamically imported, and only after the
// page is idle AND the device qualifies. Otherwise the static portrait stays (permanent fallback).
const visual = document.getElementById('hero-visual');
const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;

function qualifies(): boolean {
  if (!visual || !canvas) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (matchMedia('(prefers-reduced-data: reduce)').matches || nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 4) <= 2 || (nav.deviceMemory ?? 4) <= 2) return false;
  try {
    const t = document.createElement('canvas');
    if (!(t.getContext('webgl2') || t.getContext('webgl'))) return false;
  } catch { return false; }
  return true;
}

async function start() {
  const [THREE, { RoundedBoxGeometry }] = await Promise.all([
    import('three'),
    import('three/addons/geometries/RoundedBoxGeometry.js'),
  ]);
  const css = getComputedStyle(document.documentElement);
  const accent = new THREE.Color(css.getPropertyValue('--accent').trim() || '#3ddc84');
  const coarse = matchMedia('(pointer: coarse)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas!, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 5.3);

  scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x0b0f14, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 3, 4); scene.add(key);
  const rim = new THREE.PointLight(accent, 14, 9); rim.position.set(-2.6, -1.2, 1.6); scene.add(rim);

  // Screen UI drawn to a canvas texture
  const W = 512, H = 1024;
  const sc = document.createElement('canvas'); sc.width = W; sc.height = H;
  const g = sc.getContext('2d')!;
  const tex = new THREE.CanvasTexture(sc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const me = new Image(); me.src = '/img/portrait-400.webp';
  const hex = '#' + accent.getHexString();
  const blips = [[0.45, 0.8, 0.0], [0.7, 2.2, 0.3], [0.3, 4.1, 0.6], [0.6, 5.3, 0.15]];

  function drawScreen(t: number) {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0f1a24'); bg.addColorStop(1, '#070a0e');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#9aa7b6'; g.font = '500 22px "JetBrains Mono Variable", monospace'; g.fillText('9:41', 44, 62);
    g.fillStyle = hex; g.beginPath(); g.arc(W - 56, 54, 7, 0, 7); g.fill();
    // avatar
    g.save(); g.beginPath(); g.arc(W / 2, 200, 84, 0, 7); g.clip();
    if (me.complete && me.naturalWidth) g.drawImage(me, W / 2 - 84, 116, 168, 168); else { g.fillStyle = '#19212c'; g.fillRect(W / 2 - 84, 116, 168, 168); }
    g.restore();
    g.strokeStyle = hex; g.lineWidth = 4; g.beginPath(); g.arc(W / 2, 200, 92, 0, 7); g.stroke();
    g.textAlign = 'center'; g.fillStyle = '#eef2f6';
    g.font = '700 40px "Space Grotesk Variable", system-ui, sans-serif'; g.fillText('Mostafa Anter', W / 2, 342);
    g.fillStyle = hex; g.font = '500 22px "JetBrains Mono Variable", monospace'; g.fillText('SENIOR ANDROID ENGINEER', W / 2, 382);
    // radar
    const cx = W / 2, cy = 640, R = 170;
    g.strokeStyle = 'rgba(61,220,132,.28)'; g.lineWidth = 2;
    for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(cx, cy, (R * i) / 3, 0, 7); g.stroke(); }
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
    const a = t * 1.6;
    const sweep = g.createConicGradient(a - 1.2, cx, cy);
    sweep.addColorStop(0, 'rgba(61,220,132,0)'); sweep.addColorStop(1, 'rgba(61,220,132,.55)');
    g.fillStyle = sweep; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a - 1.2, a); g.closePath(); g.fill();
    g.strokeStyle = hex; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke();
    for (const [r, ang, ph] of blips) {
      const d = ((a - ang) % 6.2832 + 6.2832) % 6.2832; const al = Math.max(0, 1 - d / 3.2) * (0.5 + ph);
      g.fillStyle = `rgba(61,220,132,${Math.min(1, al)})`; g.beginPath(); g.arc(cx + Math.cos(ang) * R * r, cy + Math.sin(ang) * R * r, 7, 0, 7); g.fill();
    }
    // footer chips
    g.textAlign = 'left';
    [['100M+ users', 44], ['Kotlin · Compose', 262]].forEach(([s, x]) => {
      g.fillStyle = '#19212c'; g.beginPath(); g.roundRect(x as number, 900, 206, 56, 28); g.fill();
      g.fillStyle = '#eef2f6'; g.font = '500 20px "JetBrains Mono Variable", monospace'; g.fillText(s as string, (x as number) + 22, 936);
    });
    tex.needsUpdate = true;
  }

  // Phone
  const phone = new THREE.Group(); scene.add(phone);
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.2, 2.45, 0.14, 4, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x151b22, metalness: 0.85, roughness: 0.32 }));
  phone.add(body);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.z = 0.075; phone.add(screen);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new RoundedBoxGeometry(1.2, 2.45, 0.14, 4, 0.16), 40),
    new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.35 }));
  phone.add(edge);

  // Module layers behind the phone: they separate as you scroll
  const layers: { m: import("three").Mesh; l: import("three").LineSegments; z: number }[] = [];
  [0.5, 0.95, 1.4].forEach((z, i) => {
    const geo = new RoundedBoxGeometry(1.2 + i * 0.1, 2.45 + i * 0.1, 0.02, 3, 0.1);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.05, depthWrite: false }));
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 40), new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.28 - i * 0.06 }));
    m.add(l); m.position.z = -0.12; phone.add(m); layers.push({ m, l, z: -z });
  });

  // Input
  let tx = 0, ty = 0, sx = 0, sy = 0, scroll = 0;
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; } }, { passive: true });
  const onScroll = () => { scroll = Math.min(1, scrollY / (innerHeight * 0.9)); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function resize() {
    const w = canvas!.clientWidth, h = canvas!.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas!); resize();

  let visible = true, last = 0, lastTex = 0, raf = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; loop(performance.now()); }).observe(visual!);
  document.addEventListener('visibilitychange', () => loop(performance.now()));

  function loop(now: number) {
    cancelAnimationFrame(raf);
    if (!visible || document.hidden) return;
    raf = requestAnimationFrame(loop);
    const t = now / 1000, dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const k = 1 - Math.pow(0.001, dt);
    const autoX = coarse ? Math.sin(t * 0.5) * 0.6 : tx, autoY = coarse ? Math.cos(t * 0.4) * 0.3 : ty;
    sx += (autoX - sx) * k; sy += (autoY - sy) * k;
    phone.rotation.y = sx * 0.45 + scroll * 0.9 - 0.25;
    phone.rotation.x = sy * 0.2 - scroll * 0.15;
    phone.position.y = Math.sin(t * 0.9) * 0.06 - scroll * 0.2;
    layers.forEach((L, i) => { L.m.position.z = -0.12 + L.z * (0.3 + scroll * 1.1); L.m.position.x = scroll * 0.18 * (i + 1); });
    rim.position.x = -2.6 + sx * 1.2;
    if (now - lastTex > 33) { drawScreen(t); lastTex = now; }
    renderer.render(scene, camera);
  }

  canvas!.addEventListener('webglcontextlost', (e) => { e.preventDefault(); visual!.classList.remove('three-on'); cancelAnimationFrame(raf); });
  await document.fonts?.load('700 40px "Space Grotesk Variable"').catch(() => {});
  drawScreen(0); renderer.render(scene, camera);
  canvas!.hidden = false;
  requestAnimationFrame(() => visual!.classList.add('three-on'));
  loop(performance.now());
}

if (qualifies()) {
  const go = () => start().catch(() => visual?.classList.remove('three-on'));
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => void }).requestIdleCallback;
  // Wait until the page has loaded, give first paint and interaction a head start (2.5 s), then start on an idle frame.
  addEventListener('load', () => setTimeout(() => (idle ? idle(go, { timeout: 2000 }) : go()), 2500), { once: true });
}

export {};
