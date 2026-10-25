import { useId, useState } from 'react'
import { Check } from 'lucide-react'
import Attachments from '../../components/Attachments.jsx'
import Avatar from '../../components/Avatar.jsx'
import { SubtaskList, SubtaskToggle } from '../../components/Subtasks.jsx'
import { getPerson } from '../../data/people.js'
import { useCelebrateOnDone } from '../../lib/useCelebrateOnDone.js'
import SwipeRow from './SwipeRow.jsx'
import { DueParts, PriorityTag } from './taskParts.jsx'
import './TimelineCards.css'

function TaskCard({ task, now, onToggle, onOpen, onToggleSubtask }) {
  const [showSubtasks, setShowSubtasks] = useState(false)
  const listId = useId()
  const from = getPerson(task.createdBy)
  const done = task.status === 'done'
  const hasSubtasks = task.subtasks?.length > 0
  const celebrating = useCelebrateOnDone(done)
  const open = () => onOpen(task)

  return (
    <SwipeRow done={done} onSwipe={() => onToggle(task, !done)} className="task-card-row">
      <article className={`task-card${done ? ' is-done' : ''}${celebrating ? ' is-celebrating' : ''}`}>
        <div className="task-card__top">
          <Avatar personId={task.createdBy} size={34} label={from.name} />
          <span className="task-card__who">
            <span className="task-card__name">{from.name}</span>
            <span className="task-card__meta">
              <PriorityTag task={task} />
              <span aria-hidden="true">·</span>
              <DueParts task={task} now={now} />
            </span>
          </span>
          {/* A real checkbox, not nested in the open-card button below. */}
          <label className="task-card__check">
            <input
              type="checkbox"
              checked={done}
              onChange={() => onToggle(task, !done)}
              aria-label={done ? 'Mark as not done' : 'Mark as done'}
            />
            <span className="task-card__box" aria-hidden="true">
              {done && <Check size={13} strokeWidth={3} />}
            </span>
          </label>
        </div>

        {/* The whole body opens the task; a div (not a button) so the
            subtask pill inside can be its own real, independently-tappable button. */}
        <div
          className="task-card__body"
          role="button"
          tabIndex={0}
          onClick={open}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              open()
            }
          }}
        >
          <span className="task-card__desc">
            {task.title}
            {done && <span className="visually-hidden"> (done)</span>}
          </span>
          <Attachments task={task} className="attachments--large" />
          {hasSubtasks && (
            <SubtaskToggle
              task={task}
              open={showSubtasks}
              onToggle={(event) => {
                event.stopPropagation()
                setShowSubtasks((v) => !v)
              }}
              listId={listId}
            />
          )}
        </div>
        {/* Inside the card (not a sibling below it), so the card's background
            and rounded corners visibly extend to cover the open subtasks. */}
        {showSubtasks && hasSubtasks && (
          <SubtaskList task={task} id={listId} onToggleSubtask={onToggleSubtask} className="task-card__subtasks" />
        )}
      </article>
    </SwipeRow>
  )
}

/**
 * "To me" as a feed of cards, one per task: the sender's picture and name on
 * top (checkbox in the corner), with priority, time and day under it; then the
 * description, any pictures that came with it, and the "1/3" pill if the task
 * has subtasks. Each card carries its own date, so it still reads correctly
 * wherever it sits. Checking the box (or swiping the card right) marks it done.
 */
function TimelineCards({ tasks, now, onToggle, onOpen, onToggleSubtask }) {
  return (
    <ol className="task-cards">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          now={now}
          onToggle={onToggle}
          onOpen={onOpen}
          onToggleSubtask={onToggleSubtask}
        />
      ))}
    </ol>
  )
}

export default TimelineCards
