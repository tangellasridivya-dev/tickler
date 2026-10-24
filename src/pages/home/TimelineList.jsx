import Avatar from '../../components/Avatar.jsx'
import { CURRENT_USER_ID, getPerson } from '../../data/people.js'
import { PriorityFlag, TaskCheck } from './taskParts.jsx'

/**
 * "To me" layout: picture, then "Name – task description", then the priority
 * flag and the checkbox. Tasks arrive open-first (see getBoardColumns), so
 * ticked ones sit at the bottom.
 */
function TimelineList({ tasks, onToggle, onOpen }) {
  return (
    <ol className="timeline">
      {tasks.map((task) => {
        const from = task.createdBy
        const fromName = from === CURRENT_USER_ID ? 'You' : getPerson(from).name
        return (
          <li key={task.id} className={`timeline__item${task.status === 'done' ? ' is-done' : ''}`}>
            <Avatar personId={from} size={22} label={`From ${fromName}`} />
            <button type="button" className="task-title" onClick={() => onOpen(task)}>
              <span className="timeline__from">{fromName}</span>
              <span className="timeline__sep" aria-hidden="true">
                {' – '}
              </span>
              <span className="visually-hidden">: </span>
              {task.title}
            </button>
            <PriorityFlag task={task} />
            <TaskCheck task={task} onToggle={onToggle} />
          </li>
        )
      })}
    </ol>
  )
}

export default TimelineList
