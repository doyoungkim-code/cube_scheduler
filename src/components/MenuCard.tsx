interface Props {
  icon: string
  title: string
  subtitle: string
  onClick: () => void
}

export default function MenuCard({ icon, title, subtitle, onClick }: Props) {
  return (
    <div className="home-card" onClick={onClick}>
      <span className="home-card-icon">{icon}</span>
      <div className="home-card-text">
        <span className="home-card-title">{title}</span>
        <span className="home-card-subtitle">{subtitle}</span>
      </div>
    </div>
  )
}
