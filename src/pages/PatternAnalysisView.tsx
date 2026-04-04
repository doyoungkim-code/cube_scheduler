import { useState, useEffect, useRef } from 'react'
import ViewShell from '../components/ViewShell'
import { useDayData, todayKey } from '../hooks/useDayData'
import type { DayData, TimeSlot } from '../types/schedule'

const DAY_NAMES_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
const DAY_NAMES_SHORT = ['월', '화', '수', '목', '금', '토', '일']

interface RecordGroup {
  title: string; label: string; color: string; minutes: number; startMin: number; endMin: number
}

function groupSlotRecords(slots: Record<number, TimeSlot>): RecordGroup[] {
  const groups: RecordGroup[] = []
  let cur: RecordGroup | null = null
  for (let m = 0; m < 1440; m += 10) {
    const slot = slots[m]
    if (!slot) { if (cur) { groups.push(cur); cur = null }; continue }
    const title = slot.record?.title || slot.label
    if (cur && cur.title === title && cur.color === slot.color && cur.endMin === m) {
      cur.endMin = m + 10; cur.minutes += 10
    } else {
      if (cur) groups.push(cur)
      cur = { title, label: slot.label, color: slot.color, minutes: 10, startMin: m, endMin: m + 10 }
    }
  }
  if (cur) groups.push(cur)
  return groups
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtTime(mins: number): string {
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}` : `${mins}m`
}

function fmtMin(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// ===== HTML 직접 생성 (인라인 스타일) =====

const S = {
  card: 'width:760px;background:#f5f0e6;border:1px solid #d8d0c0;border-radius:12px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  header: 'display:flex;align-items:center;justify-content:space-between;background:#56423f;padding:14px 20px',
  headerTitle: 'font-size:18px;font-weight:800;color:#f0e6e0;letter-spacing:1.5px',
  headerDate: 'font-size:12px;color:#c4b0a8',
  body: 'padding:20px 24px',
  section: 'margin-bottom:16px',
  sectionTitle: 'font-size:10px;font-weight:800;color:#3a3428;letter-spacing:0.5px;margin-bottom:6px',
  timeline: 'display:flex;height:14px;border-radius:4px;overflow:visible;background:#e8e0d4',
  tlBlock: 'flex:1;min-width:0;position:relative',
  tlLabels: 'display:flex;justify-content:space-between;font-size:8px;color:#b0a890;font-family:Consolas,monospace;margin-top:2px',
  statRow: 'display:flex;align-items:center;gap:6px;margin-bottom:5px',
  statDot: 'width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block',
  statLabel: 'font-size:11px;font-weight:600;color:#3a3428;width:120px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block',
  statBarBg: 'flex:1;height:7px;background:#e8e0d4;border-radius:3px;overflow:hidden',
  statBar: 'height:100%;border-radius:3px',
  statTime: 'font-size:10px;color:#8a7e70;font-family:Consolas,monospace;width:60px;text-align:right;flex-shrink:0',
  record: 'display:flex;align-items:center;gap:6px;padding:3px 8px;background:#faf8f5;border-radius:4px;margin-bottom:3px',
  recordTime: 'font-size:9px;color:#8a7e70;font-family:Consolas,monospace;width:90px;flex-shrink:0',
  recordDot: 'width:6px;height:6px;border-radius:50%;flex-shrink:0;display:inline-block',
  recordTitle: 'font-size:11px;font-weight:600;color:#3a3428;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap',
  recordDur: 'font-size:9px;color:#8a7e70;font-family:Consolas,monospace;flex-shrink:0',
  footer: 'text-align:center;padding:8px 12px;font-size:9px;color:#b0a890;border-top:1px solid #e0d8c8',
  footerLink: 'color:#8a7e70;text-decoration:none;font-weight:600',
  weekDay: 'display:flex;align-items:center;gap:6px;margin-bottom:3px',
  weekDayName: 'font-size:10px;font-weight:700;color:#8a7e70;width:18px;text-align:center;flex-shrink:0',
  weekDayHours: 'font-size:10px;color:#8a7e70;font-family:Consolas,monospace;width:52px;text-align:right;flex-shrink:0',
  timelineSm: 'display:flex;height:8px;border-radius:3px;overflow:visible;background:#e8e0d4;flex:1',
}

const TOOLTIP_CSS = `<style>
.cube-tip{position:relative}
.cube-tip:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);font-size:11px;font-weight:600;color:#3a3428;white-space:nowrap;padding:4px 10px;background:#faf8f5;border:1px solid #d8d0c0;border-radius:6px;z-index:10;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.12)}
</style>`

function buildTimelineHtml(slots: Record<number, TimeSlot>, small?: boolean): string {
  // 연속 그룹 for tooltip
  const groups: { start: number; end: number; color: string; title: string }[] = []
  let cur: typeof groups[0] | null = null
  for (let i = 0; i < 144; i++) {
    const slot = slots[i * 10]
    const title = slot?.record?.title || slot?.label || ''
    const color = slot?.color || ''
    if (cur && slot && cur.title === title && cur.color === color && cur.end === i) {
      cur.end = i + 1
    } else {
      if (cur) groups.push(cur)
      cur = slot ? { start: i, end: i + 1, color, title } : null
    }
  }
  if (cur) groups.push(cur)

  const blockMap = new Array<typeof groups[0] | null>(144).fill(null)
  for (const g of groups) for (let i = g.start; i < g.end; i++) blockMap[i] = g

  const style = small ? S.timelineSm : S.timeline
  let html = `<div style="${style}">\n`
  for (let i = 0; i < 144; i++) {
    const slot = slots[i * 10]
    const g = blockMap[i]
    const bg = slot ? `background-color:${slot.color};` : ''
    const tip = g ? ` class="cube-tip" data-tip="${fmtMin(g.start * 10)} ~ ${fmtMin(g.end * 10)}  ${g.title.replace(/"/g, '&quot;')}"` : ''
    html += `  <div style="${S.tlBlock};${bg}"${tip}></div>\n`
  }
  html += `</div>\n`
  return html
}

