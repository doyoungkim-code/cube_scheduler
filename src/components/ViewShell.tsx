interface Props {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

/** 서브 페이지 공통 래퍼: 제목 줄 + 본문 */
export default function ViewShell({ title, description, actions, children }: Props) {
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-text">
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-desc">{description}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      <div className="page-body">{children}</div>
    </div>
  )
}
