import { useEffect, useState } from 'react'
import type { DayData, TimeSlot } from '../types/schedule'
import { storage } from '../lib/storage'
import { weekOf, compressDayBar, parseDateKey } from '../lib/slots'

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']

interface Props {
  selectedDate: string
  todayKey: string
  /** 현재 편집 중인 날의 슬롯 (저장 전 상태도 바로 반영) */
  currentSlots: Record<number, TimeSlot>
  onSelectDate: (key: string) => void
}

/** 이번 주 7일 미니 스트립. 각 날의 타임라인을 가는 색 막대로 압축해 보여 준다. */
export default function WeekStrip({ selectedDate, todayKey, currentSlots, onSelectDate }: Props) {
  const days = weekOf(selectedDate)
  const [bars, setBars] = useState<Record<string, ReturnType<typeof compressDayBar>>>({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      const out: Record<string, ReturnType<typeof compressDayBar>> = {}
      for (const dk of days) {
        if (dk === selectedDate) { out[dk] = compressDayBar(currentSlots); continue }
        const saved = await storage.loadData(`day-${dk}`) as DayData | null
        out[dk] = compressDayBar(saved?.slots ?? {})
      }
      if (!cancelled) setBars(out)
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, currentSlots])

  return (
    <div className="week-strip">
      {days.map((dk, i) => {
        const d = parseDateKey(dk)
        const segs = bars[dk] ?? []
        const filled = segs.some(s => s.color)
        return (
          <button
            key={dk}
            className={`week-strip-day ${dk === selectedDate ? 'week-strip-day--selected' : ''} ${dk === todayKey ? 'week-strip-day--today' : ''}`}
            onClick={() => onSelectDate(dk)}
          >
            <span className={`week-strip-name ${i === 5 ? 'cal-sat' : i === 6 ? 'cal-sun' : ''}`}>{DAY_NAMES[i]}</span>
            <span className="week-strip-date">{d.getDate()}</span>
            <span className={`week-strip-bar ${filled ? '' : 'week-strip-bar--empty'}`}>
              {segs.map((s, j) => (
                <span key={j} style={{ width: `${s.pct}%`, background: s.color ?? 'transparent' }} />
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}
