import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { BaseRichTextEditor, useValidationConfig } from '../../src'

type EditorProps = InstanceType<typeof BaseRichTextEditor>['$props']

interface ValidationPayload {
  valid: boolean
  error: string
  name?: string
}

interface MountedPayload {
  validate: () => boolean
  focus: () => void
}

const mountEditor = (props: EditorProps = {}) =>
  mount(BaseRichTextEditor, { props, attachTo: document.body })

type EditorWrapper = ReturnType<typeof mountEditor>

const emittedArgs = (wrapper: EditorWrapper, name: string): unknown[][] =>
  wrapper.emitted(name) ?? []

const modelUpdates = (wrapper: EditorWrapper): unknown[] =>
  emittedArgs(wrapper, 'update:modelValue').map((args) => args[0])

const validations = (wrapper: EditorWrapper): ValidationPayload[] =>
  emittedArgs(wrapper, 'validation').map((args) => args[0] as ValidationPayload)

const lastValidation = (wrapper: EditorWrapper): ValidationPayload | undefined =>
  validations(wrapper).at(-1)

const mountedApi = (wrapper: EditorWrapper): MountedPayload =>
  emittedArgs(wrapper, 'mounted')[0][0] as MountedPayload

const content = (wrapper: EditorWrapper): HTMLElement =>
  wrapper.get('.base-rich-text-editor__content').element as HTMLElement

// jsdom has no `input` event for contenteditable, so a test edits the DOM and fires it itself.
const typeInto = async (wrapper: EditorWrapper, html: string) => {
  content(wrapper).innerHTML = html
  await wrapper.get('.base-rich-text-editor__content').trigger('input')
}

const blur = (wrapper: EditorWrapper) => wrapper.get('.base-rich-text-editor__content').trigger('blur')

const button = (wrapper: EditorWrapper, label: string) =>
  wrapper.get(`button[aria-label="${label}"]`)

const firePaste = (target: HTMLElement, data: Record<string, string>) => {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: (type: string) => data[type] ?? '' },
  })
  target.dispatchEvent(event)
  return event
}

// jsdom does not implement the editing API, so it is replaced with a spy.
const execCommand = vi.fn<(command: string, showUi?: boolean, value?: string) => boolean>(
  () => true,
)
const queryCommandState = vi.fn<(command: string) => boolean>(() => false)
const queryCommandValue = vi.fn<(command: string) => string>(() => '')

const execCalls = (command: string): unknown[][] =>
  execCommand.mock.calls.filter(([name]) => name === command)

enableAutoUnmount(afterEach)

const { setValidationMessages, resetValidationMessages } = useValidationConfig()

beforeEach(() => {
  execCommand.mockClear()
  queryCommandState.mockClear()
  queryCommandValue.mockClear()
  Object.assign(document, { execCommand, queryCommandState, queryCommandValue })
})

