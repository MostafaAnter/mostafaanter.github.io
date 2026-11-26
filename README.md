# Mostafa Anter — portfolio

Live: **https://mostafaanter.github.io** · Built with Astro + TypeScript, Three.js, GSAP, Lenis. Static, no trackers, no cookies.

Every push to `main` builds and deploys automatically (GitHub Actions → GitHub Pages, about 1 minute).

```bash
npm install
npm run dev        # local preview at http://localhost:4321
npm run build      # type check + production build into dist/
```

## Update content (no code needed)

All text lives in `src/content/`:

| To change | Edit |
|---|---|
| Name, tagline, About paragraphs, contact details, social links | `profile.json` |
| Jobs, dates, bullets, Play Store buttons | `experience.json` (newest first, dates `YYYY-MM`, `end: null` = present) |
| Skills | `skills.json` |
| Certificates | `certificates.json` |
| Project cards | `projects/curated.json` |

Then commit and push. Check locally first with `npm run dev`.

## Add a certificate

1. Put the original (JPG/PNG, or a PDF rendered with `swift scripts/render-pdf.swift in.pdf assets/work/name.png 3`) in `assets/`.
2. Add a line to the `certs` list in `scripts/process-media.mjs` (name, source file, optional crop), then run `npm run media`. This creates the thumbnail and the large lightbox image in `public/certs/`.
3. Add an item to `src/content/certificates.json` with `"image": "certs/<name>"`. Items without `image` show as text-only cards.

## Refresh the blog projects

```bash
npm run fetch:blog
```

This re-reads the Blogger feed into `src/content/projects/feed.json`. For any **new** post, add an entry to `src/content/projects/curated.json` (key = the post path such as `/2025/01/my-app.html`, plus `group`, `summary`, `tech`). Posts without an entry are not shown.

## Featured projects, testimonials, form and analytics

- **Featured case studies:** `src/content/featured.json`. A field set to `null` is hidden; the `_todo` notes say what is missing.
- **Testimonials:** `src/content/testimonials.json`. The section stays hidden until you set `"placeholder": false` on a real, approved entry. Always get written permission first (see the `_readme` in that file).
- **Contact form:** paste your public Web3Forms access key into `contact.web3formsKey` in `src/content/profile.json`. Empty = no form.
- **Analytics:** put your GoatCounter site code into `analytics.goatcounter` in `profile.json`. Empty = no analytics. Cookieless, no banner needed. To use Plausible instead, see section 11 of `CLAUDE.md`.

## Other tasks

- Change the intro video / portrait: see section 6 of `CLAUDE.md`.
- Regenerate the UI sounds: `npm run audio`. Regenerate favicons: `npm run icons`.
- Theme colors: `src/styles/tokens.css`.

`CLAUDE.md` contains the full project context, decisions and gotchas. Start there when asking Claude Code to make changes.
