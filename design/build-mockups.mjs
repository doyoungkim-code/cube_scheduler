// 홈 화면 리디자인 시안 3안 생성기. node design/build-mockups.mjs → design/*.dc.html
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------- 샘플 데이터 (앱의 기본 활동 이름 사용)
const ACTS = {
  sleep: { name: '수면', color: '#3a3a4a' },
  meal: { name: '식사', color: '#ff9500' },
  algo: { name: '알고리즘', color: '#4a9eff' },
  proj: { name: '프로젝트', color: '#af52de' },
  run: { name: '운동', color: '#34c759' },
  eng: { name: '영어 공부', color: '#5ac8fa' },
  coffee: { name: '커피, 음악, 독서', color: '#a2845e' },
}
// [startMin, endMin, actKey, title?]
const SEGS = [
  [0, 420, 'sleep'], [450, 480, 'meal'], [540, 690, 'algo', 'BOJ 1753 다익스트라'], [720, 750, 'meal'],
  [780, 960, 'proj', '스케줄러 v2 마이그레이션'], [1020, 1080, 'run', '러닝 5km'], [1110, 1140, 'meal'],
  [1200, 1260, 'eng', 'Shadowing 2ch'], [1290, 1350, 'coffee'], [1380, 1440, 'sleep'],
]
const NOW = 14 * 60 + 23
const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const dur = m => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`)

const TICKETS = [
  { seq: 14, act: 'proj', status: 'progress', title: '스케줄러 v2 마이그레이션', desc: '활동 id 참조 + 구간 리스트' },
  { seq: 12, act: 'algo', status: 'progress', title: 'BOJ 1753 다익스트라', desc: '우선순위 큐 복습' },
  { seq: 15, act: 'eng', status: 'todo', title: 'Shadowing 2챕터', desc: '' },
  { seq: 11, act: 'run', status: 'done', title: '러닝 5km', desc: '한강 코스' },
]
const HABITS = [
  { name: '물 8잔', color: '#4a9eff', done: true, streak: 12 },
  { name: '스트레칭', color: '#34c759', done: true, streak: 5 },
  { name: '일기', color: '#ff9500', done: false, streak: 0 },
]
const WEEK = ['월', '화', '수', '목', '금', '토', '일']

// ---------------------------------------------------------------- 공용 조각
function timelineSegments(height, opts = {}) {
  const { radius = 3, gapBg = 'transparent' } = opts
  return SEGS.map(([s, e, k]) =>
    `<div style="position:absolute;left:${(s / 1440 * 100).toFixed(3)}%;width:${((e - s) / 1440 * 100).toFixed(3)}%;top:0;height:${height}px;background:${ACTS[k].color};border-radius:${radius}px;"></div>`,
  ).join('') + (gapBg !== 'transparent' ? '' : '')
}

function hourTicks(color, font, size = 10) {
  return Array.from({ length: 25 }, (_, h) => h).filter(h => h % 3 === 0)
    .map(h => `<span style="position:absolute;left:${(h / 24 * 100).toFixed(2)}%;transform:translateX(${h === 24 ? '-100%' : h === 0 ? '0' : '-50%'});font-family:${font};font-size:${size}px;color:${color};">${String(h % 24).padStart(2, '0')}</span>`)
    .join('')
}

function svgIcon(name, size, color) {
  const p = {
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    flame: '<path d="M12 22c4.4 0 8-3.1 8-7.5 0-3.4-2.3-5.7-4-8.5-.4 2.2-1.6 3.6-3 4.5C12.5 8.4 12 5.6 10 3c-.5 4.5-6 6.6-6 11.5C4 18.9 7.6 22 12 22z"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  }[name]
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`
}

const NAV = [['calendar', '스케줄'], ['chart', '대시보드'], ['check', '습관'], ['note', '메모'], ['gear', '설정']]

