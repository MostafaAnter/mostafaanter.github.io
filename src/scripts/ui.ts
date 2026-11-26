// Small progressive-enhancement layer. The page is fully readable without it.
const root = document.documentElement;
const $ = <T extends Element>(s: string, c: ParentNode = document) => c.querySelector<T>(s);
const $$ = <T extends Element>(s: string, c: ParentNode = document) => [...c.querySelectorAll<T>(s)];

// Theme
$('#theme-toggle')?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0b0f14' : '#f6f8f7');
});

// Mobile menu
const menu = $('#menu'), burger = $<HTMLButtonElement>('#menu-toggle');
const setMenu = (open: boolean) => { menu?.classList.toggle('open', open); burger?.setAttribute('aria-expanded', String(open)); };
burger?.addEventListener('click', () => setMenu(!menu?.classList.contains('open')));
menu?.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// Active section in nav
const links = $$<HTMLAnchorElement>('[data-nav]');
const io = new IntersectionObserver((entries) => {
  for (const en of entries) if (en.isIntersecting) links.forEach((a) => a.setAttribute('aria-current', String(a.dataset.nav === en.target.id)));
}, { rootMargin: '-45% 0px -50% 0px' });
links.forEach((a) => { const s = document.getElementById(a.dataset.nav!); if (s) io.observe(s); });

// Click-to-load intro video (nothing downloaded until the visitor asks)
$$<HTMLElement>('[data-video]').forEach((box) => {
  $('.play', box)?.addEventListener('click', () => {
    const v = document.createElement('video');
    v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('aria-label', 'Mostafa Anter introduction');
    v.innerHTML = `<source src="${box.dataset.webm}" type="video/webm; codecs=vp9,opus"><source src="${box.dataset.mp4}" type="video/mp4"><track kind="captions" srclang="en" label="English" src="${box.dataset.captions}" default>`;
    box.replaceChildren(v);
    v.focus();
  }, { once: true });
});

// Projects: filter + show more
const items = $$<HTMLElement>('#project-grid > .item');
const more = $<HTMLButtonElement>('#project-more');
const LIMIT = 9;
let group = 'all', expanded = false;
function renderProjects() {
  const match = items.filter((i) => group === 'all' || i.dataset.group === group);
  items.forEach((i) => { i.hidden = true; });
  match.forEach((i, n) => { i.hidden = !expanded && n >= LIMIT; });
  if (more) {
    more.parentElement!.hidden = match.length <= LIMIT;
    more.textContent = expanded ? 'Show fewer' : `Show all ${match.length} projects`;
    more.setAttribute('aria-expanded', String(expanded));
  }
}
$$<HTMLButtonElement>('[data-filter]').forEach((b) => b.addEventListener('click', () => {
  group = b.dataset.filter!; expanded = false;
  $$('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  renderProjects();
}));
more?.addEventListener('click', () => { expanded = !expanded; renderProjects(); });
renderProjects();

// Certificates: filter + lightbox
$$<HTMLButtonElement>('[data-cert-filter]').forEach((b) => b.addEventListener('click', () => {
  const c = b.dataset.certFilter!;
  $$('[data-cert-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $$<HTMLElement>('.cert').forEach((el) => { el.hidden = c !== 'All' && el.dataset.cat !== c; });
}));
const dlg = $<HTMLDialogElement>('#lightbox');
const dImg = $<HTMLImageElement>('#lightbox-img'), dCap = $('#lightbox-cap');
let lastTrigger: HTMLElement | null = null;
$$<HTMLButtonElement>('[data-lightbox]').forEach((b) => b.addEventListener('click', () => {
  lastTrigger = b;
  const base = b.dataset.lightbox!;
  dImg!.src = `${base}.webp`; dImg!.alt = `${b.dataset.title} certificate`;
  dCap!.textContent = b.dataset.title ?? '';
  dlg?.showModal();
}));
dlg?.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
dlg?.addEventListener('close', () => lastTrigger?.focus());
