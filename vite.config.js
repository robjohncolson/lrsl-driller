import { defineConfig } from 'vite'
import { resolve } from 'path'
import { cpSync, existsSync } from 'fs'

// Plugin to copy runtime assets (cartridges) to dist
function copyRuntimeAssets() {
  return {
    name: 'copy-runtime-assets',
    closeBundle() {
      const assetsToCopy = ['cartridges']
      for (const dir of assetsToCopy) {
        if (existsSync(dir)) {
          cpSync(dir, `dist/${dir}`, { recursive: true })
          console.log(`Copied ${dir}/ to dist/${dir}/`)
        }
      }
    }
  }
}

export default defineConfig({
  // Multi-page app setup - each HTML file is an entry point
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        app: 'platform/app.html',
        demo: 'platform/demo.html'
      }
    }
  },
  plugins: [copyRuntimeAssets()],
  // Dev server config
  server: {
    open: '/platform/app.html'
  }
})