// ---------------------------------------------------------------- 테마 정의
const THEMES = {
  A: {
    file: 'DirectionA', title: 'A · 정돈된 현재', font: "'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, sans-serif",
    mono: "'JetBrains Mono', Consolas, monospace",
    bg: '#56423f', bg2: '#4a3835', bgHover: '#63504d', border: '#6e5955', text: '#f0e6e0', text2: '#c4b0a8', muted: '#8a7a74',
    accent: '#e8a87c', accentInk: '#2b1d1a', card: '#4a3835', cardBorder: '#6e5955', lightCard: '#ffffff', lightText: '#1a1a1a', lightMuted: '#8a8a8a', lightBorder: '#e6e2dd',
    radius: 12, radiusSm: 8, ticket: '#f5f0e6', topbar: 'rgba(74,56,53,0.92)', shadow: '0 1px 3px rgba(0,0,0,0.25)',
    layout: 'three', headingWeight: 700, chipStyle: 'filled',
  },
  B: {
    file: 'DirectionB', title: 'B · 종이 스튜디오', font: "'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, sans-serif",
    mono: "'JetBrains Mono', Consolas, monospace",
    bg: '#f4efe7', bg2: '#fbf8f2', bgHover: '#ece5da', border: '#e3dbcf', text: '#2b211e', text2: '#6b5d57', muted: '#9c8f88',
    accent: '#c9713f', accentInk: '#ffffff', card: '#fbf8f2', cardBorder: '#e3dbcf', lightCard: '#ffffff', lightText: '#2b211e', lightMuted: '#9c8f88', lightBorder: '#e9e2d7',
    radius: 16, radiusSm: 10, ticket: '#fffdf8', topbar: 'rgba(244,239,231,0.9)', shadow: '0 1px 2px rgba(60,40,30,0.06), 0 8px 24px rgba(60,40,30,0.06)',
    layout: 'three', headingWeight: 600, chipStyle: 'outline',
  },
  C: {
    file: 'DirectionC', title: 'C · 다크 콘솔', font: "'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, sans-serif",
    mono: "'JetBrains Mono', Consolas, monospace",
    bg: '#17161a', bg2: '#1f1e23', bgHover: '#2a292f', border: '#2e2d34', text: '#ededf0', text2: '#a5a4ad', muted: '#6f6e78',
    accent: '#f0b98f', accentInk: '#1a1210', card: '#1f1e23', cardBorder: '#2e2d34', lightCard: '#1f1e23', lightText: '#ededf0', lightMuted: '#6f6e78', lightBorder: '#2e2d34',
    radius: 10, radiusSm: 6, ticket: '#26252b', topbar: 'rgba(23,22,26,0.9)', shadow: '0 0 0 1px #2e2d34',
    layout: 'hero', headingWeight: 600, chipStyle: 'dot',
  },
}

