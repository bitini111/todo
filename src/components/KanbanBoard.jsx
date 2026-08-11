import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import TaskCard from './TaskCard'

const COLUMNS = [
  { key: 'pending', label: '待办', emoji: '📋' },
  { key: 'in_progress', label: '进行中', emoji: '🔄' },
  { key: 'completed', label: '已完成', emoji: '✅' },
]

/** A single droppable column — tasks can be dropped here to change status */
function DroppableColumn({ col, tasks, onStatusChange, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${col.key}` })

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${col.key}${isOver ? ' drag-over' : ''}`}
    >
      <div className="column-header">
        <span>{col.emoji} {col.label}</span>
        <span className="count">{tasks.length}</span>
      </div>
      <div className="column-tasks">
        <SortableContext
          items={tasks.map(t => String(t.id))}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="empty-col">拖拽任务到这里</div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

/** @param {object} props */
function KanbanBoard({ columns, onStatusChange, onEdit, onDelete }) {
  return (
    <div className="kanban">
      {COLUMNS.map(col => (
        <DroppableColumn
          key={col.key}
          col={col}
          tasks={columns[col.key] || []}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default KanbanBoard
