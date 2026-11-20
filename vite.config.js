import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps asset and image paths relative, so the build also works under a subpath
// (e.g. https://<user>.github.io/beltaly/). Routing uses #/ hashes, so no server rewrites are needed.
export default defineConfig({
  base: './',
  plugins: [react()],
});
