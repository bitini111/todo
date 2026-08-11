import { apiPost } from './client'

export function login(username, password) {
  return apiPost('/login', { username, password })
}

export function register(username, password) {
  return apiPost('/register', { username, password })
}
