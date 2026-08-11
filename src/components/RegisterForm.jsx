import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

function RegisterForm({ onSwitch }) {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
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
    if (username.trim().length < 2 || username.trim().length > 50) {
      setError('用户名长度需要2-50个字符')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }
    if (password.length < 4) {
      setError('密码长度不能少于4个字符')
      return
    }
    if (password !== confirm) {
      setError('两次密码输入不一致')
      return
    }
    setSubmitting(true)
    try {
      await register(username.trim(), password)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Todo 待办系统</h1>
        <h2>注册</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-username">用户名</label>
            <input
              ref={usernameRef}
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError('') }}
              placeholder="2-50个字符"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">密码</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="最少4个字符"
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-confirm">确认密码</label>
            <input
              id="reg-confirm"
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError('') }}
              placeholder="再次输入密码"
              autoComplete="new-password"
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
        <p className="auth-switch">
          已有账号？<button className="btn-link" onClick={onSwitch}>立即登录</button>
        </p>
      </div>
    </div>
  )
}

export default RegisterForm
