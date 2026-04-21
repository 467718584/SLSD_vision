import React, { useState, useEffect } from 'react'
import { C } from '../constants'
import { queryClient } from './ReactQueryProvider'
import { queryKeys } from '../hooks/useApi'

// 数据集类型
interface Dataset {
  name: string
  algoType?: string
  techMethod?: string
  source?: string
}

// DatasetEditModal Props
interface DatasetEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  dataset: Dataset | null
}

// 数据集编辑Modal
function DatasetEditModal({ isOpen, onClose, onSave, dataset }: DatasetEditModalProps) {
  const [algoType, setAlgoType] = useState('其他')
  const [techMethod, setTechMethod] = useState('目标检测算法')
  const [source, setSource] = useState('')
  const [sources, setSources] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [detailChart, setDetailChart] = useState<File | null>(null)
  const [distChart, setDistChart] = useState<File | null>(null)

  const [algoTypes, setAlgoTypes] = useState<string[]>([
    '路面积水检测', '漂浮物检测', '墙面裂缝检测', '游泳检测', '其他'
  ])
  const [techMethods, setTechMethods] = useState<string[]>([
    '目标检测算法', '实例分割算法'
  ])

  useEffect(() => {
    if (dataset && isOpen) {
      setAlgoType(dataset.algoType || '其他')
      setTechMethod(dataset.techMethod || '目标检测算法')
      setSource(dataset.source || '')
    }
  }, [dataset, isOpen])

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then(r => r.json())
        .then(data => {
          if (data.algo_types && data.algo_types.length > 0) {
            setAlgoTypes(data.algo_types)
          }
          if (data.tech_methods && data.tech_methods.length > 0) {
            setTechMethods(data.tech_methods)
          }
          if (data.sources && data.sources.length > 0) {
            // 从数据来源词条获取
            setSources(data.sources)
          }
        })
        .catch(() => { })
    }
  }, [isOpen])

  if (!isOpen || !dataset) return null

  // 上传图表
  async function uploadChart(file: File, type: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    formData.append('dataset', dataset.name)

    const res = await fetch(`/api/dataset/${encodeURIComponent(dataset.name)}/chart-upload`, {
      method: 'POST',
      body: formData
    })
    return res.json()
  }

  // 保存编辑
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      // 先上传图表
      if (detailChart) {
        await uploadChart(detailChart, 'detail')
      }
      if (distChart) {
        await uploadChart(distChart, 'distribution')
      }

      // 保存基本信息
      const res = await fetch(`/api/dataset/${encodeURIComponent(dataset.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algoType,
          techMethod,
          source
        })
      })
      const data = await res.json()

      if (data.success || data.message) {
        // 联动逻辑：如果选择了新的数据来源，自动同步到settings.sites
        if (source && !sources.includes(source)) {
          try {
            const settingsRes = await fetch('/api/settings')
            const settingsData = await settingsRes.json()
            const currentSites = settingsData.sites || []
            if (!currentSites.includes(source)) {
              await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sites: [...currentSites, source] })
              })
            }
          } catch (syncErr) {
            console.warn('自动同步应用现场失败:', syncErr)
          }
        }
        alert('保存成功')
        // Invalidate React Query cache for datasets
        queryClient.invalidateQueries({ queryKey: queryKeys.datasets })
        queryClient.invalidateQueries({ queryKey: queryKeys.stats })
        if (dataset?.name) {
          queryClient.invalidateQueries({ queryKey: queryKeys.dataset(dataset.name) })
        }
        if (onSave) onSave()
        if (onClose) onClose()
      } else {
        alert('保存失败: ' + (data.error || '未知错误'))
      }
    } catch (err: any) {
      alert('保存失败: ' + err.message)
    }

    setSaving(false)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: C.gray1 }}>编辑数据集</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} style={styles.content}>
          {/* 算法类型 */}
          <div style={styles.field}>
            <label style={styles.label}>算法类型</label>
            <select
              value={algoType}
              onChange={e => setAlgoType(e.target.value)}
              style={styles.select}
            >
              {algoTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* 技术方法 */}
          <div style={styles.field}>
            <label style={styles.label}>技术方法</label>
            <select
              value={techMethod}
              onChange={e => setTechMethod(e.target.value)}
              style={styles.select}
            >
              {techMethods.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* 数据来源 */}
          <div style={styles.field}>
            <label style={styles.label}>数据来源</label>
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              style={styles.select}
            >
              <option value="">请选择数据来源</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 样本分布图 */}
          <div style={styles.field}>
            <label style={styles.label}>上传/更换样本分布图 (detail.png)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setDetailChart(e.target.files?.[0] || null)}
              style={styles.fileInput}
            />
          </div>

          {/* 类别分布图 */}
          <div style={styles.field}>
            <label style={styles.label}>上传/更换类别分布图 (distribution.png)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setDistChart(e.target.files?.[0] || null)}
              style={styles.fileInput}
            />
          </div>

          {/* 按钮 */}
          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              取消
            </button>
            <button type="submit" disabled={saving} style={{
              ...styles.submitBtn,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
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
    width: '480px',
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
  select: {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    background: 'white'
  },
  fileInput: {
    width: '100%',
    padding: '8px',
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    fontSize: '13px'
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

export default DatasetEditModal
