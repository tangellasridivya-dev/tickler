import CategoryIcon from './CategoryIcon.jsx'
import { CATEGORIES } from '../domain/categories.js'
import './Subtasks.css'

/** Category as a row of pills; `legendClassName` matches the surrounding form's labels. */
function CategoryPicker({ value, onChange, name, legendClassName = 'field__label' }) {
  return (
    <fieldset className="category-pills">
      <legend className={legendClassName}>Category</legend>
      {CATEGORIES.map((c) => (
        <label key={c.id} className={`category-pill${value === c.id ? ' is-on' : ''}`}>
          <input type="radio" name={name} value={c.id} checked={value === c.id} onChange={() => onChange(c.id)} />
          <CategoryIcon category={c.id} />
          {c.label}
        </label>
      ))}
    </fieldset>
  )
}

export default CategoryPicker