function buildStatsHtml(stats: { title: string; color: string; minutes: number }[], total: number): string {
  let html = ''
  for (const s of stats) {
    const pct = total > 0 ? (s.minutes / total) * 100 : 0
    html += `<div style="${S.statRow}">\n`
    html += `  <span style="${S.statDot};background-color:${s.color}"></span>\n`
    html += `  <span style="${S.statLabel}">${s.title}</span>\n`
    html += `  <div style="${S.statBarBg}"><div style="${S.statBar};width:${pct}%;background-color:${s.color}"></div></div>\n`
    html += `  <span style="${S.statTime}">${fmtTime(s.minutes)}</span>\n`
    html += `</div>\n`
  }
  return html
}

function buildDayHtml(day: DayData, rawSlots: Record<number, TimeSlot>): string {
  const d = new Date(day.date + 'T00:00:00')
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${DAY_NAMES_FULL[d.getDay()]}`
  const groups = groupSlotRecords(rawSlots)
  const totalMins = groups.reduce((s, g) => s + g.minutes, 0)

  const titleMap = new Map<string, { title: string; color: string; minutes: number }>()
  for (const g of groups) {
    const ex = titleMap.get(g.title)
    if (ex) ex.minutes += g.minutes
    else titleMap.set(g.title, { title: g.title, color: g.color, minutes: g.minutes })
  }
  const stats = [...titleMap.values()].sort((a, b) => b.minutes - a.minutes)

  const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24]

  let html = TOOLTIP_CSS + '\n'
  html += `<div style="${S.card}">\n`
  html += `  <div style="${S.header}">\n`
  html += `    <span style="${S.headerTitle}">DAILY REPORT</span>\n`
  html += `    <span style="${S.headerDate}">${dateStr}</span>\n`
  html += `  </div>\n`
  html += `  <div style="${S.body}">\n`

  // Timeline
  html += `    <div style="${S.section}">\n`
  html += `      <div style="${S.sectionTitle}">TIMELINE</div>\n`
  html += buildTimelineHtml(rawSlots)
  html += `      <div style="${S.tlLabels}">${hours.map(h => `<span>${String(h % 24).padStart(2, '0')}</span>`).join('')}</div>\n`
  html += `    </div>\n`

  // Summary
  html += `    <div style="${S.section}">\n`
  html += `      <div style="${S.sectionTitle}">SUMMARY (${fmtTime(totalMins)})</div>\n`
  html += buildStatsHtml(stats, totalMins)
  html += `    </div>\n`

  // Records
  if (groups.length > 0) {
    html += `    <div style="${S.section}">\n`
    html += `      <div style="${S.sectionTitle}">RECORDS</div>\n`
    for (const g of groups) {
      html += `      <div style="${S.record}">\n`
      html += `        <span style="${S.recordTime}">${fmtMin(g.startMin)} ~ ${fmtMin(g.endMin)}</span>\n`
      html += `        <span style="${S.recordDot};background-color:${g.color}"></span>\n`
      html += `        <span style="${S.recordTitle}">${g.title}</span>\n`
      html += `        <span style="${S.recordDur}">${fmtTime(g.minutes)}</span>\n`
      html += `      </div>\n`
    }
    html += `    </div>\n`
  }

  html += `  </div>\n`
  html += `  <div style="${S.footer}">\n`
  html += `    <div>이 통계는 Cube Scheduler를 통해 생성되었습니다.</div>\n`
  html += `    <a href="https://github.com/doyoungkim-code/cube_scheduler" style="${S.footerLink}" target="_blank">github.com/doyoungkim-code/cube_scheduler</a>\n`
  html += `  </div>\n`
  html += `</div>\n`
  return html
}

function buildWeekHtml(
  weekData: { date: string; stats: RecordGroup[]; total: number; slots: Record<number, TimeSlot> }[]
): string {
  if (weekData.length === 0) return ''

  const weekMap = new Map<string, { title: string; color: string; minutes: number }>()
  let weekTotal = 0
  for (const d of weekData) {
    for (const s of d.stats) {
      const ex = weekMap.get(s.title)
      if (ex) ex.minutes += s.minutes
      else weekMap.set(s.title, { title: s.title, color: s.color, minutes: s.minutes })
    }
    weekTotal += d.total
  }
  const weekStats = [...weekMap.values()].sort((a, b) => b.minutes - a.minutes)
  const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24]

  let html = TOOLTIP_CSS + '\n'
  html += `<div style="${S.card}">\n`
  html += `  <div style="${S.header}">\n`
  html += `    <span style="${S.headerTitle}">WEEKLY REPORT</span>\n`
  html += `    <span style="${S.headerDate}">${weekData[0].date} ~ ${weekData[6].date}</span>\n`
  html += `  </div>\n`
  html += `  <div style="${S.body}">\n`

  // Daily timelines
  html += `    <div style="${S.section}">\n`
  html += `      <div style="${S.sectionTitle}">DAILY TIMELINE</div>\n`
  for (let i = 0; i < weekData.length; i++) {
    const d = weekData[i]
    html += `      <div style="${S.weekDay}">\n`
    html += `        <span style="${S.weekDayName}">${DAY_NAMES_SHORT[i]}</span>\n`
    html += buildTimelineHtml(d.slots, true)
    html += `        <span style="${S.weekDayHours}">${d.total > 0 ? fmtTime(d.total) : '-'}</span>\n`
    html += `      </div>\n`
  }
  html += `      <div style="${S.tlLabels};margin-left:28px">${hours.map(h => `<span>${String(h % 24).padStart(2, '0')}</span>`).join('')}</div>\n`
  html += `    </div>\n`

  // Total
  html += `    <div style="${S.section}">\n`
  html += `      <div style="${S.sectionTitle}">TOTAL: ${fmtTime(weekTotal)}</div>\n`
  html += buildStatsHtml(weekStats, weekTotal)
  html += `    </div>\n`

  html += `  </div>\n`
  html += `  <div style="${S.footer}">\n`
  html += `    <div>이 통계는 Cube Scheduler를 통해 생성되었습니다.</div>\n`
  html += `    <a href="https://github.com/doyoungkim-code/cube_scheduler" style="${S.footerLink}" target="_blank">github.com/doyoungkim-code/cube_scheduler</a>\n`
  html += `  </div>\n`
  html += `</div>\n`
  return html
}

// ===== React 컴포넌트 (미리보기용, 기존 CSS 클래스 사용) =====

function TimelineBar({ slots, small }: { slots: Record<number, TimeSlot>; small?: boolean }) {
  const groups: { start: number; end: number; color: string; title: string }[] = []
  let cur: typeof groups[0] | null = null
  for (let i = 0; i < 144; i++) {
    const slot = slots[i * 10]
    const title = slot?.record?.title || slot?.label || ''
    const color = slot?.color || ''
    if (cur && slot && cur.title === title && cur.color === color && cur.end === i) {
      cur.end = i + 1
    } else { if (cur) groups.push(cur); cur = slot ? { start: i, end: i + 1, color, title } : null }
  }
  if (cur) groups.push(cur)
  const blockMap = new Array<typeof groups[0] | null>(144).fill(null)
  for (const g of groups) for (let i = g.start; i < g.end; i++) blockMap[i] = g

  return (
    <div className={`report-timeline ${small ? 'report-timeline--sm' : ''}`}>
      {Array.from({ length: 144 }, (_, i) => {
        const slot = slots[i * 10]
        const g = blockMap[i]
        const tip = g ? `${fmtMin(g.start * 10)} ~ ${fmtMin(g.end * 10)}  ${g.title}` : undefined
        return <div key={i} className="report-tl-block" style={slot ? { background: slot.color } : undefined} data-tip={tip} />
      })}
    </div>
  )
}

function DayReportCard({ day, rawSlots }: { day: DayData; rawSlots: Record<number, TimeSlot> }) {
  const d = new Date(day.date + 'T00:00:00')
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${DAY_NAMES_FULL[d.getDay()]}`
  const groups = groupSlotRecords(rawSlots)
  const totalMins = groups.reduce((s, g) => s + g.minutes, 0)
  const titleMap = new Map<string, { title: string; color: string; minutes: number }>()
  for (const g of groups) { const ex = titleMap.get(g.title); if (ex) ex.minutes += g.minutes; else titleMap.set(g.title, { title: g.title, color: g.color, minutes: g.minutes }) }
  const stats = [...titleMap.values()].sort((a, b) => b.minutes - a.minutes)

  return (
    <div className="report-card">
      <div className="report-header"><span className="report-header-title">DAILY REPORT</span><span className="report-header-date">{dateStr}</span></div>
      <div className="report-body">
        <div className="report-section">
          <div className="report-section-title">TIMELINE</div>
          <TimelineBar slots={rawSlots} />
          <div className="report-tl-labels">{[0,3,6,9,12,15,18,21,24].map(h=><span key={h}>{String(h%24).padStart(2,'0')}</span>)}</div>
        </div>
        <div className="report-section">
          <div className="report-section-title">SUMMARY ({fmtTime(totalMins)})</div>
          {stats.length === 0 ? <div className="report-empty">기록된 활동이 없습니다</div> : (
            <div className="report-stats">{stats.map(s=>(
              <div key={s.title} className="report-stat-row">
                <span className="report-stat-dot" style={{background:s.color}}/><span className="report-stat-label">{s.title}</span>
                <div className="report-stat-bar-bg"><div className="report-stat-bar" style={{width:`${(s.minutes/totalMins)*100}%`,background:s.color}}/></div>
                <span className="report-stat-time">{fmtTime(s.minutes)}</span>
              </div>
            ))}</div>
          )}
        </div>
        {groups.length > 0 && (
          <div className="report-section">
            <div className="report-section-title">RECORDS</div>
            <div className="report-records">{groups.map((g,i)=>(
              <div key={i} className="report-record">
                <span className="report-record-time">{fmtMin(g.startMin)} ~ {fmtMin(g.endMin)}</span>
                <span className="report-record-dot" style={{background:g.color}}/><span className="report-record-title">{g.title}</span>
                <span className="report-record-dur">{fmtTime(g.minutes)}</span>
              </div>
            ))}</div>
          </div>
        )}
      </div>
      <div className="report-footer"><span>이 통계는 Cube Scheduler를 통해 생성되었습니다.</span><a href="https://github.com/doyoungkim-code/cube_scheduler" target="_blank" rel="noopener noreferrer">github.com/doyoungkim-code/cube_scheduler</a></div>
    </div>
  )
}

