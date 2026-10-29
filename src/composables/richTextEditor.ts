/**
 * Thin wrapper around the browser editing API (`document.execCommand`) used by BaseRichTextEditor.
 *
 * `execCommand` is deprecated on paper but implemented by every browser and is what gives a
 * `contenteditable` element a native undo/redo stack. Keeping every call in this file means the
 * engine can be swapped without touching the component.
 */

export type EditorCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'justifyFull'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'undo'
  | 'redo'
  | 'fontName'
  | 'foreColor'
  | 'formatBlock'
  | 'createLink'
  | 'unlink'
  | 'insertHTML'
  | 'insertText'
  | 'defaultParagraphSeparator'

// With `styleWithCSS` on, these write `<span style>` / `text-align` instead of `<font>`/`align`.
// Every other command stays on semantic tags (`<b>`, `<i>`, `<u>`, `<strike>`).
const STYLE_WITH_CSS = new Set<EditorCommand>([
  'fontName',
  'foreColor',
  'justifyLeft',
  'justifyCenter',
  'justifyRight',
  'justifyFull',
])

export type BlockType = 'p' | 'h1' | 'h2' | 'h3' | 'other'

const hasDocument = (): boolean => typeof document !== 'undefined'

export const supportsEditingCommands = (): boolean =>
  hasDocument() && typeof document.execCommand === 'function'

export const execEditorCommand = (command: EditorCommand, value?: string): boolean => {
  if (!supportsEditingCommands()) return false

  try {
    document.execCommand('styleWithCSS', false, String(STYLE_WITH_CSS.has(command)))
    return document.execCommand(command, false, value)
  } catch {
    return false
  }
}

export const queryEditorState = (command: EditorCommand): boolean => {
  if (!hasDocument() || typeof document.queryCommandState !== 'function') return false

  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}

export const queryEditorValue = (command: EditorCommand): string => {
  if (!hasDocument() || typeof document.queryCommandValue !== 'function') return ''

  try {
    return document.queryCommandValue(command) || ''
  } catch {
    return ''
  }
}

/** The current selection range, only when it lies inside `root`. */
export const getSelectionRangeWithin = (root: HTMLElement): Range | null => {
  const selection = typeof window !== 'undefined' ? window.getSelection?.() : null
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  return root.contains(range.commonAncestorContainer) ? range.cloneRange() : null
}

export const restoreSelectionRange = (range: Range | null): void => {
  const selection = typeof window !== 'undefined' ? window.getSelection?.() : null
  if (!range || !selection) return

  selection.removeAllRanges()
  selection.addRange(range)
}

/** Closest ancestor (or the node itself) of `node` with the given tag, stopping at `root`. */
export const findAncestorTag = (
  node: Node | null,
  root: HTMLElement,
  tag: string,
): HTMLElement | null => {
  let current: Node | null = node
  while (current && current !== root) {
    if (current.nodeType === 1 && (current as HTMLElement).tagName.toLowerCase() === tag) {
      return current as HTMLElement
    }
    current = current.parentNode
  }
  return null
}

/** Maps the browser-specific `formatBlock` value ("h1", "Heading 1", "div"...) to a block type. */
export const normalizeBlockType = (raw: string): BlockType => {
  const value = raw.trim().toLowerCase()
  const heading = /^(?:h|heading\s*)([1-3])$/.exec(value)
  if (heading) return `h${heading[1]}` as BlockType
  if (/^(?:h|heading\s*)[4-6]$/.test(value) || value === 'blockquote' || value === 'pre') {
    return 'other'
  }
  return 'p'
}

/** First family of a CSS `font-family` list, lowercased and unquoted, for comparisons. */
export const firstFontFamily = (raw: string): string =>
  (raw.split(',')[0] ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .toLowerCase()

/** `rgb(r, g, b)` / `#abc` to `#rrggbb` (what `<input type="color">` requires). */
export const toHexColor = (raw: string, fallback = '#000000'): string => {
  const value = raw.trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase()
  }

  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(value)
  if (!rgb) return fallback

  return `#${[rgb[1], rgb[2], rgb[3]]
    .map((channel) => Math.min(255, Number(channel)).toString(16).padStart(2, '0'))
    .join('')}`
}