// ---------------------------------------------------------------- 렌더
function render(t) {
  const isLight = t.file === 'DirectionB'
  const isDark = t.file === 'DirectionC'
  const s = (obj) => Object.entries(obj).map(([k, v]) => `${k}:${v}`).join(';')
  const card = (extra = '') => `background:${t.card};border:1px solid ${t.cardBorder};border-radius:${t.radius}px;box-shadow:${t.shadow};${extra}`
  const light = (extra = '') => `background:${t.lightCard};border:1px solid ${t.lightBorder};border-radius:${t.radius}px;box-shadow:${t.shadow};color:${t.lightText};${extra}`
  const h = (txt, size = 13, color = t.text2) => `<div style="font-size:${size}px;font-weight:${t.headingWeight};letter-spacing:0.02em;color:${color};">${txt}</div>`

  // 헤더
  const topbar = `
<header style="display:flex;align-items:center;gap:16px;height:56px;padding:0 24px;background:${t.topbar};border-bottom:1px solid ${t.border};position:sticky;top:0;">
  <div style="display:flex;align-items:center;gap:10px;font-weight:800;font-size:15px;color:${t.text};letter-spacing:-0.01em;">
    <div style="width:22px;height:22px;border-radius:6px;background:${t.accent};"></div>Cube Scheduler
  </div>
  <nav style="display:flex;gap:2px;margin-left:16px;">
    ${NAV.map(([ic, label], i) => `<a href="#" style="display:flex;align-items:center;gap:7px;padding:7px 12px;border-radius:999px;font-size:13px;font-weight:600;text-decoration:none;color:${i === 0 ? t.accentInk : t.text2};background:${i === 0 ? t.accent : 'transparent'};">${svgIcon(ic, 15, i === 0 ? t.accentInk : t.text2)}${label}</a>`).join('')}
  </nav>
  <div style="flex:1;"></div>
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:${t.muted};">${svgIcon('undo', 14, t.muted)}Ctrl+Z</span>
    <span style="font-family:${t.mono};font-size:13px;color:${t.text2};">14:23</span>
    <div style="width:30px;height:30px;border-radius:50%;background:${t.bgHover};border:1px solid ${t.border};"></div>
  </div>
</header>`

  // 방 카드 + 시계
  const roomCard = `
<section style="${card('overflow:hidden;')}">
  <div style="height:${t.layout === 'hero' ? 96 : 132}px;background:linear-gradient(160deg, ${isLight ? '#e9dccb' : '#3b2b28'} 0%, ${isLight ? '#d8c7b2' : '#2a1d1b'} 100%);position:relative;">
    <div style="position:absolute;left:16px;bottom:12px;display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:999px;background:${ACTS.proj.color};color:#fff;font-size:12px;font-weight:700;">${ACTS.proj.name}</div>
  </div>
  <div style="padding:14px 16px;display:flex;flex-direction:column;gap:2px;">
    <div style="font-family:${t.mono};font-size:32px;font-weight:600;letter-spacing:-0.02em;color:${t.text};line-height:1;">14:23<span style="font-size:16px;color:${t.muted};">:08</span></div>
    <div style="font-size:12px;color:${t.muted};">2026.09.11 금</div>
  </div>
</section>`

  // 오늘 요약
  const totals = {}
  for (const [a, b, k] of SEGS) totals[k] = (totals[k] ?? 0) + (b - a)
  const summaryItems = Object.entries(totals).filter(([k]) => k !== 'sleep').sort((a, b) => b[1] - a[1])
  const maxMin = summaryItems[0][1]
  const summary = `
<section style="${card('padding:14px 16px;display:flex;flex-direction:column;gap:10px;')}">
  <div style="display:flex;justify-content:space-between;align-items:baseline;">${h('오늘 활동')}<span style="font-family:${t.mono};font-size:12px;color:${t.muted};">${dur(summaryItems.reduce((s, [, m]) => s + m, 0))}</span></div>
  <div style="display:flex;flex-direction:column;gap:8px;">
    ${summaryItems.map(([k, m]) => `<div style="display:flex;align-items:center;gap:8px;">
      <span style="width:8px;height:8px;border-radius:50%;background:${ACTS[k].color};flex-shrink:0;"></span>
      <span style="font-size:13px;color:${t.text};width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ACTS[k].name}</span>
      <div style="flex:1;height:6px;border-radius:3px;background:${t.bgHover};overflow:hidden;"><div style="width:${(m / maxMin * 100).toFixed(0)}%;height:100%;background:${ACTS[k].color};border-radius:3px;"></div></div>
      <span style="font-family:${t.mono};font-size:11px;color:${t.muted};width:44px;text-align:right;">${dur(m)}</span>
    </div>`).join('')}
  </div>
</section>`

  // 습관
  const habits = `
<section style="${card('padding:14px 16px;display:flex;flex-direction:column;gap:10px;')}">
  <div style="display:flex;justify-content:space-between;align-items:baseline;">${h('오늘의 습관')}<span style="font-size:12px;color:${t.muted};">2 / 3</span></div>
  <div style="display:flex;flex-direction:column;gap:6px;">
    ${HABITS.map(x => `<div style="display:flex;align-items:center;gap:10px;min-height:32px;">
      <span style="width:22px;height:22px;border-radius:7px;border:2px solid ${x.color};background:${x.done ? x.color : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${x.done ? svgIcon('check', 13, '#fff') : ''}</span>
      <span style="flex:1;font-size:13px;color:${x.done ? t.text2 : t.text};text-decoration:${x.done ? 'line-through' : 'none'};">${x.name}</span>
      ${x.streak ? `<span style="display:flex;align-items:center;gap:3px;font-family:${t.mono};font-size:11px;color:${t.accent};">${svgIcon('flame', 12, t.accent)}${x.streak}</span>` : ''}
    </div>`).join('')}
  </div>
  <a href="#" style="font-size:12px;color:${t.muted};text-decoration:none;">+ 습관 추가</a>
</section>`

  // 날짜 바
  const datebar = `
<div style="display:flex;align-items:center;gap:10px;">
  <a href="#" style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid ${t.border};background:${t.card};">${svgIcon('chevL', 16, t.text2)}</a>
  <div style="display:flex;align-items:baseline;gap:8px;">
    <span style="font-size:${isDark ? 22 : 20}px;font-weight:800;letter-spacing:-0.02em;color:${t.text};">9월 11일</span>
    <span style="font-size:13px;color:${t.text2};">금요일 · 오늘</span>
  </div>
  <a href="#" style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid ${t.border};background:${t.card};">${svgIcon('chevR', 16, t.text2)}</a>
  <div style="flex:1;"></div>
  <a href="#" style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;border:1px solid ${t.border};background:${t.card};font-size:12px;font-weight:600;color:${t.text2};text-decoration:none;">${svgIcon('calendar', 14, t.text2)}달력</a>
</div>`

  // 주간 스트립
  const weekStrip = `
<div style="display:grid;grid-template-columns:repeat(7, minmax(0, 1fr));gap:6px;">
  ${WEEK.map((d, i) => {
    const sel = i === 4
    const fill = i <= 4
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px 4px 6px;border-radius:${t.radiusSm}px;background:${sel ? (isLight ? '#fff' : t.bgHover) : 'transparent'};border:1px solid ${sel ? t.accent : 'transparent'};">
      <span style="font-size:11px;font-weight:700;color:${i === 5 ? '#4a9eff' : i === 6 ? '#ff6b5e' : t.muted};">${d}</span>
      <span style="font-family:${t.mono};font-size:13px;color:${sel ? t.text : t.text2};">${7 + i}</span>
      <div style="width:100%;height:4px;border-radius:2px;background:${t.bgHover};overflow:hidden;position:relative;">${fill ? SEGS.filter(([a]) => (a + i * 37) % 3 !== 1).map(([a, b, k]) => `<span style="position:absolute;left:${(a / 1440 * 100).toFixed(2)}%;width:${((b - a) / 1440 * 100).toFixed(2)}%;top:0;height:100%;background:${ACTS[k].color};"></span>`).join('') : ''}</div>
    </div>`
  }).join('')}
</div>`

  // 팔레트
  const chip = (k, sel) => {
    const a = ACTS[k]
    if (t.chipStyle === 'dot') return `<a href="#" style="display:flex;align-items:center;gap:7px;padding:6px 12px;border-radius:8px;border:1px solid ${sel ? a.color : t.border};background:${sel ? a.color + '22' : 'transparent'};font-size:13px;font-weight:600;color:${t.text};text-decoration:none;"><span style="width:8px;height:8px;border-radius:50%;background:${a.color};"></span>${a.name}</a>`
    if (t.chipStyle === 'outline') return `<a href="#" style="display:flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;border:1.5px solid ${a.color};background:${sel ? a.color : '#fff'};font-size:13px;font-weight:600;color:${sel ? '#fff' : a.color};text-decoration:none;">${a.name}</a>`
    return `<a href="#" style="display:flex;align-items:center;padding:6px 14px;border-radius:999px;border:2.5px solid ${sel ? '#fff' : 'transparent'};background:${a.color};font-size:13px;font-weight:600;color:#fff;text-decoration:none;box-shadow:${sel ? '0 2px 8px rgba(0,0,0,0.25)' : 'none'};">${a.name}</a>`
  }
  const palette = `
<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
  ${['sleep', 'algo', 'proj', 'run', 'meal', 'eng', 'coffee'].map(k => chip(k, k === 'proj')).join('')}
  <a href="#" style="width:32px;height:32px;border-radius:999px;border:1.5px dashed ${t.border};display:flex;align-items:center;justify-content:center;">${svgIcon('plus', 14, t.muted)}</a>
  <div style="flex:1;"></div>
  <a href="#" style="width:32px;height:32px;border-radius:999px;border:1.5px solid ${t.border};display:flex;align-items:center;justify-content:center;">${svgIcon('x', 14, t.muted)}</a>
</div>`

  // 타임테이블 (144블록 근사: 구간 + 시간 눈금 + 현재선)
  const ttH = t.layout === 'hero' ? 72 : 44
  const ttBg = isLight ? '#f1ece3' : isDark ? '#141317' : '#f3f1ee'
  const ttInk = isDark ? t.text : '#1a1a1a'
  const ttMuted = isDark ? t.muted : '#8a8a8a'
  const timetable = `
