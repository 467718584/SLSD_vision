// Roboflow风格按钮组件
import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className = '',
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    opacity: disabled || loading ? 0.6 : 1,
    fontFamily: 'inherit',
  }

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '13px' },
    lg: { padding: '10px 20px', fontSize: '14px' },
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: '#2563EB',
      color: '#FFFFFF',
    },
    secondary: {
      background: '#FFFFFF',
      color: '#1E293B',
      border: '1px solid #E2E8F0',
    },
    ghost: {
      background: 'transparent',
      color: '#64748B',
    },
    danger: {
      background: '#EF4444',
      color: '#FFFFFF',
    },
  }

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  }

  // Hover styles
  const getHoverStyles = () => {
    if (disabled || loading) return {}
    switch (variant) {
      case 'primary':
        return { background: '#1D4ED8' }
      case 'secondary':
        return { background: '#F7F8FA', borderColor: '#CBD5E1' }
      case 'ghost':
        return { background: '#F1F5F9' }
      case 'danger':
        return { background: '#DC2626' }
      default:
        return {}
    }
  }

  const [hoverStyle, setHoverStyle] = React.useState<React.CSSProperties>({})

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={className}
      style={{ ...combinedStyles, ...hoverStyle }}
      onMouseEnter={(e) => {
        const hover = getHoverStyles()
        setHoverStyle(hover)
        props.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        setHoverStyle({})
        props.onMouseLeave?.(e)
      }}
    >
      {loading && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ animation: 'spin 1s linear infinite' }}
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}

export default Button
