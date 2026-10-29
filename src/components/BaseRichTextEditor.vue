<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useAutoId } from '../composables/autoId'
import { useValidationConfig } from '../composables/validationConfig'
import { escapeHtml, htmlToText, sanitizeHtml, sanitizeUrl } from '../composables/sanitizeHtml'
import {
  execEditorCommand,
  findAncestorTag,
  firstFontFamily,
  getSelectionRangeWithin,
  normalizeBlockType,
  queryEditorState,
  queryEditorValue,
  restoreSelectionRange,
  toHexColor,
  type BlockType,
  type EditorCommand,
} from '../composables/richTextEditor'
import BaseButton from './BaseButton.vue'
import BaseDropdown from './BaseDropdown.vue'
import IconEditor from './icons/IconEditor.vue'

export type RichTextEditorVariant = 'default' | 'filled' | 'outlined'
export type RichTextEditorState = 'success' | 'error' | 'warning'

export interface RichTextEditorRuleObject {
  message?: string
  validator?: (value: string) => boolean
  required?: boolean
  [key: string]: unknown
}
export type RichTextEditorRule = string | RichTextEditorRuleObject

export type RichTextEditorToolbarItem =
  | 'undo'
  | 'redo'
  | 'blockType'
  | 'font'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'color'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'bulletList'
  | 'orderedList'
  | 'link'
  | 'separator'

export interface RichTextEditorFont {
  label: string
  /** CSS `font-family` value, e.g. `"Georgia, 'Times New Roman', serif"`. */
  value: string
}

export interface RichTextEditorLabels {
  editor: string
  toolbar: string
  undo: string
  redo: string
  bold: string
  italic: string
  underline: string
  strike: string
  textColor: string
  customColor: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  alignJustify: string
  bulletList: string
  orderedList: string
  link: string
  linkUrl: string
  applyLink: string
  removeLink: string
  textType: string
  paragraph: string
  heading1: string
  heading2: string
  heading3: string
  font: string
}

interface Props {
  id?: string
  modelValue?: string
  transparentBg?: boolean
  variant?: RichTextEditorVariant
  state?: RichTextEditorState | null
  label?: string | null
  placeholder?: string
  minHeight?: string | number
  maxHeight?: string | number | null
  disabled?: boolean
  block?: boolean
  readonly?: boolean
  required?: boolean
  helperText?: string | null
  errorMessage?: string | null
  rules?: RichTextEditorRule[]
  validateOnBlur?: boolean
  validateOnInput?: boolean
  name?: string
  toolbar?: RichTextEditorToolbarItem[]
  fonts?: RichTextEditorFont[]
  colors?: string[]
  labels?: Partial<RichTextEditorLabels>
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  modelValue: '',
  transparentBg: false,
  variant: 'default',
  state: null,
  label: null,
  placeholder: '',
  minHeight: '10rem',
  maxHeight: null,
  disabled: false,
  block: false,
  readonly: false,
  required: false,
  helperText: null,
  errorMessage: null,
  rules: () => [],
  validateOnBlur: true,
  validateOnInput: false,
  name: '',
  toolbar: () => [
    'undo',
    'redo',
    'separator',
    'blockType',
    'font',
    'separator',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'separator',
    'alignLeft',
    'alignCenter',
    'alignRight',
    'alignJustify',
    'separator',
    'bulletList',
    'orderedList',
    'link',
  ],
  fonts: () => [
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
    { label: 'Trebuchet MS', value: "'Trebuchet MS', Helvetica, sans-serif" },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
    { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  ],
  colors: () => [
    '#000000',
    '#595959',
    '#8c8c8c',
    '#d9d9d9',
    '#e03131',
    '#f76707',
    '#f59f00',
    '#2f9e44',
    '#0c8599',
    '#1971c2',
    '#7048e8',
    '#c2255c',
  ],
  labels: () => ({}),
})
const { autoId } = useAutoId('rich-text-editor', props)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
  validation: [payload: { valid: boolean; error: string; name?: string }]
  mounted: [handlers: { validate: () => boolean; focus: () => void }]
}>()

