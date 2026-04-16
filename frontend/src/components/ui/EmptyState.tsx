// 空状态组件 - 用于无数据时展示
import React from 'react'
import Button from './Button'

export interface EmptyStateProps {
  /** 空状态图标 */
  icon?: React.ReactNode
  /** 标题 */
  title: string
  /** 描述文字 */
  description?: string
  /** 操作按钮 */
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'ghost'
  }
  /** 自定义样式 */
  className?: string
  style?: React.CSSProperties
  /** 布局方式 */
  layout?: 'vertical' | 'horizontal'
}

// 默认的空状态图标 (使用SVG)
const DefaultIcon: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#CBD5E1"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
    <path d="M13 2v7h7" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
)

// 无搜索结果图标
const NoResultIcon: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#CBD5E1"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
)

// 无网络图标
const NoNetworkIcon: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#CBD5E1"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
    <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0122.58 9" />
    <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
    <path d="M8.53 16.11a6 6 0 016.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
)

// 无错误状态图标
const NoErrorIcon: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#10B981"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  style,
  layout = 'vertical',
}) => {
  const isHorizontal = layout === 'horizontal'

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: isHorizontal ? 'left' : 'center',
    padding: isHorizontal ? '24px 32px' : '48px 24px',
    gap: isHorizontal ? '24px' : '16px',
    ...style,
  }

  const iconWrapperStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: isHorizontal ? '400px' : '320px',
  }

  const titleStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1E293B',
    margin: 0,
  }

  const descriptionStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
    lineHeight: 1.5,
  }

  const actionStyles: React.CSSProperties = {
    marginTop: '8px',
  }

  return (
    <div style={containerStyles} className={className}>
      <div style={iconWrapperStyles}>
        {icon || <DefaultIcon />}
      </div>
      <div style={contentStyles}>
        <h3 style={titleStyles}>{title}</h3>
        {description && <p style={descriptionStyles}>{description}</p>}
        {action && (
          <div style={actionStyles}>
            <Button
              variant={action.variant || 'primary'}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// 预设的空状态类型
export type EmptyStateType = 'default' | 'noResult' | 'noNetwork' | 'success'

// 带预设的空状态组件
export interface PresetEmptyStateProps {
  type?: EmptyStateType
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'ghost'
  }
  className?: string
  style?: React.CSSProperties
}

export const PresetEmptyState: React.FC<PresetEmptyStateProps> = ({
  type = 'default',
  title,
  description,
  action,
  className = '',
  style,
}) => {
  const presetConfig: Record<EmptyStateType, { icon: React.ReactNode; defaultTitle: string; defaultDesc: string }> = {
    default: {
      icon: <DefaultIcon />,
      defaultTitle: '暂无数据',
      defaultDesc: '当前没有可显示的数据，请稍后再试',
    },
    noResult: {
      icon: <NoResultIcon />,
      defaultTitle: '未找到结果',
      defaultDesc: '没有找到匹配的内容，请尝试其他关键词',
    },
    noNetwork: {
      icon: <NoNetworkIcon />,
      defaultTitle: '网络连接失败',
      defaultDesc: '请检查网络连接后重试',
    },
    success: {
      icon: <NoErrorIcon />,
      defaultTitle: '操作成功',
      defaultDesc: '任务已完成',
    },
  }

  const config = presetConfig[type]

  return (
    <EmptyState
      icon={config.icon}
      title={title || config.defaultTitle}
      description={description || config.defaultDesc}
      action={action}
      className={className}
      style={style}
    />
  )
}

export default EmptyState
