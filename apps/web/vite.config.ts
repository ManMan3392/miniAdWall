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
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:3002',
  //       changeOrigin: true,
  //     },
  //     '/uploads': {
  //       target: 'http://localhost:3002',
  //       changeOrigin: true,
  //     },
  //   },
  // },
});
