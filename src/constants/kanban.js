export const COLUMNS = [
  { key: 'pending',   label: '待办',    color: 'blue',   dot: 'bg-blue-500',   header: 'bg-blue-50',    border: 'border-blue-100', text: 'text-blue-700' },
  { key: 'in_progress', label: '进行中', color: 'orange', dot: 'bg-orange-500', header: 'bg-orange-50',  border: 'border-orange-100', text: 'text-orange-700' },
  { key: 'completed', label: '已完成',  color: 'green',  dot: 'bg-emerald-500',header: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
]

export const PRIORITY = {
  high:   { label: '高', cls: 'bg-rose-100 text-rose-700' },
  medium: { label: '中', cls: 'bg-orange-100 text-orange-700' },
  low:    { label: '低', cls: 'bg-slate-200 text-slate-500' },
}

export const STATUS_OPTIONS = [
  { key: 'pending',   label: '待办'   },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
]
