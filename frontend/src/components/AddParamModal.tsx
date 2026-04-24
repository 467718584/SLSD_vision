import React, { useState } from 'react'
import { Modal } from './ui/Modal'
import { UploadIcon, XIcon } from './Icons'
import { C } from '../constants'

// 支持的参数类型
const PARAM_TYPES = [
  { value: 'onnx', label: 'ONNX', desc: '跨平台通用模型格式' },
  { value: 'om', label: '华为昇腾 OM', desc: '华为昇腾AI处理器格式' },
  { value: 'rknn', label: '瑞芯微 RKNN', desc: '瑞芯微NPU芯片格式' },
  { value: 'tflite', label: 'TensorFlow Lite', desc: '移动端/嵌入式格式' },
  { value: 'saved_model', label: 'TensorFlow SavedModel', desc: 'TensorFlow保存格式' },
  { value: 'pb', label: 'TensorFlow PB', desc: 'TensorFlow冻结图格式' },
  { value: 'others', label: '其他格式', desc: '其他自定义格式' }
]

interface AddParamModalProps {
  modelName: string
  versionName: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddParamData) => Promise<void>
}

export interface AddParamData {
  paramType: string
  description: string
  file: File | null
}

export function AddParamModal({
  modelName,
  versionName,
  isOpen,
  onClose,
  onSubmit
}: AddParamModalProps) {
  const [formData, setFormData] = useState<AddParamData>({
    paramType: 'onnx',
    description: '',
    file: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!formData.file) {
      setError('请选择要上传的文件')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSubmit(formData)
      // 重置表单
      setFormData({
        paramType: 'onnx',
        description: '',
        file: null
      })
      onClose()
    } catch (err: any) {
      setError(err.message || '上传失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, file })
    }
  }

  // 根据选择类型返回接受的文件扩展名
  const getAcceptedExtensions = () => {
    switch (formData.paramType) {
      case 'onnx': return '.onnx'
      case 'om': return '.om'
      case 'rknn': return '.rknn'
      case 'tflite': return '.tflite'
      case 'saved_model': return ''
      case 'pb': return '.pb'
      default: return '*'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`补充参数文件 - ${versionName}`} width="480px">
      <div style={{ padding: '20px' }}>
        {/* 参数类型选择 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: C.gray1 }}>
            参数类型 <span style={{ color: C.danger }}>*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {PARAM_TYPES.map(type => (
              <div
                key={type.value}
                onClick={() => setFormData({ ...formData, paramType: type.value })}
                style={{
                  padding: '10px 12px',
                  border: `2px solid ${formData.paramType === type.value ? C.primary : C.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: formData.paramType === type.value ? `${C.primary}10` : 'white',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: formData.paramType === type.value ? C.primary : C.gray1
                }}>
                  {type.label}
                </div>
                <div style={{ fontSize: '11px', color: C.gray4, marginTop: '2px' }}>
                  {type.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 文件上传 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: C.gray1 }}>
            选择文件 <span style={{ color: C.danger }}>*</span>
          </label>
          <div
            style={{
              border: `2px dashed ${formData.file ? C.success : C.border}`,
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              background: formData.file ? `${C.success}05` : 'white'
            }}
            onDragOver={e => {
              e.preventDefault()
              e.currentTarget.style.borderColor = C.primary
            }}
            onDragLeave={e => {
              e.currentTarget.style.borderColor = formData.file ? C.success : C.border
            }}
            onDrop={e => {
              e.preventDefault()
              e.currentTarget.style.borderColor = formData.file ? C.success : C.border
              if (e.dataTransfer.files.length > 0) {
                setFormData({ ...formData, file: e.dataTransfer.files[0] })
              }
            }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = getAcceptedExtensions()
              input.onchange = handleFileChange
              input.click()
            }}
          >
            {formData.file ? (
              <div style={{ color: C.success }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>✓</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{formData.file.name}</div>
                <div style={{ fontSize: '12px', color: C.gray4, marginTop: '4px' }}>
                  {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setFormData({ ...formData, file: null })
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    background: C.gray6,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  移除
                </button>
              </div>
            ) : (
              <div style={{ color: C.gray4 }}>
                <UploadIcon size={28} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '13px' }}>点击或拖拽上传文件</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  {getAcceptedExtensions() === '' ? '请选择目录或文件夹' : `支持格式: ${getAcceptedExtensions()}`}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 说明 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: C.gray1 }}>
            说明
          </label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="描述这个参数文件的用途..."
            rows={2}
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
            {loading ? '上传中...' : '上传'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