const DEFAULT_LABELS: RichTextEditorLabels = {
  editor: 'Rich text editor',
  toolbar: 'Formatting',
  undo: 'Undo',
  redo: 'Redo',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strike: 'Strikethrough',
  textColor: 'Text color',
  customColor: 'Custom color',
  alignLeft: 'Align left',
  alignCenter: 'Align center',
  alignRight: 'Align right',
  alignJustify: 'Justify',
  bulletList: 'Bulleted list',
  orderedList: 'Numbered list',
  link: 'Link',
  linkUrl: 'Link URL',
  applyLink: 'Apply',
  removeLink: 'Remove link',
  textType: 'Text type',
  paragraph: 'Paragraph',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  font: 'Font',
}

const text = computed<RichTextEditorLabels>(() => ({ ...DEFAULT_LABELS, ...props.labels }))

interface SimpleButton {
  command: EditorCommand
  icon: string
  label: keyof RichTextEditorLabels
  toggle: boolean
}

// Toolbar items that are a single button running one editing command.
const SIMPLE_BUTTONS: Partial<Record<RichTextEditorToolbarItem, SimpleButton>> = {
  undo: { command: 'undo', icon: 'undo', label: 'undo', toggle: false },
  redo: { command: 'redo', icon: 'redo', label: 'redo', toggle: false },
  bold: { command: 'bold', icon: 'bold', label: 'bold', toggle: true },
  italic: { command: 'italic', icon: 'italic', label: 'italic', toggle: true },
  underline: { command: 'underline', icon: 'underline', label: 'underline', toggle: true },
  strike: { command: 'strikeThrough', icon: 'strike', label: 'strike', toggle: true },
  alignLeft: { command: 'justifyLeft', icon: 'align-left', label: 'alignLeft', toggle: true },
  alignCenter: {
    command: 'justifyCenter',
    icon: 'align-center',
    label: 'alignCenter',
    toggle: true,
  },
  alignRight: { command: 'justifyRight', icon: 'align-right', label: 'alignRight', toggle: true },
  alignJustify: {
    command: 'justifyFull',
    icon: 'align-justify',
    label: 'alignJustify',
    toggle: true,
  },
  bulletList: {
    command: 'insertUnorderedList',
    icon: 'list-bullet',
    label: 'bulletList',
    toggle: true,
  },
  orderedList: {
    command: 'insertOrderedList',
    icon: 'list-ordered',
    label: 'orderedList',
    toggle: true,
  },
}

const BLOCK_OPTIONS: { type: BlockType; tag: string; label: keyof RichTextEditorLabels }[] = [
  { type: 'p', tag: '<p>', label: 'paragraph' },
  { type: 'h1', tag: '<h1>', label: 'heading1' },
  { type: 'h2', tag: '<h2>', label: 'heading2' },
  { type: 'h3', tag: '<h3>', label: 'heading3' },
]

const toolbarEntries = computed(() =>
  props.toolbar.map((item, index) => ({
    item,
    key: `${item}-${index}`,
    simple: SIMPLE_BUTTONS[item],
  })),
)

const editorRef = ref<HTMLDivElement | null>(null)
const rootRef = ref<HTMLDivElement | null>(null)
const isFocused = ref(false)
const isEmpty = ref(true)
const error = ref('')
// Once a value has been validated (e.g. on blur), later input is re-validated so a stale
// error clears as soon as the value is fixed. BaseTextarea behaves the same way.
const hasBeenValidated = ref(false)

const editable = computed(() => !props.disabled && !props.readonly)

// Last value this component emitted or applied; used to tell our own echo from an outside change.
let lastValue = ''
// Selection is lost when a toolbar popup takes focus, so the last one inside the editor is kept.
let savedRange: Range | null = null

const activeState = reactive<Record<string, boolean>>({})
const currentBlock = ref<BlockType>('p')
const currentFont = ref('')
const currentColor = ref('')

const openMenu = ref<string | null>(null)
const linkUrl = ref('')
const hasLink = ref(false)

const classes = computed(() => ({
  'vsui base-rich-text-editor': true,
  [`base-rich-text-editor--${props.variant}`]: true,
  [`base-rich-text-editor--${inputState.value}`]: inputState.value,
  'base-rich-text-editor--disabled': props.disabled,
  'base-rich-text-editor--readonly': props.readonly,
  'base-rich-text-editor--focused': isFocused.value,
  'base-rich-text-editor--block': props.block,
}))

const toCssSize = (value: string | number | null): string | undefined => {
  if (value === null || value === '') return undefined
  return typeof value === 'number' || /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value
}

const contentStyle = computed(() => ({
  minHeight: toCssSize(props.minHeight),
  maxHeight: toCssSize(props.maxHeight),
}))

type ValidatorResult = { valid: boolean; message: string }

const { getValidationMessage } = useValidationConfig()

// Rules measure the visible text, not the HTML: `<p><br></p>` is empty and tags do not count.
const validators: Record<string, (value: string, arg?: number) => ValidatorResult> = {
  required: (value) => ({
    valid: !!htmlToText(value).trim(),
    message: getValidationMessage('required'),
  }),
  min: (value, min) => ({
    valid: !htmlToText(value).trim() || htmlToText(value).length >= (min as number),
    message: getValidationMessage('min', min),
  }),
  max: (value, max) => ({
    valid: !htmlToText(value).trim() || htmlToText(value).length <= (max as number),
    message: getValidationMessage('max', max),
  }),
}

const validate = (value: string): boolean => {
  if (!props.rules.length) return true

  hasBeenValidated.value = true

  for (const rule of props.rules) {
    if (typeof rule === 'string') {
      const validator = validators[rule]
      if (validator) {
        const result = validator(value)
        if (!result.valid) {
          error.value = result.message
          return false
        }
      }
      continue
    }

    if (typeof rule === 'object') {
      // Every key is a rule ({ min: 3, max: 10 }), whatever its position; `message` and
      // `validator` are not, and `false` switches a rule off ({ required: false }).
      for (const [validatorName, config] of Object.entries(rule)) {
        if (validatorName === 'message' || validatorName === 'validator' || config === false)
          continue

        const validator = validators[validatorName]
        if (!validator) continue

        const result = validator(value, config as number)
        if (!result.valid) {
          error.value = rule.message || result.message
          return false
        }
      }

      // A custom validator receives the HTML value, exactly as emitted through v-model.
      if (typeof rule.validator === 'function') {
        const isValid = rule.validator(value)
        if (!isValid) {
          error.value = rule.message || 'Invalid value'
          return false
        }
      }
    }
  }

  error.value = ''
  return true
}

const validateField = (): boolean => {
  const isValid = validate(props.modelValue)
  emit('validation', { valid: isValid, error: error.value, name: props.name })
  return isValid
}

const isEditorEmpty = (): boolean => {
  const el = editorRef.value
  if (!el) return true
  return !(el.textContent ?? '').replace(/ /g, ' ').trim()
}

// Empty editors report '' (browsers leave `<p><br></p>` / `<br>` behind).
const readValue = (): string => {
  const el = editorRef.value
  if (!el || isEditorEmpty()) return ''
  return el.innerHTML
}

const setContent = (html: string) => {
  const el = editorRef.value
  if (!el) return

  el.innerHTML = sanitizeHtml(html)
  lastValue = html
  isEmpty.value = isEditorEmpty()
}

const commit = (event?: Event) => {
  const value = readValue()
  isEmpty.value = value === ''

  if (value !== lastValue) {
    lastValue = value
    emit('update:modelValue', value)
  }
  if (event) emit('input', event)

  if (props.validateOnInput || hasBeenValidated.value) {
    const isValid = validate(value)
    emit('validation', { valid: isValid, error: error.value, name: props.name })
  }
}

const refreshToolbarState = () => {
  for (const [item, config] of Object.entries(SIMPLE_BUTTONS)) {
    if (config?.toggle) activeState[item] = queryEditorState(config.command)
  }

  currentBlock.value = normalizeBlockType(queryEditorValue('formatBlock'))
  currentFont.value = firstFontFamily(queryEditorValue('fontName'))
  currentColor.value = queryEditorValue('foreColor')
}

