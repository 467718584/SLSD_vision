import React, { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { C, MODEL_CAT_COLORS, SITE_COLORS } from '../constants'

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
}

// 信息项组件
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: var(--text-muted) }}>{label}</label>
      <div style={{ marginTop: '4px', fontSize: '13px', color: var(--text-primary) }}>
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
      <div style={styles.chartItem}>
        <div style={styles.chartPlaceholder}>
          <div style={{ fontSize: '12px', color: var(--text-muted) }}>{title}</div>
          <div style={{ fontSize: '11px', color: C.gray4, marginTop: '4px' }}>暂无数据</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.chartItem}>
      <img
        src={src}
        alt={title}
        style={styles.chartImage}
        loading="lazy"
        onClick={() => onPreview(src)}
      />
      <div style={styles.chartLabel}>{title}</div>
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
    <div className="card" style={{ marginBottom: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: var(--text-primary) }}>
        训练曲线
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
  )
}

// 模型详情页组件
function ModelDetail({ model, datasets, onBack, onEdit }: ModelDetailProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // 使用 React Query 缓存模型详情数据，避免重复请求
  const { data: detailData } = useQuery<ModelDetailResponse>({
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
      {/* 头部 */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} className="btn" style={{ marginRight: '12px' }}>
            ← 返回
          </button>
          <span style={{ fontSize: '18px', fontWeight: 600, color: var(--text-primary) }}>
            {model.name}
          </span>
        </div>
        {onEdit && (
          <button
            onClick={() => onEdit(model)}
            className="btn"
            className="btn btn-primary"
          >
            编辑
          </button>
        )}
      </div>

      {/* 基本信息卡片 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: var(--text-primary) }}>
          基本信息
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <InfoItem label="算法名称" value={model.algoName || '-'} />
          <InfoItem label="技术方法" value={model.techMethod || '目标检测算法'} />
          <InfoItem
            label="模型类别"
            value={
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  background: MODEL_CAT_COLORS[model.category || '']?.bg || C.gray6,
                  color: MODEL_CAT_COLORS[model.category || '']?.text || C.gray2,
                }}
              >
                {model.category || '-'}
              </span>
            }
          />
          <InfoItem
            label="模型精度"
            value={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '6px',
                    background: C.gray6,
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${model.accuracy || 0}%`,
                      height: '100%',
                      background: accuracyColor,
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <span style={{ fontWeight: 700, color: accuracyColor }}>{model.accuracy}%</span>
              </div>
            }
          />
          <InfoItem
            label="应用现场"
            value={
              model.site ? (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    background: SITE_COLORS[model.site]?.bg || C.gray6,
                    color: SITE_COLORS[model.site]?.text || C.gray2,
                  }}
                >
                  {model.site}
                </span>
              ) : (
                '-'
              )
            }
          />
          <InfoItem
            label="使用数据集"
            value={<span style={{ color: C.primary }}>{model.dataset || '-'}</span>}
          />
          <InfoItem label="维护人员" value={model.maintainer || '-'} />
          <InfoItem label="维护日期" value={model.maintainDate || '-'} />
        </div>
        {model.description && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '12px', color: var(--text-muted) }}>描述</label>
            <p style={{ marginTop: '4px', color: C.gray2, fontSize: '13px' }}>{model.description}</p>
          </div>
        )}
      </div>

      {/* 训练曲线卡片 - 使用 React Query 缓存的 csv_charts */}
      <AccuracyCurves csvCharts={csvCharts} onPreview={handlePreview} />

      {/* PR曲线和混淆矩阵 - 使用 metadata.charts */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: var(--text-primary) }}>
          PR曲线与混淆矩阵
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          <ChartItem title="F1曲线" src={charts['box_f1']} onPreview={handlePreview} />
          <ChartItem title="精确率曲线" src={charts['box_p']} onPreview={handlePreview} />
          <ChartItem title="召回率曲线" src={charts['box_r']} onPreview={handlePreview} />
          <ChartItem title="PR曲线" src={charts['box_pr']} onPreview={handlePreview} />
          <ChartItem title="混淆矩阵" src={charts['confusion']} onPreview={handlePreview} />
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div style={styles.previewOverlay} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="preview" style={styles.previewImage} />
          <button onClick={() => setPreviewImage(null)} style={styles.previewClose}>
            ×
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  chartItem: {
    textAlign: 'center' as const,
  },
  chartImage: {
    width: '100%',
    height: '120px',
    objectFit: 'cover' as const,
    borderRadius: '6px',
    border: `1px solid ${C.border}`,
    cursor: 'pointer',
  },
  chartPlaceholder: {
    width: '100%',
    height: '120px',
    background: C.gray7,
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${C.border}`,
  },
  chartLabel: {
    fontSize: '11px',
    color: var(--text-muted),
    marginTop: '6px',
  },
  previewOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  previewImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: '8px',
  },
  previewClose: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    background: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontSize: '20px',
    cursor: 'pointer',
  },
}

export default ModelDetail
