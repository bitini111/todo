import { useState, useEffect, useCallback } from 'react'
import * as taskApi from '../api/tasks'

function useTodos() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)

  // Load tasks from server on mount
  useEffect(() => {
    taskApi.fetchTasks()
      .then(data => {
        setTasks(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const addTask = useCallback(async (title, description, status, priority) => {
    const task = await taskApi.createTask({ title, description, status, priority })
    setTasks(prev => {
      const currentTasks = prev || []
      return [task, ...currentTasks]
    })
    return task
  }, [])

  // Optimistic update: update local state immediately, then sync to server
  const updateTask = useCallback(async (id, updates) => {
    // Optimistic update — use String() for safe comparison since dnd-kit returns string IDs
    setTasks(prev => (prev || []).map(t =>
      String(t.id) === String(id) ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    ))
    try {
      await taskApi.updateTask(id, updates)
    } catch (err) {
      // Revert on failure — refetch full list
      const data = await taskApi.fetchTasks()
      setTasks(data || [])
    }
  }, [])

  const deleteTask = useCallback(async (id) => {
    setTasks(prev => (prev || []).filter(t => String(t.id) !== String(id)))
    if (editingId === id) setEditingId(null)
    try {
      await taskApi.deleteTask(id)
    } catch {
      const data = await taskApi.fetchTasks()
      setTasks(data || [])
    }
  }, [editingId])

  const startEdit = useCallback((id) => {
    setEditingId(id)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  return { tasks, loading, error, editingId, addTask, updateTask, deleteTask, startEdit, cancelEdit }
}

export default useTodos
