// Roboflow风格标签页组件
import React, { useState } from 'react'

export interface TabItem {
  key: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  content?: React.ReactNode
}

export interface TabsProps {
  items: TabItem[]
  activeKey?: string
  defaultActiveKey?: string
  onChange?: (key: string) => void
  type?: 'line' | 'card'
  className?: string
  style?: React.CSSProperties
}

const Tabs: React.FC<TabsProps> = ({
  items,
  activeKey: controlledActiveKey,
  defaultActiveKey,
  onChange,
  type = 'line',
  className = '',
  style,
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState(defaultActiveKey || items[0]?.key)
  
  const isControlled = controlledActiveKey !== undefined
  const activeKey = isControlled ? controlledActiveKey : internalActiveKey

  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return
    if (!isControlled) {
      setInternalActiveKey(key)
    }
    onChange?.(key)
  }

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    ...style,
  }

  const tabListStyles: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    borderBottom: type === 'line' ? '1px solid #E2E8F0' : 'none',
    background: type === 'card' ? '#F7F8FA' : 'transparent',
    padding: type === 'card' ? '4px' : '0',
    borderRadius: type === 'card' ? '8px 8px 0 0' : '0',
  }

  const getTabStyles = (key: string, disabled?: boolean): React.CSSProperties => {
    const isActive = key === activeKey
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: type === 'card' ? '8px 16px' : '10px 16px',
      fontSize: '13px',
      fontWeight: isActive ? 600 : 500,
      color: isActive ? '#2563EB' : disabled ? '#94A3B8' : '#64748B',
      background: isActive
        ? '#FFFFFF'
        : 'transparent',
      border: 'none',
      borderBottom: type === 'line' && isActive ? '2px solid #2563EB' : '2px solid transparent',
      borderRadius: type === 'card' ? '6px' : '0',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 150ms ease',
      marginBottom: type === 'line' ? '-1px' : '0',
      opacity: disabled ? 0.5 : 1,
    }
  }

  const contentStyles: React.CSSProperties = {
    padding: '16px 0',
    flex: 1,
  }

  const activeContent = items.find((item) => item.key === activeKey)?.content

  return (
    <div style={containerStyles} className={className}>
      <div style={tabListStyles}>
        {items.map((item) => (
          <button
            key={item.key}
            style={getTabStyles(item.key, item.disabled)}
            onClick={() => handleTabClick(item.key, item.disabled)}
            onMouseEnter={(e) => {
              if (item.key !== activeKey && !item.disabled) {
                e.currentTarget.style.background = type === 'card' ? '#E8ECF1' : '#F7F8FA'
              }
            }}
            onMouseLeave={(e) => {
              if (item.key !== activeKey && !item.disabled) {
                e.currentTarget.style.background = isControlled && item.key === controlledActiveKey ? '#FFFFFF' : type === 'card' ? 'transparent' : 'transparent'
              }
            }}
          >
            {item.icon && <span style={{ display: 'flex' }}>{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>
      <div style={contentStyles}>
        {activeContent}
      </div>
    </div>
  )
}

// 简洁版标签页（无内容区，仅切换）
export interface SimpleTabsProps {
  options: { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
  className?: string
}

export const SimpleTabs: React.FC<SimpleTabsProps> = ({
  options,
  value,
  onChange,
  className = '',
}) => {
  const styles: React.CSSProperties = {
    display: 'flex',
    gap: '2px',
    background: '#F1F5F9',
    padding: '3px',
    borderRadius: '6px',
  }

  const getTabStyles = (key: string): React.CSSProperties => ({
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    color: key === value ? '#1E293B' : '#64748B',
    background: key === value ? '#FFFFFF' : 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    boxShadow: key === value ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
  })

  return (
    <div style={styles} className={className}>
      {options.map((opt) => (
        <button
          key={opt.key}
          style={getTabStyles(opt.key)}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default Tabs
