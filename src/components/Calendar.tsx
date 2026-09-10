import { useState, useMemo } from 'react'
import { useKeysWithPrefix } from '../store'
import { dayHasContent } from '../lib/day'
import { pad2 } from '../lib/slots'

interface CalendarProps {
  selectedDate: string       // YYYY-MM-DD
  onSelectDate: (date: string) => void
  todayKey: string
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function toKey(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`
}

function Calendar({ selectedDate, onSelectDate, todayKey }: CalendarProps) {
  const [year, month] = selectedDate.split('-').map(Number) as [number, number]
  const viewYear = year
  const viewMonth = month - 1 // 0-based

  // 달력이 열릴 때의 선택 날짜 월에서 시작. (달력은 열 때마다 새로 마운트된다)
  const [navYear, setNavYear] = useState(viewYear)
  const [navMonth, setNavMonth] = useState(viewMonth)

  // 기록이 있는 날짜 (스토어에서 바로, 저장 즉시 반영)
  const dayKeys = useKeysWithPrefix('day-', dayHasContent)
  const savedDates = useMemo(() => new Set(dayKeys.map(k => k.slice('day-'.length))), [dayKeys])

  const prevMonth = () => {
    if (navMonth === 0) { setNavYear(navYear - 1); setNavMonth(11) }
    else setNavMonth(navMonth - 1)
  }

  const nextMonth = () => {
    if (navMonth === 11) { setNavYear(navYear + 1); setNavMonth(0) }
    else setNavMonth(navMonth + 1)
  }

  // 월의 첫째 날 요일과 마지막 날
  const firstDow = new Date(navYear, navMonth, 1).getDay()
  const daysInMonth = new Date(navYear, navMonth + 1, 0).getDate()

  // 이전 달 채우기
  const prevDays = new Date(navYear, navMonth, 0).getDate()
  const cells: { day: number; key: string; inMonth: boolean }[] = []

  for (let i = firstDow - 1; i >= 0; i--) {
    const d = prevDays - i
    const pm = navMonth === 0 ? 11 : navMonth - 1
    const py = navMonth === 0 ? navYear - 1 : navYear
    cells.push({ day: d, key: toKey(py, pm, d), inMonth: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: toKey(navYear, navMonth, d), inMonth: true })
  }

  // 다음 달 채우기 (6줄 42칸)
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const nm = navMonth === 11 ? 0 : navMonth + 1
    const ny = navMonth === 11 ? navYear + 1 : navYear
    cells.push({ day: d, key: toKey(ny, nm, d), inMonth: false })
  }

  return (
    <div className="calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth} aria-label="이전 달">&lsaquo;</button>
        <span className="cal-title">{navYear}년 {navMonth + 1}월</span>
        <button className="cal-nav" onClick={nextMonth} aria-label="다음 달">&rsaquo;</button>
      </div>
      <div className="cal-days">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`cal-day-name ${i === 0 ? 'cal-sun' : i === 6 ? 'cal-sat' : ''}`}>{d}</div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((c, i) => {
          const isToday = c.key === todayKey
          const isSelected = c.key === selectedDate
          const hasSaved = savedDates.has(c.key)
          const dow = i % 7

          return (
            <button
              key={i}
              className={`cal-cell ${!c.inMonth ? 'cal-cell--out' : ''} ${isToday ? 'cal-cell--today' : ''} ${isSelected ? 'cal-cell--selected' : ''} ${dow === 0 ? 'cal-sun' : dow === 6 ? 'cal-sat' : ''}`}
              onClick={() => onSelectDate(c.key)}
            >
              {c.day}
              {hasSaved && c.inMonth && <span className="cal-dot" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar
