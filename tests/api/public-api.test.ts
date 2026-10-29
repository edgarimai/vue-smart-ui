import { describe, expect, it } from 'vitest'
import * as library from '../../src'

/**
 * Snapshot of the public contract consumers depend on: what is exported, and for each
 * component its props (type, required, default) and emits. A failing snapshot means the
 * public API changed; confirm it is intentional (and a suitable semver bump) before
 * updating it with `npm test -- -u`.
 *
 * Slots and exposed methods cannot be read at runtime from `<script setup>` components,
 * so they are covered by component tests instead.
 */

interface PropDefinition {
  type?: unknown
  required?: boolean
  default?: unknown
}

/** The runtime options Vue compiles from `defineProps` / `defineEmits`. */
interface ComponentOptions {
  props?: Record<string, unknown> | string[]
  emits?: Record<string, unknown> | string[]
}

const typeName = (type: unknown): string => {
  if (type === null || type === undefined) return 'any'
  if (Array.isArray(type)) return type.map(typeName).join(' | ')
  return typeof type === 'function' ? type.name : String(type)
}

const describeDefault = (definition: PropDefinition, type: string): unknown => {
  if (!('default' in definition)) return '[none]'

  const value = definition.default
  if (typeof value !== 'function') return value === undefined ? '[undefined]' : value
  if (type.includes('Function')) return '[function]'

  // Object/Array defaults are factories.
  try {
    return (value as () => unknown)()
  } catch {
    return '[factory]'
  }
}

const describeProps = (props: ComponentOptions['props']) => {
  // Array-style props (`['a', 'b']`) carry no type information.
  const entries = Object.entries(Array.isArray(props) ? {} : (props ?? {}))

  return Object.fromEntries(
    entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, raw]) => {
        const definition: PropDefinition =
          raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : { type: raw }
        const type = typeName(definition.type)

        return [
          name,
          {
            type,
            required: definition.required === true,
            default: describeDefault(definition, type),
          },
        ]
      }),
  )
}

const describeEmits = (emits: ComponentOptions['emits']): string[] => {
  if (!emits) return []
  return (Array.isArray(emits) ? emits : Object.keys(emits)).map(String).sort()
}

const isComponent = (name: string) => name.startsWith('Base') || name === 'ToastsContainer'

describe('public API', () => {
  it('matches the recorded contract', async () => {
    const components = Object.fromEntries(
      Object.entries(library)
        .filter(([name]) => isComponent(name))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, component]) => {
          const definition = component as ComponentOptions
          return [
            name,
            { props: describeProps(definition.props), emits: describeEmits(definition.emits) },
          ]
        }),
    )

    const contract = {
      exports: Object.keys(library).sort(),
      composables: {
        useToast: Object.keys(library.useToast()).sort(),
        useToastConfig: Object.keys(library.useToastConfig()).sort(),
        useValidationConfig: Object.keys(library.useValidationConfig()).sort(),
      },
      toastDefaults: library.useToastConfig().getToastDefaults(),
      validationMessageKeys: Object.keys(
        library.useValidationConfig().validationConfig.messages,
      ).sort(),
      components,
    }

    await expect(JSON.stringify(contract, null, 2) + '\n').toMatchFileSnapshot(
      '../__snapshots__/public-api.json',
    )
  })

  it('exports every component, so the snapshot covers all of them', () => {
    const covered = Object.keys(library).filter(isComponent)

    expect(covered).toHaveLength(21)
  })
})
