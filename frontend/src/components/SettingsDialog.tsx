import React, { useState, useEffect } from 'react'
import { C } from '../constants'

// SettingsDialog Props
interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

// 设置对话框组件
function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [algoTypes, setAlgoTypes] = useState<string[]>([
    '路面积水检测', '漂浮物检测', '墙面裂缝检测', '游泳检测', '其他'
  ])
  const [techMethods, setTechMethods] = useState<string[]>(['目标检测算法', '实例分割算法'])
  const [annotationTypes, setAnnotationTypes] = useState<string[]>(['YOLO格式', 'VOC格式', 'COCO格式'])
  const [sites, setSites] = useState<string[]>([
    '苏北灌溉总渠', '南水北调宝应站', '慈溪北排', '慈溪周巷', '瓯江引水', '互联网'
  ])
  const [sources, setSources] = useState<string[]>([
    '互联网', '本地采集', '合作伙伴', '公开数据集'
  ])
  const [newAlgoType, setNewAlgoType] = useState('')
  const [newTechMethod, setNewTechMethod] = useState('')
  const [newAnnotationType, setNewAnnotationType] = useState('')
  const [newSite, setNewSite] = useState('')
  const [newSource, setNewSource] = useState('')
  const [loading, setLoading] = useState(true)

  // 加载设置
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.algo_types) setAlgoTypes(data.algo_types)
          if (data.tech_methods) setTechMethods(data.tech_methods)
          if (data.annotation_types) setAnnotationTypes(data.annotation_types)
          if (data.sites) setSites(data.sites)
          if (data.sources) setSources(data.sources)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  // 保存设置
  function handleSave() {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        algoTypes,
        techMethods,
        annotationTypes,
        sites,
        sources
      })
    })
    .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('设置已保存')
          onClose()
        } else {
          alert('保存失败: ' + data.error)
        }
      })
      .catch((err: Error) => {
        alert('保存失败: ' + err.message)
      })
  }

  // 添加算法类型
  function handleAddAlgoType() {
    if (newAlgoType && !algoTypes.includes(newAlgoType)) {
      setAlgoTypes(algoTypes.concat(newAlgoType))
      setNewAlgoType('')
    }
  }

  // 添加技术方法
  function handleAddTechMethod() {
    if (newTechMethod && !techMethods.includes(newTechMethod)) {
      setTechMethods(techMethods.concat(newTechMethod))
      setNewTechMethod('')
    }
  }

  // 添加标注方法
  function handleAddAnnotationType() {
    if (newAnnotationType && !annotationTypes.includes(newAnnotationType)) {
      setAnnotationTypes(annotationTypes.concat(newAnnotationType))
      setNewAnnotationType('')
    }
  }

  // 添加应用现场
  function handleAddSite() {
    if (newSite && !sites.includes(newSite)) {
      setSites(sites.concat(newSite))
      setNewSite('')
    }
  }

  // 添加数据来源
  function handleAddSource() {
    if (newSource && !sources.includes(newSource)) {
      setSources(sources.concat(newSource))
      setNewSource('')
    }
  }

  // 移除标签
  function handleRemove(list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) {
    setter(list.filter(t => t !== item))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="modal-header">
          <h3 className="font-semibold text-sm" style={{ margin: 0, color: C.gray1 }}>系统设置</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        {loading ? (
          <div className="text-center p-6 text-muted">加载中...</div>
        ) : (
          <div className="modal-body">
            {/* 算法类型 */}
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-3" style={{ color: C.gray1 }}>算法类型（应用场景）</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {algoTypes.map(type => (
                  <span key={type} className="tag tag-primary">
                    {type}
                    <button onClick={() => handleRemove(algoTypes, setAlgoTypes, type)} className="btn btn-ghost btn-sm" style={{ padding: '0 4px', fontSize: '14px', lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAlgoType}
                  onChange={e => setNewAlgoType(e.target.value)}
                  placeholder="新增算法类型"
                  className="input"
                  onKeyPress={e => e.key === 'Enter' && handleAddAlgoType()}
                />
                <button onClick={handleAddAlgoType} className="btn btn-primary btn-sm">添加</button>
              </div>
            </div>

            {/* 技术方法 */}
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-3" style={{ color: C.gray1 }}>技术方法</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {techMethods.map(type => (
                  <span key={type} className="tag tag-success">
                    {type}
                    <button onClick={() => handleRemove(techMethods, setTechMethods, type)} className="btn btn-ghost btn-sm" style={{ padding: '0 4px', fontSize: '14px', lineHeight: 1, color: '#047857' }}>×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTechMethod}
                  onChange={e => setNewTechMethod(e.target.value)}
                  placeholder="新增技术方法"
                  className="input"
                  onKeyPress={e => e.key === 'Enter' && handleAddTechMethod()}
                />
                <button onClick={handleAddTechMethod} className="btn btn-success btn-sm">添加</button>
              </div>
            </div>

            {/* 标注方法 */}
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-3" style={{ color: C.gray1 }}>标注方法</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {annotationTypes.map(type => (
                  <span key={type} className="tag tag-warning">
                    {type}
                    <button onClick={() => handleRemove(annotationTypes, setAnnotationTypes, type)} className="btn btn-ghost btn-sm" style={{ padding: '0 4px', fontSize: '14px', lineHeight: 1, color: C.orange }}>×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAnnotationType}
                  onChange={e => setNewAnnotationType(e.target.value)}
                  placeholder="新增标注方法"
                  className="input"
                  onKeyPress={e => e.key === 'Enter' && handleAddAnnotationType()}
                />
                <button onClick={handleAddAnnotationType} className="btn btn-sm" style={{ background: C.orange, color: 'white' }}>添加</button>
              </div>
            </div>

            {/* 应用现场 */}
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-3" style={{ color: C.gray1 }}>应用现场</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {sites.map(type => (
                  <span key={type} className="tag" style={{ background: '#E3F2FD', borderColor: '#90CAF9', color: '#1565C0' }}>
                    {type}
                    <button onClick={() => handleRemove(sites, setSites, type)} className="btn btn-ghost btn-sm" style={{ padding: '0 4px', fontSize: '14px', lineHeight: 1, color: '#1565C0' }}>×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSite}
                  onChange={e => setNewSite(e.target.value)}
                  placeholder="新增应用现场"
                  className="input"
                  onKeyPress={e => e.key === 'Enter' && handleAddSite()}
                />
                <button onClick={handleAddSite} className="btn btn-sm" style={{ background: '#1565C0', color: 'white' }}>添加</button>
              </div>
            </div>

            {/* 数据来源 */}
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-3" style={{ color: C.gray1 }}>数据来源</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {sources.map(type => (
                  <span key={type} className="tag" style={{ background: '#FFF3E0', borderColor: '#FFCC80', color: '#E65100' }}>
                    {type}
                    <button onClick={() => handleRemove(sources, setSources, type)} className="btn btn-ghost btn-sm" style={{ padding: '0 4px', fontSize: '14px', lineHeight: 1, color: '#E65100' }}>×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSource}
                  onChange={e => setNewSource(e.target.value)}
                  placeholder="新增数据来源"
                  className="input"
                  onKeyPress={e => e.key === 'Enter' && handleAddSource()}
                />
                <button onClick={handleAddSource} className="btn btn-sm" style={{ background: '#E65100', color: 'white' }}>添加</button>
              </div>
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">取消</button>
          <button onClick={handleSave} className="btn btn-primary">保存并关闭</button>
        </div>
      </div>
    </div>
  )
}

export default SettingsDialog