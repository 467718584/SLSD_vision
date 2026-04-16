// Roboflow风格表格组件
import React, { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '../Icons'

export interface Column<T> {
  key: string
  title: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
  filters?: { text: string; value: string }[]
  onFilter?: (value: string, record: T) => boolean
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: string | ((record: T) => string)
  loading?: boolean
  emptyText?: string
  onRow?: (record: T, index: number) => {
    onClick?: () => void
    style?: React.CSSProperties
    className?: string
  }
  pagination?: false | {
    current: number
    pageSize: number
    total: number
    onChange: (page: number) => void
  }
  className?: string
  style?: React.CSSProperties
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyText = '暂无数据',
  onRow,
  pagination,
  className = '',
  style,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)
  const [filters, setFilters] = useState<Record<string, string | null>>({})

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return record[rowKey] || String(index)
  }

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return

    if (sortColumn === column.key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortColumn(null)
        setSortOrder(null)
      }
    } else {
      setSortColumn(column.key)
      setSortOrder('asc')
    }
  }

  // 过滤和排序数据
  let filteredData = [...data]

  // 应用过滤器
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      const column = columns.find((col) => col.key === key)
      if (column?.onFilter) {
        filteredData = filteredData.filter((record) => column.onFilter!(value, record))
      }
    }
  })

  // 应用排序
  if (sortColumn && sortOrder) {
    filteredData.sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  const containerStyles: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    overflow: 'hidden',
    ...style,
  }

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  }

  const thStyles = (align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    padding: '12px 16px',
    textAlign: align,
    fontWeight: 600,
    color: '#64748B',
    background: '#F7F8FA',
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap',
  })

  const tdStyles = (align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    padding: '12px 16px',
    textAlign: align,
    color: '#1E293B',
    borderBottom: '1px solid #F1F5F9',
  })

  const sortIconStyles: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    marginLeft: '4px',
    verticalAlign: 'middle',
    gap: '0px',
  }

  const loadingStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#94A3B8',
  }

  const emptyStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#94A3B8',
    fontSize: '14px',
  }

  return (
    <div style={containerStyles} className={className}>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyles}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    ...thStyles(column.align),
                    width: column.width,
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: column.sortable ? 'none' : 'auto',
                  }}
                  onClick={() => handleSort(column)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {column.title}
                    {column.sortable && (
                      <span style={sortIconStyles}>
                        <ChevronUpIcon
                          size={12}
                          style={{
                            color: sortColumn === column.key && sortOrder === 'asc' ? '#2563EB' : '#CBD5E1',
                            marginBottom: '-4px',
                          }}
                        />
                        <ChevronDownIcon
                          size={12}
                          style={{
                            color: sortColumn === column.key && sortOrder === 'desc' ? '#2563EB' : '#CBD5E1',
                          }}
                        />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={loadingStyles}>
                  加载中...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={emptyStyles}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              filteredData.map((record, index) => {
                const rowProps = onRow?.(record, index)
                return (
                  <tr
                    key={getRowKey(record, index)}
                    style={{
                      ...rowProps?.style,
                      background: rowProps?.onClick ? 'transparent' : undefined,
                      transition: 'background 100ms ease',
                      cursor: rowProps?.onClick ? 'pointer' : 'default',
                    }}
                    className={rowProps?.className}
                    onClick={rowProps?.onClick}
                    onMouseEnter={(e) => {
                      if (!rowProps?.onClick) return
                      e.currentTarget.style.background = '#F7F8FA'
                    }}
                    onMouseLeave={(e) => {
                      if (!rowProps?.onClick) return
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {columns.map((column) => (
                      <td key={column.key} style={tdStyles(column.align)}>
                        {column.render
                          ? column.render(record[column.key], record, index)
                          : record[column.key]}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table
