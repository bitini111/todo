import { useDroppable } from '@dnd-kit/core'
import SortableTaskCard from './SortableTaskCard'
import { COLUMNS } from '../constants/kanban'

/**
 * A kanban column that acts as a drop zone.
 */
export default function SortableColumn({ col, tasks, onAdd, onEdit, onDelete, onStatusChange }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${col.key}`,
  })

  return (
    <div className="flex flex-col gap-3 min-h-64">
      {/* Column header */}
      <div className={`${col.header} rounded-2xl px-4 py-3 flex items-center justify-between border border-slate-100`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${col.dot}`}></span>
          <span className={`text-sm font-semibold ${col.text}`}>{col.label}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-100">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold ${col.text} hover:bg-white transition`}
          title="添加任务"
        >
          +
        </button>
      </div>

      {/* Task cards */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-3 rounded-2xl transition-colors ${
          isOver ? 'bg-white/50' : ''
        }`}
      >
        {tasks.length === 0 ? (
          <div className={`rounded-2xl ${col.border} border-2 border-dashed p-8 text-center text-sm text-slate-300`}>
            暂无任务
          </div>
        ) : (
          tasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              col={col}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  )
}
