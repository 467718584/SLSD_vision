// DatasetListWrapper - Roboflow风格数据集列表封装组件
// 用途：将现有的DatasetList组件封装为Roboflow风格的页面
// 约束：不修改原始DatasetList.tsx，只提供可选的封装包装

import React from 'react'
import DatasetList from '../DatasetList'
import PageHeader from './PageHeader'
import { Card } from './Card'
import { Button } from './Button'
import { PlusIcon, RefreshIcon, UploadIcon } from '../Icons'

// 重新导出DatasetList的类型，方便外部使用
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

export interface DatasetListWrapperProps {
  /** 数据集列表数据 */
  datasets: Dataset[]
  /** 选中数据集的回调 */
  onSelectDataset: (ds: Dataset) => void
  /** 刷新数据回调 */
  onRefresh: () => void
  /** 显示上传弹窗回调 */
  onShowUpload: () => void
  /** 页面标题 */
  title?: string
  /** 页面副标题 */
  subtitle?: string
  /** 是否显示加载状态 */
  loading?: boolean
  /** 额外的按钮操作 */
  extraActions?: React.ReactNode
  /** 高级搜索回调（可选） */
  onAdvancedSearch?: (filters: {
    searchQuery: string
    algoType: string
    techMethod: string
    source: string
    dateRange: { start: string; end: string }
    sampleRange: { min: string; max: string }
    split: string
  }) => void
  /** 类名 */
  className?: string
}

const DatasetListWrapper: React.FC<DatasetListWrapperProps> = ({
  datasets,
  onSelectDataset,
  onRefresh,
  onShowUpload,
  title = '数据集管理',
  subtitle = '管理所有标注数据集，支持批量导出和版本控制',
  loading = false,
  extraActions,
  onAdvancedSearch,
  className = '',
}) => {
  // PageHeader 操作按钮配置
  const actions = [
    {
      label: '上传数据集',
      icon: <UploadIcon size={14} />,
      onClick: onShowUpload,
      variant: 'primary' as const,
    },
    {
      label: '刷新',
      icon: <RefreshIcon size={14} />,
      onClick: onRefresh,
      variant: 'secondary' as const,
    },
  ]

  // 如果有额外操作，添加到按钮列表
  if (extraActions) {
    actions.push({
      label: '',
      onClick: () => {},
      variant: 'ghost' as const,
    } as any)
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#F7F8FA',
      }}
    >
      {/* 页面头部 */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={actions.filter((a) => a.label !== '')}
        searchPlaceholder="搜索数据集..."
        onSearch={(query) => {
          if (onAdvancedSearch) {
            onAdvancedSearch({
              searchQuery: query,
              algoType: '',
              techMethod: '',
              source: '',
              dateRange: { start: '', end: '' },
              sampleRange: { min: '', max: '' },
              split: '',
            })
          }
        }}
      />

      {/* 主内容区 */}
      <div
        style={{
          flex: 1,
          padding: '0 24px 24px',
          overflow: 'auto',
        }}
      >
        {/* 数据集列表卡片容器 */}
        <Card
          padding="none"
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {/* 传入props给原始DatasetList组件 */}
          <DatasetList
            datasets={datasets}
            onSelectDataset={onSelectDataset}
            onRefresh={onRefresh}
            onShowUpload={onShowUpload}
          />
        </Card>
      </div>
    </div>
  )
}

export default DatasetListWrapper
