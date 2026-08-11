import './global.css'
import './App.css'

import { useCallback, useState, useEffect, useRef } from 'react'
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { AuthProvider, useAuth } from './context/AuthContext'
import useTodos from './hooks/useTodos'
import TaskForm from './components/TaskForm'
import WeeklyReport from './components/WeeklyReport'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import KanbanColumn from './components/KanbanColumn'
import { getWeekStart, formatDate } from './utils/week'

const COLUMNS = [
  { key: 'pending',    label: '待办',    dot: 'bg-blue-500',   header: 'bg-blue-50',   border: 'border-blue-100',  text: 'text-blue-700' },
  { key: 'in_progress', label: '进行中',  dot: 'bg-orange-500', header: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700' },
  { key: 'completed',  label: '已完成',  dot: 'bg-emerald-500',header: 'bg-emerald-50',border: 'border-emerald-100',text: 'text-emerald-700' },
]

const PRIORITY = {
  high:   { label: '高', cls: 'bg-rose-100 text-rose-700' },
  medium: { label: '中', cls: 'bg-orange-100 text-orange-700' },
  low:    { label: '低', cls: 'bg-slate-200 text-slate-500' },
}

function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function TaskOverlay({ task, col }) {
  const pri = PRIORITY[task.priority] || PRIORITY.medium
  return (
    <div className={`rounded-2xl bg-white border ${col.border} p-3.5 shadow-xl opacity-90`}>
      <p className="font-semibold text-slate-800 text-sm">{task.title}</p>
      {task.description && <p className="mt-1 text-xs text-slate-400 line-clamp-2">{task.description}</p>}
      <div className="mt-2 flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pri.cls}`}>{pri.label}优先级</span>
      </div>
    </div>
  )
}

function KanbanApp() {
  const { user, logout } = useAuth()
  const { tasks, loading, error, editingId, addTask, updateTask, deleteTask, cancelEdit } = useTodos()

  const [editingIdLocal, setEditingIdLocal] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [taskColumns, setTaskColumns] = useState({})
  const [showAllCompleted, setShowAllCompleted] = useState(false)
  const tasksRef = useRef(tasks)
  const updateTaskRef = useRef(updateTask)

  // Calculate week boundaries
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  const weekStartStr = formatDate(weekStart)
  const weekEndFormatted = formatDate(weekEnd)

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  useEffect(() => {
    updateTaskRef.current = updateTask
  }, [updateTask])

  useEffect(() => {
    if (editingId) setEditingIdLocal(editingId)
  }, [editingId])

  useEffect(() => {
    if (!tasks || tasks.length === 0) return
    const map = {}
    tasks.forEach(t => { map[t.id] = t.status })
    setTaskColumns(map)
  }, [tasks])

  const total    = tasks?.length || 0
  // Filter completed tasks: this week by default, all if toggled
  const completedTasks = (tasks || []).filter(t => t.status === 'completed')
  const shownCompleted = showAllCompleted
    ? completedTasks
    : completedTasks.filter(t => {
        const completedAt = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt)
        return completedAt >= weekStart && completedAt <= weekEnd
      })
  const done     = shownCompleted.length
  const rate     = total === 0 ? '0%' : Math.round((done / total) * 100) + '%'

  const handleAdd = useCallback(async (title, description, status, priority) => {
    await addTask(title, description, status, priority)
    setEditingIdLocal(null)
  }, [addTask])

  const handleUpdate = useCallback(async (id, updates) => {
    await updateTask(id, updates)
    setEditingIdLocal(null)
  }, [updateTask])

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('确定要删除该任务吗？')) await deleteTask(id)
  }, [deleteTask])

  const handleStatusChange = useCallback(async (id, status) => {
    await updateTask(id, { status })
  }, [updateTask])

  const startEditForm = useCallback((id) => setEditingIdLocal(id), [])
  const cancelForm = useCallback(() => { setEditingIdLocal(null); cancelEdit() }, [cancelEdit])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: editingIdLocal !== null ? undefined : { distance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeIdNum = Number(active.id)
    const overIdStr = String(over.id)
    const currentTasks = tasksRef.current

    // Dropping on a column (cross-column drop)
    if (overIdStr.startsWith('col-')) {
      const targetCol = overIdStr.replace('col-', '')
      const activeTask = currentTasks.find(t => t.id === activeIdNum)
      if (activeTask && activeTask.status !== targetCol) {
        updateTaskRef.current(activeIdNum, { status: targetCol })
      }
      return
    }

    // Dropping on another task - update status based on which column it's in
    if (overIdStr) {
      const overTask = currentTasks.find(t => t.id === Number(overIdStr))
      if (overTask) {
        const targetCol = overTask.status
        const activeTask = currentTasks.find(t => t.id === activeIdNum)
        if (activeTask && activeTask.status !== targetCol) {
          updateTaskRef.current(activeIdNum, { status: targetCol })
        }
      }
    }
  }, [])

  const dropAnimation = useCallback(() => ({
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
  }), [])

  const activeTask = tasks?.find(t => String(t.id) === String(activeId)) || null
  const isEditing = editingIdLocal !== null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Todo 待办系统</h1>
              <p className="text-xs text-slate-400 mt-0.5">{user?.username}</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <span className="block text-2xl font-bold text-slate-800">{total}</span>
                <span className="text-xs text-slate-400">全部任务</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <span className="block text-2xl font-bold text-emerald-600">{done}</span>
                <span className="text-xs text-slate-400">已完成</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <span className="block text-2xl font-bold text-blue-600">{rate}</span>
                <span className="text-xs text-slate-400">完成率</span>
              </div>
              <button
                onClick={() => setShowAllCompleted(!showAllCompleted)}
                className={`ml-2 text-xs px-3 py-1.5 rounded-lg transition ${
                  showAllCompleted
                    ? 'bg-indigo-100 text-indigo-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title={showAllCompleted ? '只显示本周完成' : '显示全部完成'}
              >
                {showAllCompleted ? '📅 全部完成' : '📅 本周完成'}
              </button>
              <button onClick={logout} className="ml-2 text-xs text-slate-400 hover:text-rose-500 transition">退出</button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
            <aside className="flex flex-col gap-5">
              {!isEditing && (
                <TaskForm
                  editingId={null}
                  tasks={tasks}
                  onAdd={handleAdd}
                  onUpdate={handleUpdate}
                  onCancel={cancelForm}
                />
              )}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">周报概要</h2>
                <WeeklyReport tasks={tasks} />
              </div>
            </aside>

            <div className="min-w-0">
              {loading && <div className="flex items-center justify-center py-20 text-slate-400 text-sm">加载中...</div>}
              {error && <div className="flex items-center justify-center py-20 text-rose-500 text-sm">{error}</div>}
              {!loading && !error && (
                <div className="grid grid-cols-3 gap-4">
                  {COLUMNS.map(col => (
                    <KanbanColumn
                      key={col.key}
                      col={col}
                      tasks={
                        col.key === 'completed'
                          ? shownCompleted
                          : (tasks || []).filter(t => t.status === col.key)
                      }
                      onAdd={() => startEditForm(null)}
                      onEdit={startEditForm}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask && (
            <TaskOverlay task={activeTask} col={COLUMNS.find(c => c.key === activeTask.status) || COLUMNS[0]} />
          )}
        </DragOverlay>
      </div>

      {/* Edit modal — inside DndContext but z-50 so it renders above */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={cancelForm}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <TaskForm
              editingId={editingIdLocal}
              tasks={tasks}
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onCancel={cancelForm}
            />
          </div>
        </div>
      )}
    </DndContext>
  )
}

function AuthGate() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('login')
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-slate-400 text-sm">加载中...</div></div>
  if (!user) return page === 'register' ? <RegisterForm onSwitch={() => setPage('login')} /> : <LoginForm onSwitch={() => setPage('register')} />
  return <KanbanApp />
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}

export default App
