// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO (checklist pré-deploy): trocar pelo domínio definitivo antes de publicar.
export default defineConfig({
  site: 'https://arsenaldacerveja.com.br',
  integrations: [sitemap()],
  trailingSlash: 'never',
  build: {
    inlineStylesheets: 'auto',
  },
});
