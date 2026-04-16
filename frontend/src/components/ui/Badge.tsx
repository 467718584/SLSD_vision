// Roboflow风格徽章/标签组件
import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'
  size?: 'sm' | 'md'
  color?: string
  className?: string
  style?: React.CSSProperties
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  color,
  className = '',
  style,
}) => {
  const sizeStyles = {
    sm: { padding: '2px 6px', fontSize: '10px' },
    md: { padding: '4px 8px', fontSize: '11px' },
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: '#F1F5F9',
      color: '#64748B',
      border: '1px solid #E2E8F0',
    },
    success: {
      background: '#ECFDF5',
      color: '#10B981',
      border: '1px solid #D1FAE5',
    },
    warning: {
      background: '#FFF7ED',
      color: '#F59E0B',
      border: '1px solid #FEF3C7',
    },
    error: {
      background: '#FEF2F2',
      color: '#EF4444',
      border: '1px solid #FEE2E2',
    },
    info: {
      background: '#EFF6FF',
      color: '#2563EB',
      border: '1px solid #DBEAFE',
    },
    outline: {
      background: 'transparent',
      color: '#64748B',
      border: '1px solid #E2E8F0',
    },
  }

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 500,
    borderRadius: '4px',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    ...sizeStyles[size],
    ...(color ? { background: `${color}15`, color, border: `1px solid ${color}30` } : variantStyles[variant]),
  }

  return (
    <span className={className} style={{ ...baseStyles, ...style }}>
      {children}
    </span>
  )
}

// 状态指示器组件
export interface StatusDotProps {
  status: 'online' | 'offline' | 'pending' | 'error'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  size = 'md',
  label,
  className = '',
}) => {
  const sizeMap = {
    sm: '6px',
    md: '8px',
    lg: '10px',
  }

  const colorMap = {
    online: '#10B981',
    offline: '#94A3B8',
    pending: '#F59E0B',
    error: '#EF4444',
  }

  const styles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }

  const dotStyles: React.CSSProperties = {
    width: sizeMap[size],
    height: sizeMap[size],
    borderRadius: '50%',
    background: colorMap[status],
    flexShrink: 0,
  }

  const labelStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#64748B',
  }

  return (
    <span className={className} style={styles}>
      <span style={dotStyles} />
      {label && <span style={labelStyles}>{label}</span>}
    </span>
  )
}

export default Badge
