import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [react(), eslint()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://47.98.38.166:3000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://47.98.38.166:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
