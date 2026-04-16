// ModelTable - 模型列表封装组件
// 基于Table组件，提供模型专用展示模板
import React from 'react'
import Table, { Column } from './Table'

export interface Model {
  id: number
  name: string
  algoName?: string
  techMethod?: string
  category?: string
  accuracy?: number
  site?: string
  dataset?: string
  maintainer?: string
  maintainDate?: string
  description?: string
}

export interface ModelTableProps {
  models: Model[]
  loading?: boolean
  onSelect?: (model: Model) => void
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

const CAT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  '检测模型': { bg: '#E0F2FE', border: '#BAE6FD', text: '#0284C7' },
  '分割模型': { bg: '#FCE7F3', border: '#FBCFE8', text: '#DB2777' },
  '分类模型': { bg: '#DCFCE7', border: '#BBF7D0', text: '#16A34A' },
  '其他': { bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' },
}

// 精度进度条组件
const AccuracyBar = ({ value }: { value?: number }) => {
  const color = (value || 0) >= 95 ? '#10B981' : (value || 0) >= 85 ? '#2563EB' : '#F59E0B'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: 50, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${value || 0}%`, height: '100%', background: color, borderRadius: '3px' }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color, minWidth: '42px' }}>{value}%</span>
    </div>
  )
}

function ModelTable({
  models,
  loading = false,
  onSelect,
  onDownload,
  onDelete,
  className = '',
  style,
}: ModelTableProps) {
  const columns: Column<Model>[] = [
    {
      key: 'id',
      title: '编号',
      width: 50,
      align: 'center',
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>{val}</span>
      ),
    },
    {
      key: 'algoName',
      title: '算法类型',
      width: 90,
      align: 'center',
      render: (_, record) => {
        const colors = ALGO_COLORS[record.algoName || ''] || ALGO_COLORS['其他']
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
            {record.algoName || '-'}
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
      title: '模型名称',
      width: 180,
      render: (val) => (
        <span style={{
          color: '#2563EB',
          fontWeight: 500,
          fontSize: '12px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
          maxWidth: '170px',
        }}
          title={val}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'category',
      title: '模型类别',
      width: 90,
      align: 'center',
      render: (val) => {
        const colors = CAT_COLORS[val || ''] || CAT_COLORS['其他']
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
      key: 'description',
      title: '模型概述',
      width: 140,
      render: (val) => (
        <div style={{
          fontSize: '11px',
          color: '#64748B',
          lineHeight: 1.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {val || '-'}
        </div>
      ),
    },
    {
      key: 'accuracy',
      title: '模型精度',
      width: 110,
      align: 'center',
      render: (val) => <AccuracyBar value={val} />,
    },
    {
      key: 'site',
      title: '应用现场',
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
      key: 'dataset',
      title: '使用数据集',
      width: 100,
      render: (val) => (
        <span style={{
          color: '#2563EB',
          fontSize: '11px',
          cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationColor: 'rgba(37, 99, 235, 0.3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
          maxWidth: '90px',
        }}
          title={val}
        >
          {val || '-'}
        </span>
      ),
    },
    {
      key: 'maintainDate',
      title: '维护日期',
      width: 80,
      align: 'center',
      render: (val) => (
        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{val}</span>
      ),
    },
    {
      key: 'maintainer',
      title: '维护人员',
      width: 70,
      align: 'center',
      render: (val) => (
        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{val}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 100,
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
      data={models}
      rowKey="id"
      loading={loading}
      emptyText="暂无模型"
      onRow={(record) => ({
        onClick: () => onSelect?.(record),
        style: { cursor: onSelect ? 'pointer' : 'default' },
      })}
      className={className}
      style={style}
    />
  )
}

export default ModelTable
