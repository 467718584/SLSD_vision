// Roboflow风格分页组件
import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons'

export interface PaginationProps {
  current: number
  total: number
  pageSize?: number
  onChange?: (page: number) => void
  showQuickJumper?: boolean
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  className?: string
}

const Pagination: React.FC<PaginationProps> = ({
  current,
  total,
  pageSize = 10,
  onChange,
  showQuickJumper = false,
  showSizeChanger = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  className = '',
}) => {
  const totalPages = Math.ceil(total / pageSize)

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (current <= 3) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
    }

    if (current >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', totalPages]
  }

  const pageNumbers = getPageNumbers()

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  }

  const buttonStyles = (isActive: boolean, isDisabled: boolean = false): React.CSSProperties => ({
    minWidth: '32px',
    height: '32px',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? '#FFFFFF' : isDisabled ? '#CBD5E1' : '#64748B',
    background: isActive ? '#2563EB' : 'transparent',
    border: isActive ? 'none' : '1px solid #E2E8F0',
    borderRadius: '6px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    opacity: isDisabled ? 0.5 : 1,
  })

  const infoStyles: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748B',
    marginLeft: '8px',
  }

  const jumperStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '8px',
  }

  const inputStyles: React.CSSProperties = {
    width: '48px',
    height: '32px',
    padding: '0 8px',
    fontSize: '13px',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    outline: 'none',
    textAlign: 'center',
  }

  const selectStyles: React.CSSProperties = {
    height: '32px',
    padding: '0 8px',
    fontSize: '13px',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    outline: 'none',
    background: '#FFFFFF',
    cursor: 'pointer',
  }

  const [jumpValue, setJumpValue] = React.useState('')

  const handleJump = () => {
    const page = parseInt(jumpValue)
    if (page >= 1 && page <= totalPages) {
      onChange?.(page)
    }
    setJumpValue('')
  }

  if (totalPages <= 1) return null

  return (
    <div style={containerStyles} className={className}>
      {/* 上一页 */}
      <button
        style={buttonStyles(false, current === 1)}
        disabled={current === 1}
        onClick={() => current > 1 && onChange?.(current - 1)}
        onMouseEnter={(e) => {
          if (current !== 1) {
            e.currentTarget.style.background = '#F1F5F9'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <ChevronLeftIcon size={16} />
      </button>

      {/* 页码 */}
      {pageNumbers.map((page, index) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            style={{
              minWidth: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
            }}
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            style={buttonStyles(page === current)}
            onClick={() => onChange?.(page)}
            onMouseEnter={(e) => {
              if (page !== current) {
                e.currentTarget.style.background = '#F1F5F9'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = page === current ? '#2563EB' : 'transparent'
            }}
          >
            {page}
          </button>
        )
      )}

      {/* 下一页 */}
      <button
        style={buttonStyles(false, current === totalPages)}
        disabled={current === totalPages}
        onClick={() => current < totalPages && onChange?.(current + 1)}
        onMouseEnter={(e) => {
          if (current !== totalPages) {
            e.currentTarget.style.background = '#F1F5F9'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <ChevronRightIcon size={16} />
      </button>

      {/* 信息 */}
      <span style={infoStyles}>
        共 {total} 条
      </span>

      {/* 每页条数 */}
      {showSizeChanger && (
        <div style={jumperStyles}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>每页</span>
          <select
            style={selectStyles}
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 快速跳转 */}
      {showQuickJumper && (
        <div style={jumperStyles}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>跳至</span>
          <input
            style={inputStyles}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
            placeholder="页码"
          />
          <span style={{ fontSize: '13px', color: '#64748B' }}>页</span>
        </div>
      )}
    </div>
  )
}

export default Pagination
