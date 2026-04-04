import { useState, useEffect, useCallback, useRef } from 'react'
import { useDayData, todayKey } from '../hooks/useDayData'
import { useKanbanData } from '../hooks/useKanbanData'
import { ROOM_MAP } from './SchedulerView'
import type { ViewId } from '../types/navigation'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const TEAR_THRESHOLD = 60

const QUOTES = [
  '오늘 하루도 최선을 다하자.',
  '작은 진전도 진전이다.',
  '시작이 반이다.',
  '꾸준함이 재능을 이긴다.',
  '지금 이 순간에 집중하자.',
  '어제보다 나은 오늘을 만들자.',
  '실패는 성공의 어머니.',
  '할 수 있다고 믿으면 반은 이룬 것이다.',
  '멈추지 않으면 얼마나 천천히 가는지는 중요하지 않다.',
  '오늘의 노력이 내일의 나를 만든다.',
]

interface MenuDef {
  id: ViewId
  title: string
  color: string
}

const MENUS: MenuDef[] = [
  { id: 'scheduler', title: 'SCHEDULER & KANBAN', color: '#e8a87c' },
  { id: 'today-dashboard', title: 'TODAY DASHBOARD', color: '#4a9eff' },
  { id: 'pattern-analysis', title: 'PATTERN ANALYSIS', color: '#34c759' },
  { id: 'habit-tracker', title: 'HABIT TRACKER', color: '#af52de' },
  { id: 'quick-memo', title: 'QUICK MEMO', color: '#ff9500' },
]

interface Props {
  onNavigate: (view: ViewId) => void
}

// 각 메뉴 티켓의 내용을 렌더
function TicketContent({ id, data }: { id: ViewId; data: ReturnType<typeof useContentData> }) {
  switch (id) {
    case 'scheduler':
      return (
        <>
          <div className="ht-row">
            <span className="ht-label">TIME</span>
            <span className="ht-value">{data.timeStr}</span>
            <span className="ht-label" style={{ marginLeft: 'auto' }}>DATE</span>
            <span className="ht-value">{data.dateStr}</span>
          </div>
          <div className="ht-row">
            <span className="ht-label">현재 활동</span>
            <span className="ht-value">{data.currentActivity || '없음'}</span>
          </div>
          <div className="ht-mini-timeline">
            {data.timeline.map((c, i) => (
              <div key={i} className={`ht-mini-b ${i === data.nowIdx ? 'ht-mini-b--now' : ''}`}
                style={c ? { background: c } : undefined} />
            ))}
          </div>
        </>
      )
    case 'today-dashboard':
      return (
        <>
          <div className="ht-row">
            <span className="ht-label">기록시간</span>
            <span className="ht-value">{data.recordedHours}h</span>
            <span className="ht-label" style={{ marginLeft: 'auto' }}>활동 수</span>
            <span className="ht-value">{data.activityCount}개</span>
          </div>
          <div className="ht-kanban-row">
            <span className="ht-pill">할일 {data.todo}</span>
            <span className="ht-pill ht-pill--progress">진행 {data.progress}</span>
            <span className="ht-pill ht-pill--done">완료 {data.done}</span>
          </div>
        </>
      )
    case 'pattern-analysis':
      return (
        <div className="ht-row">
          <span className="ht-desc">주간/월간 활동 트렌드, 히트맵, 수면/운동 통계</span>
        </div>
      )
    case 'habit-tracker':
      return (
        <div className="ht-row">
          <span className="ht-desc">매일 습관 체크, 연속 달성 스트릭, 목표 관리</span>
        </div>
      )
    case 'quick-memo':
      return (
        <div className="ht-row">
          <span className="ht-desc">오늘의 일기, 간단한 메모장</span>
        </div>
      )
    default:
      return null
  }
}

function useContentData() {
  const today = todayKey()
  const data = useDayData(today)
  const kanban = useKanbanData()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowSlotMin = Math.floor(nowMin / 10) * 10
  const currentSlot = data.day.slots[nowSlotMin]

  const timeline = Array.from({ length: 144 }, (_, i) => {
    const slot = data.day.slots[i * 10]
    return slot ? slot.color : null
  })

  // 활동별 집계
  const actSet = new Set<string>()
  let filledMins = 0
  for (let m = 0; m < 1440; m += 10) {
    const s = data.day.slots[m]
    if (s) { filledMins += 10; actSet.add(s.label) }
  }

  return {
    now,
    timeStr: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    dateStr: `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`,
    dayName: DAY_NAMES[now.getDay()],
    currentActivity: currentSlot?.label ?? '',
    roomImg: ROOM_MAP[currentSlot?.label ?? ''] ?? './room.png',
    timeline,
    nowIdx: Math.floor(nowMin / 10),
    recordedHours: Math.round(filledMins / 60 * 10) / 10,
    activityCount: actSet.size,
    todo: kanban.tickets.filter(t => t.status === 'todo').length,
    progress: kanban.tickets.filter(t => t.status === 'progress').length,
    done: kanban.tickets.filter(t => t.status === 'done').length,
    seconds: String(now.getSeconds()).padStart(2, '0'),
  }
}

