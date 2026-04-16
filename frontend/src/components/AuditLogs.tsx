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
      <div style={styles.statsContainer}>
        {/* 用户操作统计 */}
        <div style={styles.statsCard}>
          <h3 style={styles.statsTitle}>用户操作排行 (7天)</h3>
          <div style={styles.statsList}>
            {stats.user_stats?.map((item, i) => (
              <div key={i} style={styles.statsItem}>
                <span style={styles.statsUser}>{item.username || 'Unknown'}</span>
                <span style={styles.statsCount}>{item.count}次</span>
              </div>
            )) || <p style={styles.emptyText}>暂无数据</p>}
          </div>
        </div>

        {/* 资源操作统计 */}
        <div style={styles.statsCard}>
          <h3 style={styles.statsTitle}>资源操作统计 (7天)</h3>
          <div style={styles.statsList}>
            {stats.resource_stats?.map((item, i) => (
              <div key={i} style={styles.statsItem}>
                <span style={styles.statsUser}>
                  {item.resource_type || 'N/A'} / {item.action}
                </span>
                <span style={styles.statsCount}>{item.count}次</span>
              </div>
            )) || <p style={styles.emptyText}>暂无数据</p>}
          </div>
        </div>

        {/* 每日操作趋势 */}
        <div style={styles.statsCard}>
          <h3 style={styles.statsTitle}>每日操作趋势</h3>
          <div style={styles.statsList}>
            {stats.daily_stats?.slice(0, 10).map((item, i) => (
              <div key={i} style={styles.statsItem}>
                <span style={styles.statsDate}>{item.date}</span>
                <span style={{
                  ...styles.statsBadge,
                  background: getActionColor(item.action).bg,
                  color: getActionColor(item.action).text
                }}>
                  {item.action}
                </span>
                <span style={styles.statsCount}>{item.count}次</span>
              </div>
            )) || <p style={styles.emptyText}>暂无数据</p>}
          </div>
        </div>
      </div>
    )
  }

  // 渲染日志列表
  function renderLogs() {
    if (loading) {
      return (
        <div style={styles.loading}>
          <div style={styles.spinner}><RefreshIcon size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>
          <p>加载中...</p>
        </div>
      )
    }

    if (logs.length === 0) {
      return (
        <div style={styles.empty}>
          <p style={styles.emptyText}>暂无审计日志</p>
        </div>
      )
    }

    return (
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>时间</th>
              <th style={styles.th}>用户</th>
              <th style={styles.th}>操作</th>
              <th style={styles.th}>资源类型</th>
              <th style={styles.th}>资源名称</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>IP地址</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => {
              const statusStyle = getStatusColor(log.status)
              return (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{formatTime(log.created_at)}</td>
                  <td style={styles.td}>{log.username || '-'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.actionBadge,
                      background: getActionColor(log.action).bg,
                      color: getActionColor(log.action).text
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={styles.td}>{log.resource_type || '-'}</td>
                  <td style={styles.td}>{log.resource_name || '-'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: statusStyle.bg,
                      color: statusStyle.text
                    }}>
                      {log.status === 'success' ? '成功' : '失败'}
                    </span>
                  </td>
                  <td style={styles.td}>{log.ip_address || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div style={styles.header}>
          <h2 style={styles.title}>操作审计日志</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {/* 标签页 */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'logs' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('logs')}
          >
            日志列表
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'stats' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('stats')}
          >
            统计分析
          </button>
        </div>

        {/* 筛选器 */}
        {activeTab === 'logs' && (
          <div style={styles.filters}>
            <select
              style={styles.select}
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            >
              <option value="">全部操作</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
            </select>
            <select
              style={styles.select}
              value={filters.resource_type}
              onChange={e => setFilters(f => ({ ...f, resource_type: e.target.value }))}
            >
              <option value="">全部资源</option>
              <option value="dataset">数据集</option>
              <option value="model">模型</option>
              <option value="user">用户</option>
            </select>
            <button onClick={loadData} style={styles.refreshBtn}><RefreshIcon size={14} /> 刷新</button>
          </div>
        )}

        {/* 内容 */}
        <div style={styles.content}>
          {activeTab === 'logs' ? renderLogs() : renderStats()}
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '95%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1F2937'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#9CA3AF',
    padding: '0',
    lineHeight: 1
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #E5E7EB',
    padding: '0 20px'
  },
  tab: {
    padding: '12px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6B7280'
  },
  tabActive: {
    color: C.primary,
    borderBottomColor: C.primary
  } as Record<string, string>,
  filters: {
    padding: '12px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  select: {
    padding: '6px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13px',
    background: 'white'
  },
  refreshBtn: {
    padding: '6px 12px',
    background: C.primary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    marginLeft: 'auto'
  },
  content: {
    flex: 1,
    overflow: 'auto' as const,
    padding: '16px 20px'
  },
  tableWrapper: {
    overflow: 'auto' as const
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px'
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left' as const,
    background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    fontWeight: 600,
    color: '#374151',
    whiteSpace: 'nowrap' as const
  },
  tr: {
    borderBottom: '1px solid #F3F4F6'
  },
  td: {
    padding: '10px 12px',
    color: '#374151',
    verticalAlign: 'middle' as const
  },
  actionBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6B7280'
  },
  spinner: {
    fontSize: '32px',
    marginBottom: '12px'
  },
  empty: {
    textAlign: 'center' as const,
    padding: '40px'
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: '14px'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px'
  },
  statsCard: {
    background: '#F9FAFB',
    borderRadius: '8px',
    padding: '16px'
  },
  statsTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151'
  },
  statsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  statsItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #E5E7EB'
  },
  statsUser: {
    fontSize: '13px',
    color: '#374151'
  },
  statsDate: {
    fontSize: '12px',
    color: '#6B7280'
  },
  statsCount: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151'
  },
  statsBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px'
  }
}

export default AuditLogs
