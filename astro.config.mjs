import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({output:'static',trailingSlash:'always',site:process.env.SITE_URL || 'https://beltaly.example',base:process.env.BASE_PATH || '/', integrations:[sitemap()],vite:{plugins:[tailwindcss()]}});
