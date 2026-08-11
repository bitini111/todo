import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/** @param {object} props */
function TaskCard({ task, onStatusChange, onEdit, onDelete, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDndDragging,
  } = useSortable({ id: String(task.id) })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDndDragging ? 0.4 : 1,
  }

  const priorityLabel = { high: '高', medium: '中', low: '低' }[task.priority]

  const handleDelete = () => {
    if (window.confirm('确定要删除该任务吗？')) {
      onDelete(task.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card${isDragging ? ' dragging' : ''}`}
    >
      <div className="card-header">
        <span className="card-title">{task.title}</span>
        <span className={`priority-badge ${task.priority}`}>{priorityLabel}</span>
      </div>
      {task.description && (
        <div className="card-desc">{task.description}</div>
      )}
      <div className="card-footer">
        <select
          className="status-select"
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
        >
          <option value="pending">待办</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
        </select>
        <div className="card-actions">
          <button
            className="btn-icon edit"
            title="编辑"
            onClick={(e) => { e.stopPropagation(); onEdit(task.id) }}
          >
            ✎
          </button>
          <button
            className="btn-icon delete"
            title="删除"
            onClick={(e) => { e.stopPropagation(); handleDelete() }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
