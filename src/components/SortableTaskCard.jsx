import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const STATUS_STYLE = {
  pending:    { label: '待办',   cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '进行中', cls: 'bg-orange-100 text-orange-700' },
  completed:  { label: '已完成', cls: 'bg-emerald-100 text-emerald-700' },
}

const PRIORITY = {
  high:   { label: '高', cls: 'bg-rose-100 text-rose-700' },
  medium: { label: '中', cls: 'bg-orange-100 text-orange-700' },
  low:    { label: '低', cls: 'bg-slate-200 text-slate-500' },
}

export default function SortableTaskCard({ task, col, onEdit, onDelete, onStatusChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const pri = PRIORITY[task.priority] || PRIORITY.medium
  const statusStyle = STATUS_STYLE[task.status] || STATUS_STYLE.pending

  const fmtTime = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-2xl bg-white border ${col.border} p-3.5 shadow-sm hover:shadow-md transition cursor-grab active:cursor-grabbing select-none`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-slate-800 text-sm leading-snug">{task.title}</span>
        <div className="flex gap-0.5 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(task.id) }} className="p-1 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition" title="编辑">✎</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id) }} className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition" title="删除">✕</button>
        </div>
      </div>
      {task.description && <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.cls}`}>{statusStyle.label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pri.cls}`}>{pri.label}优先级</span>
        <span className="text-xs text-slate-300">{fmtTime(task.createdAt)}</span>
      </div>
    </div>
  )
}
