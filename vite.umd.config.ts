import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { existsSync, unlinkSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Monolithic UMD build for CDN / require consumers */
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'remove-umd-css',
      closeBundle() {
        // CSS is shipped once as vue-smart-ui.css from the ES build
        const umdCss = resolve(__dirname, 'dist/vue-smart-ui-umd.css')
        if (existsSync(umdCss)) unlinkSync(umdCss)
      },
    },
  ],
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueSmartUI',
      formats: ['umd'],
      fileName: () => 'vue-smart-ui.umd.js',
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
        assetFileNames: 'vue-smart-ui-umd.[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
