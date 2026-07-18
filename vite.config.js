import { defineConfig } from 'vite';

export default defineConfig({
  base: '/gridshatter/', // <-- ADD THIS LINE (use your repo name)
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild'
  }
});
