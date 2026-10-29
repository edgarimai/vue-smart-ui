import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Builds the library (ES + UMD) into a throwaway "installed package" layout and then
 * consumes it the way a real project would, through the package.json `exports` map:
 *
 *   node_modules/.tmp/package-test/
 *     node_modules/vue-smart-ui/{package.json, dist/}   <- the package under test
 *     (vue resolves from the repo's own node_modules, further up the tree)
 *
 * The real `dist/` is never touched.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SANDBOX = join(ROOT, 'node_modules/.tmp/package-test')
const PKG_DIR = join(SANDBOX, 'node_modules/vue-smart-ui')
const DIST = join(PKG_DIR, 'dist')
const VITE_BIN = join(ROOT, 'node_modules/vite/bin/vite.js')

const EXPECTED_EXPORTS = [
  'BaseAccordion',
  'BaseAccordionItem',
  'BaseAvatar',
  'BaseButton',
  'BaseCheckbox',
  'BaseColorPicker',
  'BaseCombobox',
  'BaseDropdown',
  'BaseInfiniteScroll',
  'BaseInput',
  'BaseOTP',
  'BasePopup',
  'BaseRichTextEditor',
  'BaseSegmentedButtons',
  'BaseSkeleton',
  'BaseSlider',
  'BaseSwitch',
  'BaseTable',
  'BaseTextarea',
  'BaseToast',
  'ToastsContainer',
  'default',
  'useToast',
  'useToastConfig',
  'useValidationConfig',
]

const build = (...args: string[]) => {
  const result = spawnSync(process.execPath, [VITE_BIN, 'build', '--outDir', DIST, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`vite build failed:\n${result.stdout}\n${result.stderr}`)
  }
}

/** Runs a snippet in the sandbox so bare specifiers resolve like in a consumer project. */
const runNode = (code: string, ...flags: string[]) => {
  const result = spawnSync(process.execPath, [...flags, '-e', code], {
    cwd: SANDBOX,
    encoding: 'utf8',
  })
  return { ok: result.status === 0, stdout: result.stdout.trim(), stderr: result.stderr.trim() }
}

const keysOf = (stdout: string): string[] => (JSON.parse(stdout) as string[]).sort()

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )

beforeAll(() => {
  rmSync(SANDBOX, { recursive: true, force: true })
  mkdirSync(DIST, { recursive: true })
  cpSync(join(ROOT, 'package.json'), join(PKG_DIR, 'package.json'))

  build()
  build('--config', 'vite.umd.config.ts')
}, 240_000)

describe('package.json entry points', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    main: string
    module: string
    types: string
    exports: Record<string, string | Record<string, string>>
  }

  it('points main, module and types at files that the build produces', () => {
    for (const target of [pkg.main, pkg.module, pkg.types]) {
      expect(existsSync(join(PKG_DIR, target)), target).toBe(true)
    }
  })

  it('points every `exports` target at a file that the build produces', () => {
    const targets = Object.values(pkg.exports).flatMap((entry) =>
      typeof entry === 'string' ? [entry] : Object.values(entry),
    )

    for (const target of targets) {
      expect(existsSync(join(PKG_DIR, target)), target).toBe(true)
    }
  })
})

describe('ESM consumer', () => {
  it('exposes the public exports', () => {
    const { ok, stdout, stderr } = runNode(
      `import('vue-smart-ui').then(m => console.log(JSON.stringify(Object.keys(m))))`,
      '--input-type=module',
    )

    expect(ok, stderr).toBe(true)
    expect(keysOf(stdout)).toEqual(EXPECTED_EXPORTS)
  })

  it('has a default export that is an installable plugin', () => {
    const { ok, stdout, stderr } = runNode(
      `import('vue-smart-ui').then(m => console.log(typeof m.default.install))`,
      '--input-type=module',
    )

    expect(ok, stderr).toBe(true)
    expect(stdout).toBe('function')
  })

  it('resolves the stylesheet through the `exports` map', () => {
    const { ok, stdout, stderr } = runNode(`console.log(require.resolve('vue-smart-ui/style.css'))`)

    expect(ok, stderr).toBe(true)
    expect(stdout.endsWith('vue-smart-ui.css')).toBe(true)
  })
})

