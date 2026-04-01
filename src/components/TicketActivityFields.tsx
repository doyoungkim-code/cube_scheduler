import type { ActivitySpecificFields } from '../types/kanban'

interface Props {
  value: ActivitySpecificFields
  onChange: (value: ActivitySpecificFields) => void
}

export default function TicketActivityFields({ value, onChange }: Props) {
  if (value.type === 'exercise') {
    const d = value.data
    const update = (partial: Partial<typeof d>) =>
      onChange({ type: 'exercise', data: { ...d, ...partial } })

    return (
      <div className="ticket-section">
        <div className="ticket-section-title">운동 상세</div>
        <div className="ticket-activity-fields-row">
          <div className="ticket-field">
            <label className="ticket-field-label">운동 종류</label>
            <input
              className="ticket-field-input"
              value={d.exerciseType}
              onChange={e => update({ exerciseType: e.target.value })}
              placeholder="러닝, 웨이트, 수영 등"
            />
          </div>
          <div className="ticket-field">
            <label className="ticket-field-label">거리 (km)</label>
            <input
              className="ticket-field-input"
              value={d.km}
              onChange={e => update({ km: e.target.value })}
              placeholder="0"
            />
          </div>
          <div className="ticket-field">
            <label className="ticket-field-label">시간 (분)</label>
            <input
              className="ticket-field-input"
              value={d.minutes}
              onChange={e => update({ minutes: e.target.value })}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    )
  }

  if (value.type === 'algorithm') {
    const d = value.data
    const update = (partial: Partial<typeof d>) =>
      onChange({ type: 'algorithm', data: { ...d, ...partial } })

    return (
      <div className="ticket-section">
        <div className="ticket-section-title">알고리즘 상세</div>
        <div className="ticket-activity-fields-row">
          <div className="ticket-field">
            <label className="ticket-field-label">문제 번호</label>
            <input
              className="ticket-field-input"
              value={d.problemNumber}
              onChange={e => update({ problemNumber: e.target.value })}
              placeholder="예: 1234"
            />
          </div>
          <div className="ticket-field">
            <label className="ticket-field-label">풀이 시간</label>
            <input
              className="ticket-field-input"
              value={d.solveTime}
              onChange={e => update({ solveTime: e.target.value })}
              placeholder="예: 30분"
            />
          </div>
          <div className="ticket-field">
            <label className="ticket-field-label">링크</label>
            <input
              className="ticket-field-input"
              value={d.link}
              onChange={e => update({ link: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>
    )
  }

  return null
}