afterEach(() => {
  resetValidationMessages()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('BaseRichTextEditor rendering', () => {
  it('renders an editable textbox with the base classes and the default props', () => {
    const wrapper = mountEditor()

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['vsui', 'base-rich-text-editor', 'base-rich-text-editor--default']),
    )
    const editor = wrapper.get('[role="textbox"]')
    expect(editor.attributes('contenteditable')).toBe('true')
    expect(editor.attributes('aria-multiline')).toBe('true')
    expect(editor.attributes('aria-label')).toBe('Rich text editor')
  })

  it('shows the label, links it to the textbox and marks required fields', () => {
    const wrapper = mountEditor({ label: 'Notes', required: true })

    const label = wrapper.get('.base-rich-text-editor__label')
    expect(label.text()).toContain('Notes')
    expect(wrapper.find('.base-rich-text-editor__required').exists()).toBe(true)

    const editor = wrapper.get('[role="textbox"]')
    expect(editor.attributes('aria-labelledby')).toBe(label.attributes('id'))
    expect(editor.attributes('aria-label')).toBeUndefined()
    expect(editor.attributes('aria-required')).toBe('true')
  })

  it.each(['filled', 'outlined'] as const)('applies the %s variant class', (variant) => {
    expect(mountEditor({ variant }).classes()).toContain(`base-rich-text-editor--${variant}`)
  })

  it('applies the block, state and transparent classes', () => {
    const wrapper = mountEditor({ block: true, state: 'warning', transparentBg: true })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['base-rich-text-editor--block', 'base-rich-text-editor--warning']),
    )
    expect(wrapper.find('.base-rich-text-editor__wrapper--transparent').exists()).toBe(true)
  })

  it('shows the placeholder only while empty', async () => {
    const wrapper = mountEditor({ placeholder: 'Write here' })
    const editor = wrapper.get('.base-rich-text-editor__content')

    expect(editor.attributes('data-placeholder')).toBe('Write here')
    expect(editor.classes()).toContain('base-rich-text-editor__content--empty')

    await typeInto(wrapper, '<p>text</p>')
    expect(editor.classes()).not.toContain('base-rich-text-editor__content--empty')
  })

  it('sizes the editing area from minHeight and maxHeight', () => {
    const wrapper = mountEditor({ minHeight: 200, maxHeight: '20rem' })

    const style = wrapper.get('.base-rich-text-editor__content').attributes('style')
    expect(style).toContain('min-height: 200px')
    expect(style).toContain('max-height: 20rem')
  })

  it('shows helper text and prefers errorMessage over it', () => {
    expect(mountEditor({ helperText: 'Help' }).get('.base-rich-text-editor__helper').text()).toBe(
      'Help',
    )
    expect(
      mountEditor({ helperText: 'Help', errorMessage: 'Nope' })
        .get('.base-rich-text-editor__helper')
        .text(),
    ).toBe('Nope')
  })

  it('renders a hidden input with the value when a name is given', () => {
    const wrapper = mountEditor({ name: 'body', modelValue: '<p>x</p>' })

    const hidden = wrapper.get('input[type="hidden"]')
    expect(hidden.attributes('name')).toBe('body')
    expect((hidden.element as HTMLInputElement).value).toBe('<p>x</p>')
  })

  it('makes the content read-only and disables the toolbar when disabled or readonly', () => {
    for (const props of [{ disabled: true }, { readonly: true }]) {
      const wrapper = mountEditor(props)

      expect(wrapper.get('[role="textbox"]').attributes('contenteditable')).toBe('false')
      expect(button(wrapper, 'Bold').attributes('disabled')).toBeDefined()
    }
  })
})