const handleSelectionChange = () => {
  const el = editorRef.value
  if (!el) return

  const range = getSelectionRangeWithin(el)
  if (!range) return

  savedRange = range
  refreshToolbarState()
}

// Runs an editing command on the saved selection, even when a popup had taken the focus.
const withEditorSelection = (action: () => void) => {
  const el = editorRef.value
  if (!el || !editable.value) return

  if (document.activeElement !== el) {
    el.focus({ preventScroll: true })
    restoreSelectionRange(savedRange)
  }

  action()
  commit()
  refreshToolbarState()
}

const runCommand = (command: EditorCommand, value?: string) => {
  withEditorSelection(() => {
    execEditorCommand(command, value)
  })
}

const applyBlock = (tag: string) => runCommand('formatBlock', tag)
const applyFont = (font: string) => runCommand('fontName', font)
const applyColor = (color: string) => runCommand('foreColor', color)

const handleColorPicked = (event: Event) => {
  applyColor((event.target as HTMLInputElement).value)
  openMenu.value = null
}

const setMenu = (name: string, open: boolean) => {
  if (open) {
    const el = editorRef.value
    savedRange = (el && getSelectionRangeWithin(el)) || savedRange

    if (name === 'link') {
      const anchor = el && savedRange && findAncestorTag(savedRange.startContainer, el, 'a')
      linkUrl.value = anchor?.getAttribute('href') ?? ''
      hasLink.value = !!anchor
    }
    openMenu.value = name
  } else if (openMenu.value === name) {
    openMenu.value = null
  }
}

const applyLink = () => {
  const url = sanitizeUrl(linkUrl.value)
  if (!url) return

  withEditorSelection(() => {
    if (window.getSelection()?.isCollapsed) {
      execEditorCommand('insertHTML', `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`)
    } else {
      execEditorCommand('createLink', url)
    }
  })
  openMenu.value = null
}

const removeLink = () => {
  runCommand('unlink')
  openMenu.value = null
}

// Pasted markup is sanitized; plain text keeps its line breaks. Dropping content into the editor
// is blocked (see template) because it would bypass this.
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  if (!editable.value) return

  const html = event.clipboardData?.getData('text/html')
  const plain = event.clipboardData?.getData('text/plain') ?? ''

  if (html) {
    const clean = sanitizeHtml(html)
    if (clean) execEditorCommand('insertHTML', clean)
  } else if (plain) {
    execEditorCommand('insertHTML', escapeHtml(plain).replace(/\r?\n/g, '<br>'))
  }
  commit()
}

const handleInput = (event: Event) => commit(event)

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  // Enter creates a `<p>` instead of a `<div>` (the browser default in Chrome).
  execEditorCommand('defaultParagraphSeparator', 'p')
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  // Moving to the toolbar or one of its popups (teleported to body) is not leaving the field.
  const next = event.relatedTarget as HTMLElement | null
  if (next && (rootRef.value?.contains(next) || next.closest?.('[data-vsui-floating]'))) return

  isFocused.value = false
  emit('blur', event)

  if (props.validateOnBlur) {
    const isValid = validate(readValue())
    emit('validation', { valid: isValid, error: error.value, name: props.name })
  }
}

const focus = () => {
  editorRef.value?.focus()
}

const inputState = computed(() => {
  if (error.value) return 'error'
  return props.state
})

const displayMessage = computed(() => {
  if (error.value) return error.value
  return props.errorMessage || props.helperText
})

const isRequired = computed(() => {
  if (props.required) return true
  return props.rules.some(
    (rule) => rule === 'required' || (typeof rule === 'object' && rule.required),
  )
})

const blockLabel = computed(() => {
  const option = BLOCK_OPTIONS.find((candidate) => candidate.type === currentBlock.value)
  return text.value[option?.label ?? 'textType']
})

const fontLabel = computed(
  () =>
    props.fonts.find((font) => firstFontFamily(font.value) === currentFont.value)?.label ??
    text.value.font,
)

const colorInputValue = computed(() => toHexColor(currentColor.value))