<section style="${t.layout === 'hero' ? card('padding:16px 18px;') : light('padding:14px 16px;')}display:flex;flex-direction:column;gap:10px;">
  <div style="display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="padding:4px 10px;border-radius:999px;background:${ACTS.proj.color};color:#fff;font-size:12px;font-weight:700;">${ACTS.proj.name}</span>
      <span style="font-family:${t.mono};font-size:13px;color:${ttMuted};">14:23</span>
    </div>
    <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:${ttMuted};"><span style="width:8px;height:8px;border-radius:50%;background:${ACTS.proj.color};"></span>프로젝트 · 칠할 구간을 드래그</span>
  </div>
  <div style="position:relative;height:14px;">${hourTicks(ttMuted, t.mono)}</div>
  <div style="position:relative;height:${ttH}px;border-radius:${t.radiusSm}px;background:${ttBg};overflow:hidden;">
    ${Array.from({ length: 24 }, (_, i) => `<span style="position:absolute;left:${(i / 24 * 100).toFixed(2)}%;top:0;bottom:0;width:1px;background:${isDark ? '#2a292f' : 'rgba(0,0,0,0.05)'};"></span>`).join('')}
    ${timelineSegments(ttH, { radius: 0 })}
    <span style="position:absolute;left:${(NOW / 1440 * 100).toFixed(2)}%;top:0;bottom:0;width:2px;background:${isDark ? t.accent : '#1a73e8'};"></span>
    <span style="position:absolute;left:${(NOW / 1440 * 100).toFixed(2)}%;top:-4px;width:10px;height:10px;margin-left:-4px;border-radius:50%;background:${isDark ? t.accent : '#1a73e8'};"></span>
  </div>
  ${t.layout === 'hero' ? `<div style="display:flex;gap:16px;flex-wrap:wrap;padding-top:2px;">${SEGS.filter(x => x[3]).map(([a, b, k, title]) => `<span style="display:flex;align-items:center;gap:6px;font-size:12px;color:${t.text2};"><span style="width:8px;height:8px;border-radius:2px;background:${ACTS[k].color};"></span><span style="font-family:${t.mono};">${fmt(a)}–${fmt(b)}</span>${title}</span>`).join('')}</div>` : ''}
</section>`

  // 현재 시간대 카드
  const groupCard = (a, b, k, title, now) => `
<div style="display:flex;align-items:stretch;border-radius:${t.radiusSm}px;overflow:hidden;background:${isDark ? t.bgHover : '#fff'};border:1px solid ${isDark ? t.border : '#e6e2dd'};${now ? `box-shadow:inset 3px 0 0 ${isDark ? t.accent : '#1a73e8'};` : ''}">
  <div style="width:4px;background:${ACTS[k].color};"></div>
  <div style="flex:1;padding:8px 12px;display:flex;flex-direction:column;gap:2px;">
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="font-size:10px;font-weight:700;color:#fff;padding:1px 8px;border-radius:999px;background:${ACTS[k].color};">${ACTS[k].name}</span>
      <span style="font-family:${t.mono};font-size:11px;color:${ttMuted};">${fmt(a)}~${fmt(b)}</span>
      <span style="font-size:11px;color:${ttMuted};margin-left:auto;">${dur(b - a)}</span>
    </div>
    <div style="font-size:13px;font-weight:600;color:${ttInk};">${title}</div>
  </div>
</div>`
  const currentTasks = `
<section style="${t.layout === 'hero' ? card('padding:14px 16px;') : light('padding:14px 16px;')}display:flex;flex-direction:column;gap:8px;">
  <div style="display:flex;justify-content:space-between;align-items:baseline;">${h('현재 시간대', 13, ttInk)}<span style="font-family:${t.mono};font-size:12px;color:${ttMuted};">14:00 ~ 15:00</span></div>
  ${groupCard(780, 960, 'proj', '스케줄러 v2 마이그레이션', true)}
</section>`

  // 메모
  const memo = `
<section style="${card('padding:14px 16px;display:flex;flex-direction:column;gap:8px;')}">
  <div style="display:flex;justify-content:space-between;align-items:baseline;">${h('메모 · 9월 11일')}<span style="font-size:11px;color:${t.muted};">저장됨</span></div>
  <div style="min-height:72px;padding:10px 12px;border-radius:${t.radiusSm}px;background:${isLight ? '#fff' : t.bg};border:1px solid ${t.border};font-size:13px;line-height:1.6;color:${t.text2};">v2 마이그레이션 끝나면 대시보드 주간 리포트에 습관 체크 수 넣기</div>