describe('BaseRichTextEditor toolbar', () => {
  it('renders the default toolbar items', () => {
    const wrapper = mountEditor()

    for (const label of [
      'Undo',
      'Redo',
      'Text type',
      'Font',
      'Bold',
      'Italic',
      'Underline',
      'Strikethrough',
      'Text color',
      'Align left',
      'Align center',
      'Align right',
      'Justify',
      'Bulleted list',
      'Numbered list',
      'Link',
    ]) {
      expect(wrapper.find(`[aria-label="${label}"]`).exists(), label).toBe(true)
    }
    expect(wrapper.get('[role="toolbar"]').attributes('aria-label')).toBe('Formatting')
  })

  it('renders only the requested toolbar items, with separators', () => {
    const wrapper = mountEditor({ toolbar: ['bold', 'separator', 'italic'] })

    expect(wrapper.findAll('button')).toHaveLength(2)
    expect(wrapper.findAll('[role="separator"]')).toHaveLength(1)
  })

  it('renders no toolbar when the list is empty', () => {
    expect(mountEditor({ toolbar: [] }).find('[role="toolbar"]').exists()).toBe(false)
  })

  it('lets the labels be translated', () => {
    const wrapper = mountEditor({ labels: { bold: 'Negrito', textType: 'Tipo de texto' } })

    expect(wrapper.find('button[aria-label="Negrito"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Tipo de texto"]').exists()).toBe(true)
  })

  it.each([
    ['Bold', 'bold'],
    ['Italic', 'italic'],
    ['Underline', 'underline'],
    ['Strikethrough', 'strikeThrough'],
    ['Align left', 'justifyLeft'],
    ['Align center', 'justifyCenter'],
    ['Align right', 'justifyRight'],
    ['Justify', 'justifyFull'],
    ['Bulleted list', 'insertUnorderedList'],
    ['Numbered list', 'insertOrderedList'],
    ['Undo', 'undo'],
    ['Redo', 'redo'],
  ])('the "%s" button runs the %s command', async (label, command) => {
    const wrapper = mountEditor()

    await button(wrapper, label).trigger('click')

    expect(execCalls(command)).toHaveLength(1)
  })

  it('keeps the editor selection by cancelling mousedown on the buttons', () => {
    const wrapper = mountEditor()
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })

    button(wrapper, 'Bold').element.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('emits the new value after a command changes the content', async () => {
    const wrapper = mountEditor()
    execCommand.mockImplementationOnce(() => {
      content(wrapper).innerHTML = '<p><strong>x</strong></p>'
      return true
    })

    await button(wrapper, 'Bold').trigger('click')

    expect(modelUpdates(wrapper)).toEqual(['<p><strong>x</strong></p>'])
  })

  it('reflects the active formatting with aria-pressed', async () => {
    queryCommandState.mockImplementation((command) => command === 'bold')
    const wrapper = mountEditor()
    const editor = content(wrapper)

    editor.focus()
    const range = document.createRange()
    range.selectNodeContents(editor)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
    await nextTick()

    expect(button(wrapper, 'Bold').attributes('aria-pressed')).toBe('true')
    expect(button(wrapper, 'Italic').attributes('aria-pressed')).toBe('false')
    expect(button(wrapper, 'Undo').attributes('aria-pressed')).toBeUndefined()
  })

  it('applies a text type from the dropdown', async () => {
    // Dropdown menus are teleported to body and stay mounted, so only one is rendered here.
    const wrapper = mountEditor({ toolbar: ['blockType'] })

    await button(wrapper, 'Text type').trigger('click')
    const options = [...document.querySelectorAll<HTMLElement>('.base-rich-text-editor__option')]
    expect(options.map((option) => option.textContent?.trim())).toEqual([
      'Paragraph',
      'Heading 1',
      'Heading 2',
      'Heading 3',
    ])

    options[1].click()
    await nextTick()

    expect(execCalls('formatBlock')).toEqual([['formatBlock', false, '<h1>']])
  })

  it('shows the current text type in the dropdown trigger', async () => {
    queryCommandValue.mockImplementation((command) => (command === 'formatBlock' ? 'h2' : ''))
    const wrapper = mountEditor()
    const editor = content(wrapper)

    editor.focus()
    const range = document.createRange()
    range.selectNodeContents(editor)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
    await nextTick()

    expect(button(wrapper, 'Text type').text()).toBe('Heading 2')
  })

  it('applies a font from the dropdown', async () => {
    const wrapper = mountEditor({
      toolbar: ['font'],
      fonts: [{ label: 'Georgia', value: 'Georgia, serif' }],
    })

    await button(wrapper, 'Font').trigger('click')
    document.querySelector<HTMLElement>('.base-rich-text-editor__option')?.click()
    await nextTick()

    expect(execCalls('fontName')).toEqual([['fontName', false, 'Georgia, serif']])
  })

  it('applies a preset text color', async () => {
    const wrapper = mountEditor({ colors: ['#ff0000'] })

    await button(wrapper, 'Text color').trigger('click')
    document.querySelector<HTMLElement>('.base-rich-text-editor__swatch')?.click()
    await nextTick()

    expect(execCalls('foreColor')).toEqual([['foreColor', false, '#ff0000']])
  })

  it('applies a link to the selection, normalizing the URL', async () => {
    const wrapper = mountEditor()
    const editor = content(wrapper)
    editor.innerHTML = '<p>text</p>'
    const range = document.createRange()
    range.selectNodeContents(editor.firstElementChild as Node)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)

    await button(wrapper, 'Link').trigger('click')
    const input = document.querySelector<HTMLInputElement>('.base-rich-text-editor__link-input')
    input!.value = 'example.com'
    input!.dispatchEvent(new Event('input'))
    await nextTick()
    document
      .querySelector<HTMLElement>('.base-rich-text-editor__link-btn--primary')
      ?.click()
    await nextTick()

    expect(execCalls('createLink')).toEqual([['createLink', false, 'https://example.com']])
  })

  it('does not apply a link with an unsafe URL', async () => {
    const wrapper = mountEditor()

    await button(wrapper, 'Link').trigger('click')
    const input = document.querySelector<HTMLInputElement>('.base-rich-text-editor__link-input')
    input!.value = 'javascript:alert(1)'
    input!.dispatchEvent(new Event('input'))
    await nextTick()
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()

    expect(execCalls('createLink')).toHaveLength(0)
    expect(execCalls('insertHTML')).toHaveLength(0)
  })
})

