import React, { useState, useEffect } from 'react'
import { FolderIcon, CpuIcon, UserIcon, RefreshIcon } from './Icons'

interface Activity {
  id: number
  action: string
  user: string
  target: string
  timestamp: string
  type: 'dataset' | 'model' | 'user' | 'login' | 'settings'
}

function formatTimeAgo(timestamp: string): string {
  if (!timestamp) return '-'
  const diff = Date.now() - new Date(timestamp).getTime()
  if (isNaN(diff)) return '-'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

function getActionText(action: string, resourceType?: string): string {
  const actionMap: Record<string, string> = {
    'create': '创建',
    'update': '更新',
    'delete': '删除',
    'login': '登录',
    'logout': '登出',
    'upload': '上传',
    'download': '下载',
    'export': '导出',
  }
  const base = actionMap[action] || action
  if (resourceType === 'login' || resourceType === 'user') {
    if (action === 'login') return '登录了系统'
    if (action === 'create') return '注册了新账户'
  }
  return base
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  async function loadActivities() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
      const res = await fetch('/api/audit/recent', { headers })
      if (!res.ok) {
        // API返回404或其他错误，静默处理
        console.warn('Failed to load activities:', res.status)
        setActivities([])
        return
      }
      const data = await res.json()
      if (data && Array.isArray(data)) {
        setActivities(data)
      } else if (data && data.activities) {
        setActivities(data.activities || [])
      } else {
        setActivities([])
      }
    } catch (err) {
      console.error('Failed to load activities:', err)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const icons: Record<string, React.ReactNode> = {
    dataset: <FolderIcon size={16} />,
    model: <CpuIcon size={16} />,
    user: <UserIcon size={16} />,
    login: <UserIcon size={16} />,
    settings: <FolderIcon size={16} />,
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">最近活动</h3>
        </div>
        <div className="card-body text-center p-6">
          <RefreshIcon size={20} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h3 className="card-title">最近活动</h3>
        <button
          onClick={loadActivities}
          className="btn btn-ghost btn-sm"
          title="刷新"
        >
          <RefreshIcon size={14} />
        </button>
      </div>
      <div className="card-body" style={{ padding: '0' }}>
        {activities.length === 0 ? (
          <div className="text-center p-6 text-muted text-sm">暂无活动记录</div>
        ) : (
          <div>
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3"
                style={{ borderBottom: '1px solid #E5E7EB' }}
              >
                <div className="text-muted" style={{ flexShrink: 0 }}>
                  {icons[activity.type] || icons.user}
                </div>
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-muted"> {getActionText(activity.action, activity.type)} </span>
                  <span className="font-medium">{activity.target}</span>
                </div>
                <div className="text-xs text-muted" style={{ flexShrink: 0 }}>
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
