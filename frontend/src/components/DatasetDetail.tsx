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

// 预览图片结构
interface PreviewImages {
  train_original: string[]
  train_vis: string[]
  val_original: string[]
  val_vis: string[]
  test_original?: string[]
  test_vis?: string[]
  // 扩展字段（未来支持）
  augmented?: string[]
  preprocessed?: string[]
}

// 视图类型
type ViewTab = 'original' | 'augmented' | 'preprocessed' | 'visualization'
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
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 500,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    color: C.gray3,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }
  const activeTabStyles = {
    ...tabStyles,
    borderBottom: `2px solid ${C.primary}`,
    color: C.primary,
    fontWeight: 600,
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '4px', 
      borderBottom: `1px solid ${C.border}`,
      marginBottom: '0',
      background: C.white,
      padding: '0 4px',
      borderRadius: '8px 8px 0 0',
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
              marginLeft: '4px', 
              fontSize: '11px',
              color: activeTab === tab.key ? C.primary : C.gray3,
              background: activeTab === tab.key ? `${C.primary}15` : C.gray6,
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 500,
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
  getImageUrl,
  visibleCount = 8
}: { 
  images: string[]
  currentIndex: number
  onSelect: (index: number) => void
  getImageUrl: (path: string) => string
  visibleCount?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current && images.length > 0) {
      const itemWidth = 84 // width(76) + gap(8)
      const containerWidth = containerRef.current.clientWidth
      const scrollLeft = Math.max(0, currentIndex * itemWidth - containerWidth / 2 + itemWidth / 2)
      containerRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [currentIndex, images.length])

  if (images.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '72px',
        background: C.gray7,
        borderRadius: '8px',
        color: C.gray3,
        fontSize: '13px',
      }}>
        暂无图片
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '8px 4px',
        background: C.gray7,
        borderRadius: '8px',
        scrollbarWidth: 'thin' as const,
        scrollbarColor: `${C.gray5} ${C.gray7}`,
      }}
    >
      {images.map((img, idx) => (
        <div
          key={idx}
          onClick={() => onSelect(idx)}
          title={`图片 ${idx + 1}`}
          style={{
            flexShrink: 0,
            width: '76px',
            height: '57px',
            borderRadius: '6px',
            overflow: 'hidden',
            cursor: 'pointer',
            border: `2px solid ${idx === currentIndex ? C.primary : 'transparent'}`,
            opacity: idx === currentIndex ? 1 : 0.75,
            transition: 'all 0.15s ease',
            boxShadow: idx === currentIndex ? `0 0 0 2px ${C.primary}30` : 'none',
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
  totalImages,
  imageName
}: { 
  image: string | null
  getImageUrl: (path: string) => string
  imageIndex: number
  totalImages: number
  imageName?: string
}) {
  if (!image) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '420px',
        background: C.gray7,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        color: C.gray3,
        fontSize: '14px',
        gap: '12px',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>从下方选择一张图片查看详情</span>
      </div>
    )
  }

  // 从路径提取文件名
  const fileName = image.split('/').pop() || imageName || `Image ${imageIndex + 1}`

  return (
    <div style={{ 
      position: 'relative',
      background: C.gray7,
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
          background: `#1a1a2e`,
        }}
      />
      {/* 图片信息叠加层 */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* 文件名 */}
        <div style={{
          background: 'rgba(0,0,0,0.65)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          maxWidth: '70%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {fileName}
        </div>
        {/* 页码 */}
        <div style={{
          background: 'rgba(0,0,0,0.65)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
        }}>
          {imageIndex + 1} / {totalImages}
        </div>
      </div>
    </div>
  )
}

// 类别卡片组件
function ClassCard({ name, count }: { name: string; count: number }) {
  // 生成稳定的颜色
  const colorIndex = name.charCodeAt(0) % 5
  const colors = [
    { bg: '#EBF3FC', border: '#BFDBF7', text: '#0066CC' },
    { bg: '#D1FAE5', border: '#6EE7B7', text: '#059669' },
    { bg: '#FEF3C7', border: '#FCD34D', text: '#D97706' },
    { bg: '#FEE2E2', border: '#FECACA', text: '#DC2626' },
    { bg: '#F3E8FF', border: '#DDD6FE', text: '#7C3AED' },
  ]
  const color = colors[colorIndex]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      borderRadius: '8px',
      background: color.bg,
      border: `1px solid ${color.border}`,
    }}>
      <span style={{ fontSize: '13px', color: color.text, fontWeight: 500 }}>{name}</span>
      <span style={{ fontSize: '14px', color: color.text, fontWeight: 700 }}>{count.toLocaleString()}</span>
    </div>
  )
}

