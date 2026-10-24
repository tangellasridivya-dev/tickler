import { SCOPES } from '../../domain/selectors.js'

/** A small two-option switch: To me / By me. */
function ScopeTabs({ value, onChange }) {
  const index = SCOPES.findIndex((s) => s.id === value)

  return (
    <div className="scope-switch" role="radiogroup" aria-label="Show tasks">
      <span
        className="scope-switch__thumb"
        style={{ transform: `translateX(${index * 100}%)` }}
        aria-hidden="true"
      />
      {SCOPES.map((scope) => (
        <label key={scope.id} className="scope-switch__option">
          <input
            type="radio"
            name="scope"
            value={scope.id}
            checked={scope.id === value}
            onChange={() => onChange(scope.id)}
          />
          <span>{scope.label}</span>
        </label>
      ))}
    </div>
  )
}

export default ScopeTabs
