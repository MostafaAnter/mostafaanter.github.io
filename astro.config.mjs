import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mostafaanter.github.io',
  trailingSlash: 'always',
  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', ar: 'ar' } } })],
  i18n: { defaultLocale: 'en', locales: ['en', 'ar'], routing: { prefixDefaultLocale: true } },
  build: { inlineStylesheets: 'auto' },
});
