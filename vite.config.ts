import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The v0 preview proxies the page but does not reliably proxy Vite's
      // WebSocket upgrade. Disable HMR so @vite/client does not repeatedly
      // attempt a socket connection that closes before opening.
      hmr: false,
      // Keep file watching available so the preview still reloads after edits.
      watch: {},
    },
  };
});