</section>`

  // 칸반 티켓
  const ticket = (x) => {
    const a = ACTS[x.act]
    const stamp = { todo: 'TO DO', progress: 'IN PROGRESS', done: 'COMPLETE' }[x.status]
    return `<div style="display:flex;align-items:stretch;border-radius:8px;overflow:hidden;background:${t.ticket};box-shadow:${isDark ? '0 0 0 1px ' + t.border : '0 1px 4px rgba(0,0,0,0.12)'};opacity:${x.status === 'done' ? 0.65 : 1};">
      <div style="flex:1;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:${a.color};color:#fff;font-size:10px;font-weight:800;letter-spacing:0.06em;"><span>${a.name.toUpperCase()}</span><span style="font-family:${t.mono};opacity:0.85;">09.11</span></div>
        <div style="padding:10px 12px;display:flex;flex-direction:column;gap:3px;">
          <div style="font-size:13px;font-weight:700;color:${isDark ? t.text : '#2b211e'};">${x.title}</div>
          ${x.desc ? `<div style="font-size:11px;color:${isDark ? t.text2 : '#6b5d57'};">${x.desc}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;border-top:1px dashed ${isDark ? t.border : '#d8d0c0'};font-family:${t.mono};font-size:10px;color:${isDark ? t.muted : '#8a7e70'};"><span>T${x.seq}</span><span>${stamp}</span></div>
      </div>
      <div style="width:54px;border-left:2px dashed ${isDark ? t.bg : '#e6dccd'};background:${a.color};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#fff;">
        <span style="font-family:${t.mono};font-size:11px;font-weight:700;">#${x.seq}</span>
        <span style="writing-mode:vertical-rl;font-size:9px;letter-spacing:0.12em;opacity:0.9;">${stamp}</span>
      </div>
    </div>`
  }
  const column = (status, label) => {
    const items = TICKETS.filter(x => x.status === status)
    return `<div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">${h(label, 12)}<span style="font-family:${t.mono};font-size:11px;color:${t.muted};">${items.length}</span></div>
      ${items.map(ticket).join('') || `<div style="padding:12px;border:1px dashed ${t.border};border-radius:8px;font-size:12px;color:${t.muted};text-align:center;">티켓이 없어요</div>`}
    </div>`
  }
  const kanban = (horizontal) => `
<section style="${t.layout === 'hero' ? card('padding:14px 16px;') : light('padding:14px 16px;')}display:flex;flex-direction:column;gap:12px;">
  <div style="display:flex;align-items:center;justify-content:space-between;">${h('보드', 14, ttInk)}<a href="#" style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;background:${t.accent};color:${t.accentInk};font-size:12px;font-weight:700;text-decoration:none;">${svgIcon('plus', 13, t.accentInk)}티켓</a></div>
  <div style="display:${horizontal ? 'grid' : 'flex'};${horizontal ? 'grid-template-columns:repeat(3, minmax(0, 1fr));' : 'flex-direction:column;'}gap:14px;">
    ${column('todo', 'To Do')}${column('progress', 'Progress')}${column('done', 'Done')}
  </div>
</section>`

  // 레이아웃
  let body
  if (t.layout === 'three') {
    body = `
<div style="display:grid;grid-template-columns:300px minmax(0,1fr) 340px;gap:20px;padding:20px 24px;align-items:start;">
  <aside style="display:flex;flex-direction:column;gap:14px;">${roomCard}${summary}${habits}</aside>
  <div style="display:flex;flex-direction:column;gap:14px;">${datebar}${weekStrip}${palette}${timetable}${currentTasks}${memo}</div>
  <aside style="display:flex;flex-direction:column;gap:14px;">${kanban(false)}</aside>
</div>`
  } else {
    body = `
<div style="display:flex;flex-direction:column;gap:16px;padding:20px 24px;">
  <div style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:20px;align-items:start;">
    <div style="display:flex;flex-direction:column;gap:12px;">${datebar}${palette}${timetable}</div>
    <div style="display:flex;flex-direction:column;gap:12px;">${roomCard}${weekStrip}</div>
  </div>
  <div style="display:grid;grid-template-columns:300px minmax(0,1fr) 300px;gap:20px;align-items:start;">
    <div style="display:flex;flex-direction:column;gap:12px;">${summary}${habits}</div>
    ${kanban(true)}
    <div style="display:flex;flex-direction:column;gap:12px;">${currentTasks}${memo}</div>
  </div>
</div>`
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap">
  <style>
    body { margin: 0; background: ${t.bg}; }
    a { color: ${t.accent}; } a:hover { color: ${t.accent}; }
  </style>
</helmet>
<div style="width:1440px;min-height:900px;background:${t.bg};color:${t.text};font-family:${t.font};font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;">
${topbar}
${body}
</div>
</x-dc>
</body>
</html>
`
}

for (const t of Object.values(THEMES)) {
  writeFileSync(join(here, `${t.file}.dc.html`), render(t))
  console.log('wrote', t.file)
}

const canvas = {
  artboards: [
    { file: 'DirectionA.dc.html', title: 'A · 정돈된 현재', x: 0, y: 0, w: 1440, h: 900 },
    { file: 'DirectionB.dc.html', title: 'B · 종이 스튜디오', x: 1560, y: 0, w: 1440, h: 900 },
    { file: 'DirectionC.dc.html', title: 'C · 다크 콘솔', x: 3120, y: 0, w: 1440, h: 900 },
    { file: 'Main.dc.html', title: '방향 메모', x: 0, y: 1060, w: 720, h: 420 },
  ],
  annotations: [
    { id: 'note-a', x: 0, y: -170, w: 440, text: 'A · 정돈된 현재\n지금의 브라운 + 살구색은 그대로. 카드 위계·간격·타이포만 정리하고 흰 카드(타임테이블/보드)는 유지.\n장점: 리스크 최소, 익숙함. 단점: 흰 카드가 여전히 튀어 보인다.' },
    { id: 'note-b', x: 1560, y: -170, w: 440, text: 'B · 종이 스튜디오\n따뜻한 크림 라이트 테마. 흰 카드가 배경에 녹고, 활동색과 타이포 위계로만 구분. 칩은 아웃라인.\n장점: 낮에 편하고 인쇄물 같은 정돈. 단점: 활동색 대비가 줄어 채도 조정 필요, 다크 취향이면 낯설다.' },
    { id: 'note-c', x: 3120, y: -170, w: 440, text: 'C · 다크 콘솔\n차분한 차콜에 타임테이블을 전면 히어로로 (2단 레이아웃). 흰 카드 없이 활동색만 도드라진다. 칩은 점+텍스트.\n장점: 데이터가 주인공, 밤에 편함. 단점: 레이아웃이 바뀌어 익숙해질 시간 필요.' },
  ],
  launch: { view: 'canvas' },
}
writeFileSync(join(here, 'canvas.json'), JSON.stringify(canvas, null, 2))

writeFileSync(join(here, 'Main.dc.html'), `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style> body { margin: 0; } a { color: #c9713f; } a:hover { color: #a85a2e; } </style>
</helmet>
<div style="width:720px;min-height:420px;padding:32px;background:#fbf8f2;color:#2b211e;font-family:'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, sans-serif;display:flex;flex-direction:column;gap:18px;">
  <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;">홈 화면 리디자인 · 방향 고르기</div>
  <p style="font-size:14px;line-height:1.7;color:#6b5d57;">세 안 모두 같은 데이터(9월 11일, 프로젝트 진행 중)로 그렸다. 구조가 아니라 <strong style="color:#2b211e;">배경 톤 · 흰 카드의 처리 · 타임테이블의 비중</strong>이 다르다. 하나를 고르거나 섞어 달라고 하면(예: "B 톤에 C 레이아웃") 그 방향으로 홈 · 대시보드 · 습관 · 모바일까지 확장한다.</p>
  <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:12px;">
    <div style="padding:14px;border-radius:12px;background:#56423f;color:#f0e6e0;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;">A</span><span style="font-size:12px;color:#c4b0a8;">브라운 유지 · 흰 카드 유지 · 3열</span></div>
    <div style="padding:14px;border-radius:12px;background:#f4efe7;border:1px solid #e3dbcf;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;">B</span><span style="font-size:12px;color:#6b5d57;">크림 라이트 · 카드 녹임 · 3열</span></div>
    <div style="padding:14px;border-radius:12px;background:#17161a;color:#ededf0;display:flex;flex-direction:column;gap:6px;"><span style="font-weight:800;">C</span><span style="font-size:12px;color:#a5a4ad;">차콜 다크 · 타임테이블 히어로 · 2단</span></div>
  </div>
  <p style="font-size:12px;line-height:1.6;color:#9c8f88;">공통으로 적용한 것: 이모지 대신 선 아이콘, 시계·숫자는 모노스페이스, 버튼 최소 32px, 헤더 탭을 알약형으로. 글꼴은 앱과 같은 Pretendard(없으면 Noto Sans KR).</p>
</div>
</x-dc>
</body>
</html>
`)
console.log('wrote Main, canvas.json')
