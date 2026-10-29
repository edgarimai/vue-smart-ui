import { describe, expect, it } from 'vitest'
import { htmlToText, sanitizeHtml, sanitizeUrl } from '../../src/composables/sanitizeHtml'

describe('sanitizeHtml', () => {
  it('keeps the formatting the editor produces', () => {
    const html =
      '<h1>Title</h1><p style="text-align: center">a <strong>b</strong> <em>c</em> <u>d</u> <strike>e</strike></p><ul><li>x</li></ul>'

    expect(sanitizeHtml(html)).toBe(html)
  })

  it('removes script, style and iframe together with their content', () => {
    const clean = sanitizeHtml(
      '<p>ok</p><script>alert(1)</script><style>p{}</style><iframe src="x">t</iframe>',
    )

    expect(clean).toBe('<p>ok</p>')
  })

  it('strips event handlers and unknown attributes', () => {
    const clean = sanitizeHtml('<p onclick="x()" class="c" id="i" data-a="1">hi</p>')

    expect(clean).toBe('<p>hi</p>')
  })

  it('unwraps unknown tags but keeps their text', () => {
    expect(sanitizeHtml('<p><img src=x onerror=alert(1)>a<custom-tag>b</custom-tag></p>')).toBe(
      '<p>ab</p>',
    )
  })

  it('drops javascript: and data: links but keeps safe ones', () => {
    // The unsafe link is removed but its text stays.
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a><a href="data:text/html,y">z</a>')).toBe(
      'xz',
    )

    expect(sanitizeHtml('<a href="https://example.com">x</a>')).toBe(
      '<a href="https://example.com" rel="noopener noreferrer">x</a>',
    )
  })

  it('catches a scheme hidden with whitespace or control characters', () => {
    expect(sanitizeHtml('<a href="java\tscript:alert(1)">x</a>')).toBe('x')
    expect(sanitizeHtml('<a href=" JaVaScRiPt:alert(1)">x</a>')).toBe('x')
  })

  it('keeps only allowed style properties with safe values', () => {
    const clean = sanitizeHtml(
      '<span style="color: #ff0000; position: fixed; background: url(javascript:x); font-family: Arial, sans-serif">t</span>',
    )

    expect(clean).toBe('<span style="color: #ff0000; font-family: Arial, sans-serif">t</span>')
  })

  it('rejects style values that try to inject', () => {
    const clean = sanitizeHtml('<span style="color: expression(alert(1)); text-align: url(x)">t</span>')

    expect(clean).toBe('<span>t</span>')
  })

  it('turns a legacy align attribute into text-align', () => {
    expect(sanitizeHtml('<p align="center">t</p>')).toBe('<p style="text-align: center">t</p>')
  })

  it('returns an empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('')
  })
})

describe('sanitizeUrl', () => {
  it('completes bare domains and e-mail addresses', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com')
    expect(sanitizeUrl('me@example.com')).toBe('mailto:me@example.com')
  })

  it('keeps allowed schemes and relative URLs', () => {
    expect(sanitizeUrl('http://a.com')).toBe('http://a.com')
    expect(sanitizeUrl('tel:+5511999999999')).toBe('tel:+5511999999999')
    expect(sanitizeUrl('/path')).toBe('/path')
    expect(sanitizeUrl('#anchor')).toBe('#anchor')
  })

  it('rejects dangerous schemes and empty input', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
    expect(sanitizeUrl('vbscript:x')).toBe('')
    expect(sanitizeUrl('   ')).toBe('')
  })
})

describe('htmlToText', () => {
  it('returns the visible text without tags', () => {
    expect(htmlToText('<p>Hello <strong>world</strong></p>')).toBe('Hello world')
  })

  it('treats an empty paragraph as no text', () => {
    expect(htmlToText('<p><br></p>').trim()).toBe('')
  })
})
