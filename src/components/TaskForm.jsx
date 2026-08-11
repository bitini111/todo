import { useState, useEffect, useRef } from 'react'

const STATUSES = [
  { value: 'pending', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
]

const PRIORITIES = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
]

/** @param {object} props */
function TaskForm({ editingId, tasks, onAdd, onUpdate, onCancel }) {
  const editingTask = tasks?.find(t => t.id === editingId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('pending')
  const [priority, setPriority] = useState('medium')
  const [error, setError] = useState('')
  const titleRef = useRef(null)

  useEffect(() => {
    if (editingId && editingTask) {
      setTitle(editingTask.title)
      setDescription(editingTask.description || '')
      setStatus(editingTask.status)
      setPriority(editingTask.priority)
      setError('')
      setTimeout(() => titleRef.current?.focus(), 0)
    }
  }, [editingId])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('请输入任务标题')
      titleRef.current?.focus()
      return
    }
    if (trimmed.length > 100) {
      setError('标题不能超过100个字符')
      return
    }
    if (editingId) {
      onUpdate(editingId, { title: trimmed, description, status, priority })
      onCancel()
    } else {
      onAdd(trimmed, description, status, priority)
      setTitle('')
      setDescription('')
      setStatus('pending')
      setPriority('medium')
      setError('')
    }
  }

  const handleCancel = () => {
    setTitle('')
    setDescription('')
    setStatus('pending')
    setPriority('medium')
    setError('')
    onCancel()
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-lg shadow-slate-200/70">
      <h2 className="text-sm font-bold text-slate-900">{editingId ? '编辑任务' : '新建任务'}</h2>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500">任务标题 <span className="text-red-500">*</span></label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError('') }}
            placeholder="输入任务标题"
            maxLength={100}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <div className="mt-1 text-right text-xs text-slate-400">{title.length}/100</div>
          {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">任务描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="可选，最多500字符"
            maxLength={500}
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
          />
          <div className="mt-1 text-right text-xs text-slate-400">{description.length}/500</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-slate-500">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">优先级</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          {editingId && (
            <button type="button" className="btn btn-secondary flex-1" onClick={handleCancel}>
              取消
            </button>
          )}
          <button type="submit" className="btn btn-primary flex-1">
            {editingId ? '保存修改' : '添加任务'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskForm
