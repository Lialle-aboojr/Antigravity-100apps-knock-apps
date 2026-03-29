import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages等のサブディレクトリにもデプロイ可能にするため、相対パスを指定
  base: './',
  plugins: [react()],
})
