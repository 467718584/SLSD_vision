// ModelListWrapper - Roboflow风格模型列表封装组件
// 用途：将现有的ModelList组件封装为Roboflow风格的页面
// 约束：不修改原始ModelList.tsx，只提供可选的封装包装

import React from 'react'
import ModelList from '../ModelList'
import PageHeader from './PageHeader'
import { Card } from './Card'
import { UploadIcon, RefreshIcon } from '../Icons'

// 重新导出ModelList的类型，方便外部使用
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

export interface Dataset {
  name: string
}

export interface ModelListWrapperProps {
  /** 模型列表数据 */
  models: Model[]
  /** 数据集列表（用于关联） */
  datasets: Dataset[]
  /** 选中模型的回调 */
  onSelectModel: (m: Model) => void
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
    algoName: string
    techMethod: string
    site: string
    category: string
    dateRange: { start: string; end: string }
    accuracyRange: { min: string; max: string }
  }) => void
  /** 类名 */
  className?: string
}

const ModelListWrapper: React.FC<ModelListWrapperProps> = ({
  models,
  datasets,
  onSelectModel,
  onRefresh,
  onShowUpload,
  title = '模型管理',
  subtitle = '管理所有训练模型，支持性能对比和批量导出',
  loading = false,
  extraActions,
  onAdvancedSearch,
  className = '',
}) => {
  // PageHeader 操作按钮配置
  const actions = [
    {
      label: '上传模型',
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
        actions={actions}
        searchPlaceholder="搜索模型..."
        onSearch={(query) => {
          if (onAdvancedSearch) {
            onAdvancedSearch({
              searchQuery: query,
              algoName: '',
              techMethod: '',
              site: '',
              category: '',
              dateRange: { start: '', end: '' },
              accuracyRange: { min: '', max: '' },
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
        {/* 模型列表卡片容器 */}
        <Card
          padding="none"
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {/* 传入props给原始ModelList组件 */}
          <ModelList
            models={models}
            datasets={datasets}
            onSelectModel={onSelectModel}
            onRefresh={onRefresh}
            onShowUpload={onShowUpload}
          />
        </Card>
      </div>
    </div>
  )
}

export default ModelListWrapper
