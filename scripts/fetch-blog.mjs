// Build-time only: caches the Blogger feed as local JSON. The site never calls Blogger at runtime.
import { writeFile, mkdir } from 'node:fs/promises';

const BLOG = 'https://mostafa-anter-portfolio.blogspot.com';
const FEED = `${BLOG}/feeds/posts/default?alt=json&max-results=150`;
const OUT = new URL('../src/content/projects/feed.json', import.meta.url);

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const text = (html) => decode(html
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>|<\/(p|div|li|h\d)>/gi, '\n')
  .replace(/<[^>]+>/g, ' '))
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

const res = await fetch(FEED);
if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
const feed = (await res.json()).feed;

const posts = (feed.entry ?? []).map((e) => {
  const html = e.content?.$t ?? '';
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => decode(m[1]));
  const images = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => decode(m[1]));
  return {
    title: text(e.title.$t),
    url: e.link.find((l) => l.rel === 'alternate')?.href,
    published: e.published.$t,
    updated: e.updated.$t,
    labels: (e.category ?? []).map((c) => c.term),
    text: text(html),
    playStore: links.find((l) => l.includes('play.google.com')) ?? null,
    github: links.filter((l) => l.includes('github.com')),
    otherLinks: [...new Set(links.filter((l) => !/blogspot|blogger|googleusercontent|play\.google|github\.com/.test(l)))],
    images,
  };
}).sort((a, b) => b.published.localeCompare(a.published));

await mkdir(new URL('./', OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), total: posts.length, posts }, null, 2));
console.log(`Cached ${posts.length} posts (feed reports ${feed.openSearch$totalResults.$t}) -> src/content/projects/feed.json`);