function WeekReportCard({ weekData }: { weekData: { date: string; stats: RecordGroup[]; total: number; slots: Record<number, TimeSlot> }[] }) {
  if (weekData.length === 0) return null
  const weekMap = new Map<string, { title: string; color: string; minutes: number }>()
  let weekTotal = 0
  for (const d of weekData) { for (const s of d.stats) { const ex = weekMap.get(s.title); if (ex) ex.minutes += s.minutes; else weekMap.set(s.title, { title: s.title, color: s.color, minutes: s.minutes }); }; weekTotal += d.total }
  const weekStats = [...weekMap.values()].sort((a, b) => b.minutes - a.minutes)

  return (
    <div className="report-card">
      <div className="report-header"><span className="report-header-title">WEEKLY REPORT</span><span className="report-header-date">{weekData[0].date} ~ {weekData[6].date}</span></div>
      <div className="report-body">
        <div className="report-section">
          <div className="report-section-title">DAILY TIMELINE</div>
          {weekData.map((d,i)=>(
            <div key={d.date} className="report-week-day">
              <span className="report-week-day-name">{DAY_NAMES_SHORT[i]}</span>
              <TimelineBar slots={d.slots} small />
              <span className="report-week-day-hours">{d.total>0?fmtTime(d.total):'-'}</span>
            </div>
          ))}
          <div className="report-tl-labels" style={{marginLeft:28}}>{[0,3,6,9,12,15,18,21,24].map(h=><span key={h}>{String(h%24).padStart(2,'0')}</span>)}</div>
        </div>
        <div className="report-section">
          <div className="report-section-title">TOTAL: {fmtTime(weekTotal)}</div>
          {weekStats.length === 0 ? <div className="report-empty">기록된 활동이 없습니다</div> : (
            <div className="report-stats">{weekStats.map(s=>(
              <div key={s.title} className="report-stat-row">
                <span className="report-stat-dot" style={{background:s.color}}/><span className="report-stat-label">{s.title}</span>
                <div className="report-stat-bar-bg"><div className="report-stat-bar" style={{width:`${weekTotal>0?(s.minutes/weekTotal)*100:0}%`,background:s.color}}/></div>
                <span className="report-stat-time">{fmtTime(s.minutes)}</span>
              </div>
            ))}</div>
          )}
        </div>
      </div>
      <div className="report-footer"><span>이 통계는 Cube Scheduler를 통해 생성되었습니다.</span><a href="https://github.com/doyoungkim-code/cube_scheduler" target="_blank" rel="noopener noreferrer">github.com/doyoungkim-code/cube_scheduler</a></div>
    </div>
  )
}

