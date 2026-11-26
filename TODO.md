# TODO: details only the owner can supply

Nothing here blocks the site. Each item is hidden or omitted on the live site until you fill it in. Fill any of them whenever you like, then tell Claude Code (or edit the file named in brackets yourself).

**Rule:** only add facts that are true and that you can back up. Do not add made-up numbers, dates or quotes.

## Contact form and analytics (both switched off until set)
- [ ] **Web3Forms access key** (free, public by design: https://web3forms.com): paste into `contact.web3formsKey` [`src/content/profile.json`]. Until then there is no contact form (email, WhatsApp and LinkedIn still work).
- [ ] **GoatCounter site code** (https://www.goatcounter.com, cookieless): put into `analytics.goatcounter` [`src/content/profile.json`]. Until then there is no analytics at all.

## Featured case studies [`src/content/featured.json`]
- [ ] **The Weather Channel:** which metric is the 40% performance gain (cold start, jank, ANRs...)? Also confirm with your employer what may be published about internal work.
- [ ] **La3eb:** any real numbers for build time or release frequency?
- [ ] **KLLIQ:** any real result (upload reliability, chat latency...)? The Impact line stays hidden until then.
- [ ] **Android TV:** the problem it solved, your role, any impact, and which company it was for (if any).

## Certificates [`src/content/certificates.json`]
- [ ] **Swift 5 iOS Application Developer Specialization:** real issuer and date (shown today as "Listed on LinkedIn"). Do not guess a date: Swift 5 was released in 2019.
- [ ] Scans/PDFs for **Udemy "Master CI/CD for Android Developers"** and **Microsoft Applied Skills (GitHub Copilot)** if you have them.
- [ ] Is the Mobile Application Launchpad certificate the same item as "Developing Android Apps (Udacity, 2016)" on your resume?

## Testimonials [`src/content/testimonials.json`]
- [ ] 2-3 real quotes, each with the author's **written permission** to publish their name and role. The section stays hidden until at least one is set to `"placeholder": false`.

## Experience dates and wording [`src/content/experience.json`]
- [ ] **LocName** start month (placeholder 2015-01) and **Freelancer.com** end month (placeholder 2015-01). LinkedIn only gives the year.
- [ ] In your intro video you say "Live": La3eb or LivePlus? (Not used anywhere on the site until confirmed.)

## Other
- [ ] Keep your public email in the structured data (JSON-LD)? It is there now because you publish it on the site.
- [ ] Check the live site in **Safari** and **Firefox** (video, sound, certificate viewer, 3D hero, mobile menu).
- [ ] After deploying: submit `https://mostafaanter.github.io/sitemap.xml` in Google Search Console, and run the page through Google's Rich Results Test.
