import { defineConfig } from 'vite'
import { resolve } from 'path'


export default defineConfig({
  root: "editor",
  base: "/editor/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'editor/index.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
      '/preview': {
        target: 'http://localhost:3000',
      },
    }
  }
})
