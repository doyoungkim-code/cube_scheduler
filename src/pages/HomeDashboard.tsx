import HomeHeader from '../components/HomeHeader'
import MenuCard from '../components/MenuCard'
import { useDayData, todayKey } from '../hooks/useDayData'
import { useKanbanData } from '../hooks/useKanbanData'
import type { ViewId } from '../types/navigation'

const MENU_CARDS: { id: ViewId; icon: string; title: string; subtitle: string }[] = [
  { id: 'scheduler', icon: '📋', title: '스케줄러 & 칸반보드', subtitle: '시간표와 작업 관리' },
  { id: 'today-dashboard', icon: '📊', title: '오늘의 대시보드', subtitle: '오늘 활동 요약과 진행률' },
  { id: 'pattern-analysis', icon: '📈', title: '주간/월간 패턴 분석', subtitle: '활동 트렌드와 히트맵' },
  { id: 'habit-tracker', icon: '✅', title: '습관 트래커', subtitle: '매일 습관 체크와 스트릭' },
  { id: 'quick-memo', icon: '📝', title: '퀵 메모 / 오늘 일기', subtitle: '간단한 메모와 일기장' },
  { id: 'settings', icon: '⚙️', title: '환경설정', subtitle: '테마, 활동, 데이터 관리' },
]

interface Props {
  onNavigate: (view: ViewId) => void
}

export default function HomeDashboard({ onNavigate }: Props) {
  const today = todayKey()
  const data = useDayData(today)
  const kanban = useKanbanData()

  return (
    <div className="home">
      <div className="home-drag-region" />
      <HomeHeader
        todaySlots={data.day.slots}
        tickets={kanban.tickets}
      />
      <div className="home-grid">
        {MENU_CARDS.map(card => (
          <MenuCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            subtitle={card.subtitle}
            onClick={() => onNavigate(card.id)}
          />
        ))}
      </div>
    </div>
  )
}
