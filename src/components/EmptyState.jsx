import './EmptyState.css'

function EmptyState({ icon: Icon, tone = 'neutral', title, children, action, compact = false }) {
  return (
    <div className={`empty-state empty-state--${tone}${compact ? ' empty-state--compact' : ''}`}>
      {Icon && (
        <span className="empty-state__icon" aria-hidden="true">
          <Icon size={compact ? 20 : 24} />
        </span>
      )}
      <div className="empty-state__text">
        <p className="empty-state__title">{title}</p>
        {children && <p className="empty-state__body">{children}</p>}
      </div>
      {action}
    </div>
  )
}

export default EmptyState
