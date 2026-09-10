import { useMemo } from 'react'
import type { WeeklyRoutinesView, DayOfWeek } from '../types/schedule'
import { dayKeyFromDate } from '../types/schedule'
import { dateKeyOf, parseDateKey, shiftDateKey } from '../lib/slots'
import { useDaysSlots } from '../hooks/useDayData'

interface Props {
  weekly: WeeklyRoutinesView
}

interface DayStat {
  key: DayOfWeek
  label: string
  rate: number  // 0-100
  samples: number
}

const DAY_LABELS: { key: DayOfWeek; label: string }[] = [
  { key: 'mon', label: '월' }, { key: 'tue', label: '화' }, { key: 'wed', label: '수' },
  { key: 'thu', label: '목' }, { key: 'fri', label: '금' }, { key: 'sat', label: '토' }, { key: 'sun', label: '일' },
]

const WINDOW_DAYS = 28

export default function RoutineAdherence({ weekly }: Props) {
  const today = dateKeyOf(new Date())
  const dateKeys = useMemo(
    () => Array.from({ length: WINDOW_DAYS }, (_, i) => shiftDateKey(today, -i)),
    [today],
  )
  const docs = useDaysSlots(dateKeys)
  const loading = docs.some(d => d === undefined)

  const { stats, overall } = useMemo(() => {
    const dayMap = new Map<DayOfWeek, { match: number; total: number; samples: Set<string> }>()
    for (const d of DAY_LABELS) dayMap.set(d.key, { match: 0, total: 0, samples: new Set() })

    dateKeys.forEach((dk, i) => {
      const dayOfWeek = dayKeyFromDate(parseDateKey(dk))
      const routines = weekly[dayOfWeek] ?? []
      if (routines.length === 0) return
      const slots = docs[i]
      if (!slots || Object.keys(slots).length === 0) return

      let total = 0
      let matched = 0
      for (const r of routines) {
        for (let m = r.startMin; m < r.endMin; m += 10) {
          total++
          const slot = slots[m]
          if (slot && slot.activityId === r.activityId) matched++
        }
      }
      const entry = dayMap.get(dayOfWeek)!
      entry.match += matched
      entry.total += total
      entry.samples.add(dk)
    })

    const stats: DayStat[] = DAY_LABELS.map(d => {
      const e = dayMap.get(d.key)!
      return {
        key: d.key,
        label: d.label,
        rate: e.total > 0 ? Math.round((e.match / e.total) * 100) : 0,
        samples: e.samples.size,
      }
    })
    let totalMatch = 0, totalSlots = 0
    for (const e of dayMap.values()) { totalMatch += e.match; totalSlots += e.total }
    return { stats, overall: totalSlots > 0 ? Math.round((totalMatch / totalSlots) * 100) : 0 }
  }, [dateKeys, docs, weekly])

  return (
    <div className="adherence">
      <div className="adherence-header">
        <span className="adherence-title">요일별 이행률</span>
        <span className="adherence-overall">지난 4주 평균 <strong>{overall}%</strong></span>
      </div>
      {loading ? <div className="adherence-loading">로딩 중...</div> : null}
      <div className="adherence-bars" style={loading ? { opacity: 0.3 } : undefined}>
        {stats.map(s => (
          <div key={s.key} className="adherence-bar-row">
            <span className="adherence-day">{s.label}</span>
            <div className="adherence-bar-bg">
              <div className="adherence-bar-fill" style={{ width: `${s.rate}%` }} />
            </div>
            <span className="adherence-pct">{s.samples > 0 ? `${s.rate}%` : '-'}</span>
            <span className="adherence-samples">{s.samples}일</span>
          </div>
        ))}
      </div>
    </div>
  )
}
