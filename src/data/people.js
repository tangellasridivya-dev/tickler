// People the current user coordinates tasks with. There is no account system
// yet, so this is a fixed household and circle; replace with real data once one exists.
// `photo` is a picture URL. These are free placeholder portraits from randomuser.me;
// swap in real photos any time. Without a photo (or if it fails to load),
// coloured initials are shown.
export const CURRENT_USER_ID = 'me'

const portrait = (path) => `https://randomuser.me/api/portraits/med/${path}.jpg`

export const PEOPLE = [
  { id: CURRENT_USER_ID, name: 'Sridivya', relation: 'Me', color: '#0f6cbd', photo: portrait('women/44') },
  { id: 'maya', name: 'Maya', relation: 'Partner', color: '#c239b3', photo: portrait('women/68') },
  { id: 'arjun', name: 'Arjun', relation: 'Brother', color: '#038387', photo: portrait('men/32') },
  { id: 'leela', name: 'Leela', relation: 'Sister', color: '#ca5010', photo: portrait('women/65') },
  { id: 'ananya', name: 'Ananya', relation: 'Mom', color: '#8764b8', photo: portrait('women/4') },
  { id: 'vikram', name: 'Vikram', relation: 'Dad', color: '#498205', photo: portrait('men/5') },
  { id: 'priya', name: 'Priya', relation: 'Friend', color: '#e3008c', photo: portrait('women/12') },
  { id: 'rahul', name: 'Rahul', relation: 'Colleague', color: '#004e8c', photo: portrait('men/75') },
]

export function getPerson(id) {
  return PEOPLE.find((p) => p.id === id) ?? { id, name: 'Someone', relation: '', color: '#616161', photo: null }
}

export const currentUser = () => getPerson(CURRENT_USER_ID)
