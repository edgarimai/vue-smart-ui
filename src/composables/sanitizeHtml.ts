/**
 * Allowlist HTML sanitizer used by BaseRichTextEditor for incoming `modelValue` and pasted content.
 *
 * It parses with `DOMParser` (inert: no script runs, no resource loads), keeps only the tags and
 * attributes the editor can produce, and unwraps everything else. It is a safety net for the
 * editor, not a replacement for sanitizing on the consumer side where the HTML is rendered.
 */

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'div',
  'h1',
  'h2',
  'h3',
  'blockquote',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'del',
  'span',
  'ul',
  'ol',
  'li',
  'a',
  'sub',
  'sup',
])

// Dropped together with their content (unwrapping them would leak script/style text).
const DROPPED_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'noscript',
  'template',
  'svg',
  'math',
  'textarea',
  'select',
  'title',
])

const ALLOWED_PROTOCOLS = new Set(['http', 'https', 'mailto', 'tel'])

const COLOR_VALUE = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\(\s*[\d.\s,%/a-z]+\)|[a-z]{3,20})$/i

const ALLOWED_STYLES: Record<string, RegExp> = {
  color: COLOR_VALUE,
  'font-family': /^[\w\s,'"-]+$/,
  'text-align': /^(left|right|center|justify)$/i,
  'font-weight': /^(normal|bold|bolder|lighter|[1-9]00)$/i,
  'font-style': /^(normal|italic|oblique)$/i,
  'text-decoration': /^(none|underline|line-through|underline line-through|line-through underline)$/i,
}

const ALIGN_VALUES = new Set(['left', 'right', 'center', 'justify'])

export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Browsers ignore whitespace and control characters inside a URL scheme ("java\tscript:").
const compactUrl = (value: string): string =>
  Array.from(value)
    .filter((char) => char.charCodeAt(0) > 32 && char.charCodeAt(0) !== 127)
    .join('')

/**
 * Returns a safe URL for an `href`, or `''` when it must be rejected. Relative URLs and anchors
 * are kept; a bare domain or e-mail typed by a user is completed with `https://` / `mailto:`.
 */
export const sanitizeUrl = (raw: string): string => {
  const value = raw.trim()
  if (!value) return ''

  const compact = compactUrl(value)
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)
  if (scheme) return ALLOWED_PROTOCOLS.has(scheme[1].toLowerCase()) ? value : ''

  if (/^[/#?]/.test(compact)) return value
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`
  return `https://${value}`
}

const cleanStyle = (el: Element): void => {
  const raw = el.getAttribute('style')
  if (!raw) return

  const kept: string[] = []
  for (const declaration of raw.split(';')) {
    const separator = declaration.indexOf(':')
    if (separator < 0) continue

    const property = declaration.slice(0, separator).trim().toLowerCase()
    const value = declaration.slice(separator + 1).trim()
    if (ALLOWED_STYLES[property]?.test(value)) kept.push(`${property}: ${value}`)
  }

  if (kept.length) el.setAttribute('style', kept.join('; '))
  else el.removeAttribute('style')
}

const cleanAttributes = (el: Element, tag: string): void => {
  const href = tag === 'a' ? el.getAttribute('href') : null
  const align = el.getAttribute('align')?.trim().toLowerCase()
  const style = el.getAttribute('style')

  for (const name of el.getAttributeNames()) el.removeAttribute(name)

  if (style) el.setAttribute('style', style)
  cleanStyle(el)

  // Legacy `align="center"` (pasted content, some browsers) becomes an equivalent style.
  if (align && ALIGN_VALUES.has(align) && !el.hasAttribute('style')) {
    el.setAttribute('style', `text-align: ${align}`)
  }

  if (tag === 'a') {
    const safeHref = href ? sanitizeUrl(href) : ''
    if (safeHref) {
      el.setAttribute('href', safeHref)
      el.setAttribute('rel', 'noopener noreferrer')
    }
  }
}

const cleanChildren = (parent: Node): void => {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === 3) continue // text

    if (child.nodeType !== 1) {
      parent.removeChild(child) // comments, processing instructions...
      continue
    }

    const el = child as Element
    const tag = el.tagName.toLowerCase()

    if (DROPPED_TAGS.has(tag)) {
      parent.removeChild(el)
      continue
    }

    cleanChildren(el)

    if (!ALLOWED_TAGS.has(tag)) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
      continue
    }

    cleanAttributes(el, tag)

    // A link whose URL was rejected would be a bare `<a>`; keep only its text.
    if (tag === 'a' && !el.hasAttribute('href')) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
    }
  }
}

export const sanitizeHtml = (html: string): string => {
  if (!html) return ''

  // No DOM (SSR): fall back to plain escaped text rather than passing markup through.
  if (typeof DOMParser === 'undefined') return escapeHtml(html)

  const body = new DOMParser().parseFromString(html, 'text/html').body
  cleanChildren(body)
  return body.innerHTML
}

/** Visible text of an HTML string; what `required`, `min` and `max` are measured on. */
export const htmlToText = (html: string): string => {
  if (!html) return ''

  const text =
    typeof DOMParser === 'undefined'
      ? html.replace(/<[^>]*>/g, '')
      : (new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '')

  return text.replace(/ /g, ' ')
}
