import React, { useState, useEffect, useRef } from 'react'
import { C } from '../constants'
import Skeleton from './ui/Skeleton'

// Props
interface DatasetDetailProps {
  ds: Dataset
  onBack: () => void
  onRefresh?: () => void
  onEdit: (ds: Dataset) => void
}

interface Dataset {
  id?: number
  name: string
  algoType?: string
  techMethod?: string
  total?: number
  labelCount?: number
  labels?: Record<string, number>
  classInfo?: Record<string, number | { name?: string; count?: number }>
  split?: string
  splitRatio?: string
  annotationType?: string
  maintainer?: string
  maintainDate?: string
  desc?: string
  source?: string
  storageType?: string
  hasTest?: boolean
  hasFolder?: boolean
  hasZip?: boolean
  bgCountTrain?: number
  bgCountVal?: number
  bgCountTest?: number
  bgCountTotal?: number
  imgCountTrain?: number
  imgCountVal?: number
  imgCountTest?: number
  previewCount?: number
}

// 四组预览图片结构
interface PreviewImages {
  train_original: string[]
  train_vis: string[]
  val_original: string[]
  val_vis: string[]
  test_original?: string[]
  test_vis?: string[]
}

// 视图类型
type ViewTab = 'original' | 'visualization'
type SplitFilter = 'all' | 'train' | 'val' | 'test'

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

