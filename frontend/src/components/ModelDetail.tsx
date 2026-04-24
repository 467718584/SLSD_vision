import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { C, MODEL_CAT_COLORS, SITE_COLORS } from '../constants'
import { Modal } from './ui/Modal'
import { ChevronLeftIcon, XIcon, EditIcon } from './Icons'
import Skeleton from './ui/Skeleton'
import { VersionSelector, ParamList, ModelVersion, ModelParam, CreateVersionModal, AddParamModal } from './VersionSelector'
import { VersionTimeline, VersionDiff } from './VersionTimeline'
import { CreateVersionData } from './CreateVersionModal'
import { AddParamData } from './AddParamModal'

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
  const [activeVersion, setActiveVersion] = useState<string>('')
  const [compareVersion, setCompareVersion] = useState<string | null>(null)
  const [showCreateVersion, setShowCreateVersion] = useState(false)
  const [showAddParam, setShowAddParam] = useState(false)
  const [showVersionTimeline, setShowVersionTimeline] = useState(false)
  const queryClient = useQueryClient()

  // 获取模型版本列表
  const { data: versionsData, isLoading: versionsLoading } = useQuery<{ success: boolean; versions: ModelVersion[] }>({
    queryKey: ['modelVersions', model.name],
    queryFn: async () => {
      const res = await fetch(`/api/model/${encodeURIComponent(model.name)}/versions`)
      return res.json()
    },
    enabled: !!model.name
  })

  const versions = versionsData?.versions || []
  const existingVersionNames = versions.map(v => v.versionName)

  // 如果没有选中版本且有版本列表，默认选中第一个
  React.useEffect(() => {
    if (!activeVersion && versions.length > 0) {
      const defaultVer = versions.find(v => v.isDefault) || versions[0]
      setActiveVersion(defaultVer.versionName)
    }
  }, [versions, activeVersion])

  // 获取当前版本的详情
  const { data: versionDetail, isLoading: versionLoading } = useQuery<{ success: boolean; version: ModelVersion }>({
    queryKey: ['versionDetail', model.name, activeVersion],
    queryFn: async () => {
      const res = await fetch(`/api/model/${encodeURIComponent(model.name)}/versions/${encodeURIComponent(activeVersion)}`)
      return res.json()
    },
    enabled: !!model.name && !!activeVersion
  })

  const currentVersion = versionDetail?.version
  const currentParams = currentVersion?.params || []

  // 创建版本mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: CreateVersionData) => {
      const res = await fetch(`/api/model/${encodeURIComponent(model.name)}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('创建版本失败')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelVersions', model.name] })
      setShowCreateVersion(false)
    }
  })

  // 上传参数文件mutation
  const uploadParamMutation = useMutation({
    mutationFn: async (data: AddParamData & { versionName: string }) => {
      const formData = new FormData()
      formData.append('file', data.file as File)
      formData.append('param_type', data.paramType)
      formData.append('description', data.description)
      
      const res = await fetch(`/api/model/${encodeURIComponent(model.name)}/versions/${encodeURIComponent(data.versionName)}/params`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('上传失败')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versionDetail', model.name, activeVersion] })
      setShowAddParam(false)
    }
  })

  // 删除参数文件mutation
  const deleteParamMutation = useMutation({
    mutationFn: async (paramId: number) => {
      const res = await fetch(`/api/model/${encodeURIComponent(model.name)}/versions/${encodeURIComponent(activeVersion)}/params/${paramId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('删除失败')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versionDetail', model.name, activeVersion] })
    }
  })

  // 设为默认版本mutation
  const setDefaultVersionMutation = useMutation({
    mutationFn: async (versionName: string) => {
      const res = await fetch(`/api/model/${encodeURIComponent(model.name)}/versions/${encodeURIComponent(versionName)}/default`, {
        method: 'PUT'
      })
      if (!res.ok) throw new Error('设置默认版本失败')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelVersions', model.name] })
      queryClient.invalidateQueries({ queryKey: ['versionDetail', model.name, activeVersion] })
    }
  })

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
      <div className="page-header mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="page-title" style={{ margin: 0 }}>{model.name}</h2>
            {/* 版本选择器 */}
            {versions.length > 0 && (
              <VersionSelector
                versions={versions}
                activeVersion={activeVersion}
                onVersionChange={setActiveVersion}
                onCreateVersion={() => setShowCreateVersion(true)}
                loading={versionsLoading}
              />
            )}
          </div>
          <p className="text-sm text-muted mt-1">
            模型详细信息 {activeVersion && <span className="badge badge-primary ml-2">{activeVersion}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {activeVersion && (
            <button
              onClick={() => setShowAddParam(true)}
              className="btn btn-secondary"
              style={{ background: '#f59e0b', color: 'white', borderColor: '#f59e0b' }}
            >
              + 补充参数
            </button>
          )}
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

      {/* 版本信息提示栏 - 当选中版本时显示 */}
      {activeVersion && currentVersion && (
        <div className="card mb-4" style={{ background: `${C.primary}08`, border: `1px solid ${C.primary}20` }}>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentVersion.datasetName && (
                  <div className="text-sm">
                    <span className="text-muted">关联数据集: </span>
                    <span style={{ color: C.primary, fontWeight: 600 }}>{currentVersion.datasetName}</span>
                    {currentVersion.datasetVersion && <span className="text-muted"> / {currentVersion.datasetVersion}</span>}
                  </div>
                )}
                {currentVersion.total_epochs && (
                  <div className="text-sm">
                    <span className="text-muted">训练轮次: </span>
                    <span style={{ fontWeight: 600 }}>{currentVersion.total_epochs}</span>
                  </div>
                )}
                {currentVersion.map50 && (
                  <div className="text-sm">
                    <span className="text-muted">mAP50: </span>
                    <span style={{ fontWeight: 600, color: C.success }}>{currentVersion.map50}%</span>
                  </div>
                )}
                {currentVersion.map50_95 && (
                  <div className="text-sm">
                    <span className="text-muted">mAP50-95: </span>
                    <span style={{ fontWeight: 600, color: C.success }}>{currentVersion.map50_95}%</span>
                  </div>
                )}
              </div>
              {currentVersion.description && (
                <div className="text-sm text-muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentVersion.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 版本历史时间线 - 可折叠 */}
      {versions.length > 0 && (
        <div className="card mb-4">
          <div
            className="card-header cursor-pointer"
            style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setShowVersionTimeline(!showVersionTimeline)}
          >
            <div className="flex items-center gap-2">
              <h3 className="card-title">版本历史</h3>
              <span className="badge badge-primary">{versions.length}个版本</span>
            </div>
            <span style={{ transform: showVersionTimeline ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
          </div>
          {showVersionTimeline && (
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <VersionTimeline
                versions={versions}
                activeVersion={activeVersion}
                onVersionSelect={setActiveVersion}
                onSetDefault={(versionName) => {
                  setDefaultVersionMutation.mutate(versionName)
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* 版本对比 - 当选中对比版本时显示 */}
      {compareVersion && versions.length > 1 && (
        <div className="card mb-4">
          <div className="card-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">版本对比</h3>
            <button
              onClick={() => setCompareVersion(null)}
              className="btn btn-sm btn-secondary"
            >
              关闭对比
            </button>
          </div>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <VersionDiff
              version1={currentVersion || versions[0]}
              version2={versions.find(v => v.versionName === compareVersion)}
            />
          </div>
        </div>
      )}

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

      {/* 参数文件列表 - 当有版本时显示 */}
      {activeVersion && (
        <div className="card mb-4">
          <div className="card-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">其它硬件模型参数</h3>
            <button
              onClick={() => setShowAddParam(true)}
              className="btn btn-sm"
              style={{ background: '#f59e0b', color: 'white', borderColor: '#f59e0b' }}
            >
              + 补充参数
            </button>
          </div>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            {versionLoading ? (
              <div style={{ textAlign: 'center', color: C.gray4, padding: '20px' }}>加载中...</div>
            ) : (
              <ParamList
                params={currentParams}
                onDelete={(paramId) => deleteParamMutation.mutate(paramId)}
                onDownload={(paramId) => {
                  window.open(`/api/model/${encodeURIComponent(model.name)}/versions/${encodeURIComponent(activeVersion)}/params/${paramId}/download`, '_blank')
                }}
              />
            )}
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

      {/* 新建版本弹窗 */}
      <CreateVersionModal
        modelName={model.name}
        isOpen={showCreateVersion}
        onClose={() => setShowCreateVersion(false)}
        onSubmit={async (data) => {
          await createVersionMutation.mutateAsync(data)
        }}
        existingVersions={existingVersionNames}
      />

      {/* 补充参数弹窗 */}
      <AddParamModal
        modelName={model.name}
        versionName={activeVersion}
        isOpen={showAddParam}
        onClose={() => setShowAddParam(false)}
        onSubmit={async (data) => {
          await uploadParamMutation.mutateAsync({ ...data, versionName: activeVersion })
        }}
      />
    </div>
  )
}

export default ModelDetail
