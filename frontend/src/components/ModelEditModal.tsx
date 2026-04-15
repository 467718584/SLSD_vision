import React, { useState, useEffect } from 'react'
import { C } from '../constants'

// 模型类型
interface Model {
  name: string
  algoName?: string
  techMethod?: string
  category?: string
  description?: string
  site?: string
  dataset?: string
  maintainer?: string
}

// Dataset 简化类型
interface Dataset {
  name: string
}

// ModelEditModal Props
interface ModelEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  model: Model | null
  datasets?: Dataset[]
}

// 模型编辑Modal
function ModelEditModal({ isOpen, onClose, onSave, model, datasets }: ModelEditModalProps) {
  const [algoName, setAlgoName] = useState('')
  const [techMethod, setTechMethod] = useState('目标检测算法')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [site, setSite] = useState('')
  const [dataset, setDataset] = useState('')
  const [maintainer, setMaintainer] = useState('')
  const [saving, setSaving] = useState(false)

  const [algoTypes, setAlgoTypes] = useState<string[]>([
    '路面积水检测', '漂浮物检测', '墙面裂缝检测', '游泳检测', '其他'
  ])
  const [techMethods, setTechMethods] = useState<string[]>([
    '目标检测算法', '实例分割算法'
  ])
  const [sites, setSites] = useState<string[]>([])
  const modelCategories = [
    'YOLO',
    '多标签实例分割模型（双标签）',
    '多标签实例分割模型（三标签）',
    '单标签实例分割模型（背景负样本）',
    '单标签实例分割模型',
    '单标签目标检测模型',
    '其他'
  ]

  useEffect(() => {
    if (model && isOpen) {
      setAlgoName(model.algoName || '')
      setTechMethod(model.techMethod || '目标检测算法')
      setCategory(model.category || '')
      setDescription(model.description || '')
      setSite(model.site || '')
      setDataset(model.dataset || '')
      setMaintainer(model.maintainer || '')
    }
  }, [model, isOpen])

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
          if (data.sites && data.sites.length > 0) {
            setSites(data.sites)
          }
        })
        .catch(() => { })
    }
  }, [isOpen])

  if (!isOpen || !model) return null

  // 保存编辑
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/model/${encodeURIComponent(model.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algoName,
          techMethod,
          category,
          description,
          site,
          dataset,
          maintainer
        })
      })
      const data = await res.json()

      if (data.success || data.message) {
        alert('保存成功')
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
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: C.gray1 }}>编辑模型</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} style={styles.content}>
          {/* 算法类型 */}
          <div style={styles.field}>
            <label style={styles.label}>算法类型</label>
            <select
              value={algoName}
              onChange={e => setAlgoName(e.target.value)}
              style={styles.select}
            >
              <option value="">请选择算法类型</option>
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

          {/* 模型类别 */}
          <div style={styles.field}>
            <label style={styles.label}>模型类别</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={styles.select}
            >
              <option value="">请选择模型类别</option>
              {modelCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* 应用现场 */}
          <div style={styles.field}>
            <label style={styles.label}>应用现场</label>
            <select
              value={site}
              onChange={e => setSite(e.target.value)}
              style={styles.select}
            >
              <option value="">请选择应用现场</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 关联数据集 */}
          <div style={styles.field}>
            <label style={styles.label}>关联数据集</label>
            <select
              value={dataset}
              onChange={e => setDataset(e.target.value)}
              style={styles.select}
            >
              <option value="">请选择数据集</option>
              {(datasets || []).map(ds => (
                <option key={ds.name} value={ds.name}>{ds.name}</option>
              ))}
            </select>
          </div>

          {/* 维护人员 */}
          <div style={styles.field}>
            <label style={styles.label}>维护人员</label>
            <input
              type="text"
              value={maintainer}
              onChange={e => setMaintainer(e.target.value)}
              placeholder="请输入维护人员"
              style={styles.input}
            />
          </div>

          {/* 模型描述 */}
          <div style={styles.field}>
            <label style={styles.label}>模型描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请输入模型描述"
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }}
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
    width: '500px',
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

export default ModelEditModal
