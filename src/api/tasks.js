import { apiGet, apiPost, apiPut, apiDelete } from './client'

export function fetchTasks() {
  return apiGet('/tasks')
}

export function createTask(task) {
  return apiPost('/tasks', task)
}

export function updateTask(id, updates) {
  return apiPut(`/tasks/${id}`, updates)
}

export function deleteTask(id) {
  return apiDelete(`/tasks/${id}`)
}
