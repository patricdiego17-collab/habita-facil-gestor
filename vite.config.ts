// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: false,
    strictPort: false,
  },
  preview: {
    port: 4173,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    outDir: 'dist',
  },
  envPrefix: 'VITE_',
  // Se publicar em subpasta (ex.: GitHub Pages), descomente e ajuste:
  // base: '/habita-facil-gestor/',
})
