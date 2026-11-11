import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/karaoke/',
  plugins: [preact(), tailwindcss()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
  },
});
