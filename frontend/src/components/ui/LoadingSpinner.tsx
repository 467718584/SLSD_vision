// 加载旋转器组件
import React from 'react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'gray'
  className?: string
  style?: React.CSSProperties
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  style,
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 40,
  }

  const colorMap = {
    primary: '#2563EB',
    white: '#FFFFFF',
    gray: '#94A3B8',
  }

  const dimension = sizeMap[size]
  const strokeWidth = size === 'sm' ? 2 : size === 'md' ? 2.5 : 3

  const containerStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  }

  return (
    <div style={containerStyles} className={className}>
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colorMap[color]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: 'spinnerRotate 1s linear infinite' }}
      >
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
      <style>{`
        @keyframes spinnerRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// 全屏加载覆盖层
export interface LoadingOverlayProps {
  visible: boolean
  text?: string
  opacity?: number
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text,
  opacity = 0.8,
}) => {
  if (!visible) return null

  const overlayStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `rgba(255, 255, 255, ${opacity})`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    zIndex: 1000,
    borderRadius: 'inherit',
  }

  const textStyles: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748B',
  }

  return (
    <div style={overlayStyles}>
      <LoadingSpinner size="lg" color="primary" />
      {text && <span style={textStyles}>{text}</span>}
    </div>
  )
}

// 按钮加载状态
export interface ButtonSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

export const ButtonSpinner: React.FC<ButtonSpinnerProps> = ({ size = 'md' }) => {
  const sizeMap = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  return (
    <svg
      width={sizeMap[size]}
      height={sizeMap[size]}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'spinnerRotate 1s linear infinite' }}
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  )
}

export default LoadingSpinner
