import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve, dirname } from 'path'
import { renameSync, existsSync, unlinkSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function postBuildCleanup() {
  return {
    name: 'post-build-cleanup',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')

      // Ensure CSS is named vue-smart-ui.css
      for (const name of ['style.css', 'index.css']) {
        const from = resolve(dist, name)
        const to = resolve(dist, 'vue-smart-ui.css')
        if (existsSync(from)) {
          if (existsSync(to)) unlinkSync(to)
          renameSync(from, to)
        }
      }

      // Remove unused style entry JS and UMD CSS artifact
      for (const file of ['style.js', 'style.d.ts', 'vue-smart-ui-umd.css', 'shims-style.d.ts']) {
        const path = resolve(dist, file)
        if (existsSync(path)) unlinkSync(path)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.app.json',
      entryRoot: 'src',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: [
        'src/main.ts',
        'src/App.vue',
        'src/style.ts',
        'src/usage-example.ts',
        'src/toast-config-example.ts',
        'src/validation-config-example.ts',
      ],
      insertTypesEntry: false,
      copyDtsFiles: true,
    }),
    postBuildCleanup(),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        style: resolve(__dirname, 'src/style.ts'),
      },
      name: 'VueSmartUI',
      formats: ['es'],
      fileName: (_format, entryName) => {
        if (entryName === 'style') return 'style.js'
        return 'index.js'
      },
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: ['vue'],
      output: {
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: 'vue-smart-ui.[ext]',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
