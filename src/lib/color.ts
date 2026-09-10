/**
 * 색 유틸. 활동색은 사용자가 고르므로, 그 위에 올리는 글자색은 대비를 계산해 정한다.
 */

const INK_DARK = '#1f1a17'
const INK_LIGHT = '#ffffff'

function parseHex(c: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3,8})$/i.exec(c.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map(x => x + x).join('')
  if (h.length !== 6 && h.length !== 8) return null
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function channel(v: number): number {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** WCAG 상대 휘도 (0~1). 파싱 실패 시 null */
export function luminance(hex: string): number | null {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const [r, g, b] = rgb
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** 두 색의 대비율 (1~21) */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a) ?? 0, lb = luminance(b) ?? 1
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * 배경색 위에 놓을 글자색. 중간 명도(보라·주황 등)에서는 수치상 비슷해도 흰 글자가 자연스러우므로
 * 짙은 잉크는 대비가 확실히(1.3배 이상) 좋을 때만 쓴다.
 */
export function inkOn(bg: string): string {
  const l = luminance(bg)
  if (l === null) return INK_LIGHT
  return contrastRatio(bg, INK_DARK) >= contrastRatio(bg, INK_LIGHT) * 1.3 ? INK_DARK : INK_LIGHT
}
