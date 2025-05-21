import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-ignore: no type declarations for vite-plugin-compression
import viteCompression from 'vite-plugin-compression';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteCompression(),
  ],
  root: '.',
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts', 'd3'],
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
