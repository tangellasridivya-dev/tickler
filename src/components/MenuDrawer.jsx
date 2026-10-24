import { useEffect, useRef } from 'react'
import { Plus, UserRound, Users, X } from 'lucide-react'
import Avatar from './Avatar.jsx'
import { CURRENT_USER_ID, PEOPLE, currentUser } from '../data/people.js'
import { hrefFor } from '../lib/router.js'
import './MenuDrawer.css'

/**
 * Side menu opened from the top bar. Built on <dialog> for focus trapping and
 * Escape-to-close. Just the three places you actually go — notifications
 * already have their own bell in the header, so they stay out of here.
 */
function MenuDrawer({ open, onClose, path, mineCount }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const me = currentUser()
  const household = PEOPLE.filter((p) => p.id !== CURRENT_USER_ID).length
  const items = [
    // Your own to-dos for today: a calm count, not an alert.
    { href: hrefFor('/mine'), path: '/mine', icon: UserRound, label: 'My tasks', count: mineCount, quiet: true },
    { href: hrefFor('/'), path: '/', icon: Users, label: 'Shared with me' },
    { href: hrefFor('/new'), path: '/new', icon: Plus, label: 'New task' },
  ]

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-label="Menu"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className="drawer__panel">
          <div className="drawer__head">
            <Avatar personId={CURRENT_USER_ID} size={40} label={me.name} />
            <div className="drawer__who">
              <p className="drawer__name">{me.name}</p>
              <p className="drawer__meta">{household} people in your circle</p>
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close menu">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Main">
            <ul className="drawer__list">
              {items.map(({ href, path: itemPath, icon: Icon, label, count, quiet }) => (
                <li key={itemPath}>
                  <a
                    className="drawer__item"
                    href={href}
                    aria-current={path === itemPath ? 'page' : undefined}
                    onClick={onClose}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{label}</span>
                    {count > 0 && (
                      <span className={`drawer__count${quiet ? ' drawer__count--quiet' : ''}`}>{count}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="drawer__foot">Tickler · tasks for you and your family</p>
        </div>
      )}
    </dialog>
  )
}

export default MenuDrawer
