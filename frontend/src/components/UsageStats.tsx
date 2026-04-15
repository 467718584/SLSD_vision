import React, { useState, useEffect, useRef } from 'react'
import { C } from '../constants'

// 类型定义
interface UsageSummary {
  total_datasets: number
  total_models: number
  total_raw_data: number
  active_users: number
}

interface DailyStat {
  date_period: string
  count: number
}

interface UsageDaily {
  datasets: DailyStat[]
  models: DailyStat[]
  raw_data: DailyStat[]
  users: DailyStat[]
}

interface UsageStatsData {
  period: string
  days: number
  summary: UsageSummary
  daily: UsageDaily
}

interface UsageStatsProps {
  onClose?: () => void
}

// 样式
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    height: '100%',
    overflow: 'auto',
    background: C.bg,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: C.gray1,
    margin: 0,
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  filterBtn: {
    padding: '6px 16px',
    borderRadius: '6px',
    border: `1px solid ${C.border}`,
    background: C.white,
    cursor: 'pointer',
    fontSize: '13px',
    color: C.gray2,
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    background: C.primary,
    color: C.white,
    border: `1px solid ${C.primary}`,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center' as const,
  },
  statIcon: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: C.primary,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: C.gray3,
  },
  chartSection: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: C.gray1,
    marginBottom: '16px',
  },
  chartContainer: {
    position: 'relative' as const,
    height: '240px',
  },
  chart: {
    width: '100%',
    height: '100%',
  },
  tableSection: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: '12px',
    padding: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    borderBottom: `1px solid ${C.border}`,
    color: C.gray3,
    fontWeight: 500,
  },
  td: {
    padding: '10px 12px',
    borderBottom: `1px solid ${C.border}`,
    color: C.gray2,
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: C.gray4,
    fontSize: '13px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: C.gray3,
  },
}

// 简单柱状图组件（不依赖外部图表库）
function SimpleBarChart({ data, color, height = 200 }: { data: { label: string; value: number }[], color: string, height?: number }) {
  if (!data || data.length === 0) {
    return <div style={{ ...styles.empty, height }}>暂无数据</div>
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const barWidth = Math.max(20, Math.min(60, (700 / data.length) - 8))

  return (
    <div style={{ position: 'relative', height }}>
      <svg width="100%" height={height} style={{ overflow: 'visible' }}>
        {/* Y轴网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = height - (ratio * (height - 40)) - 20
          const val = Math.round(maxValue * ratio)
          return (
            <g key={i}>
              <line
                x1="40"
                y1={y}
                x2="100%"
                y2={y}
                stroke={C.border}
                strokeDasharray="4,4"
              />
              <text
                x="35"
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill={C.gray4}
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* X轴 */}
        <line x1="40" y1={height - 20} x2="100%" y2={height - 20} stroke={C.border} />

        {/* 柱状图 */}
        {data.map((d, i) => {
          const barH = Math.max(2, ((d.value / maxValue) * (height - 40)))
          const x = 40 + i * (barWidth + 8)
          const y = height - 20 - barH
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={color}
                rx="3"
                opacity="0.85"
              />
              <text
                x={x + barWidth / 2}
                y={height - 5}
                textAnchor="middle"
                fontSize="10"
                fill={C.gray3}
              >
                {d.label.length > 6 ? d.label.slice(-5) : d.label}
              </text>
              {d.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill={color}
                  fontWeight={500}
                >
                  {d.value}
                </text>
              )}
            </g>
          )
        })}

        {/* Y轴标签 */}
        <text
          x="15"
          y={height / 2}
          textAnchor="middle"
          fontSize="11"
          fill={C.gray3}
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          数量
        </text>
      </svg>
    </div>
  )
}