// ===== 메인 =====

export default function PatternAnalysisView({ onGoHome }: { onGoHome: () => void }) {
  const [mode, setMode] = useState<'day' | 'week'>('day')
  const today = todayKey()
  const [selectedDate, setSelectedDate] = useState(today)
  const data = useDayData(selectedDate)
  const reportRef = useRef<HTMLDivElement>(null)

  const [weekData, setWeekData] = useState<{ date: string; stats: RecordGroup[]; total: number; slots: Record<number, TimeSlot> }[]>([])

  useEffect(() => {
    if (mode !== 'week') return
    async function load() {
      if (!window.electronAPI) return
      const sel = new Date(selectedDate + 'T00:00:00')
      const dayOfWeek = sel.getDay()
      const monday = new Date(sel)
      monday.setDate(sel.getDate() - ((dayOfWeek + 6) % 7))

      const results: typeof weekData = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        const dk = dateKey(d)
        const saved = await window.electronAPI.loadData(`day-${dk}`) as DayData | null
        if (saved?.slots) {
          const groups = groupSlotRecords(saved.slots)
          results.push({ date: dk, stats: groups, total: groups.reduce((s, g) => s + g.minutes, 0), slots: saved.slots })
        } else {
          results.push({ date: dk, stats: [], total: 0, slots: {} })
        }
      }
      setWeekData(results)
    }
    load()
  }, [mode, selectedDate])

  const [copyMsg, setCopyMsg] = useState('')
  const [showTutorial, setShowTutorial] = useState(false)
  const hasShownTutorial = useRef(false)

  const handleCopy = async () => {
    // 직접 생성한 인라인 스타일 HTML
    const html = mode === 'day'
      ? buildDayHtml(data.day, data.rawDay.slots)
      : buildWeekHtml(weekData)

    if (window.electronAPI?.copyHtmlToClipboard) {
      await window.electronAPI.copyHtmlToClipboard(html, html)
      setCopyMsg('복사 완료!')
    } else {
      await navigator.clipboard.writeText(html)
      setCopyMsg('복사 완료!')
    }
    setTimeout(() => setCopyMsg(''), 2000)

    if (!hasShownTutorial.current) {
      hasShownTutorial.current = true
      setShowTutorial(true)
    }
  }

  return (
    <ViewShell title="대시보드" onGoHome={onGoHome}>
      <div className="share-page">
        <div className="share-toolbar">
          <div className="dash-tabs">
            <button className={`dash-tab ${mode === 'day' ? 'dash-tab--active' : ''}`} onClick={() => setMode('day')}>하루 일과</button>
            <button className={`dash-tab ${mode === 'week' ? 'dash-tab--active' : ''}`} onClick={() => setMode('week')}>주간 현황</button>
          </div>
          <input
            type="date"
            className="share-date-input"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <div className="share-actions">
            <button className="btn-sm btn-save" onClick={handleCopy}>클립보드 복사</button>
            {copyMsg && <span className="share-copy-msg">{copyMsg}</span>}
          </div>
        </div>
        <div className="share-preview">
          <div ref={reportRef}>
            {mode === 'day' ? (
              <DayReportCard day={data.day} rawSlots={data.rawDay.slots} />
            ) : (
              <WeekReportCard weekData={weekData} />
            )}
          </div>
        </div>
      </div>

      {showTutorial && (
        <div className="modal-backdrop" onClick={() => setShowTutorial(false)}>
          <div className="modal tutorial-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>블로그에 붙여넣기</h2>
              <button className="slot-editor-close" onClick={() => setShowTutorial(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="tutorial-steps">
                <div className="tutorial-step"><span className="tutorial-step-num">1</span><span className="tutorial-step-text">블로그 (Tistory 등) 에서 <strong>새 글 작성</strong>을 클릭합니다.</span></div>
                <div className="tutorial-step"><span className="tutorial-step-num">2</span><span className="tutorial-step-text">에디터 상단의 작성 모드를 <strong>HTML</strong>로 변경합니다.</span></div>
                <div className="tutorial-step"><span className="tutorial-step-num">3</span><span className="tutorial-step-text">HTML 편집 영역에서 <strong>Ctrl + V</strong>로 붙여넣습니다.</span></div>
                <div className="tutorial-step"><span className="tutorial-step-num">4</span><span className="tutorial-step-text">다시 <strong>기본 모드</strong>로 전환하면 리포트가 표시됩니다!</span></div>
              </div>
              <p className="tutorial-note">Notion, Velog 등 HTML을 지원하는 에디터에서도 동일하게 사용할 수 있습니다.</p>
              <button className="btn-sm btn-save tutorial-close-btn" onClick={() => setShowTutorial(false)}>확인</button>
            </div>
          </div>
        </div>
      )}
    </ViewShell>
  )
}
