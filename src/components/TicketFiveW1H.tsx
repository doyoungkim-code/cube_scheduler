import type { FiveW1H } from '../types/kanban'

const LABELS: { key: keyof FiveW1H; label: string }[] = [
  { key: 'why', label: '왜 (Why)' },
  { key: 'what', label: '무엇을 (What)' },
  { key: 'where', label: '어디서 (Where)' },
  { key: 'when', label: '언제 (When)' },
  { key: 'who', label: '누가 (Who)' },
  { key: 'how', label: '어떻게 (How)' },
]

interface Props {
  value: FiveW1H
  onChange: (value: FiveW1H) => void
}

export default function TicketFiveW1H({ value, onChange }: Props) {
  return (
    <div className="ticket-section">
      <div className="ticket-section-title">육하원칙</div>
      <div className="ticket-5w1h-grid">
        {LABELS.map(({ key, label }) => (
          <div key={key} className="ticket-field">
            <label className="ticket-field-label">{label}</label>
            <textarea
              className="ticket-field-textarea"
              value={value[key]}
              onChange={e => onChange({ ...value, [key]: e.target.value })}
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