// Tab标签组件
function TabBar({ 
  activeTab, 
  onTabChange, 
  tabs 
}: { 
  activeTab: ViewTab
  onTabChange: (tab: ViewTab) => void
  tabs: { key: ViewTab; label: string; count?: number }[]
}) {
  const tabStyles = {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    color: C.gray3,
    transition: 'all 0.2s',
  }
  const activeTabStyles = {
    ...tabStyles,
    borderBottom: `2px solid ${C.primary}`,
    color: C.primary,
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '4px', 
      borderBottom: `1px solid ${C.border}`,
      marginBottom: '16px'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={activeTab === tab.key ? activeTabStyles : tabStyles}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span style={{ 
              marginLeft: '6px', 
              fontSize: '11px',
              color: activeTab === tab.key ? C.primary : C.gray3,
              background: activeTab === tab.key ? `${C.primary}15` : C.gray5,
              padding: '2px 6px',
              borderRadius: '10px'
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// 胶片条组件
function FilmStrip({ 
  images, 
  currentIndex, 
  onSelect,
  getImageUrl 
}: { 
  images: string[]
  currentIndex: number
  onSelect: (index: number) => void
  getImageUrl: (path: string) => string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const itemWidth = 80 + 8 // width + gap
      const scrollPosition = Math.max(0, currentIndex * itemWidth - containerRef.current.clientWidth / 2 + itemWidth / 2)
      containerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' })
    }
  }, [currentIndex])

  if (images.length === 0) return null

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '8px 0',
        background: C.gray6,
        borderRadius: '8px',
        scrollbarWidth: 'thin' as const,
      }}
    >
      {images.map((img, idx) => (
        <div
          key={idx}
          onClick={() => onSelect(idx)}
          style={{
            flexShrink: 0,
            width: '80px',
            height: '60px',
            borderRadius: '6px',
            overflow: 'hidden',
            cursor: 'pointer',
            border: `2px solid ${idx === currentIndex ? C.primary : 'transparent'}`,
            opacity: idx === currentIndex ? 1 : 0.7,
            transition: 'all 0.2s',
          }}
        >
          <img
            src={getImageUrl(img)}
            alt={`thumb-${idx}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  )
}

// 主图展示组件
function MainViewer({ 
  image, 
  getImageUrl,
  imageIndex,
  totalImages 
}: { 
  image: string | null
  getImageUrl: (path: string) => string
  imageIndex: number
  totalImages: number
}) {
  if (!image) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        color: C.gray3,
        fontSize: '14px'
      }}>
        选择一张图片查看详情
      </div>
    )
  }

  return (
    <div style={{ 
      position: 'relative',
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <img
        src={getImageUrl(image)}
        alt="main-preview"
        style={{
          display: 'block',
          width: '100%',
          maxHeight: '480px',
          objectFit: 'contain',
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(0,0,0,0.6)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '12px',
      }}>
        {imageIndex + 1} / {totalImages}
      </div>
    </div>
  )
}

// 图片分组组件（简化版，用于标签页）
function ImageGrid({ 
  images, 
  onSelect,
  getImageUrl,
  columns = 4
}: { 
  images: string[]
  onSelect: (img: string) => void
  getImageUrl: (path: string) => string
  columns?: number
}) {
  if (images.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        color: C.gray3,
        fontSize: '14px'
      }}>
        暂无图片
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '8px',
    }}>
      {images.map((img, idx) => (
        <div
          key={idx}
          onClick={() => onSelect(img)}
          style={{
            position: 'relative',
            paddingTop: '75%',
            background: C.gray6,
            borderRadius: '6px',
            overflow: 'hidden',
            cursor: 'pointer',
            border: '1px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          <img
            src={getImageUrl(img)}
            alt={`grid-${idx}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  )
}

// 数据集详情页组件
function DatasetDetail({ ds, onBack, onRefresh, onEdit }: DatasetDetailProps) {
  const [previewImages, setPreviewImages] = useState<PreviewImages>({
    train_original: [], train_vis: [],
    val_original: [], val_vis: [],
    test_original: [], test_vis: [],
  })
  const [loading, setLoading] = useState(true)
  
  // 新增状态：视图切换
  const [activeTab, setActiveTab] = useState<ViewTab>('original')
  const [splitFilter, setSplitFilter] = useState<SplitFilter>('all')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    loadPreviewImages()
  }, [ds.name])

  async function loadPreviewImages() {
    setLoading(true)
    try {
      const res = await fetch(`/api/dataset/${encodeURIComponent(ds.name)}/preview-images`)
      const data = await res.json()
      setPreviewImages({
        train_original: data.train_original || [],
        train_vis: data.train_vis || [],
        val_original: data.val_original || [],
        val_vis: data.val_vis || [],
        test_original: data.test_original || [],
        test_vis: data.test_vis || [],
      })
      // 默认选中第一张图
      const firstImg = data.train_original?.[0] || data.val_original?.[0] || data.train_vis?.[0] || data.val_vis?.[0]
      if (firstImg) {
        setSelectedImage(firstImg)
      }
    } catch (err) {
      console.error('Failed to load preview images:', err)
    }
    setLoading(false)
  }

  // 获取图片URL
  function getImageUrl(path: string) {
    if (!path) return ''
    const dataMatch = path.match(/(?:\/|\.)?data\/datasets\/(.+)/i)
    if (dataMatch) {
      return `/data/datasets/${dataMatch[1]}`
    }
    if (path.startsWith('/data/')) {
      return path
    }
    if (path.startsWith('vis/') || path.startsWith('images/') || path.startsWith('train/') || path.startsWith('val/') || path.startsWith('test/')) {
      return `/data/${path}`
    }
    return `/data/${path}`
  }

  // 根据当前tab和split获取图片列表
  function getCurrentImages() {
    let images: string[] = []
    
    // 根据tab选择图片类型
    switch (activeTab) {
      case 'original':
        images = [...previewImages.train_original, ...previewImages.val_original, ...(previewImages.test_original || [])]
        break
      case 'visualization':
        images = [...previewImages.train_vis, ...previewImages.val_vis, ...(previewImages.test_vis || [])]
        break
    }
    
    // 根据split过滤
    switch (splitFilter) {
      case 'train':
        images = images.filter(img => img.includes('/train/'))
        break
      case 'val':
        images = images.filter(img => img.includes('/val/'))
        break
      case 'test':
        images = images.filter(img => img.includes('/test/'))
        break
    }
    
    return images
  }

  // 计算各tab数量
  const originalCount = previewImages.train_original.length + previewImages.val_original.length + (previewImages.test_original?.length || 0)
  const visCount = previewImages.train_vis.length + previewImages.val_vis.length + (previewImages.test_vis?.length || 0)

  const tabs = [
    { key: 'original' as ViewTab, label: 'Original Images', count: originalCount },
    { key: 'visualization' as ViewTab, label: 'Visualization', count: visCount },
  ]

  const currentImages = getCurrentImages()

  const handleSelectImage = (img: string) => {
    setSelectedImage(img)
    const idx = currentImages.indexOf(img)
    if (idx >= 0) setSelectedIndex(idx)
  }

  const handleFilmSelect = (index: number) => {
    if (currentImages[index]) {
      setSelectedImage(currentImages[index])
      setSelectedIndex(index)
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 头部 - 增加间距 */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: C.gray1, margin: 0 }}>{ds.name}</h2>
            <p style={{ fontSize: '14px', color: C.gray3, marginTop: '4px' }}>数据集详细信息</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onBack} style={{ padding: '8px 16px', fontSize: '14px', border: `1px solid ${C.border}`, background: 'white', borderRadius: '6px', cursor: 'pointer' }}>
              ← 返回
            </button>
            {onEdit && (
              <button onClick={() => onEdit(ds)} style={{ padding: '8px 16px', fontSize: '14px', border: 'none', background: C.primary, color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                编辑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 左右分栏布局 - 使用grid布局 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 300px', 
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* 左侧 - 主图展示 + 胶片条 */}
        <div style={{ minWidth: 0 }}>
          {/* Tab标签 */}
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

          {/* 主图展示 */}
          {loading ? (
            <div>
              <Skeleton height={480} className="w-full mb-3" borderRadius={8} />
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1,2,3,4,5].map(i => <Skeleton key={i} width={80} height={60} borderRadius={6} />)}
              </div>
            </div>
          ) : (
            <>
              <MainViewer 
                image={selectedImage} 
                getImageUrl={getImageUrl}
                imageIndex={selectedIndex}
                totalImages={currentImages.length}
              />
              
              {/* 胶片条导航 */}
              <div style={{ marginTop: '12px' }}>
                <FilmStrip
                  images={currentImages}
                  currentIndex={selectedIndex}
                  onSelect={handleFilmSelect}
                  getImageUrl={getImageUrl}
                />
              </div>
            </>
          )}
        </div>

        {/* 右侧 30% - 数据集信息 + 类别统计 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 基本信息卡片 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4 text-primary">基本信息</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InfoItem label="算法类型" value={ds.algoType} />
              <InfoItem label="技术方法" value={ds.techMethod || '目标检测算法'} />
              <InfoItem label="存储方式" value={ds.storageType === 'folder' ? '文件夹' : 'ZIP压缩包'} />
              <InfoItem label="标注格式" value={ds.annotationType?.toUpperCase() || 'YOLO'} />
              <InfoItem label="样本总数" value={ds.total?.toLocaleString()} />
              <InfoItem label="标签总数" value={ds.labelCount?.toLocaleString()} />
              <InfoItem label="类别数量" value={Object.keys(ds.classInfo || {}).length} />
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="text-xs text-muted">分配比例</label>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* 训练集 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: C.success }} />
                      <span style={{ fontSize: '13px', color: C.gray2 }}>训练集</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: C.success }}>{ds.imgCountTrain?.toLocaleString() ?? 0}</span>
                      <span style={{ fontSize: '12px', color: C.gray3 }}>({ds.imgCountTrain && ds.total ? ((ds.imgCountTrain / ds.total) * 100).toFixed(1) : '0.0'}%)</span>
                    </div>
                  </div>
                  {/* 验证集 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: C.warning }} />
                      <span style={{ fontSize: '13px', color: C.gray2 }}>验证集</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: C.warning }}>{ds.imgCountVal?.toLocaleString() ?? 0}</span>
                      <span style={{ fontSize: '12px', color: C.gray3 }}>({ds.imgCountVal && ds.total ? ((ds.imgCountVal / ds.total) * 100).toFixed(1) : '0.0'}%)</span>
                    </div>
                  </div>
                  {/* 测试集 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: C.error }} />
                      <span style={{ fontSize: '13px', color: C.gray2 }}>测试集</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: C.error }}>{ds.imgCountTest?.toLocaleString() ?? 0}</span>
                      <span style={{ fontSize: '12px', color: C.gray3 }}>({ds.imgCountTest && ds.total ? ((ds.imgCountTest / ds.total) * 100).toFixed(1) : '0.0'}%)</span>
                    </div>
                  </div>
                  {/* 可视化进度条 */}
                  <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: C.gray6, gap: '2px', marginTop: '4px' }}>
                    {ds.total && ds.total > 0 && (ds.imgCountTrain ?? 0) > 0 ? (
                      <div style={{ flex: ds.imgCountTrain || 1, background: C.success, borderRadius: '4px 0 0 4px' }} />
                    ) : null}
                    {ds.total && ds.total > 0 && (ds.imgCountVal ?? 0) > 0 ? (
                      <div style={{ flex: ds.imgCountVal || 1, background: C.warning }} />
                    ) : null}
                    {ds.total && ds.total > 0 && (ds.imgCountTest ?? 0) > 0 ? (
                      <div style={{ flex: ds.imgCountTest || 1, background: C.error, borderRadius: '0 4px 4px 0' }} />
                    ) : null}
                    {(ds.imgCountTrain ?? 0) === 0 && (ds.imgCountVal ?? 0) === 0 && (ds.imgCountTest ?? 0) === 0 && (
                      <div style={{ flex: 1, background: C.gray5 }} />
                    )}
                  </div>
                  {/* 原始比例字符串 */}
                  <div style={{ fontSize: '11px', color: C.gray3 }}>原始比例: {ds.split || ds.splitRatio || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 类别统计卡片 */}
          {ds.classInfo && Object.keys(ds.classInfo).length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-4 text-primary">类别统计</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(ds.classInfo).map(([key, value]) => {
                  const count = typeof value === 'number' ? value : (value.count || 0)
                  const name = typeof value === 'object' ? (value.name || key) : key
                  return (
                    <div key={key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: C.primaryBg,
                      border: `1px solid ${C.primaryBd}`,
                    }}>
                      <span style={{ fontSize: '13px', color: C.primary, fontWeight: 500 }}>{name}</span>
                      <span style={{ fontSize: '14px', color: C.primary, fontWeight: 700 }}>{count.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Split过滤器 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3 text-primary">数据分组</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(['all', 'train', 'val', 'test'] as SplitFilter[]).map(filter => {
                const isActive = splitFilter === filter
                const count = filter === 'train' ? (ds.imgCountTrain ?? 0)
                  : filter === 'val' ? (ds.imgCountVal ?? 0)
                  : filter === 'test' ? (ds.imgCountTest ?? 0)
                  : (ds.total ?? 0)
                return (
                  <button
                    key={filter}
                    onClick={() => setSplitFilter(filter)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: '1px solid',
                      borderColor: isActive ? C.primary : C.border,
                      background: isActive ? `${C.primary}15` : 'transparent',
                      color: isActive ? C.primary : C.gray2,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ textTransform: 'capitalize' }}>
                      {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      opacity: 0.7,
                      background: isActive ? `${C.primary}20` : C.gray5,
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 数据来源 */}
          {ds.source && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-2 text-primary">数据来源</h3>
              <span style={{ 
                display: 'inline-block', 
                padding: '4px 10px', 
                fontSize: '12px', 
                borderRadius: '4px', 
                background: '#E3F2FD', 
                border: '1px solid #90CAF9', 
                color: '#1565C0' 
              }}>
                {ds.source}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DatasetDetail
