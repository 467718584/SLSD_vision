// DatasetTable - 数据集列表封装组件
// 基于Table组件，提供数据集专用展示模板
import React from 'react'
import Table, { Column } from './Table'
import Badge from './Badge'

export interface Dataset {
  id: number
  name: string
  algoType?: string
  techMethod?: string
  total?: number
  split?: string
  annotationType?: string
  maintainer?: string
  maintainDate?: string
  desc?: string
  source?: string
  classInfo?: Record<string, number | { name?: string; count?: number }>
}

export interface DatasetTableProps {
  datasets: Dataset[]
  loading?: boolean
  onSelect?: (dataset: Dataset) => void
  onDownload?: (name: string, e: React.MouseEvent) => void
  onDelete?: (name: string, e: React.MouseEvent) => void
  className?: string
  style?: React.CSSProperties
}

// 标签颜色映射
const ALGO_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'YOLO': { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5' },
  'SSD': { bg: '#FEF3C7', border: '#FDE68A', text: '#D97706' },
  'Faster R-CNN': { bg: '#DCFCE7', border: '#BBF7D0', text: '#16A34A' },
  '其他': { bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' },
}

const TECH_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  '目标检测算法': { bg: '#E0F2FE', border: '#BAE6FD', text: '#0284C7' },
  '实例分割算法': { bg: '#FCE7F3', border: '#FBCFE8', text: '#DB2777' },
}

const SITE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'xxx现场': { bg: '#FEF3C7', border: '#FDE68A', text: '#D97706' },
  '其他': { bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' },
}

function DatasetTable({
  datasets,
  loading = false,
  onSelect,
  onDownload,
  onDelete,
  className = '',
  style,
}: DatasetTableProps) {
  const columns: Column<Dataset>[] = [
    {
      key: 'id',
      title: '编号',
      width: 60,
      align: 'center',
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>{val}</span>
      ),
    },
    {
      key: 'algoType',
      title: '算法类型',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const colors = ALGO_COLORS[record.algoType || ''] || ALGO_COLORS['其他']
        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.text,
          }}>
            {record.algoType || '-'}
          </span>
        )
      },
    },
    {
      key: 'techMethod',
      title: '技术方法',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const colors = TECH_COLORS[record.techMethod || '目标检测算法'] || TECH_COLORS['目标检测算法']
        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.text,
          }}>
            {record.techMethod || '目标检测算法'}
          </span>
        )
      },
    },
    {
      key: 'name',
      title: '数据集名称',
      width: 200,
      render: (val) => (
        <span style={{
          color: '#2563EB',
          fontWeight: 500,
          fontSize: '12px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
          maxWidth: '190px',
        }}
          title={val}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'split',
      title: '分配比例',
      width: 80,
      align: 'center',
      render: (val) => (
        <span style={{
          background: 'rgba(37, 99, 235, 0.1)',
          color: '#2563EB',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: '11px',
          fontWeight: 600,
        }}>
          {val}
        </span>
      ),
    },
    {
      key: 'total',
      title: '样本数量',
      width: 90,
      align: 'center',
      render: (val) => (
        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '13px' }}>
          {(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'classCount',
      title: '标签数',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <span style={{
          background: 'rgba(37, 99, 235, 0.1)',
          color: '#2563EB',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: '12px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: 600,
        }}>
          {Object.keys(record.classInfo || {}).length}
        </span>
      ),
    },
    {
      key: 'source',
      title: '数据来源',
      width: 90,
      align: 'center',
      render: (val) => {
        const colors = SITE_COLORS[val || ''] || SITE_COLORS['其他']
        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.text,
          }}>
            {val || '-'}
          </span>
        )
      },
    },
    {
      key: 'maintainDate',
      title: '维护日期',
      width: 90,
      align: 'center',
      render: (val) => (
        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{val}</span>
      ),
    },
    {
      key: 'maintainer',
      title: '维护人员',
      width: 80,
      align: 'center',
      render: (val) => (
        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{val}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          {onDownload && (
            <button
              onClick={(e) => onDownload(record.name, e)}
              style={{
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              下载
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => onDelete(record.name, e)}
              style={{
                background: '#FEE2E2',
                color: '#DC2626',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              删除
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={datasets}
      rowKey="id"
      loading={loading}
      emptyText="暂无数据集"
      onRow={(record) => ({
        onClick: () => onSelect?.(record),
        style: { cursor: onSelect ? 'pointer' : 'default' },
      })}
      className={className}
      style={style}
    />
  )
}

export default DatasetTable