function HomeTicket({ menu, data, onTear }: { menu: MenuDef; data: ReturnType<typeof useContentData>; onTear: () => void }) {
  const [tearDrag, setTearDrag] = useState<{ startX: number; currentX: number } | null>(null)
  const [tornOff, setTornOff] = useState(false)
  const tearingRef = useRef(false)

  const dragDist = tearDrag ? Math.max(0, tearDrag.currentX - tearDrag.startX) : 0
  const tearProgress = Math.min(1, dragDist / TEAR_THRESHOLD)

  const handleStubDown = useCallback((e: React.MouseEvent) => {
    if (tornOff) return
    e.stopPropagation(); e.preventDefault()
    tearingRef.current = true
    setTearDrag({ startX: e.clientX, currentX: e.clientX })
  }, [tornOff])

  useEffect(() => {
    if (!tearDrag) return
    const onMove = (e: MouseEvent) => setTearDrag(prev => prev ? { ...prev, currentX: e.clientX } : null)
    const onUp = () => {
      if (tearDrag && Math.max(0, tearDrag.currentX - tearDrag.startX) >= TEAR_THRESHOLD) {
        setTornOff(true)
        setTimeout(onTear, 500)
      }
      setTearDrag(null)
      tearingRef.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [tearDrag, onTear])

  const stubStyle: React.CSSProperties | undefined =
    tornOff ? undefined
    : tearDrag ? { transform: `translateX(${dragDist}px) rotate(${tearProgress * 5}deg)`, transition: 'none' }
    : undefined

  const perfStyle: React.CSSProperties | undefined =
    tearDrag && !tornOff ? { width: `${2 + tearProgress * 8}px`, transition: 'none' } : undefined

  return (
    <div
      className={`ht ${tornOff ? 'ht--torn' : ''} ${tearDrag ? 'ht--tearing' : ''}`}
      onClick={tornOff ? undefined : onTear}
    >
      <div className="ht-stripe" style={{ background: menu.color }} />
      <div className="ht-body">
        <div className="ht-topbar" style={{ background: menu.color }}>
          <span className="ht-topbar-title">{menu.title}</span>
          <div className="ht-topbar-info">
            <span>DATE</span><strong>{data.dateStr}</strong>
          </div>
        </div>
        <div className="ht-content">
          <TicketContent id={menu.id} data={data} />
        </div>
        <div className="ht-footer">
          <span className="ht-barcode-text">T-{menu.id.toUpperCase().slice(0, 8)}</span>
        </div>
      </div>
      <div className="ht-perf" style={perfStyle}>
        <div className="ht-perf-notch ht-perf-notch--top" />
        <div className="ht-perf-dots" />
        <div className="ht-perf-notch ht-perf-notch--bottom" />
      </div>
      <div className="ht-stub" style={{ ...stubStyle, backgroundColor: menu.color }} onMouseDown={handleStubDown}>
        <span className="ht-stub-text">ENTER</span>
        <div className="ht-zigzag" />
      </div>
    </div>
  )
}

export default function HomeDashboard({ onNavigate }: Props) {
  const contentData = useContentData()
  const d = contentData.now
  const quoteIdx = (d.getFullYear() * 366 + (d.getMonth()+1) * 31 + d.getDate()) % QUOTES.length

  return (
    <div className="home">
      <div className="home-drag-region" />
      <div className="home-layout">
        <div className="home-side">
          <div className="home-clock">
            {contentData.timeStr}
            <span className="home-clock-sec">:{contentData.seconds}</span>
          </div>
          <div className="home-date">{contentData.dateStr} {contentData.dayName}</div>
          <div className="home-quote">"{QUOTES[quoteIdx]}"</div>
          <button className="home-settings-btn" onClick={() => onNavigate('settings')}>
            ⚙️
          </button>
        </div>
        <div className="home-tickets">
          {MENUS.map(menu => (
            <HomeTicket key={menu.id} menu={menu} data={contentData} onTear={() => onNavigate(menu.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}
