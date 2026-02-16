import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// base para GitHub Pages (repo: dev_task_manager)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/dev_task_manager/',
});
