import React, { useState, useEffect } from 'react'
import { C } from '../constants'

// 模型类型
interface Dataset {
  name: string
}

// ModelUploadModal Props
interface ModelUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  datasets?: Dataset[]
}

// 模型上传Modal组件
function ModelUploadModal({ isOpen, onClose, onSuccess, datasets }: ModelUploadModalProps) {
  const [name, setName] = useState('')
  const [algoName, setAlgoName] = useState('路面积水检测')
  const [techMethod, setTechMethod] = useState('目标检测算法')
  const [category, setCategory] = useState('YOLO')
  const [description, setDescription] = useState('')
  const [site, setSite] = useState('')
  const [maintainer, setMaintainer] = useState('管理员')
  const [dataset, setDataset] = useState('')
  const [folder, setFolder] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  // 设置选项
  const [algoTypes, setAlgoTypes] = useState<string[]>([
    '路面积水检测', '漂浮物检测', '墙面裂缝检测', '游泳检测', '其他'
  ])
  const [techMethods, setTechMethods] = useState<string[]>(['目标检测算法', '实例分割算法'])
  const [sites, setSites] = useState<string[]>([
    '苏北灌溉总渠', '南水北调宝应站', '慈溪北排', '慈溪周巷', '瓯江引水'
  ])
  const modelCategories = [
    'YOLO',
    '多标签实例分割模型（双标签）',
    '多标签实例分割模型（三标签）',
    '单标签实例分割模型（背景负样本）',
    '单标签实例分割模型',
    '单标签目标检测模型',
    '其他'
  ]

  // 加载设置
  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.algo_types && data.algo_types.length > 0) {
            setAlgoTypes(data.algo_types)
            setAlgoName(data.algo_types[0])
          }
          if (data.tech_methods && data.tech_methods.length > 0) {
            setTechMethods(data.tech_methods)
            setTechMethod(data.tech_methods[0])
          }
          if (data.sites && data.sites.length > 0) {
            setSites(data.sites)
          }
        })
        .catch(() => { })
    }
  }, [isOpen])

  if (!isOpen) return null

  // 提交上传
  async function handleSubmit() {
    if (!name.trim()) { setError('请输入模型名称'); return }
    if (!folder || folder.length === 0) { setError('请选择模型文件夹'); return }
    if (!dataset) { setError('请选择关联数据集'); return }

    setError('')
    setUploading(true)
    setProgress(10)

    const formData = new FormData()
    for (let i = 0; i < folder.length; i++) {
      formData.append('files', folder[i])
    }
    formData.append('name', name)
    formData.append('algoName', algoName)
    formData.append('techMethod', techMethod)
    formData.append('category', category)
    formData.append('description', description)
    formData.append('site', site)
    formData.append('maintainer', maintainer)
    formData.append('dataset', dataset)

    try {
      setProgress(30)
      const response = await fetch('/api/model/upload', {
        method: 'POST',
        body: formData
      })
      setProgress(70)

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        setError('服务器错误: ' + text.substring(0, 100))
        setUploading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        setProgress(100)
        if (onClose) onClose()
        setName(''); setFolder(null); setDescription('')
        alert('上传成功！')
        if (onSuccess) onSuccess()
      } else {
        setError(data.error || '上传失败')
        setUploading(false)
      }
    } catch (e: any) {
      setError('上传失败: ' + e.message)
      setUploading(false)
    }
  }

  // 获取文件夹信息
  function getFolderInfo() {
    if (folder && folder.length > 0) {
      return `已选择文件夹: ${folder[0].webkitRelativePath.split('/')[0]} (${folder.length} 个文件)`
    }
    return ''
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: C.gray1 }}>新建模型</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {/* 表单内容 */}
        <div style={styles.content}>
          {/* 模型名称 */}
          <div style={styles.section}>
            <label style={styles.label}>模型名称 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="请输入模型名称"
              style={styles.input}
            />
          </div>

          {/* 算法类型 + 技术方法 */}
          <div style={styles.row}>
            <div style={styles.half}>
              <label style={styles.label}>算法类型</label>
              <select value={algoName} onChange={e => setAlgoName(e.target.value)} style={styles.select}>
                {algoTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={styles.half}>
              <label style={styles.label}>技术方法</label>
              <select value={techMethod} onChange={e => setTechMethod(e.target.value)} style={styles.select}>
                {techMethods.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* 模型类别 */}
          <div style={styles.section}>
            <label style={styles.label}>模型类别</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={styles.select}>
              {modelCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* 关联数据集 */}
          <div style={styles.section}>
            <label style={styles.label}>关联数据集 *</label>
            <select value={dataset} onChange={e => setDataset(e.target.value)} style={styles.select}>
              <option value="">请选择数据集</option>
              {datasets?.map(ds => <option key={ds.name} value={ds.name}>{ds.name}</option>)}
            </select>
          </div>

          {/* 应用现场 */}
          <div style={styles.section}>
            <label style={styles.label}>应用现场</label>
            <select value={site} onChange={e => setSite(e.target.value)} style={styles.select}>
              <option value="">请选择应用现场</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 维护人员 */}
          <div style={styles.section}>
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
          <div style={styles.section}>
            <label style={styles.label}>模型描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请输入模型描述"
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }}
            />
          </div>

          {/* 模型文件夹 */}
          <div style={styles.section}>
            <label style={styles.label}>模型文件夹 * (请上传包含weights、results.csv等文件的文件夹)</label>
            <input
              type="file"
              webkitdirectory="true"
              multiple
              onChange={e => { if (e.target.files) setFolder(e.target.files) }}
              style={styles.fileInput}
            />
          </div>

          {/* 文件夹信息 */}
          {getFolderInfo() && (
            <div style={{ fontSize: '12px', color: C.primary, marginBottom: '16px' }}>
              {getFolderInfo()}
            </div>
          )}

          {/* 精度提示 */}
          <div style={{ ...styles.section, background: C.gray7, padding: '8px 12px', borderRadius: '6px' }}>
            <span style={{ fontSize: '12px', color: C.gray3 }}>模型精度将从results.csv自动获取</span>
          </div>

          {/* 错误信息 */}
          {error && (
            <div style={styles.error}>{error}</div>
          )}

          {/* 进度条 */}
          {uploading && (
            <div style={styles.progressContainer}>
              <div style={{ ...styles.progressBar, width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>取消</button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            style={{
              ...styles.submitBtn,
              opacity: uploading ? 0.7 : 1,
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? '上传中...' : '上传'}
          </button>
        </div>
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
  section: {
    marginBottom: '16px'
  },
  row: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px'
  },
  half: {
    flex: 1
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
  error: {
    padding: '10px 12px',
    background: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px'
  },
  progressContainer: {
    height: '4px',
    background: '#E5E7EB',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    background: C.primary,
    transition: 'width 0.3s'
  },
  footer: {
    padding: '16px 24px',
    borderTop: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
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

export default ModelUploadModal
