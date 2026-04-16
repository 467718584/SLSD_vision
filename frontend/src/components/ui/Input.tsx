// Roboflow风格输入框组件
import React from 'react'
import { SearchIcon } from '../Icons'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  className = '',
  style,
  ...props
}) => {
  const [focused, setFocused] = React.useState(false)

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  }

  const labelStyles: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1E293B',
  }

  const inputWrapperStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: icon ? (iconPosition === 'left' ? '8px 12px 8px 36px' : '8px 36px 8px 12px') : '8px 12px',
    fontSize: '13px',
    fontFamily: 'inherit',
    border: `1px solid ${error ? '#EF4444' : focused ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: '6px',
    background: '#FFFFFF',
    color: '#1E293B',
    outline: 'none',
    transition: 'all 150ms ease',
    boxShadow: focused ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
  }

  const iconWrapperStyles: React.CSSProperties = {
    position: 'absolute',
    left: iconPosition === 'left' ? '10px' : 'auto',
    right: iconPosition === 'right' ? '10px' : 'auto',
    display: 'flex',
    alignItems: 'center',
    color: '#94A3B8',
    pointerEvents: 'none',
  }

  const hintStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#94A3B8',
  }

  const errorStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#EF4444',
  }

  return (
    <div style={containerStyles} className={className}>
      {label && <label style={labelStyles}>{label}</label>}
      <div style={inputWrapperStyles}>
        {icon && <span style={iconWrapperStyles}>{icon}</span>}
        <input
          {...props}
          style={{ ...inputStyles, ...style }}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
        />
      </div>
      {hint && !error && <span style={hintStyles}>{hint}</span>}
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  )
}

// 搜索框组件
export interface SearchInputProps extends Omit<InputProps, 'icon'> {
  onSearch?: (value: string) => void
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  value,
  onChange,
  ...props
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch((e.target as HTMLInputElement).value)
    }
  }

  return (
    <Input
      icon={<SearchIcon size={16} />}
      placeholder="搜索..."
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export default Input
