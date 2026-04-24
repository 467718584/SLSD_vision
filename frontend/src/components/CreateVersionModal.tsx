import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { XIcon, UploadIcon } from './Icons'
import { C } from '../constants'

interface Dataset {
  name: string
  versions?: { version: string }[]
}

interface CreateVersionModalProps {
  modelName: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateVersionData) => Promise<void>
  existingVersions: string[] // 用于检查版本号冲突
}

export interface CreateVersionData {
  versionName: string
  description: string
  datasetName?: string
  datasetVersion?: string
  accuracy?: number
  map50?: number
  map50_95?: number
  total_epochs?: number
  files?: FileList | null
}

export function CreateVersionModal({
  modelName,
  isOpen,
  onClose,
  onSubmit,
  existingVersions
}: CreateVersionModalProps) {
  const [formData, setFormData] = useState<CreateVersionData>({
    versionName: '',
    description: '',
    datasetName: '',
    datasetVersion: '',
    accuracy: 0,
    map50: 0,
    map50_95: 0,
    total_epochs: 0,
    files: null
  })
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [datasetVersions, setDatasetVersions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 加载数据集列表
  useEffect(() => {
    if (isOpen) {
      fetch('/api/datasets')
        .then(r => r.json())
        .then(data => {
          if (data.datasets) {
            setDatasets(data.datasets)
          }
        })
        .catch(console.error)
    }
  }, [isOpen])

  // 加载选中数据集的版本
  useEffect(() => {
    if (formData.datasetName) {
      const ds = datasets.find(d => d.name === formData.datasetName)
      if (ds?.versions) {
        setDatasetVersions(ds.versions.map(v => v.version))
      } else {
        // 尝试从API获取
        fetch(`/api/dataset/${encodeURIComponent(formData.datasetName)}/versions`)
          .then(r => r.json())
          .then(data => {
            if (data.versions) {
              setDatasetVersions(data.versions.map((v: any) => v.version))
            }
          })
          .catch(() => setDatasetVersions([]))
      }
    } else {
      setDatasetVersions([])
    }
  }, [formData.datasetName, datasets])

  // 建议下一个版本号
  useEffect(() => {
    if (!formData.versionName && existingVersions.length > 0) {
      // 解析现有版本号，找最大的
      const versions = existingVersions.map(v => {
        const match = v.match(/^v?(\d+)\.(\d+)$/)
        if (match) return { major: parseInt(match[1]), minor: parseInt(match[2]) }
        return { major: 0, minor: 0 }
      })
      const max = versions.reduce((max, v) => {
        if (v.major > max.major || (v.major === max.major && v.minor > max.minor)) return v
        return max
      }, { major: 0, minor: 0 })
      setFormData(prev => ({
        ...prev,
        versionName: `v${max.major}.${max.minor + 1}`
      }))
    }
  }, [existingVersions, isOpen])

  const handleSubmit = async () => {
    // 验证
    if (!formData.versionName.trim()) {
      setError('请输入版本名称')
      return
    }

    // 检查版本号格式
    if (!/^v?\d+\.\d+$/.test(formData.versionName)) {
      setError('版本号格式错误，请使用 x.y 格式（如 v1.0 或 1.0）')
      return
    }

    // 检查版本是否已存在
    const normalizedVersion = formData.versionName.startsWith('v')
      ? formData.versionName
      : `v${formData.versionName}`

    if (existingVersions.some(v => v === normalizedVersion || v === formData.versionName)) {
      setError('该版本已存在')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSubmit(formData)
      // 重置表单
      setFormData({
        versionName: '',
        description: '',
        datasetName: '',
        datasetVersion: '',
        accuracy: 0,
        map50: 0,
        map50_95: 0,
        total_epochs: 0,
        files: null
      })
      onClose()
    } catch (err: any) {
      setError(err.message || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`新建版本 - ${modelName}`} width="520px">
      <div style={{ padding: '20px' }}>
        {/* 版本号 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: C.gray1 }}>
            版本名称 <span style={{ color: C.danger }}>*</span>
          </label>
          <input
            type="text"
            value={formData.versionName}
            onChange={e => setFormData({ ...formData, versionName: e.target.value })}
            placeholder="如 v1.0"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <p style={{ fontSize: '11px', color: C.gray4, marginTop: '4px' }}>
            建议格式: v1.0, v2.1 等
          </p>
        </div>

        {/* 版本说明 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: C.gray1 }}>
            版本说明
          </label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="描述这个版本的主要变化..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* 关联数据集 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: C.gray1 }}>
            关联数据集
          </label>
          <select
            value={formData.datasetName}
            onChange={e => setFormData({ ...formData, datasetName: e.target.value, datasetVersion: '' })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">选择数据集（可选）</option>
            {datasets.map(ds => (
              <option key={ds.name} value={ds.name}>{ds.name}</option>
            ))}
          </select>
        </div>

        {/* 数据集版本 */}
        {formData.datasetName && datasetVersions.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: C.gray1 }}>
              数据集版本
            </label>
            <select
              value={formData.datasetVersion}
              onChange={e => setFormData({ ...formData, datasetVersion: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${C.border}`,
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">选择数据集版本（可选）</option>
              {datasetVersions.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        )}

        {/* 训练指标 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: C.gray1 }}>
            训练指标
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: C.gray4, marginBottom: '4px' }}>mAP50</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.map50 || ''}
                onChange={e => setFormData({ ...formData, map50: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${C.border}`,
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: C.gray4, marginBottom: '4px' }}>mAP50-95</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.map50_95 || ''}
                onChange={e => setFormData({ ...formData, map50_95: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${C.border}`,
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: C.gray4, marginBottom: '4px' }}>训练轮次</label>
              <input
                type="number"
                min="0"
                value={formData.total_epochs || ''}
                onChange={e => setFormData({ ...formData, total_epochs: parseInt(e.target.value) || 0 })}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${C.border}`,
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>
        </div>

        {/* 上传权重文件 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: C.gray1 }}>
            上传权重文件
          </label>
          <div
            style={{
              border: `2px dashed ${C.border}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onDragOver={e => {
              e.preventDefault()
              e.currentTarget.style.borderColor = C.primary
            }}
            onDragLeave={e => {
              e.currentTarget.style.borderColor = C.border
            }}
            onDrop={e => {
              e.preventDefault()
              e.currentTarget.style.borderColor = C.border
              if (e.dataTransfer.files.length > 0) {
                setFormData({ ...formData, files: e.dataTransfer.files })
              }
            }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.accept = '.pt,.pth,.onnx,.om,.rknn'
              input.onchange = e => {
                const files = (e.target as HTMLInputElement).files
                if (files) setFormData({ ...formData, files })
              }
              input.click()
            }}
          >
            {formData.files && formData.files.length > 0 ? (
              <div style={{ color: C.primary }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{formData.files.length} 个文件已选择</div>
                <div style={{ fontSize: '12px', color: C.gray4, marginTop: '4px' }}>
                  {Array.from(formData.files).map(f => f.name).join(', ')}
                </div>
              </div>
            ) : (
              <div style={{ color: C.gray4 }}>
                <UploadIcon size={32} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '14px' }}>点击或拖拽上传权重文件</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>支持 .pt, .pth, .onnx, .om, .rknn 等格式</div>
              </div>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            padding: '10px 12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: C.danger,
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* 按钮 */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
            取消
          </button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
            {loading ? '创建中...' : '创建版本'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
