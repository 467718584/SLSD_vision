import React, { useState, useEffect } from 'react'
import { C, SITE_COLORS } from '../constants'
import { RefreshIcon, XIcon, FolderIcon, CpuIcon, PlusIcon, TrashIcon, AlertCircleIcon } from './Icons'

interface Site {
  id: number
  name: string
  dataset_count: number
  model_count: number
  maintainer: string
  maintain_date: string
  description?: string
}

interface AddSiteForm {
  name: string
  maintainer: string
  maintain_date: string
  description: string
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

// 添加站点弹窗
function AddSiteModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<AddSiteForm>({ name: '', maintainer: '', maintain_date: '', description: '' })
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      alert('请输入应用现场名称')
      return
    }
    setSaving(true)
    try {
      // 添加到sites表
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success || data.message) {
        // 同时添加到settings.sites（如果不存在）
        const settingsRes = await fetch('/api/settings')
        const settingsData = await settingsRes.json()
        const currentSites = settingsData.sites || []
        if (!currentSites.includes(form.name)) {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sites: [...currentSites, form.name] })
          })
        }
        alert('添加成功')
        setForm({ name: '', maintainer: '', maintain_date: '', description: '' })
        onSuccess()
        onClose()
      } else {
        alert('添加失败: ' + (data.error || '未知错误'))
      }
    } catch (err: any) {
      alert('添加失败: ' + err.message)
    }
    setSaving(false)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: C.gray1 }}>添加应用现场</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.content}>
          <div style={styles.field}>
            <label style={styles.label}>现场名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="请输入应用现场名称"
              style={styles.input}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>维护人员</label>
            <input
              type="text"
              value={form.maintainer}
              onChange={e => setForm({ ...form, maintainer: e.target.value })}
              placeholder="请输入维护人员"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>维护日期</label>
            <input
              type="date"
              value={form.maintain_date}
              onChange={e => setForm({ ...form, maintain_date: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>描述</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="请输入描述信息"
              style={{ ...styles.input, minHeight: '60px', resize: 'vertical' as const }}
            />
          </div>
          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>取消</button>
            <button type="submit" disabled={saving} style={{ ...styles.submitBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SiteManagement({ onRefresh }: SiteManagementProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetchSites()
  }, [])

  async function fetchSites() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sites')
      const data = await res.json()
      
      // 处理数组和对象两种响应格式
      if (Array.isArray(data)) {
        setSites(data)
      } else if (data && data.success && Array.isArray(data.data)) {
        setSites(data.data)
      } else {
        setError(data.error || '加载失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
    setLoading(false)
  }

  // 添加站点
  async function handleAddSite(form: AddSiteForm) {
    await fetchSites()
  }

  // 删除站点
  async function handleDelete(name: string, id: number) {
    if (!confirm(`确定要删除应用现场"${name}"吗？`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/sites/${encodeURIComponent(name)}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success || data.message) {
        alert('删除成功')
        fetchSites()
      } else {
        alert('删除失败: ' + (data.error || '未知错误'))
      }
    } catch (err: any) {
      alert('删除失败: ' + err.message)
    }
    setDeleting(null)
  }

  // 自动生成：从settings.sites自动创建site记录
  async function handleAutoGenerate() {
    if (!confirm('将从系统设置中的应用现场列表自动生成记录，是否继续？')) return
    setLoading(true)
    try {
      // 获取settings中的sites
      const settingsRes = await fetch('/api/settings')
      const settingsData = await settingsRes.json()
      const siteNames = settingsData.sites || []
      
      // 获取当前sites表中的记录
      const sitesRes = await fetch('/api/sites')
      const sitesData = await sitesRes.json()
      const existingSites = Array.isArray(sitesData) ? sitesData : (sitesData.data || [])
      const existingNames = existingSites.map((s: Site) => s.name)
      
      // 为settings中存在但sites表中不存在的site创建记录
      let added = 0
      for (const name of siteNames) {
        if (!existingNames.includes(name) && name !== '互联网') {
          await fetch('/api/sites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, maintainer: '-', maintain_date: '-' })
          })
          added++
        }
      }
      
      alert(`自动生成完成，新增 ${added} 条记录`)
      fetchSites()
    } catch (err: any) {
      alert('自动生成失败: ' + err.message)
      setLoading(false)
    }
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
        <button onClick={fetchSites} className="btn btn-primary btn-sm mt-3">重试</button>
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
          <button onClick={handleAutoGenerate} className="btn btn-secondary btn-sm" title="从设置中的应用现场列表自动生成记录">
            <PlusIcon size={14} /> 自动生成
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
            <PlusIcon size={14} /> 添加
          </button>
          <button onClick={fetchSites} className="btn btn-secondary btn-sm">
            <RefreshIcon size={14} /> 刷新
          </button>
          {onRefresh && (
            <button onClick={onRefresh} className="btn btn-primary btn-sm">
              <RefreshIcon size={14} /> 返回
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid mb-6">
        <div className="stat-card transition-all">
          <div className="stat-icon blue"><FolderIcon size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{sites.length}</div>
            <div className="stat-label">应用现场总数</div>
          </div>
        </div>
        <div className="stat-card transition-all">
          <div className="stat-icon orange"><FolderIcon size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">
              {sites.reduce((s, site) => s + site.dataset_count, 0)}
            </div>
            <div className="stat-label">关联数据集总数</div>
          </div>
        </div>
        <div className="stat-card transition-all">
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
        <EmptyState message="暂无可管理的应用现场，请点击" />
      ) : (
        <div className="card overflow-hidden" style={{ padding: 0 }}>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="table th" style={{ width: '80px', textAlign: 'center' }}>编号</th>
                  <th className="table th" style={{ width: '180px' }}>现场名称</th>
                  <th className="table th" style={{ width: '100px', textAlign: 'center' }}>关联数据集</th>
                  <th className="table th" style={{ width: '100px', textAlign: 'center' }}>关联模型</th>
                  <th className="table th" style={{ width: '100px' }}>维护人员</th>
                  <th className="table th" style={{ width: '120px' }}>维护日期</th>
                  <th className="table th" style={{ width: '80px', textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50 transition-colors">
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
                    <td className="table td" style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(site.name, site.id)}
                        disabled={deleting === site.id}
                        className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50"
                        title="删除"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 底部说明 */}
      <div className="mt-4 p-3 rounded-lg text-sm text-muted flex items-start gap-2" style={{ background: C.gray7 }}>
        <AlertCircleIcon size={14} className="mt-0.5 flex-shrink-0" />
        <span>说明：关联数据集和关联模型的数量会根据数据集管理和模型管理中选择的"数据来源"/"应用现场"自动统计。可点击"自动生成"从系统设置中的应用现场列表同步记录，或点击"添加"手动新增。</span>
      </div>

      {/* 添加站点弹窗 */}
      <AddSiteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => handleAddSite({ name: '', maintainer: '', maintain_date: '', description: '' })}
      />
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '420px',
    maxHeight: '90vh',
    overflow: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  header: {
    padding: '20px 24px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    color: C.gray3
  },
  content: {
    padding: '20px 24px'
  },
  field: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: C.gray2,
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px'
  },
  cancelBtn: {
    padding: '10px 20px',
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    background: 'white',
    color: C.gray2,
    cursor: 'pointer',
    fontSize: '13px'
  },
  submitBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    background: C.primary,
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px'
  }
}
