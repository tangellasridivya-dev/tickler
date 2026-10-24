// People the current user coordinates tasks with. There is no account system
// yet, so this is a fixed family and circle; replace with real data once one exists.
// `photo` is a picture URL. These are free portraits from Unsplash (unsplash.com,
// free to use under the Unsplash License), cropped to the face; swap in real
// photos any time. Without a photo (or if it fails to load), coloured initials show.
export const CURRENT_USER_ID = 'me'

const portrait = (id) => `https://images.unsplash.com/photo-${id}?w=128&h=128&fit=crop&crop=faces&q=80`

export const PEOPLE = [
  { id: CURRENT_USER_ID, name: 'Sridivya', relation: 'Me', color: '#0b7d73', photo: portrait('1706943262459-3ef6ce03305c') },
  { id: 'karthik', name: 'Karthik', relation: 'Husband', color: '#c239b3', photo: portrait('1757744705465-ea08b0ddc38a') },
  { id: 'arjun', name: 'Arjun', relation: 'Brother', color: '#038387', photo: portrait('1625241152315-4a698f74ceb7') },
  { id: 'lakshmi', name: 'Lakshmi', relation: 'Sister', color: '#ca5010', photo: portrait('1618245472177-2a74ad3b994a') },
  { id: 'padma', name: 'Padma', relation: 'Mom', color: '#8764b8', photo: portrait('1533128361669-69c065857a13') },
  { id: 'venkat', name: 'Venkat', relation: 'Dad', color: '#498205', photo: portrait('1774437678561-c321687f6986') },
  { id: 'priya', name: 'Priya', relation: 'Friend', color: '#e3008c', photo: portrait('1595754883593-e274aaa13580') },
  { id: 'rahul', name: 'Rahul', relation: 'Colleague', color: '#004e8c', photo: portrait('1653055645127-54ec96add7b5') },
]

export function getPerson(id) {
  return PEOPLE.find((p) => p.id === id) ?? { id, name: 'Someone', relation: '', color: '#616161', photo: null }
}

export const currentUser = () => getPerson(CURRENT_USER_ID)
