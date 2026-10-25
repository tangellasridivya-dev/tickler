import { sectionDate, sectionTitle, visibleSections } from './daySections.js'
import './DaySections.css'

/**
 * The days of the board stacked down the page — one heading per day, its tasks
 * underneath — instead of columns you scroll sideways through. `children` is
 * given each day's column and renders the list for it, so every board can keep
 * its own row design while sharing the dates. `tools` rides on the first
 * heading, where the board's filter and date jump live.
 */
function DaySections({ columns, now, emptyText, tools, children }) {
  const sections = visibleSections(columns)
  if (sections.length === 0) return <p className="day-empty">{emptyText}</p>

  return (
    <div className="day-sections">
      {sections.map((column, index) => {
        const title = sectionTitle(column, now)
        const date = sectionDate(column)
        const headingId = `day-${column.id}`
        return (
          <section key={column.id} className="day-section" aria-labelledby={headingId}>
            <div className="day-section__bar">
              <h2 id={headingId} className={`day-section__title${title === 'Today' ? ' is-today' : ''}`}>
                {title}
                {date && <span className="day-section__date">{date}</span>}
              </h2>
              {index === 0 && tools && <span className="day-section__tools">{tools}</span>}
            </div>
            {children(column)}
          </section>
        )
      })}
    </div>
  )
}

export default DaySections
