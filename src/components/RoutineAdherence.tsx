import { useState, useEffect } from 'react'
import type { DayData, WeeklyRoutines, DayOfWeek } from '../types/schedule'
import { dayKeyFromDate } from '../types/schedule'

interface Props {
  weekly: WeeklyRoutines
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

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RoutineAdherence({ weekly }: Props) {
  const [stats, setStats] = useState<DayStat[]>([])
  const [overall, setOverall] = useState<number>(0)

  useEffect(() => {
    async function load() {
      if (!window.electronAPI) return
      // 지난 28일 집계
      const dayMap = new Map<DayOfWeek, { match: number; total: number; samples: Set<string> }>()
      for (const d of DAY_LABELS) {
        dayMap.set(d.key, { match: 0, total: 0, samples: new Set() })
      }

      const now = new Date()
      for (let i = 0; i < 28; i++) {
        const date = new Date(now)
        date.setDate(now.getDate() - i)
        const dk = dateKey(date)
        const dayOfWeek = dayKeyFromDate(date)
        const routines = weekly[dayOfWeek]
        if (routines.length === 0) continue

        const saved = await window.electronAPI.loadData(`day-${dk}`) as DayData | null
        if (!saved?.slots) continue

        // 루틴 슬롯 계산
        let totalRoutineSlots = 0
        let matchedSlots = 0
        for (const r of routines) {
          for (let m = r.startMin; m < r.endMin; m += 10) {
            totalRoutineSlots++
            const slot = saved.slots[m]
            if (slot && slot.label === r.name) matchedSlots++
          }
        }

        const entry = dayMap.get(dayOfWeek)!
        entry.match += matchedSlots
        entry.total += totalRoutineSlots
        entry.samples.add(dk)
      }

      const result: DayStat[] = DAY_LABELS.map(d => {
        const e = dayMap.get(d.key)!
        return {
          key: d.key,
          label: d.label,
          rate: e.total > 0 ? Math.round((e.match / e.total) * 100) : 0,
          samples: e.samples.size,
        }
      })
      setStats(result)

      let totalMatch = 0, totalSlots = 0
      for (const e of dayMap.values()) { totalMatch += e.match; totalSlots += e.total }
      setOverall(totalSlots > 0 ? Math.round((totalMatch / totalSlots) * 100) : 0)
    }
    load()
  }, [weekly])

  return (
    <div className="adherence">
      <div className="adherence-header">
        <span className="adherence-title">요일별 이행률</span>
        <span className="adherence-overall">지난 4주 평균 <strong>{overall}%</strong></span>
      </div>
      <div className="adherence-bars">
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
