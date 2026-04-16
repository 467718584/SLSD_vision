// StatsCardGrid - 统计卡片网格组件
// 用于展示关键指标数据的卡片网格布局
import React from 'react'

export interface StatItem {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  trend?: {
    value: number
    isPositive: boolean
  }
}

export interface StatsCardGridProps {
  stats: StatItem[]
  columns?: number // 默认4列
  className?: string
  style?: React.CSSProperties
}

const COLOR_MAP = {
  blue: {
    bg: 'rgba(37, 99, 235, 0.1)',
    color: '#2563EB',
  },
  green: {
    bg: 'rgba(16, 185, 129, 0.1)',
    color: '#10B981',
  },
  orange: {
    bg: 'rgba(245, 158, 11, 0.1)',
    color: '#F59E0B',
  },
  red: {
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
  },
  purple: {
    bg: 'rgba(139, 92, 246, 0.1)',
    color: '#8B5CF6',
  },
}

function StatsCardGrid({
  stats,
  columns = 4,
  className = '',
  style,
}: StatsCardGridProps) {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '16px',
    marginBottom: '24px',
    ...style,
  }

  return (
    <div style={gridStyle} className={className}>
      {stats.map((stat, index) => {
        const colorConfig = COLOR_MAP[stat.color || 'blue']
        
        return (
          <div
            key={index}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              transition: 'all 150ms ease',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563EB'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* 图标 */}
            {stat.icon && (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: colorConfig.bg,
                  color: colorConfig.color,
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
            )}

            {/* 内容 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#1E293B',
                  lineHeight: 1.2,
                  marginBottom: '4px',
                }}
              >
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#94A3B8',
                }}
              >
                {stat.label}
              </div>
              
              {/* 趋势指示 */}
              {stat.trend && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: stat.trend.isPositive ? '#10B981' : '#EF4444',
                  }}
                >
                  <span>
                    {stat.trend.isPositive ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
                  </span>
                  <span style={{ color: '#94A3B8', fontWeight: 400 }}>较上期</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsCardGrid
