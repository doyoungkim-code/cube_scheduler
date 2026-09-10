import { useNow } from '../hooks/useNow'
import { pad2 } from '../lib/slots'

interface Props {
  roomImg: string
  currentLabel: string
  currentColor?: string
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

/** 현재 활동에 따라 바뀌는 방 이미지 + 시계 카드. 초 단위 시계는 이 컴포넌트만 리렌더한다. */
export default function RoomCard({ roomImg, currentLabel, currentColor }: Props) {
  const now = useNow(1000)
  return (
    <section className="room-card">
      <div className="room-card-img-wrap">
        <img className="room-card-img" src={roomImg} alt="" />
      </div>
      <div className="room-card-info">
        <div className="room-card-clock">
          {pad2(now.getHours())}:{pad2(now.getMinutes())}
          <span className="room-card-sec">:{pad2(now.getSeconds())}</span>
        </div>
        <div className="room-card-date">
          {now.getFullYear()}.{pad2(now.getMonth() + 1)}.{pad2(now.getDate())} {DAY_NAMES[now.getDay()]}
        </div>
        <div className="room-card-activity">
          {currentLabel
            ? <span className="room-card-pill" style={{ background: currentColor }}>{currentLabel}</span>
            : <span className="room-card-pill room-card-pill--empty">지금 하는 일 없음</span>}
        </div>
      </div>
    </section>
  )
}
