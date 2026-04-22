import React, { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { C, MODEL_CAT_COLORS, SITE_COLORS } from '../constants'
import { Modal } from './ui/Modal'
import { ChevronLeftIcon, XIcon, EditIcon } from './Icons'
import Skeleton from './ui/Skeleton'

// Props
interface ModelDetailProps {
  model: Model
  datasets?: Dataset[]
  onBack: () => void
  onEdit: (model: Model) => void
}

interface Model {
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

interface Dataset {
  name: string
}

interface Charts {
  [key: string]: string | undefined
}

interface ModelDetailResponse {
  success: boolean
  metadata?: Record<string, any>
  charts: Charts
  csv_charts: (string | null)[]
  weights?: { best?: string; last?: string }
  batch_images?: string[]
  predictions?: string[]
}

// 信息项组件
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted font-medium">{label}</label>
      <div className="text-sm" style={{ color: 'var(--text-primary)', marginTop: '4px' }}>
        {value}
      </div>
    </div>
  )
}

// 图表项组件 - 使用 React.memo 避免不必要的重渲染
const ChartItem = React.memo(function ChartItem({
  title,
  src,
  onPreview
}: {
  title: string
  src?: string
  onPreview: (src: string) => void
}) {
  if (!src) {
    return (
      <div className="text-center">
        <div
          style={{
            width: '100%',
            height: '240px',
            background: 'var(--gray-7)',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)',
          }}
        >
          <span className="text-xs text-muted">{title}</span>
          <span className="text-xs" style={{ color: 'var(--gray-4)', marginTop: '4px' }}>暂无数据</span>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <img
        src={src}
        alt={title}
        className="img-fluid transition-all"
        style={{
          width: '100%',
          height: '240px',
          objectFit: 'cover',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          imageRendering: '-webkit-optimize-contrast',
        }}
        loading="lazy"
        onClick={() => onPreview(src)}
      />
      <div className="text-xs text-muted" style={{ marginTop: '6px' }}>{title}</div>
    </div>
  )
})