describe('BaseRichTextEditor content and v-model', () => {
  it('renders the initial modelValue', () => {
    const wrapper = mountEditor({ modelValue: '<p>Hello <strong>world</strong></p>' })

    expect(content(wrapper).innerHTML).toBe('<p>Hello <strong>world</strong></p>')
  })

  it('sanitizes the incoming modelValue', () => {
    const wrapper = mountEditor({
      modelValue: '<p onclick="x()">hi</p><script>alert(1)</script><img src=x onerror=alert(1)>',
    })

    expect(content(wrapper).innerHTML).toBe('<p>hi</p>')
  })

  it('emits update:modelValue and input with the HTML when the user types', async () => {
    const wrapper = mountEditor()

    await typeInto(wrapper, '<p>typed</p>')

    expect(modelUpdates(wrapper)).toEqual(['<p>typed</p>'])
    expect(emittedArgs(wrapper, 'input')).toHaveLength(1)
  })

  it('emits an empty string instead of the markup a cleared editor leaves behind', async () => {
    const wrapper = mountEditor({ modelValue: '<p>x</p>' })

    await typeInto(wrapper, '<p><br></p>')

    expect(modelUpdates(wrapper)).toEqual([''])
  })

  it('follows an outside change of modelValue', async () => {
    const wrapper = mountEditor({ modelValue: '<p>one</p>' })

    await wrapper.setProps({ modelValue: '<p>two</p>' })

    expect(content(wrapper).innerHTML).toBe('<p>two</p>')
  })

  it('clears the editor when modelValue is reset to an empty string', async () => {
    const wrapper = mountEditor({ modelValue: '<p>one</p>' })

    await wrapper.setProps({ modelValue: '' })

    expect(content(wrapper).innerHTML).toBe('')
    expect(wrapper.get('.base-rich-text-editor__content').classes()).toContain(
      'base-rich-text-editor__content--empty',
    )
  })

  it('does not rewrite the DOM when modelValue is just the echo of what it emitted', async () => {
    const wrapper = mountEditor()
    await typeInto(wrapper, '<p>typed</p>')
    const paragraph = content(wrapper).firstElementChild

    await wrapper.setProps({ modelValue: '<p>typed</p>' })

    // A rewrite would replace the node, dropping the caret and the browser's undo stack.
    expect(content(wrapper).firstElementChild).toBe(paragraph)
  })

  it('works with v-model in a parent', async () => {
    const model = ref('<p>a</p>')
    const Parent = defineComponent({
      setup: () => () =>
        h(BaseRichTextEditor, {
          modelValue: model.value,
          'onUpdate:modelValue': (value: string) => (model.value = value),
        }),
    })
    const wrapper = mount(Parent, { attachTo: document.body })

    content(wrapper as unknown as EditorWrapper).innerHTML = '<p>b</p>'
    await wrapper.get('.base-rich-text-editor__content').trigger('input')

    expect(model.value).toBe('<p>b</p>')
  })

  it('emits focus and blur', async () => {
    const wrapper = mountEditor()

    await wrapper.get('.base-rich-text-editor__content').trigger('focus')
    expect(emittedArgs(wrapper, 'focus')).toHaveLength(1)
    expect(wrapper.classes()).toContain('base-rich-text-editor--focused')

    await blur(wrapper)
    expect(emittedArgs(wrapper, 'blur')).toHaveLength(1)
    expect(wrapper.classes()).not.toContain('base-rich-text-editor--focused')
  })

  it('does not treat moving focus to the toolbar as a blur', async () => {
    const wrapper = mountEditor({ rules: ['required'] })
    await wrapper.get('.base-rich-text-editor__content').trigger('focus')

    await wrapper
      .get('.base-rich-text-editor__content')
      .trigger('blur', { relatedTarget: button(wrapper, 'Bold').element })

    expect(emittedArgs(wrapper, 'blur')).toHaveLength(0)
    expect(validations(wrapper)).toHaveLength(0)
  })

  it('sets the default paragraph separator on focus', async () => {
    const wrapper = mountEditor()

    await wrapper.get('.base-rich-text-editor__content').trigger('focus')

    expect(execCalls('defaultParagraphSeparator')).toEqual([
      ['defaultParagraphSeparator', false, 'p'],
    ])
  })
})

