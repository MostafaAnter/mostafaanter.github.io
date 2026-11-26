import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mostafaanter.github.io',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
});
