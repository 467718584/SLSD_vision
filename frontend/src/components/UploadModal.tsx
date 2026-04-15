import React, { useState, useEffect } from 'react'
import { C } from '../constants'

// Props
interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

// UploadModal组件
function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [name, setName] = useState('')
  const [algoType, setAlgoType] = useState('其他')
  const [techMethod, setTechMethod] = useState('目标检测算法')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('')
  const [maintainer, setMaintainer] = useState('管理员')
  const [file, setFile] = useState<File | null>(null)
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploadMode, setUploadMode] = useState<'zip' | 'folder'>('zip')
  const [annotationType, setAnnotationType] = useState<'yolo' | 'voc' | 'coco'>('yolo')
  const [skipValidation, setSkipValidation] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [showNameWarning, setShowNameWarning] = useState(false)
  const [nameWarningMsg, setNameWarningMsg] = useState('')

  // 设置选项
  const [algoTypes, setAlgoTypes] = useState<string[]>([
    '路面积水检测', '漂浮物检测', '墙面裂缝检测', '游泳检测', '其他'
  ])
  const [techMethods, setTechMethods] = useState<string[]>(['目标检测算法', '实例分割算法'])
  const [sources, setSources] = useState<string[]>([
    '苏北灌溉总渠', '南水北调宝应站', '慈溪北排', '慈溪周巷', '瓯江引水', '互联网'
  ])
  const annotationTypes = ['yolo', 'voc', 'coco'] as const

  // 加载设置
  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.algo_types && data.algo_types.length > 0) {
            setAlgoTypes(data.algo_types)
            setAlgoType(data.algo_types[0])
          }
          if (data.tech_methods && data.tech_methods.length > 0) {
            setTechMethods(data.tech_methods)
            setTechMethod(data.tech_methods[0])
          }
          if (data.sites && data.sites.length > 0) {
            setSources(data.sites)
          }
        })
        .catch(() => { })
    }
  }, [isOpen])

  if (!isOpen) return null

  // 文件选择处理
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files
    if (f && f.length > 0) {
      if (uploadMode === 'folder') {
        setFiles(f)
        if (!name && f[0].webkitRelativePath) {
          const folderName = f[0].webkitRelativePath.split('/')[0]
          setName(folderName)
        }
      } else {
        setFile(f[0])
        if (!name) {
          setName(f[0].name.replace(/\.(zip|tar|gz)$/i, ''))
        }
      }
    }
  }

  // 校验名称是否已存在
  async function validateName(datasetName: string) {
    if (!datasetName.trim()) return { exists: false }
    try {
      const res = await fetch('/api/dataset/validate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: datasetName })
      })
      return await res.json()
    } catch (e) {
      return { exists: false }
    }
  }

  // 提交上传
  async function handleSubmit() {
    if (!name.trim()) { setError('请输入数据集名称'); return }
    if (uploadMode === 'folder' && (!files || files.length === 0)) { setError('请选择文件夹'); return }
    if (uploadMode === 'zip' && !file) { setError('请选择ZIP文件'); return }

    // 检查名称是否已存在
    const nameCheck = await validateName(name)
    if (nameCheck.exists) {
      setShowNameWarning(true)
      const storageType = nameCheck.storage_type || 'folder'
      setNameWarningMsg(`数据集 "${name}" 已存在，存储方式为: ${storageType === 'zip' ? '压缩包' : '文件夹'}。是否覆盖？`)
      return
    }

    await doUpload()
  }

  // 执行上传
  async function doUpload() {
    setError('')
    setUploading(true)
    setProgress(10)

    const formData = new FormData()
    if (uploadMode === 'folder' && files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }
    } else if (file) {
      formData.append('file', file)
    }
    formData.append('name', name)
    formData.append('algoType', algoType)
    formData.append('description', description)
    formData.append('source', source)
    formData.append('maintainer', maintainer)
    formData.append('uploadMode', uploadMode)
    formData.append('annotationType', annotationType)
    formData.append('skipValidation', skipValidation.toString())

    try {
      setProgress(30)
      const response = await fetch('/api/dataset/upload', {
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
        setName(''); setFile(null); setFiles(null); setDescription('')
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

  // 确认覆盖
  async function handleConfirmOverwrite() {
    setShowNameWarning(false)
    await doUpload()
  }

  // 获取文件信息
  function getFileInfo() {
    if (uploadMode === 'folder' && files && files.length > 0) {
      return `已选择 ${files.length} 个文件`
    } else if (file) {
      return `已选择: ${file.name}`
    }
    return '未选择文件'
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: C.gray1 }}>新建数据集</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {/* 上传方式选择 */}
        <div style={styles.section}>
          <label style={styles.label}>上传方式</label>
          <div style={styles.radioGroup}>
            <label style={styles.radio}>
              <input
                type="radio"
                name="uploadMode"
                value="zip"
                checked={uploadMode === 'zip'}
                onChange={() => setUploadMode('zip')}
              />
              <span style={{ marginLeft: '6px' }}>ZIP压缩包</span>
            </label>
            <label style={styles.radio}>
              <input
                type="radio"
                name="uploadMode"
                value="folder"
                checked={uploadMode === 'folder'}
                onChange={() => setUploadMode('folder')}
              />
              <span style={{ marginLeft: '6px' }}>文件夹</span>
            </label>
          </div>
        </div>

        {/* 文件选择 */}
        <div style={styles.section}>
          <label style={styles.label}>
            {uploadMode === 'folder' ? '选择文件夹 *' : '选择ZIP文件 *'}
          </label>
          {uploadMode === 'folder' ? (
            <input
              type="file"
              webkitdirectory="true"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
          ) : (
            <input
              type="file"
              accept=".zip,.tar,.gz"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
          )}
          <div style={{ fontSize: '12px', color: C.gray3, marginTop: '4px' }}>
            {getFileInfo()}
          </div>
        </div>

        {/* 数据集名称 */}
        <div style={styles.section}>
          <label style={styles.label}>数据集名称 *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入数据集名称"
            style={styles.input}
          />
        </div>

        {/* 算法类型 */}
        <div style={styles.section}>
          <label style={styles.label}>算法类型</label>
          <select value={algoType} onChange={e => setAlgoType(e.target.value)} style={styles.select}>
            {algoTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* 技术方法 */}
        <div style={styles.section}>
          <label style={styles.label}>技术方法</label>
          <select value={techMethod} onChange={e => setTechMethod(e.target.value)} style={styles.select}>
            {techMethods.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* 数据来源 */}
        <div style={styles.section}>
          <label style={styles.label}>数据来源</label>
          <select value={source} onChange={e => setSource(e.target.value)} style={styles.select}>
            <option value="">请选择</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* 标注格式 */}
        <div style={styles.section}>
          <label style={styles.label}>标注格式</label>
          <select value={annotationType} onChange={e => setAnnotationType(e.target.value as 'yolo' | 'voc' | 'coco')} style={styles.select}>
            {annotationTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}格式</option>)}
          </select>
        </div>

        {/* 描述 */}
        <div style={styles.section}>
          <label style={styles.label}>数据集描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="输入数据集描述"
            style={{ ...styles.input, minHeight: '60px', resize: 'vertical' as const }}
          />
        </div>

        {/* 维护人员 */}
        <div style={styles.section}>
          <label style={styles.label}>维护人员</label>
          <input
            type="text"
            value={maintainer}
            onChange={e => setMaintainer(e.target.value)}
            placeholder="输入维护人员"
            style={styles.input}
          />
        </div>

        {/* 跳过校验 */}
        <div style={styles.section}>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={skipValidation}
              onChange={e => setSkipValidation(e.target.checked)}
            />
            <span style={{ marginLeft: '6px', fontSize: '13px', color: C.gray2 }}>
              跳过YOLO格式校验
            </span>
          </label>
        </div>

        {/* 进度条 */}
        {uploading && (
          <div style={styles.progressContainer}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {/* 确认覆盖弹窗 */}
        {showNameWarning && (
          <div style={styles.warningOverlay}>
            <div style={styles.warningModal}>
              <p style={{ marginBottom: '16px', color: C.gray1 }}>{nameWarningMsg}</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowNameWarning(false)} style={styles.cancelBtn}>取消</button>
                <button onClick={handleConfirmOverwrite} style={styles.confirmBtn}>确认覆盖</button>
              </div>
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>取消</button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            style={{
              ...styles.submitBtn,
              opacity: uploading ? 0.6 : 1,
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
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '480px',
    maxHeight: '85vh',
    overflowY: 'auto' as const
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: C.gray3,
    padding: '0',
    lineHeight: 1
  },
  section: {
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
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const
  },
  select: {
    width: '100%',
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    background: 'white'
  },
  fileInput: {
    width: '100%',
    fontSize: '13px',
    color: C.gray2
  },
  radioGroup: {
    display: 'flex',
    gap: '16px'
  },
  radio: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: C.gray2,
    cursor: 'pointer'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  progressContainer: {
    height: '4px',
    background: C.gray6,
    borderRadius: '2px',
    marginBottom: '12px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    background: C.primary,
    transition: 'width 0.3s'
  },
  error: {
    padding: '8px 12px',
    background: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '12px'
  },
  warningOverlay: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px'
  },
  warningModal: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px'
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: `1px solid ${C.border}`,
    background: 'white',
    fontSize: '13px',
    cursor: 'pointer',
    color: C.gray2
  },
  confirmBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: C.warning,
    color: 'white',
    fontSize: '13px',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '8px 20px',
    borderRadius: '6px',
    border: 'none',
    background: C.primary,
    color: 'white',
    fontSize: '13px',
    fontWeight: 500
  }
}

export default UploadModal