describe('BaseRichTextEditor paste and drop', () => {
  it('inserts pasted HTML after sanitizing it', () => {
    const wrapper = mountEditor()

    const event = firePaste(content(wrapper), {
      'text/html': '<p onclick="x()">ok</p><script>alert(1)</script>',
    })

    expect(event.defaultPrevented).toBe(true)
    expect(execCalls('insertHTML')).toEqual([['insertHTML', false, '<p>ok</p>']])
  })

  it('inserts pasted plain text escaped, keeping line breaks', () => {
    const wrapper = mountEditor()

    firePaste(content(wrapper), { 'text/plain': 'a <b>\nc' })

    expect(execCalls('insertHTML')).toEqual([['insertHTML', false, 'a &lt;b&gt;<br>c']])
  })

  it('ignores a paste when read-only', () => {
    const wrapper = mountEditor({ readonly: true })

    const event = firePaste(content(wrapper), { 'text/plain': 'x' })

    expect(event.defaultPrevented).toBe(true)
    expect(execCalls('insertHTML')).toHaveLength(0)
  })

  it('blocks dropping external content into the editor', () => {
    const wrapper = mountEditor()
    const event = new Event('drop', { bubbles: true, cancelable: true })

    content(wrapper).dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })
})

describe('BaseRichTextEditor validation', () => {
  it('validates on blur by default and emits the result', async () => {
    const wrapper = mountEditor({ rules: ['required'] })

    await blur(wrapper)

    expect(lastValidation(wrapper)).toEqual({
      valid: false,
      error: 'This field is required',
      name: '',
    })
    expect(wrapper.get('.base-rich-text-editor__helper').text()).toBe('This field is required')
    expect(wrapper.classes()).toContain('base-rich-text-editor--error')
    expect(wrapper.get('[role="textbox"]').attributes('aria-invalid')).toBe('true')
  })

  it('does not validate on blur when validateOnBlur is false', async () => {
    const wrapper = mountEditor({ rules: ['required'], validateOnBlur: false })

    await blur(wrapper)

    expect(validations(wrapper)).toHaveLength(0)
  })

  it('validates on input from the start when validateOnInput is set', async () => {
    const wrapper = mountEditor({ rules: ['required'], validateOnInput: true })

    await typeInto(wrapper, '<p>x</p>')

    expect(lastValidation(wrapper)?.valid).toBe(true)
  })

  it('re-validates on input once a value has been validated, clearing the stale error', async () => {
    const wrapper = mountEditor({ rules: ['required'] })
    await blur(wrapper)
    expect(lastValidation(wrapper)?.valid).toBe(false)

    await typeInto(wrapper, '<p>fixed</p>')

    expect(lastValidation(wrapper)?.valid).toBe(true)
    expect(wrapper.find('.base-rich-text-editor__helper').exists()).toBe(false)
  })

  it('treats an empty paragraph as empty for required', () => {
    const wrapper = mountEditor({ rules: ['required'], modelValue: '<p><br></p>' })

    expect(mountedApi(wrapper).validate()).toBe(false)
  })

  it('counts visible text, not markup, for min and max', () => {
    // 5 characters of text inside plenty of markup.
    const html = '<p><strong>He</strong><em>llo</em></p>'

    expect(mountedApi(mountEditor({ rules: [{ min: 5 }], modelValue: html })).validate()).toBe(true)
    expect(mountedApi(mountEditor({ rules: [{ min: 6 }], modelValue: html })).validate()).toBe(
      false,
    )
    expect(mountedApi(mountEditor({ rules: [{ max: 5 }], modelValue: html })).validate()).toBe(true)
    expect(mountedApi(mountEditor({ rules: [{ max: 4 }], modelValue: html })).validate()).toBe(
      false,
    )
  })

  it('uses a custom message and passes the HTML to a custom validator', () => {
    const validator = vi.fn(() => false)
    const wrapper = mountEditor({
      rules: [{ validator, message: 'Bad content' }],
      modelValue: '<p>x</p>',
    })

    expect(mountedApi(wrapper).validate()).toBe(false)
    expect(validator).toHaveBeenCalledWith('<p>x</p>')
    expect(lastValidation(wrapper)?.error).toBe('Bad content')
  })

  it('switches a rule off with false', () => {
    const wrapper = mountEditor({ rules: [{ required: false }] })

    expect(mountedApi(wrapper).validate()).toBe(true)
  })

  it('uses the configured validation messages', () => {
    setValidationMessages({ required: 'Campo obrigatório' })
    const wrapper = mountEditor({ rules: ['required'] })

    mountedApi(wrapper).validate()

    expect(lastValidation(wrapper)?.error).toBe('Campo obrigatório')
  })

  it('includes the name in every validation payload', async () => {
    const wrapper = mountEditor({ rules: ['required'], name: 'body' })

    await blur(wrapper)
    mountedApi(wrapper).validate()

    expect(validations(wrapper).map((payload) => payload.name)).toEqual(['body', 'body'])
  })

  it('marks the field as required when a rule requires it', () => {
    const wrapper = mountEditor({ label: 'Notes', rules: [{ required: true }] })

    expect(wrapper.find('.base-rich-text-editor__required').exists()).toBe(true)
  })
})

describe('BaseRichTextEditor exposed API', () => {
  it('emits mounted with validate and focus', () => {
    const wrapper = mountEditor()

    const api = mountedApi(wrapper)
    expect(typeof api.validate).toBe('function')
    expect(typeof api.focus).toBe('function')
  })

  it('exposes focus and validate through a template ref', () => {
    const exposed = ref<{ focus: () => void; validate: () => boolean } | null>(null)
    const Parent = defineComponent({
      setup: () => () => h(BaseRichTextEditor, { ref: exposed, rules: ['required'] }),
    })
    mount(Parent, { attachTo: document.body })

    expect(exposed.value?.validate()).toBe(false)
    expect(() => exposed.value?.focus()).not.toThrow()
  })

  it('focus() focuses the editing area', () => {
    const wrapper = mountEditor()
    const spy = vi.spyOn(content(wrapper), 'focus')

    mountedApi(wrapper).focus()

    expect(spy).toHaveBeenCalled()
  })
})
