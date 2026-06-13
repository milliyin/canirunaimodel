// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const siteUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://canirunaimodel.vercel.app';

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  adapter: vercel(),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    worker: {
      format: 'es'
    }
  }
});