// A programmatic change (async load, form reset) does not fire `input`, so follow the model.
// An echo of what we just emitted is skipped: rewriting the DOM would drop the caret and undo stack.
watch(
  () => props.modelValue,
  (value) => {
    if ((value ?? '') !== lastValue) setContent(value ?? '')
  },
)

onMounted(() => {
  setContent(props.modelValue ?? '')
  document.addEventListener('selectionchange', handleSelectionChange)

  emit('mounted', {
    validate: validateField,
    focus,
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', handleSelectionChange)
})

// Also reachable through a template ref (`editorRef.value.focus()`), not only the `mounted` payload.
defineExpose({ focus, validate: validateField })
</script>

<template>
  <div ref="rootRef" :class="classes">
    <label v-if="label" :id="`${autoId}-label`" class="base-rich-text-editor__label">
      {{ label }}
      <span v-if="isRequired" class="base-rich-text-editor__required" aria-hidden="true">*</span>
    </label>

    <div
      class="base-rich-text-editor__wrapper"
      :class="{ 'base-rich-text-editor__wrapper--transparent': transparentBg }"
    >
      <div
        v-if="toolbar.length"
        class="base-rich-text-editor__toolbar"
        role="toolbar"
        :aria-label="text.toolbar"
      >
        <template v-for="entry in toolbarEntries" :key="entry.key">
          <span
            v-if="entry.item === 'separator'"
            class="base-rich-text-editor__separator"
            role="separator"
            aria-orientation="vertical"
          />

          <BaseButton
            v-else-if="entry.simple"
            variant="ghost"
            size="small"
            icon-only
            class="base-rich-text-editor__btn"
            :class="{ 'base-rich-text-editor__btn--active': activeState[entry.item] }"
            :disabled="!editable"
            :title="text[entry.simple.label]"
            :aria-label="text[entry.simple.label]"
            :aria-pressed="entry.simple.toggle ? !!activeState[entry.item] : undefined"
            @mousedown.prevent
            @click="runCommand(entry.simple.command)"
          >
            <IconEditor :name="entry.simple.icon" />
          </BaseButton>

          <BaseDropdown
            v-else-if="entry.item === 'blockType'"
            :model-value="openMenu === 'blockType'"
            @update:model-value="setMenu('blockType', $event)"
          >
            <template #trigger>
              <button
                type="button"
                class="base-rich-text-editor__select"
                :disabled="!editable"
                :title="text.textType"
                :aria-label="text.textType"
                aria-haspopup="menu"
                :aria-expanded="openMenu === 'blockType'"
                @mousedown.prevent
              >
                <span class="base-rich-text-editor__select-label">{{ blockLabel }}</span>
                <IconEditor name="chevron-down" />
              </button>
            </template>

            <div class="base-rich-text-editor__menu" role="menu">
              <button
                v-for="option in BLOCK_OPTIONS"
                :key="option.type"
                type="button"
                role="menuitemradio"
                :aria-checked="currentBlock === option.type"
                class="base-dropdown-item base-rich-text-editor__option"
                :class="[
                  `base-rich-text-editor__option--${option.type}`,
                  { 'base-rich-text-editor__option--active': currentBlock === option.type },
                ]"
                @mousedown.prevent
                @click="applyBlock(option.tag)"
              >
                {{ text[option.label] }}
              </button>
            </div>
          </BaseDropdown>

          <BaseDropdown
            v-else-if="entry.item === 'font'"
            :model-value="openMenu === 'font'"
            @update:model-value="setMenu('font', $event)"
          >
            <template #trigger>
              <button
                type="button"
                class="base-rich-text-editor__select"
                :disabled="!editable"
                :title="text.font"
                :aria-label="text.font"
                aria-haspopup="menu"
                :aria-expanded="openMenu === 'font'"
                @mousedown.prevent
              >
                <span class="base-rich-text-editor__select-label">{{ fontLabel }}</span>
                <IconEditor name="chevron-down" />
              </button>
            </template>

            <div class="base-rich-text-editor__menu" role="menu">
              <button
                v-for="font in fonts"
                :key="font.value"
                type="button"
                role="menuitemradio"
                :aria-checked="firstFontFamily(font.value) === currentFont"
                class="base-dropdown-item base-rich-text-editor__option"
                :class="{
                  'base-rich-text-editor__option--active':
                    firstFontFamily(font.value) === currentFont,
                }"
                :style="{ fontFamily: font.value }"
                @mousedown.prevent
                @click="applyFont(font.value)"
              >
                {{ font.label }}
              </button>
            </div>
          </BaseDropdown>

          <BaseDropdown
            v-else-if="entry.item === 'color'"
            :model-value="openMenu === 'color'"
            @update:model-value="setMenu('color', $event)"
          >
            <template #trigger>
              <BaseButton
                variant="ghost"
                size="small"
                icon-only
                class="base-rich-text-editor__btn"
                :disabled="!editable"
                :title="text.textColor"
                :aria-label="text.textColor"
                aria-haspopup="menu"
                :aria-expanded="openMenu === 'color'"
                @mousedown.prevent
              >
                <span class="base-rich-text-editor__color-glyph" aria-hidden="true">
                  A
                  <span
                    class="base-rich-text-editor__color-bar"
                    :style="{ backgroundColor: currentColor || 'currentColor' }"
                  />
                </span>
              </BaseButton>
            </template>

            <div class="base-rich-text-editor__menu base-rich-text-editor__menu--color">
              <div class="base-rich-text-editor__swatches">
                <button
                  v-for="color in colors"
                  :key="color"
                  type="button"
                  class="base-rich-text-editor__swatch"
                  :style="{ backgroundColor: color }"
                  :title="color"
                  :aria-label="color"
                  @mousedown.prevent
                  @click="applyColor(color)"
                />
              </div>
              <label class="base-rich-text-editor__custom-color" data-prevent-close>
                <span>{{ text.customColor }}</span>
                <input type="color" :value="colorInputValue" @change="handleColorPicked" />
              </label>
            </div>
          </BaseDropdown>

          <BaseDropdown
            v-else-if="entry.item === 'link'"
            :model-value="openMenu === 'link'"
            @update:model-value="setMenu('link', $event)"
          >
            <template #trigger>
              <BaseButton
                variant="ghost"
                size="small"
                icon-only
                class="base-rich-text-editor__btn"
                :disabled="!editable"
                :title="text.link"
                :aria-label="text.link"
                aria-haspopup="dialog"
                :aria-expanded="openMenu === 'link'"
                @mousedown.prevent
              >
                <IconEditor name="link" />
              </BaseButton>
            </template>

            <div class="base-rich-text-editor__menu base-rich-text-editor__menu--link" data-prevent-close>
              <input
                v-model="linkUrl"
                type="text"
                class="base-rich-text-editor__link-input"
                placeholder="https://"
                :aria-label="text.linkUrl"
                @keydown.enter.prevent="applyLink"
              />
              <div class="base-rich-text-editor__link-actions">
                <button
                  v-if="hasLink"
                  type="button"
                  class="base-rich-text-editor__link-btn"
                  @click="removeLink"
                >
                  {{ text.removeLink }}
                </button>
                <button
                  type="button"
                  class="base-rich-text-editor__link-btn base-rich-text-editor__link-btn--primary"
                  :disabled="!linkUrl.trim()"
                  @click="applyLink"
                >
                  {{ text.applyLink }}
                </button>
              </div>
            </div>
          </BaseDropdown>
        </template>
      </div>

      <div
        :id="autoId"
        ref="editorRef"
        class="base-rich-text-editor__content"
        :class="{ 'base-rich-text-editor__content--empty': isEmpty }"
        :style="contentStyle"
        :contenteditable="editable ? 'true' : 'false'"
        role="textbox"
        aria-multiline="true"
        :aria-label="label ? undefined : text.editor"
        :aria-labelledby="label ? `${autoId}-label` : undefined"
        :aria-required="isRequired"
        :aria-readonly="readonly || undefined"
        :aria-disabled="disabled || undefined"
        :aria-invalid="error ? true : undefined"
        :data-placeholder="placeholder || undefined"
        spellcheck="true"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @paste="handlePaste"
        @drop.prevent
      />
    </div>

    <input v-if="name" type="hidden" :name="name" :value="modelValue" />

    <div
      v-if="displayMessage"
      class="base-rich-text-editor__helper"
      :class="{ 'base-rich-text-editor__helper--error': error }"
    >
      {{ displayMessage }}
    </div>
  </div>
