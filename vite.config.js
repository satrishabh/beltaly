import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from the root of www.beltaly.in. Real paths (/shop/...) are prerendered by scripts/prerender.mjs,
// so GitHub Pages serves each page with a 200 and its own title.
export default defineConfig({
  base: '/',
  plugins: [react()],
});
