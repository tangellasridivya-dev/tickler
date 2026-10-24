import Avatar from '../../components/Avatar.jsx'
import { getPerson } from '../../data/people.js'
import { PriorityFlag, ProgressBadge, TaskTime } from './taskParts.jsx'

/** Groups tasks by who is doing them, keeping the column's order within each group. */
function groupByAssignee(tasks) {
  const groups = new Map()
  for (const task of tasks) {
    if (!groups.has(task.assigneeId)) groups.set(task.assigneeId, [])
    groups.get(task.assigneeId).push(task)
  }
  return [...groups.entries()]
}

/** "By me" layout: one header per person, the tasks you gave them underneath, each with its progress. */
function PersonGroups({ tasks, now, showDay, onOpen }) {
  return (
    <div className="person-groups">
      {groupByAssignee(tasks).map(([personId, list]) => {
        const person = getPerson(personId)
        const open = list.filter((t) => t.status === 'open').length
        const headingId = `group-${personId}-${list[0].id}`
        return (
          <section key={personId} className="person-group" aria-labelledby={headingId}>
            <h3 id={headingId} className="person-group__head">
              <Avatar personId={personId} size={22} label={person.name} />
              <span className="person-group__name">{person.name}</span>
              <span className="person-group__count">
                · {open === 0 ? 'all done' : `${open} ${open === 1 ? 'task' : 'tasks'}`}
              </span>
            </h3>
            <ul className="person-group__list">
              {list.map((task) => (
                <li key={task.id} className={`person-group__item${task.status === 'done' ? ' is-done' : ''}`}>
                  <PriorityFlag task={task} />
                  <button type="button" className="task-title" onClick={() => onOpen(task)}>
                    {task.title}
                  </button>
                  <TaskTime task={task} now={now} showDay={showDay} />
                  <ProgressBadge task={task} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

export default PersonGroups
