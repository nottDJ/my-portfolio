import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative base so the build works from any sub-path (e.g. /my-portfolio/aether/).
  base: './',
  plugins: [react(), tailwindcss()],
});
