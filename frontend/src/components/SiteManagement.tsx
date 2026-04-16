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
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: 500,
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: C.gray3
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
      <div style={{ fontSize: '14px', color: C.gray3 }}>{message}</div>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}><RefreshIcon size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>
          <div style={{ color: C.gray3, fontSize: '13px' }}>加载中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{
          padding: '16px',
          background: '#FEE2E2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          color: '#DC2626',
          fontSize: '13px'
        }}>
          <XIcon size={14} /> {error}
        </div>
        <button
          onClick={fetchSites}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: C.primary,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* 页面标题 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.gray1, margin: 0 }}>
            🏗️ 应用现场管理
          </h2>
          <p style={{ fontSize: '12px', color: C.gray3, marginTop: '4px' }}>
            查看所有应用现场的关联统计信息（数据来源于数据集管理和模型管理）
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchSites}
            style={{
              padding: '8px 16px',
              background: C.gray6,
              color: C.gray2,
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            <RefreshIcon size={14} /> 刷新
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                padding: '8px 16px',
                background: C.primary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              ↩️ 返回
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: C.primary }}>{sites.length}</div>
          <div style={{ fontSize: '12px', color: C.gray3, marginTop: '4px' }}>应用现场总数</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#E8631A' }}>
            {sites.reduce((s, site) => s + site.dataset_count, 0)}
          </div>
          <div style={{ fontSize: '12px', color: C.gray3, marginTop: '4px' }}>关联数据集总数</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#8E44AD' }}>
            {sites.reduce((s, site) => s + site.model_count, 0)}
          </div>
          <div style={{ fontSize: '12px', color: C.gray3, marginTop: '4px' }}>关联模型总数</div>
        </div>
      </div>

      {/* 数据表格 */}
      {sites.length === 0 ? (
        <EmptyState message="暂无可管理的应用现场，请在设置中添加" />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                    style={{ background: 'white' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.gray7)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ ...td(true), color: C.gray3, fontSize: '12px' }}>
                      {String(site.id).padStart(3, '0')}
                    </td>
                    <td style={td()}>
                      <MemoizedSiteTag site={site.name} />
                    </td>
                    <td style={{ ...td(true), fontWeight: 600 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 12px',
                        background: site.dataset_count > 0 ? C.primaryBg : C.gray6,
                        color: site.dataset_count > 0 ? C.primary : C.gray3,
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        <FolderIcon size={14} /> {site.dataset_count}
                      </span>
                    </td>
                    <td style={{ ...td(true), fontWeight: 600 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 12px',
                        background: site.model_count > 0 ? '#FDF0E7' : C.gray6,
                        color: site.model_count > 0 ? '#E8631A' : C.gray3,
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600
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
      <div style={{
        marginTop: '16px',
        padding: '12px 16px',
        background: C.gray7,
        borderRadius: '8px',
        fontSize: '12px',
        color: C.gray3
      }}>
        💡 说明：关联数据集和关联模型的数量会根据数据集管理和模型管理中选择的"数据来源"/"应用现场"自动统计。
        新增或删除应用现场请前往 <strong style={{ color: C.gray2 }}>设置</strong> 页面操作。
      </div>
    </div>
  )
}
