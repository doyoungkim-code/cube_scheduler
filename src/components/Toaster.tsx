import { useUiStore } from '../store/ui'

/** 화면 아래 가운데 토스트 스택. 되돌리기 버튼이 있으면 누르고 나서 사라진다. */
export default function Toaster() {
  const toasts = useUiStore(s => s.toasts)
  const dismiss = useUiStore(s => s.dismissToast)
  if (toasts.length === 0) return null
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.tone === 'danger' ? 'toast--danger' : ''}`}>
          <span className="toast-msg">{t.message}</span>
          {t.actionLabel && t.onAction && (
            <button className="toast-action" onClick={() => { t.onAction?.(); dismiss(t.id) }}>{t.actionLabel}</button>
          )}
          <button className="toast-close" aria-label="닫기" onClick={() => dismiss(t.id)}>&times;</button>
        </div>
      ))}
    </div>
  )
}
