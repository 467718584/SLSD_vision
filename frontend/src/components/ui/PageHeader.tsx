// Roboflow风格页面头部组件
import React from 'react'
import { Button } from './Button'
import { SimpleTabs } from './Tabs'
import { SearchInput } from './Input'

export interface PageAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
}

export interface FilterTab {
  key: string
  label: string
  count?: number
}

export interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: PageAction[]
  filters?: FilterTab[]
  activeFilter?: string
  onFilterChange?: (key: string) => void
  searchPlaceholder?: string
  searchValue?: string
  onSearch?: (value: string) => void
  className?: string
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions = [],
  filters = [],
  activeFilter,
  onFilterChange,
  searchPlaceholder,
  searchValue,
  onSearch,
  className = '',
}) => {
  const containerStyles: React.CSSProperties = {
    marginBottom: '24px',
  }

  const topRowStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: filters.length > 0 ? '16px' : '0',
  }

  const titleSectionStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }

  const titleStyles: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1E293B',
    margin: 0,
  }

  const subtitleStyles: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
  }

  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const filterRowStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  }

  const tabsWrapperStyles: React.CSSProperties = {
    flex: 1,
  }

  const searchWrapperStyles: React.CSSProperties = {
    width: '240px',
  }

  return (
    <div style={containerStyles} className={className}>
      <div style={topRowStyles}>
        <div style={titleSectionStyles}>
          <h1 style={titleStyles}>{title}</h1>
          {subtitle && <p style={subtitleStyles}>{subtitle}</p>}
        </div>

        {actions.length > 0 && (
          <div style={actionsStyles}>
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'primary'}
                onClick={action.onClick}
                loading={action.loading}
                icon={action.icon}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {filters.length > 0 && (
        <div style={filterRowStyles}>
          <div style={tabsWrapperStyles}>
            <SimpleTabs
              options={filters.map((f) => ({ key: f.key, label: f.count !== undefined ? `${f.label} (${f.count})` : f.label }))}
              value={activeFilter || filters[0]?.key || ''}
              onChange={(key) => onFilterChange?.(key)}
            />
          </div>

          {searchPlaceholder && (
            <div style={searchWrapperStyles}>
              <SearchInput
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearch?.(e.target.value)}
                onSearch={onSearch}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PageHeader
