const STORAGE_KEY = 'todo-tasks'

/**
 * Read tasks from localStorage with graceful fallback.
 * Migrates legacy data: fills in missing priority, createdAt, updatedAt.
 */
export function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const tasks = JSON.parse(raw)
    const now = new Date().toISOString()
    return tasks.map(t => ({
      ...t,
      priority: t.priority || 'medium',
      createdAt: t.createdAt || now,
      updatedAt: t.updatedAt || now,
    }))
  } catch {
    return []
  }
}

export function saveTodos(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

/** Generate a UUID v4 string */
export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
