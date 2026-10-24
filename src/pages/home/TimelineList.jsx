import { useId, useState } from 'react'
import { Check } from 'lucide-react'
import Avatar from '../../components/Avatar.jsx'
import { CURRENT_USER_ID, getPerson } from '../../data/people.js'
import { useCelebrateOnDone } from '../../lib/useCelebrateOnDone.js'
import SwipeRow from './SwipeRow.jsx'
import { SubtaskList, SubtaskToggle } from '../../components/Subtasks.jsx'
import { PriorityFlag, RepeatIcon, TaskTime } from './taskParts.jsx'

function TimelineRow({ task, now, showDay, onToggle, onOpen, onToggleSubtask }) {
  const [showSubtasks, setShowSubtasks] = useState(false)
  const listId = useId()
  const from = task.createdBy
  const fromOther = from !== CURRENT_USER_ID
  const done = task.status === 'done'
  const hasSubtasks = task.subtasks?.length > 0
  const celebrating = useCelebrateOnDone(done)
  return (
    <SwipeRow done={done} onSwipe={() => onToggle(task, !done)}>
      <div className={`timeline__item${done ? ' is-done' : ''}${celebrating ? ' is-celebrating' : ''}`}>
        {/* My tasks has no one else's picture, so no spacer either — the
            description starts right at the edge instead of leaving a gap. */}
        {fromOther && (
          <span className="timeline__avatar">
            <Avatar personId={from} size={28} label={`From ${getPerson(from).name}`} />
            {celebrating && (
              <span className="task-celebrate-badge" aria-hidden="true">
                <Check size={14} strokeWidth={3} />
              </span>
            )}
          </span>
        )}
        <div className="timeline__content">
          <button
            type="button"
            className="task-title"
            onClick={() => onOpen(task)}
            aria-description={done ? 'Done. Swipe right to mark as not done.' : 'Swipe right to mark as done.'}
          >
            {fromOther && (
              <>
                <span className="timeline__from">{getPerson(from).name}</span>
                <span className="timeline__sep" aria-hidden="true">
                  {' – '}
                </span>
                <span className="visually-hidden">: </span>
              </>
            )}
            {task.title}
            {done && <span className="visually-hidden"> (done)</span>}
          </button>
          {/* Priority and time sit under the description, not competing with it on one line. */}
          <span className="timeline__meta">
            <PriorityFlag task={task} />
            <TaskTime task={task} now={now} showDay={showDay} />
            <RepeatIcon task={task} />
          </span>
          {hasSubtasks && (
            <span className="timeline__sub-row">
              <SubtaskToggle task={task} open={showSubtasks} onToggle={() => setShowSubtasks((v) => !v)} listId={listId} />
            </span>
          )}
        </div>
      </div>
      {showSubtasks && hasSubtasks && <SubtaskList task={task} id={listId} onToggleSubtask={onToggleSubtask} />}
    </SwipeRow>
  )
}

/**
 * "To me" layout. Tasks from other people show their picture and "Name – task";
 * your own tasks show just the task, flush to the edge. Priority and time sit
 * on their own line under the description, with a "1/3" pill below that if
 * the task has subtasks. Swipe a row right to mark it done — the title
 * crosses itself out as you drag, and a brief flash marks it finishing.
 * Tasks arrive open-first (see getBoardColumns), so finished ones sit last.
 */
function TimelineList({ tasks, now, showDay, onToggle, onOpen, onToggleSubtask }) {
  return (
    <ol className="timeline">
      {tasks.map((task) => (
        <TimelineRow
          key={task.id}
          task={task}
          now={now}
          showDay={showDay}
          onToggle={onToggle}
          onOpen={onOpen}
          onToggleSubtask={onToggleSubtask}
        />
      ))}
    </ol>
  )
}

export default TimelineList
