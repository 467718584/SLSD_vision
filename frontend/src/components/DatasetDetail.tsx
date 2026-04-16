import React, { useState, useEffect } from 'react'
import { C } from '../constants'

// Props
interface DatasetDetailProps {
  ds: Dataset
  onBack: () => void
  onRefresh?: () => void
  onEdit: (ds: Dataset) => void
}

interface Dataset {
  name: string
  algoType?: string
  techMethod?: string
  total?: number
  classInfo?: Record<string, number | { name?: string; count?: number }>
  split?: string
  annotationType?: string
  maintainer?: string
  maintainDate?: string
  desc?: string
  source?: string
}

interface SplitImages {
  train: string[]
  val: string[]
  test: string[]
}

// 信息项组件
function InfoItem({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <div className="mt-1 text-sm font-medium text-primary">
        {value || '-'}
      </div>
    </div>
  )
}

// 图片分区组件
function ImageSection({ title, images, onPreview, getImageUrl }: {
  title: string
  images: string[]
  onPreview: (img: string) => void
  getImageUrl: (path: string) => string
}) {
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold text-secondary mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={getImageUrl(img)}
            alt={`preview-${idx}`}
            className="w-[100px] h-[75px] object-cover rounded cursor-pointer border border-[#E2E8F0]"
            onClick={() => onPreview(img)}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  )
}

// 数据集详情页组件
function DatasetDetail({ ds, onBack, onRefresh, onEdit }: DatasetDetailProps) {
  const [splitImages, setSplitImages] = useState<SplitImages>({ train: [], val: [], test: [] })
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    loadImages()
  }, [ds.name])

  async function loadImages() {
    setLoading(true)
    try {
      const res = await fetch(`/api/dataset/${encodeURIComponent(ds.name)}/split-images`)
      const data = await res.json()
      setSplitImages({
        train: data.train || [],
        val: data.val || [],
        test: data.test || []
      })
    } catch (err) {
      console.error('Failed to load images:', err)
    }
    setLoading(false)
  }

  // 获取图片URL
  function getImageUrl(path: string) {
    return `/data/${path.replace('SLSD_vision/data/', '')}`
  }

  return (
    <div className="p-5">
      {/* 头部 */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="btn mr-3">
            ← 返回
          </button>
          <span className="text-lg font-semibold text-primary">
            {ds.name}
          </span>
        </div>
        {onEdit && (
          <button onClick={() => onEdit(ds)} className="btn btn-primary">
            编辑
          </button>
        )}
      </div>

      {/* 基本信息卡片 */}
      <div className="card mb-4">
        <h3 className="text-sm font-semibold mb-4 text-primary">
          基本信息
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <InfoItem label="算法类型" value={ds.algoType} />
          <InfoItem label="技术方法" value={ds.techMethod || '目标检测算法'} />
          <InfoItem label="样本数量" value={ds.total?.toLocaleString()} />
          <InfoItem label="标签数" value={Object.keys(ds.classInfo || {}).length} />
          <InfoItem label="分配比例" value={ds.split} />
          <InfoItem label="标注格式" value={ds.annotationType?.toUpperCase() || 'YOLO'} />
          <InfoItem label="维护人员" value={ds.maintainer} />
          <InfoItem label="维护日期" value={ds.maintainDate} />
        </div>
        {ds.desc && (
          <div className="mt-4">
            <label className="text-xs text-muted">描述</label>
            <p className="mt-1 text-sm text-secondary">{ds.desc}</p>
          </div>
        )}
        {ds.source && (
          <div className="mt-3">
            <label className="text-xs text-muted">数据来源</label>
            <div className="mt-1">
              <span className="inline-block px-[8px] py-[2px] text-xs rounded bg-[#E3F2FD] border border-[#90CAF9] text-[#1565C0]">
                {ds.source}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 类别统计卡片 */}
      {ds.classInfo && Object.keys(ds.classInfo).length > 0 && (
        <div className="card mb-4">
          <h3 className="text-sm font-semibold mb-4 text-primary">
            类别统计
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(ds.classInfo).map(([key, value]) => {
              const count = typeof value === 'number' ? value : (value.count || 0)
              const name = typeof value === 'object' ? (value.name || key) : key
              return (
                <div key={key} className="rounded-lg p-3 px-4 min-w-[120px] bg-[#EBF3FC] border border-[#BFDBF7]">
                  <div className="text-xs text-[#0066CC] mb-1">{name}</div>
                  <div className="text-xl font-bold text-[#0066CC]">
                    {count.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 数据集预览卡片 */}
      <div className="card mb-4">
        <h3 className="text-sm font-semibold mb-4 text-primary">
          数据集预览
        </h3>
        {loading ? (
          <div className="text-center p-10 text-muted">加载中...</div>
        ) : (
          <>
            {/* Train集 */}
            {splitImages.train.length > 0 && (
              <ImageSection title={`训练集 (${splitImages.train.length})`} images={splitImages.train.slice(0, 6)} onPreview={setPreviewImage} getImageUrl={getImageUrl} />
            )}
            {/* Val集 */}
            {splitImages.val.length > 0 && (
              <ImageSection title={`验证集 (${splitImages.val.length})`} images={splitImages.val.slice(0, 6)} onPreview={setPreviewImage} getImageUrl={getImageUrl} />
            )}
            {/* Test集 */}
            {splitImages.test.length > 0 && (
              <ImageSection title={`测试集 (${splitImages.test.length})`} images={splitImages.test.slice(0, 6)} onPreview={setPreviewImage} getImageUrl={getImageUrl} />
            )}
            {splitImages.train.length === 0 && splitImages.val.length === 0 && splitImages.test.length === 0 && (
              <div className="text-center p-10 text-muted">暂无预览图片</div>
            )}
          </>
        )}
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]" onClick={() => setPreviewImage(null)}>
          <img src={getImageUrl(previewImage)} alt="preview" className="max-w-[90%] max-h-[90%] rounded-lg" />
          <button onClick={() => setPreviewImage(null)} className="absolute top-5 right-5 w-10 h-10 bg-white rounded-full text-xl cursor-pointer border-0">×</button>
        </div>
      )}
    </div>
  )
}

export default DatasetDetail
