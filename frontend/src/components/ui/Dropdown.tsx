// Roboflow风格下拉菜单组件
import React, { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon } from '../Icons'

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = '请选择',
  label,
  error,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex]
          if (!option.disabled) {
            onChange?.(option.value)
            setIsOpen(false)
          }
        } else {
          setIsOpen(!isOpen)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const selectedOption = options.find((opt) => opt.value === value)

  const sizeStyles = {
    sm: { padding: '6px 10px', fontSize: '12px' },
    md: { padding: '8px 12px', fontSize: '13px' },
    lg: { padding: '10px 14px', fontSize: '14px' },
  }

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'relative',
  }

  const labelStyles: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1E293B',
  }

  const triggerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    width: '100%',
    background: disabled ? '#F7F8FA' : '#FFFFFF',
    border: `1px solid ${error ? '#EF4444' : isOpen ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    outline: 'none',
    ...sizeStyles[size],
    transition: 'all 150ms ease',
    boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
  }

  const triggerTextStyles: React.CSSProperties = {
    color: selectedOption ? '#1E293B' : '#94A3B8',
    flex: 1,
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const menuStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    overflow: 'hidden',
    animation: 'dropdownFadeIn 150ms ease',
    maxHeight: '240px',
    overflowY: 'auto',
  }

  const optionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#1E293B',
    cursor: 'pointer',
    transition: 'background 100ms ease',
  }

  return (
    <div style={containerStyles} className={className} ref={containerRef}>
      {label && <label style={labelStyles}>{label}</label>}
      <div
        tabIndex={disabled ? -1 : 0}
        style={triggerStyles}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        onFocus={() => !disabled && setIsOpen(true)}
      >
        <span style={triggerTextStyles}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon
          size={16}
          style={{
            color: '#94A3B8',
            transition: 'transform 150ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        />
      </div>

      {isOpen && (
        <div style={menuStyles}>
          {options.map((option, index) => (
            <div
              key={option.value}
              style={{
                ...optionStyles,
                background:
                  index === highlightedIndex
                    ? '#F1F5F9'
                    : option.value === value
                    ? '#EFF6FF'
                    : 'transparent',
                opacity: option.disabled ? 0.5 : 1,
                cursor: option.disabled ? 'not-allowed' : 'pointer',
              }}
              onClick={() => {
                if (!option.disabled) {
                  onChange?.(option.value)
                  setIsOpen(false)
                }
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option.icon && <span>{option.icon}</span>}
              <span style={{ flex: 1 }}>{option.label}</span>
              {option.value === value && <CheckIcon size={14} style={{ color: '#2563EB' }} />}
            </div>
          ))}
        </div>
      )}

      {error && (
        <span style={{ fontSize: '12px', color: '#EF4444' }}>{error}</span>
      )}

      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default Dropdown