// 精度曲线组件 - 专门处理 csv_charts 中的 4 张精度曲线图
function AccuracyCurves({
  csvCharts,
  onPreview
}: {
  csvCharts: (string | null)[]
  onPreview: (src: string) => void
}) {
  const curveTitles = ['mAP50', 'mAP50-95', '训练损失', '验证损失']

  return (
    <div className="card mb-4">
      <div className="card-header" style={{ padding: '16px 20px' }}>
        <h3 className="card-title">训练曲线</h3>
      </div>
      <div className="card-body" style={{ padding: '16px 20px' }}>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {curveTitles.map((title, index) => {
            const src = csvCharts[index]
            // csv_charts 路径需要加上 /data/ 前缀（后端返回的是相对路径）
            const fullSrc = src ? `/${src}` : undefined
            return (
              <ChartItem
                key={title}
                title={title}
                src={fullSrc}
                onPreview={onPreview}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 模型详情页组件
function ModelDetail({ model, datasets, onBack, onEdit }: ModelDetailProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // 使用 React Query 缓存模型详情数据，避免重复请求
  const { data: detailData, isLoading: chartsLoading } = useQuery<ModelDetailResponse>({
    queryKey: ['modelDetail', model.name],
    queryFn: async () => {
      const res = await fetch(`/api/model/detail/${encodeURIComponent(model.name)}`)
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5分钟内不重新请求
    gcTime: 1000 * 60 * 30,   // 缓存保留30分钟
  })

  const charts = detailData?.charts || {}
  const csvCharts = detailData?.csv_charts || [null, null, null, null]

  // 精度颜色
  const accuracyColor =
    (model.accuracy || 0) >= 95
      ? C.success
      : (model.accuracy || 0) >= 85
      ? C.primary
      : C.warning

  // 预览回调
  const handlePreview = useCallback((src: string) => {
    setPreviewImage(src)
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      {/* 头部 - 使用 page-header 布局，Roboflow风格 */}
      <div className="page-header mb-5">
        <div>
          <h2 className="page-title">{model.name}</h2>
          <p className="text-sm text-muted mt-1">模型详细信息</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="btn btn-secondary">
            <ChevronLeftIcon size={16} />
            返回
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(model)}
              className="btn btn-primary"
            >
              <EditIcon size={14} />
              编辑
            </button>
          )}
        </div>
      </div>

      {/* 基本信息卡片 */}
      <div className="card mb-4">
        <div className="card-header" style={{ padding: '16px 20px' }}>
          <h3 className="card-title">基本信息</h3>
        </div>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <InfoItem label="算法名称" value={model.algoName || '-'} />
            <InfoItem label="技术方法" value={model.techMethod || '目标检测算法'} />
            <InfoItem
              label="模型类别"
              value={
                <span className="badge">
                  {model.category || '-'}
                </span>
              }
            />
            <InfoItem
              label="模型精度"
              value={
                <div className="accuracy-bar">
                  <div className="accuracy-bar-track">
                    <div
                      className="accuracy-bar-fill"
                      style={{
                        width: `${model.accuracy || 0}%`,
                        background: accuracyColor,
                      }}
                    />
                  </div>
                  <span className="accuracy-value" style={{ color: accuracyColor }}>{model.accuracy}%</span>
                </div>
              }
            />
            <InfoItem
              label="应用现场"
              value={
                model.site ? (
                  <span className="badge">
                    {model.site}
                  </span>
                ) : (
                  '-'
                )
              }
            />
            <InfoItem
              label="使用数据集"
              value={<span style={{ color: 'var(--primary)' }}>{model.dataset || '-'}</span>}
            />
            <InfoItem label="维护人员" value={model.maintainer || '-'} />
            <InfoItem label="维护日期" value={model.maintainDate || '-'} />
          </div>
          {model.description && (
            <div style={{ marginTop: '16px' }}>
              <label className="text-xs text-muted font-medium">描述</label>
              <p className="text-sm" style={{ color: 'var(--gray-2)', marginTop: '4px' }}>{model.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* 训练曲线卡片 - 使用 React Query 缓存的 csv_charts */}
      {chartsLoading ? (
        <div className="card mb-4">
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <h3 className="card-title">训练曲线</h3>
          </div>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} height={120} borderRadius="6px" />)}
            </div>
          </div>
        </div>
      ) : (
        <AccuracyCurves csvCharts={csvCharts} onPreview={handlePreview} />
      )}

      {/* PR曲线和混淆矩阵 - 使用 metadata.charts */}
      <div className="card mb-4">
        <div className="card-header" style={{ padding: '16px 20px' }}>
          <h3 className="card-title">PR曲线与混淆矩阵</h3>
        </div>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          {chartsLoading ? (
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={120} borderRadius="6px" />)}
            </div>
          ) : (
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              <ChartItem title="F1曲线" src={charts['BoxF1_curve']} onPreview={handlePreview} />
              <ChartItem title="精确率曲线" src={charts['BoxP_curve']} onPreview={handlePreview} />
              <ChartItem title="召回率曲线" src={charts['BoxR_curve']} onPreview={handlePreview} />
              <ChartItem title="PR曲线" src={charts['BoxPR_curve']} onPreview={handlePreview} />
              <ChartItem title="混淆矩阵" src={charts['confusion_matrix']} onPreview={handlePreview} />
            </div>
          )}
        </div>
      </div>

      {/* 预测效果展示 */}
      {detailData?.predictions && detailData.predictions.length > 0 && (
        <div className="card mb-4">
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <h3 className="card-title">预测效果</h3>
          </div>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div
              className="grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              {detailData.predictions.map((src, index) => (
                <div key={index} className="text-center">
                  <img
                    src={src}
                    alt={`预测效果 ${index + 1}`}
                    className="img-fluid transition-all"
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      imageRendering: '-webkit-optimize-contrast',
                    }}
                    loading="lazy"
                    onClick={() => handlePreview(src)}
                  />
                  <div className="text-xs text-muted" style={{ marginTop: '6px' }}>
                    预测效果 {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 图片预览弹窗 - 使用 Modal 组件 */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="图片预览"
        size="lg"
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src={previewImage || ''}
            alt="preview"
            className="img-fluid"
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }}
          />
        </div>
      </Modal>
    </div>
  )
}

export default ModelDetail
