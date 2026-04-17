import React, { useState, useEffect } from 'react'
import { C, SITE_COLORS } from '../constants'
import { RefreshIcon, XIcon, FolderIcon, CpuIcon } from './Icons'

interface Site {
  id: number
  name: string
  dataset_count: number
  model_count: number
  maintainer: string
  maintain_date: string
  description?: string
}

interface SiteManagementProps {
  onRefresh?: () => void
}

// 基础标签组件
const MemoizedTag = React.memo(({ label, colors }: { label: string; colors?: { bg?: string; border?: string; text?: string } }) => {
  const c = colors || { bg: C.gray6, border: C.border, text: C.gray2 }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        whiteSpace: "nowrap"
      }}>
      {label}
    </span>
  )
})

const MemoizedSiteTag = React.memo(({ site }: { site?: string }) => (
  <MemoizedTag label={site || "-"} colors={SITE_COLORS[site || ""] || SITE_COLORS["其他"]} />
))

// 表格样式辅助函数
const th = (w: string, c = false) => ({
  padding: "10px 12px",
  fontSize: "12px",
  fontWeight: 600,
  color: C.gray1,
  textAlign: c ? "center" as const : "left" as const,
  width: w,
  whiteSpace: "nowrap" as const
})

const td = (c = false) => ({
  padding: "12px",
  fontSize: "13px",
  color: C.gray1,
  textAlign: c ? "center" as const : "left" as const,
  borderBottom: `1px solid ${C.border}`
})

// 空状态组件
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-sm" style={{ color: C.gray3 }}>
      <div className="text-4xl mb-3"><FolderIcon size={32} /></div>
      <div className="text-muted">{message}</div>
    </div>
  )
}

export default function SiteManagement({ onRefresh }: SiteManagementProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSites()
  }, [])

  async function fetchSites() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sites')
      const data = await res.json()
      if (data.success) {
        setSites(data.data || [])
      } else {
        setError(data.error || '加载失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-2xl mb-2"><RefreshIcon size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>
          <div style={{ color: C.gray3 }} className="text-sm">加载中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-center gap-2">
          <XIcon size={14} /> {error}
        </div>
        <button
          onClick={fetchSites}
          className="btn btn-primary btn-sm mt-3"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="p-5">
      {/* 页面标题 */}
      <div className="page-header mb-5">
        <div>
          <h2 className="page-title"><FolderIcon size={18} /> 应用现场管理</h2>
          <p className="text-sm text-muted mt-1">
            查看所有应用现场的关联统计信息（数据来源于数据集管理和模型管理）
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSites}
            className="btn btn-secondary btn-sm"
          >
            <RefreshIcon size={14} /> 刷新
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="btn btn-primary btn-sm"
            >
              <RefreshIcon size={14} /> 返回
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon blue"><FolderIcon size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{sites.length}</div>
            <div className="stat-label">应用现场总数</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FolderIcon size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">
              {sites.reduce((s, site) => s + site.dataset_count, 0)}
            </div>
            <div className="stat-label">关联数据集总数</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F3E8FF', color: '#8E44AD' }}><CpuIcon size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">
              {sites.reduce((s, site) => s + site.model_count, 0)}
            </div>
            <div className="stat-label">关联模型总数</div>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      {sites.length === 0 ? (
        <EmptyState message="暂无可管理的应用现场，请在设置中添加" />
      ) : (
        <div className="card overflow-hidden" style={{ padding: 0 }}>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="table th" style={{ width: '80px', textAlign: 'center' }}>编号</th>
                  <th className="table th" style={{ width: '200px' }}>现场名称</th>
                  <th className="table th" style={{ width: '120px', textAlign: 'center' }}>关联数据集</th>
                  <th className="table th" style={{ width: '120px', textAlign: 'center' }}>关联模型</th>
                  <th className="table th" style={{ width: '120px' }}>维护人员</th>
                  <th className="table th" style={{ width: '140px' }}>维护日期</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr
                    key={site.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="table td text-xs" style={{ textAlign: 'center', color: C.gray3 }}>
                      {String(site.id).padStart(3, '0')}
                    </td>
                    <td className="table td">
                      <MemoizedSiteTag site={site.name} />
                    </td>
                    <td className="table td" style={{ textAlign: 'center' }}>
                      <span className={`badge ${site.dataset_count > 0 ? 'badge-primary' : ''}`}>
                        <FolderIcon size={12} /> {site.dataset_count}
                      </span>
                    </td>
                    <td className="table td" style={{ textAlign: 'center' }}>
                      <span className="badge">
                        <CpuIcon size={12} /> {site.model_count}
                      </span>
                    </td>
                    <td className="table td">
                      <span style={{ color: site.maintainer && site.maintainer !== '-' ? C.gray1 : C.gray4 }}>
                        {site.maintainer || '-'}
                      </span>
                    </td>
                    <td className="table td">
                      <span style={{ color: site.maintain_date && site.maintain_date !== '-' ? C.gray1 : C.gray4 }}>
                        {site.maintain_date || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 底部说明 */}
      <div className="mt-4 p-3 rounded-lg text-sm text-muted" style={{ background: C.gray7 }}>
        💡 说明：关联数据集和关联模型的数量会根据数据集管理和模型管理中选择的"数据来源"/"应用现场"自动统计。
        新增或删除应用现场请前往 <strong style={{ color: C.gray2 }}>设置</strong> 页面操作。
      </div>
    </div>
  )
}