// 数据集详情页组件
function DatasetDetail({ ds, onBack, onRefresh, onEdit }: DatasetDetailProps) {
  const [previewImages, setPreviewImages] = useState<PreviewImages>({
    train_original: [], train_vis: [],
    val_original: [], val_vis: [],
    test_original: [], test_vis: [],
    augmented: [], preprocessed: [],
  })
  const [charts, setCharts] = useState<{ detail?: string; distribution?: string }>({})
  const [loading, setLoading] = useState(true)
  
  // 视图状态
  const [activeTab, setActiveTab] = useState<ViewTab>('original')
  const [splitFilter, setSplitFilter] = useState<SplitFilter>('all')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    loadPreviewImages()
    loadCharts()
  }, [ds.name])

  async function loadCharts() {
    try {
      const res = await fetch(`/api/dataset/${encodeURIComponent(ds.name)}/charts`)
      const data = await res.json()
      if (data.detail || data.distribution) {
        setCharts({
          detail: data.detail,
          distribution: data.distribution
        })
      }
    } catch (err) {
      console.warn('Failed to load charts:', err)
    }
  }

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
        augmented: data.augmented || [],
        preprocessed: data.preprocessed || [],
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

  // 根据当前tab获取图片列表
  function getCurrentImages() {
    let images: string[] = []
    
    switch (activeTab) {
      case 'original':
        images = [...previewImages.train_original, ...previewImages.val_original, ...(previewImages.test_original || [])]
        break
      case 'augmented':
        images = previewImages.augmented || []
        break
      case 'preprocessed':
        images = previewImages.preprocessed || []
        break
      case 'visualization':
        images = [...previewImages.train_vis, ...previewImages.val_vis, ...(previewImages.test_vis || [])]
        break
    }
    
    switch (splitFilter) {
      case 'train':
        images = images.filter(img => img.includes('/train/') || img.includes('\\train\\'))
        break
      case 'val':
        images = images.filter(img => img.includes('/val/') || img.includes('\\val\\'))
        break
      case 'test':
        images = images.filter(img => img.includes('/test/') || img.includes('\\test\\'))
        break
    }
    
    return images
  }

  // 计算各tab数量
  const originalCount = previewImages.train_original.length + previewImages.val_original.length + (previewImages.test_original?.length || 0)
  const augmentedCount = previewImages.augmented?.length || 0
  const preprocessedCount = previewImages.preprocessed?.length || 0
  const visCount = previewImages.train_vis.length + previewImages.val_vis.length + (previewImages.test_vis?.length || 0)

  const tabs = [
    { key: 'original' as ViewTab, label: 'Original Images', count: originalCount },
    { key: 'augmented' as ViewTab, label: 'Augmented Images', count: augmentedCount },
    { key: 'preprocessed' as ViewTab, label: 'Preprocessed Images', count: preprocessedCount },
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
      {/* 头部 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: C.gray1, margin: 0 }}>{ds.name}</h2>
            <p style={{ fontSize: '14px', color: C.gray3, marginTop: '4px' }}>数据集详细信息</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={onBack} 
              style={{ 
                padding: '8px 16px', 
                fontSize: '14px', 
                border: `1px solid ${C.border}`, 
                background: C.white, 
                borderRadius: '6px', 
                cursor: 'pointer',
                color: C.gray2,
              }}>
              ← 返回
            </button>
            {onEdit && (
              <button 
                onClick={() => onEdit(ds)} 
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '14px', 
                  border: 'none', 
                  background: C.primary, 
                  color: 'white', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                }}>
                编辑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区 - 左右分栏 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 320px', 
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* 左侧 - 图片展示区 */}
        <div style={{ 
          background: C.white, 
          borderRadius: '12px', 
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
        }}>
          {/* Tab标签 */}
          <div style={{ padding: '12px 16px 0', background: C.gray8 }}>
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
          </div>

          {/* 主图展示区 */}
          <div style={{ padding: '16px', background: C.gray8 }}>
            {loading ? (
              <Skeleton height={420} borderRadius={8} />
            ) : (
              <MainViewer 
                image={selectedImage} 
                getImageUrl={getImageUrl}
                imageIndex={selectedIndex}
                totalImages={currentImages.length}
              />
            )}
          </div>

          {/* 胶片条导航 */}
          <div style={{ padding: '0 16px 16px', background: C.gray8 }}>
            {loading ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} width={76} height={57} borderRadius={6} />)}
              </div>
            ) : (
              <FilmStrip
                images={currentImages}
                currentIndex={selectedIndex}
                onSelect={handleFilmSelect}
                getImageUrl={getImageUrl}
              />
            )}
          </div>

          {/* 图表展示（如果有） */}
          {(charts.detail || charts.distribution) && (
            <div style={{ padding: '16px', borderTop: `1px solid ${C.border}` }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: C.gray2, margin: '0 0 12px' }}>数据分析图表</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {charts.detail && (
                  <div>
                    <div style={{ fontSize: '11px', color: C.gray3, marginBottom: '8px' }}>样本分布图</div>
                    <img src={getImageUrl(charts.detail)} alt="样本分布" style={{ width: '100%', borderRadius: '6px', border: `1px solid ${C.border}` }} loading="lazy" />
                  </div>
                )}
                {charts.distribution && (
                  <div>
                    <div style={{ fontSize: '11px', color: C.gray3, marginBottom: '8px' }}>类别分布图</div>
                    <img src={getImageUrl(charts.distribution)} alt="类别分布" style={{ width: '100%', borderRadius: '6px', border: `1px solid ${C.border}` }} loading="lazy" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧 - 信息栏 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 基本信息卡片 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4 text-primary">基本信息</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InfoItem label="算法类型" value={ds.algoType} />
              <InfoItem label="技术方法" value={ds.techMethod || '目标检测'} />
              <InfoItem label="存储方式" value={ds.storageType === 'folder' ? '文件夹' : 'ZIP'} />
              <InfoItem label="标注格式" value={ds.annotationType?.toUpperCase() || 'YOLO'} />
              <InfoItem label="样本总数" value={ds.total?.toLocaleString()} />
              <InfoItem label="标签总数" value={ds.labelCount?.toLocaleString()} />
            </div>
            
            {/* 分割比例可视化 */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${C.border}` }}>
              <label className="text-xs text-muted mb-2 block">数据分割</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 训练集 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: C.success }} />
                    <span style={{ fontSize: '13px', color: C.gray2 }}>训练集</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: C.success }}>{ds.imgCountTrain?.toLocaleString() ?? 0}</span>
                    <span style={{ fontSize: '12px', color: C.gray3 }}>
                      ({ds.total && ds.total > 0 ? ((ds.imgCountTrain || 0) / ds.total * 100).toFixed(1) : '0.0'}%)
                    </span>
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
                    <span style={{ fontSize: '12px', color: C.gray3 }}>
                      ({ds.total && ds.total > 0 ? ((ds.imgCountVal || 0) / ds.total * 100).toFixed(1) : '0.0'}%)
                    </span>
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
                    <span style={{ fontSize: '12px', color: C.gray3 }}>
                      ({ds.total && ds.total > 0 ? ((ds.imgCountTest || 0) / ds.total * 100).toFixed(1) : '0.0'}%)
                    </span>
                  </div>
                </div>
                {/* 进度条 */}
                <div style={{ 
                  display: 'flex', 
                  height: '8px', 
                  borderRadius: '4px', 
                  overflow: 'hidden', 
                  background: C.gray6, 
                  gap: '2px',
                  marginTop: '4px',
                }}>
                  {ds.total && ds.total > 0 && (ds.imgCountTrain ?? 0) > 0 && (
                    <div style={{ 
                      flex: ds.imgCountTrain || 1, 
                      background: C.success, 
                      borderRadius: '4px 0 0 4px' 
                    }} />
                  )}
                  {ds.total && ds.total > 0 && (ds.imgCountVal ?? 0) > 0 && (
                    <div style={{ flex: ds.imgCountVal || 1, background: C.warning }} />
                  )}
                  {ds.total && ds.total > 0 && (ds.imgCountTest ?? 0) > 0 && (
                    <div style={{ 
                      flex: ds.imgCountTest || 1, 
                      background: C.error, 
                      borderRadius: '0 4px 4px 0' 
                    }} />
                  )}
                  {(ds.imgCountTrain ?? 0) === 0 && (ds.imgCountVal ?? 0) === 0 && (ds.imgCountTest ?? 0) === 0 && (
                    <div style={{ flex: 1, background: C.gray5 }} />
                  )}
                </div>
                <div style={{ fontSize: '11px', color: C.gray3 }}>原始比例: {ds.split || ds.splitRatio || '-'}</div>
              </div>
            </div>
          </div>

          {/* 数据分组过滤器 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3 text-primary">数据分组</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(['all', 'train', 'val', 'test'] as SplitFilter[]).map(filter => {
                const isActive = splitFilter === filter
                const count = filter === 'train' ? (ds.imgCountTrain ?? 0)
                  : filter === 'val' ? (ds.imgCountVal ?? 0)
                  : filter === 'test' ? (ds.imgCountTest ?? 0)
                  : (ds.total ?? 0)
                const color = filter === 'train' ? C.success : filter === 'val' ? C.warning : filter === 'test' ? C.error : C.primary
                
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
                      borderColor: isActive ? color : C.border,
                      background: isActive ? `${color}12` : 'transparent',
                      color: isActive ? color : C.gray2,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <span style={{ textTransform: 'capitalize' }}>
                      {filter === 'all' ? '全部' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </span>
                    <span style={{ 
                      fontSize: '12px',
                      background: isActive ? `${color}20` : C.gray6,
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

          {/* 类别统计卡片 */}
          {ds.classInfo && Object.keys(ds.classInfo).length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-4 text-primary">
                类别统计 ({Object.keys(ds.classInfo).length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(ds.classInfo).map(([key, value]) => {
                  const count = typeof value === 'number' ? value : (value.count || 0)
                  const name = typeof value === 'object' ? (value.name || key) : key
                  return <ClassCard key={key} name={name} count={count} />
                })}
              </div>
            </div>
          )}

          {/* 维护信息 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3 text-primary">维护信息</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label className="text-xs text-muted">维护人员</label>
                <p className="mt-1 text-sm text-secondary">{ds.maintainer || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-muted">维护日期</label>
                <p className="mt-1 text-sm text-secondary">{ds.maintainDate || '-'}</p>
              </div>
              {ds.source && (
                <div>
                  <label className="text-xs text-muted">数据来源</label>
                  <div className="mt-1">
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 10px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      background: '#E3F2FD',
                      border: '1px solid #90CAF9',
                      color: '#1565C0',
                    }}>
                      {ds.source}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 描述 */}
          {ds.desc && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-2 text-primary">描述</h3>
              <p className="text-sm text-secondary">{ds.desc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DatasetDetail