</template>

<style lang="scss">
.base-rich-text-editor {
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 20rem;

  &__label {
    font-size: var(--vsui-rte-label-font-size, 0.875rem);
    font-weight: 500;
    color: var(--vsui-rte-label-color, #374151);
  }

  &__required {
    color: var(--vsui-rte-required-color, #ef4444);
    margin-left: 0.25rem;
  }

  &__wrapper {
    position: relative;
    width: 100%;
    border-radius: var(--vsui-rte-border-radius, 0.375rem);
    border: 1px solid var(--vsui-rte-border-color, #d1d5db);
    background-color: var(--vsui-rte-bg, white);
    transition: all 0.2s;
  }

  &__wrapper--transparent {
    background-color: transparent;
  }

  // Toolbar
  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.125rem;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid var(--vsui-rte-toolbar-border-color, #e5e7eb);
    background-color: var(--vsui-rte-toolbar-bg, transparent);
    border-radius: var(--vsui-rte-border-radius, 0.375rem) var(--vsui-rte-border-radius, 0.375rem)
      0 0;
  }

  &__separator {
    width: 1px;
    height: 1.25rem;
    margin: 0 0.25rem;
    background-color: var(--vsui-rte-toolbar-border-color, #e5e7eb);
  }

  &__btn {
    padding: 0.25rem;
    min-width: 1.75rem;
    min-height: 1.75rem;
    color: var(--vsui-rte-button-color, #374151);

    &--active,
    &--active:hover:not(:disabled) {
      background-color: var(--vsui-rte-button-active-bg, #e5e7eb);
      color: var(--vsui-rte-button-active-color, #111827);
    }
  }

  &__select {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    min-width: 6.5rem;
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.375rem;
    background-color: transparent;
    color: var(--vsui-rte-button-color, #374151);
    font-family: inherit;
    font-size: 0.8125rem;
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: var(--vsui-rte-button-active-bg, #e5e7eb);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__select-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__color-glyph {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.9375rem;
    font-weight: 700;
    line-height: 1;
  }

  &__color-bar {
    display: block;
    width: 1rem;
    height: 3px;
    margin-top: 2px;
    border-radius: 1px;
  }

  // Popups (teleported to body, which is why these are not nested under the root block)
  &__menu {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.25rem;
    min-width: 10rem;

    &--color {
      min-width: 11rem;
      padding: 0.5rem;
    }

    &--link {
      min-width: 16rem;
      padding: 0.5rem;
    }
  }

  &__option {
    width: 100%;
    border: none;
    border-radius: 0.25rem;
    background-color: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    white-space: nowrap;

    &--h1 {
      font-size: 1.25rem;
      font-weight: 700;
    }

    &--h2 {
      font-size: 1.125rem;
      font-weight: 700;
    }

    &--h3 {
      font-size: 1rem;
      font-weight: 600;
    }

    &--active {
      background-color: var(--vsui-rte-option-active-bg, #eff6ff);
      color: var(--vsui-rte-option-active-color, #2563eb);
    }
  }

  &__swatches {
    display: grid;
    grid-template-columns: repeat(6, 1.5rem);
    gap: 0.25rem;
  }

  &__swatch {
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    border: 1px solid var(--vsui-rte-swatch-border-color, rgba(0, 0, 0, 0.15));
    border-radius: 0.25rem;
    cursor: pointer;

    &:hover {
      transform: scale(1.1);
    }
  }

  &__custom-color {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.8125rem;
    cursor: pointer;

    input {
      width: 2rem;
      height: 1.5rem;
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
    }
  }

  &__link-input {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--vsui-rte-border-color, #d1d5db);
    border-radius: 0.375rem;
    background-color: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.875rem;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: var(--vsui-rte-focus-border-color, #3b82f6);
    }
  }

  &__link-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  &__link-btn {
    padding: 0.25rem 0.625rem;
    border: 1px solid var(--vsui-rte-border-color, #d1d5db);
    border-radius: 0.375rem;
    background-color: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;

    &--primary {
      border-color: var(--vsui-rte-focus-border-color, #3b82f6);
      background-color: var(--vsui-rte-focus-border-color, #3b82f6);
      color: #ffffff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  // Editing area
  &__content {
    padding: var(--vsui-rte-padding, 0.625rem 0.75rem);
    overflow-y: auto;
    font-size: var(--vsui-rte-font-size, 0.875rem);
    line-height: var(--vsui-rte-line-height, 1.5);
    color: var(--vsui-rte-text-color, #111827);
    font-family: var(--vsui-font-family-base, inherit);
    box-sizing: border-box;
    word-break: break-word;

    &:focus {
      outline: none;
    }

    &--empty::before {
      content: attr(data-placeholder);
      float: left;
      height: 0;
      color: var(--vsui-rte-placeholder-color, #9ca3af);
      pointer-events: none;
    }

    p,
    ul,
    ol,
    blockquote,
    h1,
    h2,
    h3 {
      margin: 0 0 0.75em;
    }

    > :last-child {
      margin-bottom: 0;
    }

    h1 {
      font-size: 1.75em;
      font-weight: 700;
      line-height: 1.25;
    }

    h2 {
      font-size: 1.5em;
      font-weight: 700;
      line-height: 1.3;
    }

    h3 {
      font-size: 1.25em;
      font-weight: 600;
      line-height: 1.35;
    }

    ul,
    ol {
      padding-left: 1.5em;
    }

    ul {
      list-style: disc;
    }

    ol {
      list-style: decimal;
    }

    blockquote {
      padding-left: 0.75em;
      border-left: 3px solid var(--vsui-rte-border-color, #d1d5db);
    }

    a {
      color: var(--vsui-rte-link-color, #2563eb);
      text-decoration: underline;
    }
  }

  &__helper {
    font-size: var(--vsui-rte-helper-font-size, 0.75rem);
    color: var(--vsui-rte-helper-color, #6b7280);
  }

  &--success {
    .base-rich-text-editor__wrapper {
      border-color: var(--vsui-rte-success-color, #22c55e) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--vsui-rte-success-ring-color, rgba(34, 197, 94, 0.1));
      }
    }
    .base-rich-text-editor__helper {
      color: var(--vsui-rte-success-color, #22c55e);
    }
  }

  &--error {
    .base-rich-text-editor__wrapper {
      border-color: var(--vsui-rte-error-color, #ef4444) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--vsui-rte-error-ring-color, rgba(239, 68, 68, 0.1));
      }
    }
    .base-rich-text-editor__helper {
      color: var(--vsui-rte-error-color, #ef4444);
    }
  }

  &--warning {
    .base-rich-text-editor__wrapper {
      border-color: var(--vsui-rte-warning-color, #f59e0b) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--vsui-rte-warning-ring-color, rgba(245, 158, 11, 0.1));
      }
    }
    .base-rich-text-editor__helper {
      color: var(--vsui-rte-warning-color, #f59e0b);
    }
  }

  &__wrapper:focus-within {
    border-color: var(--vsui-rte-focus-border-color, #3b82f6);
    box-shadow: 0 0 0 3px var(--vsui-rte-focus-ring-color, rgba(59, 130, 246, 0.1));
  }

  &--filled {
    .base-rich-text-editor__wrapper {
      background-color: var(--vsui-rte-filled-bg, #f3f4f6);
      border-color: transparent;

      &:hover {
        background-color: var(--vsui-rte-filled-hover-bg, #e5e7eb);
      }

      &:focus-within {
        background-color: var(--vsui-rte-filled-focus-bg, #f9fafb);
      }
    }
  }

  &--outlined &__wrapper {
    border-width: var(--vsui-rte-outlined-border-width, 2px);
  }

  &--disabled {
    opacity: var(--vsui-rte-disabled-opacity, 0.6);
    cursor: not-allowed;

    .base-rich-text-editor__content {
      cursor: not-allowed;
    }
  }

  &--block {
    display: flex;
    width: 100%;
  }
}
</style>
