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
      <div className="text-4xl mb-3">🏗️</div>
      <div style={{ color: C.gray3 }}>{message}</div>
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
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold m-0" style={{ color: C.gray1 }}>
            🏗️ 应用现场管理
          </h2>
          <p className="text-xs mt-1" style={{ color: C.gray3 }}>
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
              ↩️ 返回
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center p-4">
          <div className="text-3xl font-bold" style={{ color: C.primary }}>{sites.length}</div>
          <div className="text-xs mt-1" style={{ color: C.gray3 }}>应用现场总数</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-3xl font-bold" style={{ color: '#E8631A' }}>
            {sites.reduce((s, site) => s + site.dataset_count, 0)}
          </div>
          <div className="text-xs mt-1" style={{ color: C.gray3 }}>关联数据集总数</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-3xl font-bold" style={{ color: '#8E44AD' }}>
            {sites.reduce((s, site) => s + site.model_count, 0)}
          </div>
          <div className="text-xs mt-1" style={{ color: C.gray3 }}>关联模型总数</div>
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
                <tr style={{ background: C.gray7 }}>
                  <th style={th('80px', true)}>编号</th>
                  <th style={th('200px')}>现场名称</th>
                  <th style={th('120px', true)}>关联数据集</th>
                  <th style={th('120px', true)}>关联模型</th>
                  <th style={th('120px')}>维护人员</th>
                  <th style={th('140px')}>维护日期</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr
                    key={site.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td style={{ ...td(true), color: C.gray3 }} className="text-xs">
                      {String(site.id).padStart(3, '0')}
                    </td>
                    <td style={td()}>
                      <MemoizedSiteTag site={site.name} />
                    </td>
                    <td style={{ ...td(true), fontWeight: 600 }}>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                        style={{
                          background: site.dataset_count > 0 ? C.primaryBg : C.gray6,
                          color: site.dataset_count > 0 ? C.primary : C.gray3,
                        }}>
                        <FolderIcon size={14} /> {site.dataset_count}
                      </span>
                    </td>
                    <td style={{ ...td(true), fontWeight: 600 }}>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                        style={{
                          background: site.model_count > 0 ? '#FDF0E7' : C.gray6,
                          color: site.model_count > 0 ? '#E8631A' : C.gray3,
                        }}>
                        <CpuIcon size={14} /> {site.model_count}
                      </span>
                    </td>
                    <td style={td()}>
                      <span style={{ color: site.maintainer && site.maintainer !== '-' ? C.gray1 : C.gray4 }}>
                        {site.maintainer || '-'}
                      </span>
                    </td>
                    <td style={td()}>
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
      <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: C.gray7, color: C.gray3 }}>
        💡 说明：关联数据集和关联模型的数量会根据数据集管理和模型管理中选择的"数据来源"/"应用现场"自动统计。
        新增或删除应用现场请前往 <strong style={{ color: C.gray2 }}>设置</strong> 页面操作。
      </div>
    </div>
  )
}
