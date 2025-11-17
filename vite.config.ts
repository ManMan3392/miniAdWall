import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// @ts-expect-error vite-plugin-eslint 类型声明缺失
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [react(), eslint()],
});
