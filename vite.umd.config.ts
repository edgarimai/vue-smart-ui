import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { copyFileSync, existsSync, unlinkSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Monolithic UMD build for CDN / require consumers.
 *
 * The package is `"type": "module"`, so Node loads a `.js` file as ESM and
 * `require('vue-smart-ui')` would return `{}`. The bundle is therefore emitted as
 * `.cjs` (always CommonJS) and copied to `.umd.js`, the name earlier releases shipped,
 * so existing CDN links and direct `dist/` paths keep working.
 */
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'finalize-umd',
      writeBundle(options) {
        const dist = options.dir ?? resolve(__dirname, 'dist')

        copyFileSync(resolve(dist, 'vue-smart-ui.umd.cjs'), resolve(dist, 'vue-smart-ui.umd.js'))

        // CSS is shipped once as vue-smart-ui.css from the ES build
        const umdCss = resolve(dist, 'vue-smart-ui-umd.css')
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
      fileName: () => 'vue-smart-ui.umd.cjs',
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
