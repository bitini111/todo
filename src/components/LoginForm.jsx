import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

function LoginForm({ onSwitch }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const usernameRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) {
      setError('请输入用户名')
      usernameRef.current?.focus()
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }
    setSubmitting(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Todo 待办系统</h1>
        <h2>登录</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-username">用户名</label>
            <input
              ref={usernameRef}
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError('') }}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">密码</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
        <p className="auth-switch">
          还没有账号？<button className="btn-link" onClick={onSwitch}>立即注册</button>
        </p>
      </div>
    </div>
  )
}

export default LoginForm
