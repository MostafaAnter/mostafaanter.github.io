// Motion layer: smooth scroll (Lenis), reveals + timeline draw (GSAP), custom cursor, magnetic buttons.
// Loaded only when the user has not asked for reduced motion/data. Everything is progressive enhancement.
const root = document.documentElement;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(prefers-reduced-data: reduce)').matches;

async function init() {
  const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]);
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll, synced with ScrollTrigger
  const lenis = new Lenis({ duration: 1.1, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  addEventListener('modal:open', () => lenis.stop());
  addEventListener('modal:close', () => lenis.start());
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || a.hash.length < 2) return;
    const target = document.querySelector(a.hash); if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target as HTMLElement, { duration: 1.3 });
    history.pushState(null, '', a.hash);
  });
  if (location.hash.length > 1) { const t = document.querySelector(location.hash); if (t) requestAnimationFrame(() => lenis.scrollTo(t as HTMLElement, { immediate: true })); }
  if (new URLSearchParams(location.search).has('nomotion')) return;

  // Hero intro (headline + portrait are never hidden, so LCP is unaffected)
  gsap.to('[data-hero]', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.1 });

  // Section reveals
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }),
  });

  // Timeline line draws with scroll
  const line = document.querySelector('.timeline .line');
  if (line) gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: true } });

  // Stat counters: count up once when visible. Final text is in the HTML already (no-JS fallback).
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const m = /^(\d+)(.*)$/.exec(el.dataset.count || ''); if (!m) return;
    const end = +m[1], suffix = m[2], o = { v: 0 };
    el.textContent = '0' + suffix;
    ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v) + suffix; }, onComplete: () => { el.textContent = end + suffix; } }) });
  });

  window.__motionReady = true;

  // Custom cursor + magnetic buttons: mouse-like pointers only
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const dot = Object.assign(document.createElement('div'), { className: 'cursor-dot' });
    const ring = Object.assign(document.createElement('div'), { className: 'cursor-ring' });
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    document.body.append(ring, dot);
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    const hot = 'a, button, [role="button"], summary, input, select, textarea, video, .thumb';
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!root.classList.contains('has-cursor')) { root.classList.add('has-cursor'); gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); }
      document.body.classList.add('cursor-on');
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      ring.classList.toggle('hot', !!(e.target as Element).closest?.(hot));
    }, { passive: true });
    document.addEventListener('pointerleave', () => document.body.classList.remove('cursor-on'));
    addEventListener('pointerdown', () => ring.classList.add('down'));
    addEventListener('pointerup', () => ring.classList.remove('down'));

    document.querySelectorAll<HTMLElement>('.btn.primary, .btn').forEach((b) => {
      const mx = gsap.quickTo(b, 'x', { duration: 0.4, ease: 'power3' }), my = gsap.quickTo(b, 'y', { duration: 0.4, ease: 'power3' });
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.22); my((e.clientY - r.top - r.height / 2) * 0.3); });
      b.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }
}

if (!calm) {
  const go = () => init().catch(() => root.classList.remove('motion-ok'));
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go, { once: true }) : go();
}
declare global { interface Window { __motionReady?: boolean } }

export {};
