interface Props {
  now: Date
  roomImg: string
  currentLabel: string
  currentColor?: string
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
function pad(n: number) { return String(n).padStart(2, '0') }

/** 현재 활동에 따라 바뀌는 방 이미지 + 시계 카드 */
export default function RoomCard({ now, roomImg, currentLabel, currentColor }: Props) {
  return (
    <section className="room-card">
      <div className="room-card-img-wrap">
        <img className="room-card-img" src={roomImg} alt="" />
      </div>
      <div className="room-card-info">
        <div className="room-card-clock">
          {pad(now.getHours())}:{pad(now.getMinutes())}
          <span className="room-card-sec">:{pad(now.getSeconds())}</span>
        </div>
        <div className="room-card-date">
          {now.getFullYear()}.{pad(now.getMonth() + 1)}.{pad(now.getDate())} {DAY_NAMES[now.getDay()]}
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
