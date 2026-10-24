import { useRef, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'

const START_SLOP = 8 // px of movement before deciding it's a swipe or a scroll
const MAX_THRESHOLD = 96 // px; or 30% of the row, whichever is smaller

/**
 * A list row you swipe right to finish (or, if it's finished, to undo).
 * Only rightward drags are captured: vertical scrolling and leftward swipes
 * (to the next day on the board) still go to the browser. Works with touch,
 * pen and mouse. A tap that wasn't a swipe still reaches the row's buttons.
 */
function SwipeRow({ done, onSwipe, className = '', children }) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [width, setWidth] = useState(300)
  const gesture = useRef(null) // { x, y, axis, width, id, dx }
  const swallowClick = useRef(false)

  const threshold = Math.min(MAX_THRESHOLD, width * 0.3)

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      axis: null,
      width: event.currentTarget.getBoundingClientRect().width,
      id: event.pointerId,
    }
  }

  const onPointerMove = (event) => {
    const g = gesture.current
    if (!g || g.id !== event.pointerId) return
    // A mouse moving with no button held means we missed the release: end here.
    if (event.pointerType === 'mouse' && event.buttons === 0) return finish()
    const moveX = event.clientX - g.x
    const moveY = event.clientY - g.y
    if (!g.axis) {
      if (Math.abs(moveX) < START_SLOP && Math.abs(moveY) < START_SLOP) return
      g.axis = moveX > 0 && Math.abs(moveX) > Math.abs(moveY) ? 'swipe' : 'other'
      if (g.axis === 'swipe') {
        event.currentTarget.setPointerCapture(event.pointerId)
        setWidth(g.width)
        setDragging(true)
      }
    }
    if (g.axis === 'swipe') {
      g.dx = Math.max(0, moveX)
      setDx(g.dx)
    }
  }

  function finish() {
    const g = gesture.current
    gesture.current = null
    if (g?.axis !== 'swipe') return
    // Use the distance recorded on the gesture, not render state, which can lag
    // behind when moves and the release arrive in quick succession.
    const distance = g.dx ?? 0
    // Swallow only the click the browser fires right after this pointerup (if
    // any); clear the flag on the next tick so a later real tap still works.
    swallowClick.current = true
    setTimeout(() => {
      swallowClick.current = false
    }, 0)
    setDragging(false)
    if (distance >= Math.min(MAX_THRESHOLD, g.width * 0.3)) {
      navigator.vibrate?.(12)
      onSwipe()
    }
    setDx(0)
  }

  const progress = Math.min(1, dx / threshold)
  const armed = progress >= 1

  return (
    <li
      className={`swipe${dx > 0 ? ' is-swiping' : ''}${armed ? ' is-armed' : ''}${done ? ' is-done' : ''} ${className}`}
      // The task title reads this to draw a strike-through line that grows
      // with the drag, like the finger is crossing the task out.
      style={{ '--swipe-progress': progress }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onClickCapture={(event) => {
        // The click that ends a swipe shouldn't also open the task.
        if (swallowClick.current) {
          swallowClick.current = false
          event.stopPropagation()
          event.preventDefault()
        }
      }}
    >
      <span className={`swipe__action${done ? ' swipe__action--undo' : ''}`} aria-hidden="true">
        <span className="swipe__label" style={{ opacity: 0.4 + progress * 0.6, transform: `scale(${0.85 + progress * 0.15})` }}>
          {done ? <RotateCcw size={16} /> : <Check size={16} strokeWidth={2.75} />}
          {done ? 'Not done' : 'Done'}
        </span>
      </span>
      <div
        className={`swipe__content${dragging ? '' : ' swipe__content--settle'}`}
        style={dx ? { transform: `translateX(${dx}px)` } : undefined}
      >
        {children}
      </div>
    </li>
  )
}

export default SwipeRow
