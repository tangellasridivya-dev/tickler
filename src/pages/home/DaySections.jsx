import { sectionTitle, visibleSections } from './daySections.js'
import './DaySections.css'

/**
 * The days of the board stacked down the page — one heading per day, its tasks
 * underneath — instead of columns you scroll sideways through. `children` is
 * given each day's column and renders the list for it, so every board can keep
 * its own row design while sharing the dates.
 */
function DaySections({ columns, now, emptyText, children }) {
  const sections = visibleSections(columns)
  if (sections.length === 0) return <p className="day-empty">{emptyText}</p>

  return (
    <div className="day-sections">
      {sections.map((column) => {
        const title = sectionTitle(column, now)
        const headingId = `day-${column.id}`
        return (
          <section key={column.id} className="day-section" aria-labelledby={headingId}>
            <h2 id={headingId} className={`day-section__title${title === 'Today' ? ' is-today' : ''}`}>
              {title}
            </h2>
            {children(column)}
          </section>
        )
      })}
    </div>
  )
}

export default DaySections
