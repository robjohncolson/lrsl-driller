import { defineConfig } from 'vite'

export default defineConfig({
  // Multi-page app setup - each HTML file is an entry point
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        zscore: 'zscore_3d_explorer.html',
        demo: 'platform/demo.html'
      }
    }
  },
  // Dev server config
  server: {
    open: true
  }
})
