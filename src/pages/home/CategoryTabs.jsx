import { BOARD_FILTERS } from '../../domain/selectors.js'
import './CategoryTabs.css'

/**
 * Filter tabs under the header: All, the categories, Overdue and Priority.
 * The selected one is an outlined tab that opens into the line beneath it.
 */
function CategoryTabs({ value, onChange }) {
  return (
    <div className="category-tabs" role="group" aria-label="Filter tasks">
      <span className="category-tabs__edge" aria-hidden="true" />
      {BOARD_FILTERS.map((filter) => {
        const selected = filter.id === value
        return (
          <button
            key={filter.id}
            type="button"
            className={`category-tab${selected ? ' is-selected' : ''}`}
            aria-pressed={selected}
            onClick={(event) => {
              onChange(filter.id)
              event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
            }}
          >
            {filter.label}
          </button>
        )
      })}
      <span className="category-tabs__edge category-tabs__edge--end" aria-hidden="true" />
    </div>
  )
}

export default CategoryTabs
