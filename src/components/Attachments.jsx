import './Attachments.css'

/**
 * Pictures that came with a task, shown under its description. Decoding is
 * left lazy so a long list of cards doesn't stall on images below the fold.
 */
function Attachments({ task, className = '' }) {
  const shots = task.attachments ?? []
  if (shots.length === 0) return null

  return (
    <span className={`attachments ${className}`}>
      {shots.map((shot) => (
        <img
          key={shot.id}
          className="attachments__shot"
          src={shot.url}
          alt={shot.alt ?? ''}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ))}
    </span>
  )
}

export default Attachments
