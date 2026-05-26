import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import path from 'path';

export default defineConfig({
  base: '/CardGame/',
  plugins: [
    react(),
    glsl({ compress: false }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('pixi.js') || id.includes('@pixi') || id.includes('pixi-filters')) return 'vendor-pixi';
          if (id.includes('gsap')) return 'vendor-gsap';
          if (id.includes('howler')) return 'vendor-howler';
          if (id.includes('react') || id.includes('scheduler') || id.includes('zustand') || id.includes('immer') || id.includes('lz-string')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
