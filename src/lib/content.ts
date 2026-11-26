import profile from '../content/profile.json';
import experience from '../content/experience.json';
import skills from '../content/skills.json';
import certificates from '../content/certificates.json';
import feed from '../content/projects/feed.json';
import curated from '../content/projects/curated.json';

export { profile, experience, skills, certificates };

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const fmtMonth = (ym: string | null) => (ym ? `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}` : 'Present');

export function yearsBetween(start: string, end: string | null) {
  const [sy, sm] = start.split('-').map(Number);
  const now = new Date();
  const [ey, em] = end ? end.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const m = (ey - sy) * 12 + (em - sm);
  const y = Math.floor(m / 12), r = m % 12;
  return [y ? `${y} yr${y > 1 ? 's' : ''}` : '', r ? `${r} mo` : ''].filter(Boolean).join(' ') || '1 mo';
}

type Curated = { group: 'freelance' | 'learning'; summary: string; tech: string[]; github?: string };
export const projects = feed.posts
  .map((p) => {
    const c = (curated.items as Record<string, Curated>)[new URL(p.url).pathname];
    return c && { title: p.title, url: p.url, year: +p.published.slice(0, 4), published: p.published, ...c, github: c.github ?? p.github[0] ?? null };
  })
  .filter(Boolean) as Array<{ title: string; url: string; year: number; published: string; group: 'freelance' | 'learning'; summary: string; tech: string[]; github: string | null }>;

export const certDate = (d: string | null) => {
  if (!d) return '';
  const [y, m] = d.split('-');
  return m ? `${MONTHS[+m - 1]} ${y}` : y;
};