// 简单折线图组件
function SimpleLineChart({ data, color, height = 200 }: { data: { label: string; value: number }[], color: string, height?: number }) {
  if (!data || data.length === 0) {
    return <div style={{ ...styles.empty, height }}>暂无数据</div>
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const points = data.map((d, i) => {
    const x = 50 + (i / Math.max(data.length - 1, 1)) * (650)
    const y = height - 30 - ((d.value / maxValue) * (height - 60))
    return { x, y, ...d }
  })

  const pathD = points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ')

  const areaD = pathD + ` L ${points[points.length - 1].x} ${height - 30} L ${points[0].x} ${height - 30} Z`

  return (
    <div style={{ position: 'relative', height }}>
      <svg width="100%" height={height} style={{ overflow: 'visible' }}>
        {/* Y轴网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = height - 30 - (ratio * (height - 60))
          const val = Math.round(maxValue * ratio)
          return (
            <g key={i}>
              <line
                x1="45"
                y1={y}
                x2="100%"
                y2={y}
                stroke={C.border}
                strokeDasharray="4,4"
              />
              <text
                x="40"
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill={C.gray4}
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* X轴 */}
        <line x1="45" y1={height - 30} x2="100%" y2={height - 30} stroke={C.border} />

        {/* 面积填充 */}
        <path d={areaD} fill={color} opacity="0.1" />

        {/* 折线 */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />

        {/* 数据点 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={color} />
            <circle cx={p.x} cy={p.y} r="6" fill={color} opacity="0.3" />
          </g>
        ))}

        {/* X轴标签 */}
        {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 8)) === 0 || i === points.length - 1).map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill={C.gray3}
          >
            {p.label.length > 6 ? p.label.slice(-5) : p.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default function UsageStats(_props: UsageStatsProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UsageStatsData | null>(null)

  useEffect(() => {
    loadStats()
  }, [period, days])

  async function loadStats() {
    setLoading(true)
    try {
      const res = await fetch(`/api/stats/usage?period=${period}&days=${days}`)
      const json = await res.json()
      if (json.success) {
        setData(json.stats)
      }
    } catch (err) {
      console.error('Failed to load usage stats:', err)
    }
    setLoading(false)
  }

  function getDaysLabel() {
    return [
      { label: '7天', value: 7 },
      { label: '14天', value: 14 },
      { label: '30天', value: 30 },
      { label: '90天', value: 90 },
    ]
  }

  function formatLabel(dateStr: string) {
    if (!dateStr) return '-'
    // period = day: "2024-01-15"
    // period = week: "2024-W03"
    // period = month: "2024-01"
    if (period === 'day') {
      return dateStr.slice(5) // "01-15"
    } else if (period === 'week') {
      return dateStr // "2024-W03"
    } else {
      return dateStr // "2024-01"
    }
  }

  // 将原始数据转换为图表格式
  function toChartData(raw: DailyStat[]) {
    return raw.map(r => ({
      label: formatLabel(r.date_period),
      value: r.count,
    }))
  }

  const summary = data?.summary

  if (loading && !data) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>加载中...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 使用统计报表</h2>
      </div>

      {/* 筛选器 */}
      <div style={styles.filterRow}>
        <span style={{ fontSize: '13px', color: C.gray2, alignSelf: 'center', marginRight: '4px' }}>周期:</span>
        {(['day', 'week', 'month'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              ...styles.filterBtn,
              ...(period === p ? styles.filterBtnActive : {}),
            }}
          >
            {p === 'day' ? '按日' : p === 'week' ? '按周' : '按月'}
          </button>
        ))}
        <span style={{ fontSize: '13px', color: C.gray2, alignSelf: 'center', marginLeft: '12px', marginRight: '4px' }}>范围:</span>
        {getDaysLabel().map(d => (
          <button
            key={d.value}
            onClick={() => setDays(d.value)}
            style={{
              ...styles.filterBtn,
              ...(days === d.value ? styles.filterBtnActive : {}),
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* 统计卡片 */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📁</div>
          <div style={{ ...styles.statValue, color: C.primary }}>
            {summary?.total_datasets ?? 0}
          </div>
          <div style={styles.statLabel}>数据集上传</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🤖</div>
          <div style={{ ...styles.statValue, color: '#E8631A' }}>
            {summary?.total_models ?? 0}
          </div>
          <div style={styles.statLabel}>模型上传</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🗂️</div>
          <div style={{ ...styles.statValue, color: C.success }}>
            {summary?.total_raw_data ?? 0}
          </div>
          <div style={styles.statLabel}>原始数据上传</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={{ ...styles.statValue, color: '#8E44AD' }}>
            {summary?.active_users ?? 0}
          </div>
          <div style={styles.statLabel}>活跃用户</div>
        </div>
      </div>

      {/* 上传统计图表 */}
      <div style={styles.chartSection}>
        <h3 style={styles.chartTitle}>上传趋势</h3>
        <div style={styles.chartContainer}>
          <SimpleBarChart
            data={toChartData(data?.daily?.datasets || [])}
            color={C.primary}
            height={220}
          />
        </div>
      </div>

      {/* 活跃用户图表 */}
      <div style={styles.chartSection}>
        <h3 style={styles.chartTitle}>用户活跃趋势</h3>
        <div style={styles.chartContainer}>
          <SimpleLineChart
            data={toChartData(data?.daily?.users || [])}
            color="#8E44AD"
            height={220}
          />
        </div>
      </div>

      {/* 详细数据表格 */}
      <div style={styles.tableSection}>
        <h3 style={styles.chartTitle}>详细数据</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>日期/周期</th>
              <th style={styles.th}>数据集</th>
              <th style={styles.th}>模型</th>
              <th style={styles.th}>原始数据</th>
              <th style={styles.th}>活跃用户</th>
            </tr>
          </thead>
          <tbody>
            {data && data.daily.datasets.length > 0 ? (
              data.daily.datasets.map((ds, i) => {
                const models = data.daily.models.find(m => m.date_period === ds.date_period)
                const raw = data.daily.raw_data.find(r => r.date_period === ds.date_period)
                const users = data.daily.users.find(u => u.date_period === ds.date_period)
                return (
                  <tr key={ds.date_period || i}>
                    <td style={styles.td}>{formatLabel(ds.date_period)}</td>
                    <td style={styles.td}>{ds.count}</td>
                    <td style={styles.td}>{models?.count ?? '-'}</td>
                    <td style={styles.td}>{raw?.count ?? '-'}</td>
                    <td style={styles.td}>{users?.count ?? '-'}</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} style={styles.empty}>暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
