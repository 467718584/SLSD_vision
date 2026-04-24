import React, { useState, useEffect } from 'react'
import { C, SITE_COLORS } from '../constants'
import { FolderIcon, CpuIcon, ChevronLeftIcon, ImageIcon, TagIcon, CalendarIcon, UserIcon } from './Icons'

// 类型定义
interface SiteDetailProps {
  siteName: string
  onBack: () => void
  onViewDataset: (name: string) => void
  onViewModel: (name: string) => void
}

interface SiteInfo {
  id: number
  name: string
  maintainer: string
  maintain_date: string
  description: string
}

interface Stats {
  dataset_count: number
  model_count: number
  image_count: number
  avg_accuracy: number
}

interface DatasetItem {
  name: string
  algoType: string
  total: number
  source: string
  maintainer: string
  maintainDate: string
  accuracy: number
}

interface ModelItem {
  name: string
  algoName: string
  accuracy: number
  site: string
  maintainer: string
  maintainDate: string
}

// 样式
const styles = {
  container: {
    padding: '24px 32px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px'
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'white',
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: C.gray2,
    transition: 'all 0.2s'
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: C.gray1
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    border: `1px solid ${C.border}`,
    padding: '20px',
    marginBottom: '20px'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: C.gray1,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  infoLabel: {
    fontSize: '12px',
    color: C.gray3
  },
  infoValue: {
    fontSize: '14px',
    color: C.gray1,
    fontWeight: 500
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px'
  },
  statCard: {
    background: C.gray8,
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center' as const
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: C.primary,
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '12px',
    color: C.gray3
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px'
  },
  itemCard: {
    background: C.gray8,
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: `1px solid transparent`
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: C.gray1,
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  itemMeta: {
    fontSize: '12px',
    color: C.gray3,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    background: C.primaryBg,
    color: C.primary
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    color: C.gray3,
    fontSize: '14px'
  }
}

export default function SiteDetail({ siteName, onBack, onViewDataset, onViewModel }: SiteDetailProps) {
  const [site, setSite] = useState<SiteInfo | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [datasets, setDatasets] = useState<DatasetItem[]>([])
  const [models, setModels] = useState<ModelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSiteDetail()
  }, [siteName])

  async function fetchSiteDetail() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/site/${encodeURIComponent(siteName)}`)
      const data = await res.json()
      
      if (data.success) {
        setSite(data.site)
        setStats(data.stats)
        setDatasets(data.datasets || [])
        setModels(data.models || [])
      } else {
        setError(data.error || '加载失败')
      }
    } catch (err: any) {
      setError('网络错误: ' + err.message)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '60px', color: C.gray3 }}>
          加载中...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
          <div style={{ color: C.error, marginBottom: '16px' }}>{error}</div>
          <button onClick={fetchSiteDetail} className="btn btn-primary btn-sm">重试</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* 返回按钮 */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn}
          onClick={onBack}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = C.primary
            e.currentTarget.style.color = C.primary
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = C.border
            e.currentTarget.style.color = C.gray2
          }}
        >
          <ChevronLeftIcon size={14} /> 返回
        </button>
        <h1 style={styles.title}>应用现场详情: {siteName}</h1>
      </div>

      {/* 基本信息卡片 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <UserIcon size={16} /> 基本信息
        </div>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>现场名称</span>
            <span style={styles.infoValue}>{site?.name}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>维护人员</span>
            <span style={styles.infoValue}>{site?.maintainer || '-'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>维护日期</span>
            <span style={styles.infoValue}>{site?.maintain_date || '-'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>关联数据集</span>
            <span style={{ ...styles.infoValue, color: C.primary }}>{stats?.dataset_count || 0} 个</span>
          </div>
        </div>
        {site?.description && (
          <div style={{ marginTop: '16px', padding: '12px', background: C.gray8, borderRadius: '6px' }}>
            <span style={{ fontSize: '12px', color: C.gray3 }}>描述: </span>
            <span style={{ fontSize: '13px', color: C.gray1 }}>{site.description}</span>
          </div>
        )}
      </div>

      {/* 产出统计卡片 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <FolderIcon size={16} /> 产出统计
        </div>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: C.primary }}>{stats?.dataset_count || 0}</div>
            <div style={styles.statLabel}>关联数据集</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#10B981' }}>{stats?.image_count || 0}</div>
            <div style={styles.statLabel}>图片总数</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#F59E0B' }}>{stats?.model_count || 0}</div>
            <div style={styles.statLabel}>关联模型</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#8E44AD' }}>
              {stats?.avg_accuracy ? `${stats.avg_accuracy}%` : '-'}
            </div>
            <div style={styles.statLabel}>平均精度</div>
          </div>
        </div>
      </div>

      {/* 关联数据集列表 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <FolderIcon size={16} /> 关联数据集 ({datasets.length})
        </div>
        {datasets.length === 0 ? (
          <div style={styles.emptyState}>暂无关联的数据集</div>
        ) : (
          <div style={styles.gridContainer}>
            {datasets.map((ds) => (
              <div
                key={ds.name}
                style={styles.itemCard}
                onClick={() => onViewDataset(ds.name)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.primary
                  e.currentTarget.style.background = 'white'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.background = C.gray8
                }}
              >
                <div style={styles.itemTitle}>
                  <FolderIcon size={14} />
                  {ds.name}
                </div>
                <div style={styles.itemMeta}>
                  <div>算法类型: <span style={styles.tag}>{ds.algoType}</span></div>
                  <div>图片数量: {ds.total}</div>
                  <div>维护人员: {ds.maintainer}</div>
                  <div>维护日期: {ds.maintainDate}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 关联模型列表 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <CpuIcon size={16} /> 关联模型 ({models.length})
        </div>
        {models.length === 0 ? (
          <div style={styles.emptyState}>暂无关联的模型</div>
        ) : (
          <div style={styles.gridContainer}>
            {models.map((m) => (
              <div
                key={m.name}
                style={styles.itemCard}
                onClick={() => onViewModel(m.name)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.primary
                  e.currentTarget.style.background = 'white'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.background = C.gray8
                }}
              >
                <div style={styles.itemTitle}>
                  <CpuIcon size={14} />
                  {m.name}
                </div>
                <div style={styles.itemMeta}>
                  <div>算法名称: <span style={styles.tag}>{m.algoName}</span></div>
                  <div>模型精度: <span style={{ color: C.success, fontWeight: 600 }}>{m.accuracy}%</span></div>
                  <div>维护人员: {m.maintainer}</div>
                  <div>维护日期: {m.maintainDate}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
