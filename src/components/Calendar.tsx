import { useState, useEffect } from 'react'

interface CalendarProps {
  selectedDate: string       // YYYY-MM-DD
  onSelectDate: (date: string) => void
  todayKey: string
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toKey(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

function Calendar({ selectedDate, onSelectDate, todayKey }: CalendarProps) {
  const [year, month] = selectedDate.split('-').map(Number) as [number, number]
  const viewYear = year
  const viewMonth = month - 1 // 0-based

  const [navYear, setNavYear] = useState(viewYear)
  const [navMonth, setNavMonth] = useState(viewMonth)
  const [savedDates, setSavedDates] = useState<Set<string>>(new Set())

  // 저장된 날짜 목록 로드
  useEffect(() => {
    async function loadKeys() {
      if (window.electronAPI) {
        const keys = await window.electronAPI.listDayKeys()
        // keys are like "day-2026-03-23", extract the date part
        const dates = new Set(keys.map(k => k.replace('day-', '')))
        setSavedDates(dates)
      }
    }
    loadKeys()
  }, [selectedDate]) // 날짜 변경 시 갱신

  // 선택된 날짜가 바뀌면 해당 월로 이동
  useEffect(() => {
    setNavYear(viewYear)
    setNavMonth(viewMonth)
  }, [viewYear, viewMonth])

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
        <button className="cal-nav" onClick={prevMonth}>&lsaquo;</button>
        <span className="cal-title">{navYear}년 {navMonth + 1}월</span>
        <button className="cal-nav" onClick={nextMonth}>&rsaquo;</button>
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
