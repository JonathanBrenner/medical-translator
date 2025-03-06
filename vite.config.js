import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src',
  build: {
    outDir: '../static/dist',
    assetsDir: '',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/upload': 'http://localhost:5000'
    }
  }
});