describe('CommonJS consumer', () => {
  // The package is `"type": "module"`: a `.js` UMD bundle would be loaded as ESM and
  // `require('vue-smart-ui')` would return `{}`, hence the `.cjs` entry.
  it('exposes the public exports through require()', () => {
    const { ok, stdout, stderr } = runNode(
      `console.log(JSON.stringify(Object.keys(require('vue-smart-ui'))))`,
    )

    expect(ok, stderr).toBe(true)
    expect(keysOf(stdout)).toEqual(EXPECTED_EXPORTS)
  })

  it('has a default export that is an installable plugin', () => {
    const { ok, stdout, stderr } = runNode(
      `console.log(typeof require('vue-smart-ui').default.install)`,
    )

    expect(ok, stderr).toBe(true)
    expect(stdout).toBe('function')
  })
})

describe('UMD / CDN consumer', () => {
  // `.umd.js` is the name earlier releases shipped; CDN links and direct paths rely on it.
  it.each(['vue-smart-ui.umd.cjs', 'vue-smart-ui.umd.js'])(
    'exposes the public exports on the VueSmartUI global from %s when Vue is a global',
    (file) => {
      const { ok, stdout, stderr } = runNode(`
        const vm = require('node:vm')
        const fs = require('node:fs')
        const code = fs.readFileSync('node_modules/vue-smart-ui/dist/${file}', 'utf8')
        const sandbox = { Vue: require('vue') }
        vm.runInNewContext(code, sandbox)
        console.log(JSON.stringify(Object.keys(sandbox.VueSmartUI)))
      `)

      expect(ok, stderr).toBe(true)
      expect(keysOf(stdout)).toEqual(EXPECTED_EXPORTS)
    },
  )

  it('keeps the legacy .umd.js identical to the .cjs entry', () => {
    const read = (file: string) => readFileSync(join(DIST, file), 'utf8')

    expect(read('vue-smart-ui.umd.js')).toBe(read('vue-smart-ui.umd.cjs'))
  })

  it('does not leave the UMD stylesheet behind', () => {
    expect(existsSync(join(DIST, 'vue-smart-ui-umd.css'))).toBe(false)
  })
})

describe('type declarations', () => {
  const declarations = () => walk(DIST).filter((file) => file.endsWith('.d.ts'))

  it('does not reference the internal `@/` alias, which consumers cannot resolve', () => {
    const offenders = declarations().filter((file) =>
      /from ['"]@\//.test(readFileSync(file, 'utf8')),
    )

    expect(offenders).toEqual([])
  })

  it('only imports relative files that exist in the package', () => {
    const missing: string[] = []

    for (const file of declarations()) {
      const source = readFileSync(file, 'utf8')
      for (const [, specifier] of source.matchAll(/from ['"](\.[^'"]+)['"]/g)) {
        const base = resolve(dirname(file), specifier)
        const candidates = [base, `${base}.d.ts`, `${base}.ts`, join(base, 'index.d.ts')]
        if (!candidates.some((candidate) => existsSync(candidate))) {
          missing.push(`${file.replace(DIST, 'dist')} -> ${specifier}`)
        }
      }
    }

    expect(missing).toEqual([])
  })
})

describe('stylesheet contract', () => {
  const css = () => readFileSync(join(DIST, 'vue-smart-ui.css'), 'utf8')

  /** Custom properties and class names are public API: consumers theme and target them. */
  const collectContract = () => {
    const variables = new Set<string>()
    const classes = new Set<string>()

    for (const match of css().matchAll(/--vsui-[\w-]+/g)) variables.add(match[0])

    postcss.parse(css()).walkRules((rule) => {
      for (const match of rule.selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(match[1])
    })

    return {
      variables: [...variables].sort(),
      classes: [...classes].sort(),
    }
  }

  it('keeps the `--vsui-*` custom properties and class names consumers rely on', async () => {
    await expect(JSON.stringify(collectContract(), null, 2) + '\n').toMatchFileSnapshot(
      '../__snapshots__/css-contract.json',
    )
  })
})
