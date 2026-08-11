import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // { token, username } | null
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth-token')
    const username = localStorage.getItem('auth-username')
    if (token && username) {
      setUser({ token, username })
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password)
    localStorage.setItem('auth-token', data.token)
    localStorage.setItem('auth-username', data.username)
    setUser({ token: data.token, username: data.username })
  }, [])

  const register = useCallback(async (username, password) => {
    const data = await authApi.register(username, password)
    localStorage.setItem('auth-token', data.token)
    localStorage.setItem('auth-username', data.username)
    setUser({ token: data.token, username: data.username })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-username')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
