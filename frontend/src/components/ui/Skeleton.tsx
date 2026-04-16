// 骨架屏组件 - 用于数据加载中
import React from 'react'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = '4px',
  className = '',
  style,
}) => {
  const skeletonStyles: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E8ECF1 50%, #F1F5F9 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.5s ease-in-out infinite',
    ...style,
  }

  return (
    <>
      <div className={className} style={skeletonStyles} />
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}

// 骨架屏文本行
export interface SkeletonTextProps {
  lines?: number
  width?: string | number
  lastLineWidth?: string | number
  spacing?: number
  className?: string
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  width = '100%',
  lastLineWidth = '60%',
  spacing = 8,
  className = '',
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing}px`,
    width: '100%',
  }

  return (
    <div style={containerStyles} className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : width}
          height="14px"
        />
      ))}
    </div>
  )
}

// 骨架屏卡片
export interface SkeletonCardProps {
  avatar?: boolean
  title?: boolean
  paragraph?: number
  className?: string
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  avatar = true,
  title = true,
  paragraph = 3,
  className = '',
}) => {
  const cardStyles: React.CSSProperties = {
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
    gap: '12px',
  }

  return (
    <div style={cardStyles} className={className}>
      {avatar && (
        <div style={headerStyles}>
          <Skeleton width={40} height={40} borderRadius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {title && <Skeleton width="60%" height={14} />}
            {title && <Skeleton width="40%" height={12} />}
          </div>
        </div>
      )}
      <SkeletonText lines={paragraph} />
    </div>
  )
}

// 骨架屏表格行
export interface SkeletonTableRowProps {
  columns?: number
  className?: string
}

export const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({
  columns = 4,
  className = '',
}) => {
  const rowStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    borderBottom: '1px solid #F1F5F9',
  }

  return (
    <div style={rowStyles} className={className}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton
          key={index}
          width={`${100 / columns}%`}
          height={14}
        />
      ))}
    </div>
  )
}

// 骨架屏表格
export interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => {
  const containerStyles: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    overflow: 'hidden',
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    background: '#F7F8FA',
    borderBottom: '1px solid #E2E8F0',
  }

  return (
    <div style={containerStyles} className={className}>
      {/* 表头 */}
      <div style={headerStyles}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={`header-${index}`}
            width={`${100 / columns}%`}
            height={14}
          />
        ))}
      </div>
      {/* 数据行 */}
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonTableRow key={index} columns={columns} />
      ))}
    </div>
  )
}

// 骨架屏统计卡片网格
export interface SkeletonStatsGridProps {
  count?: number
  className?: string
}

export const SkeletonStatsGrid: React.FC<SkeletonStatsGridProps> = ({
  count = 4,
  className = '',
}) => {
  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${count}, 1fr)`,
    gap: '16px',
  }

  const cardStyles: React.CSSProperties = {
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

  return (
    <div style={gridStyles} className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={cardStyles}>
          <div style={headerStyles}>
            <Skeleton width={36} height={36} borderRadius="8px" />
            <Skeleton width={50} height={12} />
          </div>
          <Skeleton width="80%" height={24} />
          <Skeleton width="50%" height={12} />
        </div>
      ))}
    </div>
  )
}

export default Skeleton
