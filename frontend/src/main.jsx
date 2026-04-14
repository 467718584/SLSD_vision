import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

// 封装的fetch函数，自动添加Authorization头
const originalFetch = window.fetch

window.fetch = async function(url, options = {}) {
  const token = localStorage.getItem('token')
  
  const headers = {
    ...options.headers,
  }
  
  // 对于需要认证的请求，添加token
  if (token && !url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // 添加Content-Type（如果不是FormData）
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  
  return originalFetch(url, {
    ...options,
    headers
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
