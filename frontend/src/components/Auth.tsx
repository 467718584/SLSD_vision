import React, { useState } from 'react'
import { C } from '../constants'

// 用户类型
interface User {
  username: string
  role: 'admin' | 'user' | 'viewer'
  email?: string
}

// Login Props
interface LoginProps {
  onSuccess: (user: User) => void
}

// Register Props
interface RegisterProps {
  onSuccess: (user: User) => void
  onSwitchToLogin: () => void
}

// UserInfo Props
interface UserInfoProps {
  user: User | null
  onLogout: () => void
}

// 登录组件
function Login({ onSuccess }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        if (onSuccess) onSuccess(data.user)
      } else {
        setError(data.error || '登录失败')
      }
    } catch (err: any) {
      setError('网络错误: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>SLSD Vision</h2>
          <p style={styles.subtitle}>机器视觉管理平台</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.hint}>默认账户: admin / admin123</span>
        </div>
      </div>
    </div>
  )
}

// 注册组件
function Register({ onSuccess, onSwitchToLogin }: RegisterProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度至少6位')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email })
      })
      const data = await res.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        if (onSuccess) onSuccess(data.user)
      } else {
        setError(data.error || '注册失败')
      }
    } catch (err: any) {
      setError('网络错误: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>注册账户</h2>
          <p style={styles.subtitle}>创建新账户</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>邮箱 (可选)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码 (至少6位)"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '注册中...' : '注册'}
          </button>

          <button
            type="button"
            onClick={onSwitchToLogin}
            style={styles.switchBtn}
          >
            已有账户？返回登录
          </button>
        </form>
      </div>
    </div>
  )
}

// 用户信息组件
function UserInfo({ user, onLogout }: UserInfoProps) {
  return (
    <div style={styles.userInfo}>
      <span style={styles.username}>{user?.username}</span>
      <span style={styles.role}>（{user?.role === 'admin' ? '管理员' : '用户'}）</span>
      <button onClick={onLogout} style={styles.logoutBtn}>登出</button>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '380px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: C.primary,
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: C.gray3,
    margin: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: C.gray2
  },
  input: {
    padding: '12px 16px',
    border: `1px solid ${C.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '14px',
    background: C.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'background 0.2s'
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: C.primary,
    fontSize: '13px',
    cursor: 'pointer',
    padding: '8px'
  },
  error: {
    padding: '12px 16px',
    background: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '8px',
    fontSize: '13px'
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center' as const
  },
  hint: {
    fontSize: '12px',
    color: C.gray3
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  username: {
    fontWeight: 500,
    color: C.gray1
  },
  role: {
    fontSize: '12px',
    color: C.gray3
  },
  logoutBtn: {
    padding: '6px 12px',
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: '4px',
    fontSize: '12px',
    color: C.gray2,
    cursor: 'pointer',
    marginLeft: '8px'
  }
}

export { Login, Register, UserInfo }
