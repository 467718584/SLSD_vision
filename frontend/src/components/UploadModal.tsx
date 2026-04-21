import React, { useState, useEffect } from 'react'
import { C } from '../constants'
import { UploadIcon } from './Icons'

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
  const [progressText, setProgressText] = useState('')
  const [showNameWarning, setShowNameWarning] = useState(false)
  const [nameWarningMsg, setNameWarningMsg] = useState('')
  const [uploadSpeed, setUploadSpeed] = useState('')
  const [uploadedSize, setUploadedSize] = useState(0)
  const [totalSize, setTotalSize] = useState(0)

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

  // 格式化文件大小
  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  // 获取文件总大小
  function getTotalSize() {
    if (uploadMode === 'folder' && files) {
      let total = 0
      for (let i = 0; i < files.length; i++) {
        total += files[i].size
      }
      return total
    }
    return file ? file.size : 0
  }

  // 执行上传
  async function doUpload() {
    setError('')
    setUploading(true)
    setProgress(0)
    setProgressText('准备上传...')
    setUploadSpeed('')
    setTotalSize(getTotalSize())
    setUploadedSize(0)

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

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const startTime = Date.now()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          setProgress(percent)
          setUploadedSize(e.loaded)
          setTotalSize(e.total)
          const elapsed = (Date.now() - startTime) / 1000
          const speed = elapsed > 0 ? e.loaded / elapsed : 0
          setUploadSpeed(formatSize(speed) + '/s')
          setProgressText(`上传中 ${formatSize(e.loaded)} / ${formatSize(e.total)}`)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            if (data.success) {
              setProgress(100)
              setProgressText('上传完成!')
              setUploadSpeed('')
              if (onClose) onClose()
              setName(''); setFile(null); setFiles(null); setDescription('')
              alert('上传成功!')
              if (onSuccess) onSuccess()
            } else {
              setError(data.error || '上传失败')
              setUploading(false)
            }
          } catch {
            setError('服务器响应格式错误')
            setUploading(false)
          }
        } else {
          setError('上传失败: HTTP ' + xhr.status)
          setUploading(false)
        }
        resolve()
      }

      xhr.onerror = () => {
        setError('网络错误,上传失败')
        setUploading(false)
        resolve()
      }

      xhr.open('POST', '/api/dataset/upload')
      xhr.send(formData)
    })
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '480px', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ margin: 0, color: C.gray1 }}>新建数据集</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm transition-all" style={{ fontSize: '24px', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* 上传方式选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: C.gray2 }}>上传方式</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1 text-sm" style={{ color: C.gray2, cursor: 'pointer' }}>
              <input
                type="radio"
                name="uploadMode"
                value="zip"
                checked={uploadMode === 'zip'}
                onChange={() => setUploadMode('zip')}
              />
              <span>ZIP压缩包</span>
            </label>
            <label className="flex items-center gap-1 text-sm" style={{ color: C.gray2, cursor: 'pointer' }}>
              <input
                type="radio"
                name="uploadMode"
                value="folder"
                checked={uploadMode === 'folder'}
                onChange={() => setUploadMode('folder')}
              />
              <span>文件夹</span>
            </label>
          </div>
        </div>

        {/* 文件选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: C.gray2 }}>
            {uploadMode === 'folder' ? '选择文件夹 *' : '选择ZIP文件 *'}
          </label>
          <input
            type="file"
            webkitdirectory={uploadMode === 'folder' ? "true" : undefined}
            accept={uploadMode === 'zip' ? ".zip,.tar,.gz" : undefined}
            onChange={handleFileChange}
            className="input"
          />
          <div className="text-xs mt-1" style={{ color: C.gray3 }}>{getFileInfo()}</div>
        </div>

        {/* 数据集名称 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: C.gray2 }}>数据集名称 *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入数据集名称"
            className="input"
          />
        </div>

        {/* 算法类型 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: C.gray2 }}>算法类型</label>
          <select value={algoType} onChange={e => setAlgoType(e.target.value)} className="input">
            {algoTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* 技术方法 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: C.gray2 }}>技术方法</label>
          <select value={techMethod} onChange={e => setTechMethod(e.target.value)} className="input">
            {techMethods.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* 数据来源 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: C.gray2 }}>数据来源</label>
          <select value={source} onChange={e => setSource(e.target.value)} className="input">
            <option value="">请选择</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* 标注格式 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: C.gray2 }}>标注格式</label>
          <select value={annotationType} onChange={e => setAnnotationType(e.target.value as 'yolo' | 'voc' | 'coco')} className="input">
            {annotationTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}格式</option>)}
          </select>
        </div>

        {/* 描述 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: C.gray2 }}>数据集描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="输入数据集描述"
            className="input"
            style={{ minHeight: '60px', resize: 'vertical' }}
          />
        </div>

        {/* 维护人员 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: C.gray2 }}>维护人员</label>
          <input
            type="text"
            value={maintainer}
            onChange={e => setMaintainer(e.target.value)}
            placeholder="输入维护人员"
            className="input"
          />
        </div>

        {/* 跳过校验 */}
        <div className="mb-4">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={skipValidation}
              onChange={e => setSkipValidation(e.target.checked)}
            />
            <span className="text-sm" style={{ color: C.gray2 }}>跳过YOLO格式校验</span>
          </label>
        </div>

        {/* 进度条 - 真实上传进度 */}
        {uploading && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UploadIcon size={16} />
                <span className="text-sm" style={{ color: C.gray2 }}>{progressText}</span>
              </div>
              <div className="flex items-center gap-3">
                {uploadSpeed && <span className="text-xs" style={{ color: C.primary }}>{uploadSpeed}</span>}
                <span className="text-sm font-semibold" style={{ color: C.primary }}>{progress}%</span>
              </div>
            </div>
            <div style={{ height: '8px', background: C.gray6, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${progress}%`, 
                background: `linear-gradient(90deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,
                borderRadius: '4px',
                transition: 'width 0.2s ease-out'
              }} />
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="mb-3 p-3 rounded" style={{ background: C.errorBg, color: C.error, fontSize: '13px' }}>{error}</div>
        )}

        {/* 确认覆盖弹窗 */}
        {showNameWarning && (
          <div className="modal-overlay" style={{ borderRadius: '12px' }}>
            <div className="modal p-4" style={{ maxWidth: '400px' }}>
              <p className="mb-4 text-sm" style={{ color: C.gray1 }}>{nameWarningMsg}</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNameWarning(false)} className="btn btn-secondary btn-sm">取消</button>
                <button onClick={handleConfirmOverwrite} className="btn btn-primary btn-sm">确认覆盖</button>
              </div>
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="btn btn-secondary btn-sm transition-all">取消</button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="btn btn-primary btn-sm transition-all"
            style={{ opacity: uploading ? 0.6 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}
          >
            {uploading ? '上传中...' : '上传'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadModal