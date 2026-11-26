// Sound: OFF by default. Nothing is downloaded or played until the visitor clicks the toggle.
// UI sounds (hover/click/section) + optional ambient loop, via Web Audio. State is remembered in localStorage.
const root = document.documentElement;
const KEY = { sound: 'sound', ambient: 'ambient' };
const $ = <T extends Element>(s: string) => document.querySelector<T>(s);
const soundBtn = $<HTMLButtonElement>('#sound-toggle');
const ambBtn = $<HTMLButtonElement>('#ambient-toggle');
if (!soundBtn || !ambBtn) throw new Error('sound controls missing');

const get = (k: string) => { try { return localStorage.getItem(k) === 'on'; } catch { return false; } };
const set = (k: string, on: boolean) => { try { localStorage.setItem(k, on ? 'on' : 'off'); } catch { /* private mode */ } };

let soundOn = get(KEY.sound), ambientOn = get(KEY.ambient);
let ctx: AudioContext | null = null, master: GainNode, ambGain: GainNode;
let ambSrc: AudioBufferSourceNode | null = null;
const buffers = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<AudioBuffer | undefined>>();

const ext = (() => { const a = document.createElement('audio'); return a.canPlayType('audio/webm; codecs="opus"') ? 'webm' : 'mp3'; })();

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  ambGain = ctx.createGain(); ambGain.gain.value = 0; ambGain.connect(ctx.destination);
  return ctx;
}

function load(name: string) {
  if (buffers.has(name)) return Promise.resolve(buffers.get(name));
  if (!loading.has(name)) {
    loading.set(name, fetch(`/audio/${name}.${ext}`).then((r) => r.arrayBuffer()).then((b) => ensureCtx().decodeAudioData(b))
      .then((buf) => { buffers.set(name, buf); return buf; }).catch(() => undefined));
  }
  return loading.get(name)!;
}

function play(name: string, vol = 1) {
  if (!soundOn || !ctx || ctx.state !== 'running') return;
  const buf = buffers.get(name);
  if (!buf) { void load(name); return; } // first use: fetch lazily, play next time
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(g).connect(master); src.start();
}

async function startAmbient() {
  if (!ctx || ambSrc) return;
  const buf = await load('ambient'); if (!buf || !ambientOn || !soundOn || ambSrc) return;
  ambSrc = ctx.createBufferSource(); ambSrc.buffer = buf; ambSrc.loop = true; ambSrc.connect(ambGain); ambSrc.start();
  ambGain.gain.cancelScheduledValues(ctx.currentTime);
  ambGain.gain.setTargetAtTime(videoPlaying ? 0 : 0.22, ctx.currentTime, 0.8);
}
function stopAmbient() {
  if (!ctx || !ambSrc) return;
  const s = ambSrc; ambSrc = null;
  ambGain.gain.cancelScheduledValues(ctx.currentTime);
  ambGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  setTimeout(() => { try { s.stop(); } catch { /* already stopped */ } }, 1200);
}

function render() {
  soundBtn!.setAttribute('aria-pressed', String(soundOn));
  soundBtn!.setAttribute('aria-label', soundOn ? 'Turn sound off' : 'Turn sound on');
  soundBtn!.title = soundOn ? 'Sound on' : 'Sound off';
  root.classList.toggle('sound-on', soundOn);
  ambBtn!.hidden = !soundOn;
  ambBtn!.setAttribute('aria-pressed', String(ambientOn));
  ambBtn!.setAttribute('aria-label', ambientOn ? 'Turn ambient music off' : 'Turn ambient music on');
  ambBtn!.title = ambientOn ? 'Ambient on' : 'Ambient off';
}

// Autoplay rules: a stored "on" preference only takes effect after the first user gesture.
async function resume() {
  if (!soundOn) return;
  ensureCtx(); if (ctx!.state !== 'running') await ctx!.resume().catch(() => {});
  void load('hover'); void load('click'); void load('section');
  if (ambientOn) void startAmbient();
}
const firstGesture = () => { void resume(); };
if (soundOn) ['pointerdown', 'keydown', 'touchstart'].forEach((e) => addEventListener(e, firstGesture, { once: true, passive: true, capture: true }));

soundBtn.addEventListener('click', async (e) => {
  e.stopPropagation();
  soundOn = !soundOn; set(KEY.sound, soundOn); render();
  if (soundOn) { await resume(); await load('on'); const c = ctx!; const s = c.createBufferSource(); s.buffer = buffers.get('on')!; s.connect(master); s.start(); }
  else { const had = ctx && ctx.state === 'running' ? buffers.get('off') : undefined; stopAmbient(); if (had && ctx) { const s = ctx.createBufferSource(); s.buffer = had; s.connect(master); s.start(); } else void load('off'); }
});
ambBtn.addEventListener('click', async (e) => {
  e.stopPropagation();
  ambientOn = !ambientOn; set(KEY.ambient, ambientOn); render();
  if (ambientOn) { await resume(); void startAmbient(); play('click', 0.6); } else stopAmbient();
});

// UI sounds (mouse hover only; touch has no hover)
let lastHover: Element | null = null, lastAt = 0;
const hot = 'a[href], button:not([hidden]), [role="button"], .thumb';
document.addEventListener('pointerover', (e) => {
  if (!soundOn || e.pointerType !== 'mouse') return;
  const el = (e.target as Element).closest(hot); if (!el || el === lastHover) return;
  lastHover = el; const now = performance.now(); if (now - lastAt < 70) return; lastAt = now;
  play('hover', 0.7);
}, { passive: true });
document.addEventListener('pointerout', (e) => { if (!(e.relatedTarget as Element | null)?.closest?.(hot)) lastHover = null; }, { passive: true });
document.addEventListener('click', (e) => {
  const t = e.target as Element; if (t.closest('#sound-toggle, #ambient-toggle')) return;
  if (t.closest(hot)) play('click', 0.9);
}, { capture: true });

// Section change whoosh
let current = '';
const io = new IntersectionObserver((entries) => {
  for (const en of entries) if (en.isIntersecting) { const id = en.target.id; if (current && id !== current) play('section', 0.8); current = id; }
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main > section[id]').forEach((s) => io.observe(s));

// Ambient: duck while the intro video plays; pause when the tab is hidden
let videoPlaying = false;
const duck = (on: boolean) => { videoPlaying = on; if (ctx && ambSrc) ambGain.gain.setTargetAtTime(on ? 0 : 0.22, ctx.currentTime, 0.4); };
document.addEventListener('play', (e) => { if ((e.target as Element).tagName === 'VIDEO') duck(true); }, true);
['pause', 'ended'].forEach((ev) => document.addEventListener(ev, (e) => { if ((e.target as Element).tagName === 'VIDEO') duck(false); }, true));
document.addEventListener('visibilitychange', () => {
  if (!ctx || !soundOn) return;
  void (document.hidden ? ctx.suspend() : ctx.resume());
});

render();
export {};
