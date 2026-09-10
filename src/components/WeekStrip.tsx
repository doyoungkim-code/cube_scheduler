import { useMemo } from 'react'
import type { TimeSlot } from '../types/schedule'
import { weekOf, compressDayBar, parseDateKey } from '../lib/slots'
import { useDaysSlots } from '../hooks/useDayData'

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
  const days = useMemo(() => weekOf(selectedDate), [selectedDate])
  const docs = useDaysSlots(days)

  const bars = useMemo(() => days.map((dk, i) => {
    const slots = dk === selectedDate ? currentSlots : (docs[i] ?? {})
    return compressDayBar(slots)
  }), [days, docs, selectedDate, currentSlots])

  return (
    <div className="week-strip">
      {days.map((dk, i) => {
        const d = parseDateKey(dk)
        const segs = bars[i]
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
