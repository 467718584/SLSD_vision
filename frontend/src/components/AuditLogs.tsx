import React, { useState, useEffect } from 'react'
import { C } from '../constants'
import { RefreshIcon } from './Icons'

// 审计日志类型定义
interface AuditLog {
  id: number
  username?: string
  action: string
  resource_type?: string
  resource_name?: string
  status?: string
  ip_address?: string
  created_at?: string
}

interface AuditStats {
  user_stats?: { username?: string; count: number }[]
  resource_stats?: { resource_type?: string; action: string; count: number }[]
  daily_stats?: { date: string; action: string; count: number }[]
}

interface AuditLogsProps {
  onClose: () => void
}

// 审计日志组件
function AuditLogs({ onClose }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'logs' | 'stats'>('logs')
  const [filters, setFilters] = useState({
    action: '',
    resource_type: ''
  })

  useEffect(() => {
    loadData()
  }, [filters])

  async function loadData() {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = { 'Authorization': `Bearer ${token}` }

      // 并行加载日志和统计
      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/audit/logs?limit=100&action=${filters.action}&resource_type=${filters.resource_type}`, { headers }),
        fetch('/api/audit/stats?days=7', { headers })
      ])

      const logsData = await logsRes.json()
      const statsData = await statsRes.json()

      if (logsData.success) setLogs(logsData.logs || [])
      if (statsData.success) setStats(statsData.stats)
    } catch (err) {
      console.error('Failed to load audit data:', err)
    }
    setLoading(false)
  }

  // 格式化时间
  function formatTime(timestamp?: string) {
    if (!timestamp) return '-'
    const d = new Date(timestamp)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 获取状态颜色
  function getStatusColor(status?: string) {
    switch (status) {
      case 'success': return { bg: '#D1FAE5', text: '#065F46' }
      case 'error': return { bg: '#FEE2E2', text: '#991B1B' }
      default: return { bg: '#F3F4F6', text: '#374151' }
    }
  }

  // 获取操作类型颜色
  function getActionColor(action: string) {
    switch (action) {
      case 'create': return { bg: '#D1FAE5', text: '#065F46' }
      case 'update': return { bg: '#DBEAFE', text: '#1E40AF' }
      case 'delete': return { bg: '#FEE2E2', text: '#991B1B' }
      case 'login': return { bg: '#EDE9FE', text: '#5B21B6' }
      default: return { bg: '#F3F4F6', text: '#374151' }
    }
  }

  // 渲染统计图表
  function renderStats() {
    if (!stats) return null

    return (
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* 用户操作统计 */}
        <div className="p-4 rounded-lg" style={{ background: '#F9FAFB' }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#374151' }}>用户操作排行 (7天)</h3>
          <div className="flex flex-col gap-2">
            {stats.user_stats?.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <span className="text-sm" style={{ color: '#374151' }}>{item.username || 'Unknown'}</span>
                <span className="text-sm font-medium" style={{ color: '#374151' }}>{item.count}次</span>
              </div>
            )) || <p className="text-sm" style={{ color: '#9CA3AF' }}>暂无数据</p>}
          </div>
        </div>

        {/* 资源操作统计 */}
        <div className="p-4 rounded-lg" style={{ background: '#F9FAFB' }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#374151' }}>资源操作统计 (7天)</h3>
          <div className="flex flex-col gap-2">
            {stats.resource_stats?.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <span className="text-sm" style={{ color: '#374151' }}>
                  {item.resource_type || 'N/A'} / {item.action}
                </span>
                <span className="text-sm font-medium" style={{ color: '#374151' }}>{item.count}次</span>
              </div>
            )) || <p className="text-sm" style={{ color: '#9CA3AF' }}>暂无数据</p>}
          </div>
        </div>

        {/* 每日操作趋势 */}
        <div className="p-4 rounded-lg" style={{ background: '#F9FAFB' }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#374151' }}>每日操作趋势</h3>
          <div className="flex flex-col gap-2">
            {stats.daily_stats?.slice(0, 10).map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <span className="text-xs" style={{ color: '#6B7280' }}>{item.date}</span>
                <span className="text-xs px-2 py-1 rounded" style={{
                  background: getActionColor(item.action).bg,
                  color: getActionColor(item.action).text
                }}>
                  {item.action}
                </span>
                <span className="text-sm font-medium" style={{ color: '#374151' }}>{item.count}次</span>
              </div>
            )) || <p className="text-sm" style={{ color: '#9CA3AF' }}>暂无数据</p>}
          </div>
        </div>
      </div>
    )
  }

  // 渲染日志列表
  function renderLogs() {
    if (loading) {
      return (
        <div className="text-center p-10" style={{ color: '#6B7280' }}>
          <div className="mb-3" style={{ fontSize: '32px' }}><RefreshIcon size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>
          <p>加载中...</p>
        </div>
      )
    }

    if (logs.length === 0) {
      return (
        <div className="text-center p-10">
          <p className="text-sm" style={{ color: '#9CA3AF' }}>暂无审计日志</p>
        </div>
      )
    }

    return (
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="table th">时间</th>
              <th className="table th">用户</th>
              <th className="table th">操作</th>
              <th className="table th">资源类型</th>
              <th className="table th">资源名称</th>
              <th className="table th">状态</th>
              <th className="table th">IP地址</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => {
              const statusStyle = getStatusColor(log.status)
              return (
                <tr key={i} className="table tr">
                  <td className="table td">{formatTime(log.created_at)}</td>
                  <td className="table td">{log.username || '-'}</td>
                  <td className="table td">
                    <span className="text-xs px-2 py-1 rounded font-medium" style={{
                      background: getActionColor(log.action).bg,
                      color: getActionColor(log.action).text
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td className="table td">{log.resource_type || '-'}</td>
                  <td className="table td">{log.resource_name || '-'}</td>
                  <td className="table td">
                    <span className="text-xs px-2 py-1 rounded font-medium" style={{
                      background: statusStyle.bg,
                      color: statusStyle.text
                    }}>
                      {log.status === 'success' ? '成功' : '失败'}
                    </span>
                  </td>
                  <td className="table td">{log.ip_address || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '95%', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* 标题栏 */}
        <div className="modal-header">
          <h2 className="font-semibold" style={{ margin: 0, fontSize: '18px', color: '#1F2937' }}>操作审计日志</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ fontSize: '24px', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* 标签页 */}
        <div className="flex" style={{ borderBottom: '1px solid #E5E7EB', padding: '0 20px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'logs' ? '' : 'btn-ghost'}`}
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'logs' ? '2px solid ' + C.primary : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              color: activeTab === 'logs' ? C.primary : '#6B7280'
            }}
          >
            日志列表
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'stats' ? '' : 'btn-ghost'}`}
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'stats' ? '2px solid ' + C.primary : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              color: activeTab === 'stats' ? C.primary : '#6B7280'
            }}
          >
            统计分析
          </button>
        </div>

        {/* 筛选器 */}
        {activeTab === 'logs' && (
          <div className="flex gap-3 items-center p-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
            <select
              className="input"
              style={{ padding: '6px 12px', width: 'auto' }}
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            >
              <option value="">全部操作</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
            </select>
            <select
              className="input"
              style={{ padding: '6px 12px', width: 'auto' }}
              value={filters.resource_type}
              onChange={e => setFilters(f => ({ ...f, resource_type: e.target.value }))}
            >
              <option value="">全部资源</option>
              <option value="dataset">数据集</option>
              <option value="model">模型</option>
              <option value="user">用户</option>
            </select>
            <button onClick={loadData} className="btn btn-primary btn-sm flex items-center gap-1" style={{ marginLeft: 'auto' }}>
              <RefreshIcon size={14} /> 刷新
            </button>
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'logs' ? renderLogs() : renderStats()}
        </div>
      </div>
    </div>
  )
}

export default AuditLogs