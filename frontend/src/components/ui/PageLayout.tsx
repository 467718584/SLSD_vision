import React from 'react'

interface PageLayoutProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * 统一页面布局组件
 * 确保所有页面有一致的布局结构
 */
export function PageLayout({ title, subtitle, actions, children, className = '' }: PageLayoutProps) {
  return (
    <div className={`page-layout ${className}`}>
      {/* 页面标题区 */}
      <div className="page-header mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">{title}</h2>
            {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      </div>
      
      {/* 页面内容区 */}
      <div className="page-content">
        {children}
      </div>
    </div>
  )
}

/**
 * 统计卡片网格容器
 */
export function StatsGrid({ children }: { children: React.ReactNode }) {
  return <div className="stats-grid">{children}</div>
}

/**
 * 卡片容器
 */
export function CardContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

/**
 * 表格容器
 */
export function TableContainer({ children }: { children: React.ReactNode }) {
  return <div className="table-container">{children}</div>
}
