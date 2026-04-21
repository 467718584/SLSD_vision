import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { ReactQueryProvider } from './components/ReactQueryProvider'
import { NotificationProvider } from './hooks/useNotification'
import './styles.css'
import './styles_roboflow.css'
import './responsive.css'

// CSRF Token管理
let csrfToken = ''

// 获取CSRF Token
export async function fetchCsrfToken(): Promise<void> {
  try {
    const res = await fetch('/api/auth/csrf')
    const data = await res.json()
    if (data.csrf_token) {
      csrfToken = data.csrf_token
    }
  } catch (e) {
    console.warn('Failed to fetch CSRF token:', e)
  }
}

// 初始化CSRF Token
fetchCsrfToken()

// 封装的fetch函数，自动添加Authorization和CSRF头
const originalFetch = window.fetch

window.fetch = async function(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('token')

  // 构建新的headers（浅拷贝，避免修改原始对象）
  const existingHeaders = options?.headers as Record<string, string> | undefined
  const headers: Record<string, string> = existingHeaders ? { ...existingHeaders } : {}

  // 对于需要认证的请求，添加token
  if (token && !url.toString().includes('/api/auth/login') && !url.toString().includes('/api/auth/register')) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 对于写请求，添加CSRF Token
  const method = (options?.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  // 添加Content-Type（如果不是FormData）
  if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await originalFetch(url, {
    ...options,
    headers
  })

  // 如果收到新的CSRF Token（来自响应头），更新它
  const newCsrfToken = response.headers.get('X-CSRF-Token')
  if (newCsrfToken) {
    csrfToken = newCsrfToken
  }

  return response
}

// 错误处理函数
function handleError(error: Error, errorInfo: React.ErrorInfo): void {
  console.error('Global error:', error, errorInfo)
  // 可以在这里添加错误上报逻辑
}

// 等待CSRF Token初始化完成
async function initApp() {
  await fetchCsrfToken()
  
  const rootElement = document.getElementById('root')
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary onError={handleError} showDetails={true}>
          <ReactQueryProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </ReactQueryProvider>
        </ErrorBoundary>
      </React.StrictMode>
    )
  }
}

// 启动应用
initApp()
