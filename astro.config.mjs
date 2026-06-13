// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

const siteUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://canirunaimodel.vercel.app';

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
    worker: {
      format: 'es'
    }
  }
});
