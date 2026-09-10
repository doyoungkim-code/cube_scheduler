import { describe, it, expect } from 'vitest'
import { luminance, contrastRatio, inkOn } from './color'

describe('color', () => {
  it('휘도: 검정 0, 흰색 1', () => {
    expect(luminance('#000')).toBeCloseTo(0, 5)
    expect(luminance('#ffffff')).toBeCloseTo(1, 5)
    expect(luminance('nope')).toBeNull()
  })

  it('대비율: 흑백 21, 같은 색 1', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#808080', '#808080')).toBeCloseTo(1, 5)
  })

  it('밝은 활동색 위엔 짙은 잉크, 어두운 색 위엔 흰색', () => {
    expect(inkOn('#ffcc00')).toBe('#1f1a17')   // 노랑
    expect(inkOn('#5ac8fa')).toBe('#1f1a17')   // 하늘
    expect(inkOn('#3a3a4a')).toBe('#ffffff')   // 수면 회색
    expect(inkOn('#af52de')).toBe('#ffffff')   // 보라
    expect(inkOn('#34c759')).toBe('#1f1a17')   // 초록은 밝아서 짙은 잉크
  })

  it('파싱 실패 시 흰색', () => {
    expect(inkOn('red')).toBe('#ffffff')
  })
})
