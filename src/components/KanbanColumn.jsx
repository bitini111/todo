import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableTaskCard from './SortableTaskCard'

export default function KanbanColumn({ col, tasks, onAdd, onEdit, onDelete, onStatusChange }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${col.key}`,
  })

  const taskIds = tasks.map(t => t.id)

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden transition-colors ${isOver ? 'ring-2 ring-indigo-400 ring-offset-2 bg-indigo-50/30' : ''}`}>
      {/* Column header */}
      <div className={`${col.header} px-4 py-4 flex items-center justify-between border-b ${col.border}`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`}></span>
          <span className={`text-sm font-semibold ${col.text}`}>{col.label}</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white text-slate-500 border shadow-sm">{tasks.length}</span>
        </div>
        <button
          onClick={onAdd}
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold ${col.text} hover:bg-white shadow-sm transition`}
          title="添加任务"
        >
          +
        </button>
      </div>

      {/* Drop zone with task cards - larger area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] p-3 rounded-b-2xl transition-colors ${isOver ? col.header : ''}`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className={`rounded-2xl ${col.border} border-2 border-dashed min-h-[200px] flex items-center justify-center text-sm text-slate-300`}>
              暂无任务，拖拽或点击 + 添加
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {tasks.map(task => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  col={col}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
}
