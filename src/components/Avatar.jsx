import { useState } from 'react'
import { getPerson } from '../data/people.js'
import './Avatar.css'

const initials = (name) =>
  name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

/** Person picture, falling back to coloured initials when there is no photo or it fails to load. */
function Avatar({ personId, size = 24, label }) {
  const person = getPerson(personId)
  const [failed, setFailed] = useState(false)
  const showPhoto = person.photo && !failed
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) }

  return (
    <span
      className="avatar-pic"
      style={{ ...style, background: showPhoto ? undefined : person.color }}
      role="img"
      aria-label={label ?? person.name}
      title={label ?? person.name}
    >
      {showPhoto ? (
        <img
          src={person.photo}
          alt=""
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(person.name)
      )}
    </span>
  )
}

export default Avatar
