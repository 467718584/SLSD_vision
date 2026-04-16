// Roboflow风格卡片组件
import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  style,
  hoverable = false,
  padding = 'md',
  onClick,
}) => {
  const [hovered, setHovered] = React.useState(false)

  const paddingMap = {
    none: '0',
    sm: '12px',
    md: '16px',
    lg: '20px',
  }

  const baseStyles: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: paddingMap[padding],
    transition: 'all 150ms ease',
    cursor: onClick ? 'pointer' : 'default',
    boxShadow: hovered && hoverable ? '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
    ...style,
  }

  if (hoverable) {
    return (
      <div
        className={className}
        style={{
          ...baseStyles,
          transform: hovered ? 'translateY(-1px)' : 'none',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
      >
        {children}
      </div>
    )
  }

  return (
    <div className={className} style={baseStyles} onClick={onClick}>
      {children}
    </div>
  )
}

// 统计卡片组件
export interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  color?: 'blue' | 'green' | 'orange' | 'red'
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  className = '',
}) => {
  const colorMap = {
    blue: { bg: '#EFF6FF', text: '#2563EB' },
    green: { bg: '#ECFDF5', text: '#10B981' },
    orange: { bg: '#FFF7ED', text: '#F59E0B' },
    red: { bg: '#FEF2F2', text: '#EF4444' },
  }

  const styles: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const iconWrapperStyles: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colorMap[color].bg,
    color: colorMap[color].text,
  }

  const valueStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1E293B',
  }

  const titleStyles: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '4px',
  }

  const trendUpStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#10B981',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  }

  const trendDownStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#EF4444',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  }

  return (
    <div className={className} style={styles}>
      <div style={headerStyles}>
        <div style={iconWrapperStyles}>{icon}</div>
        {trend && (
          <span style={trend.direction === 'up' ? trendUpStyles : trendDownStyles}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div>
        <div style={valueStyles}>{value}</div>
        <div style={titleStyles}>{title}</div>
      </div>
    </div>
  )
}

export default Card
