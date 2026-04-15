import React, { useState, useEffect } from 'react'
import { C } from '../constants'

// 设置对话框组件
function SettingsDialog({ isOpen, onClose }) {
  const [algoTypes, setAlgoTypes] = useState([
    '路面积水检测', '漂浮物检测', '墙面裂缝检测', '游泳检测', '其他'
  ])
  const [techMethods, setTechMethods] = useState(['目标检测算法', '实例分割算法'])
  const [annotationTypes, setAnnotationTypes] = useState(['YOLO格式', 'VOC格式', 'COCO格式'])
  const [sites, setSites] = useState([
    '苏北灌溉总渠', '南水北调宝应站', '慈溪北排', '慈溪周巷', '瓯江引水', '互联网'
  ])
  const [newAlgoType, setNewAlgoType] = useState('')
  const [newTechMethod, setNewTechMethod] = useState('')
  const [newAnnotationType, setNewAnnotationType] = useState('')
  const [newSite, setNewSite] = useState('')
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
        sites
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
      .catch(err => {
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

  // 移除标签
  function handleRemove(list, setter, item) {
    setter(list.filter(t => t !== item))
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: C.gray1 }}>系统设置</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.gray3 }}>加载中...</div>
        ) : (
          <div style={styles.content}>
            {/* 算法类型 */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>算法类型（应用场景）</h4>
              <div style={styles.tagList}>
                {algoTypes.map(type => (
                  <span key={type} style={{ ...styles.tag, background: C.primaryBg, borderColor: C.primaryBd, color: C.primary }}>
                    {type}
                    <button onClick={() => handleRemove(algoTypes, setAlgoTypes, type)} style={styles.tagRemove}>×</button>
                  </span>
                ))}
              </div>
              <div style={styles.addRow}>
                <input
                  type="text"
                  value={newAlgoType}
                  onChange={e => setNewAlgoType(e.target.value)}
                  placeholder="新增算法类型"
                  style={styles.input}
                  onKeyPress={e => e.key === 'Enter' && handleAddAlgoType()}
                />
                <button onClick={handleAddAlgoType} style={{ ...styles.addBtn, background: C.primary }}>添加</button>
              </div>
            </div>

            {/* 技术方法 */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>技术方法</h4>
              <div style={styles.tagList}>
                {techMethods.map(type => (
                  <span key={type} style={{ ...styles.tag, background: '#E8F5E9', borderColor: '#A5D6A7', color: '#2E7D32' }}>
                    {type}
                    <button onClick={() => handleRemove(techMethods, setTechMethods, type)} style={{ ...styles.tagRemove, color: '#2E7D32' }}>×</button>
                  </span>
                ))}
              </div>
              <div style={styles.addRow}>
                <input
                  type="text"
                  value={newTechMethod}
                  onChange={e => setNewTechMethod(e.target.value)}
                  placeholder="新增技术方法"
                  style={styles.input}
                  onKeyPress={e => e.key === 'Enter' && handleAddTechMethod()}
                />
                <button onClick={handleAddTechMethod} style={{ ...styles.addBtn, background: '#2E7D32' }}>添加</button>
              </div>
            </div>

            {/* 标注方法 */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>标注方法</h4>
              <div style={styles.tagList}>
                {annotationTypes.map(type => (
                  <span key={type} style={{ ...styles.tag, background: C.orangeBg, borderColor: '#F5C8A8', color: C.orange }}>
                    {type}
                    <button onClick={() => handleRemove(annotationTypes, setAnnotationTypes, type)} style={{ ...styles.tagRemove, color: C.orange }}>×</button>
                  </span>
                ))}
              </div>
              <div style={styles.addRow}>
                <input
                  type="text"
                  value={newAnnotationType}
                  onChange={e => setNewAnnotationType(e.target.value)}
                  placeholder="新增标注方法"
                  style={styles.input}
                  onKeyPress={e => e.key === 'Enter' && handleAddAnnotationType()}
                />
                <button onClick={handleAddAnnotationType} style={{ ...styles.addBtn, background: C.orange }}>添加</button>
              </div>
            </div>

            {/* 应用现场 */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>应用现场</h4>
              <div style={styles.tagList}>
                {sites.map(type => (
                  <span key={type} style={{ ...styles.tag, background: '#E3F2FD', borderColor: '#90CAF9', color: '#1565C0' }}>
                    {type}
                    <button onClick={() => handleRemove(sites, setSites, type)} style={{ ...styles.tagRemove, color: '#1565C0' }}>×</button>
                  </span>
                ))}
              </div>
              <div style={styles.addRow}>
                <input
                  type="text"
                  value={newSite}
                  onChange={e => setNewSite(e.target.value)}
                  placeholder="新增应用现场"
                  style={styles.input}
                  onKeyPress={e => e.key === 'Enter' && handleAddSite()}
                />
                <button onClick={handleAddSite} style={{ ...styles.addBtn, background: '#1565C0' }}>添加</button>
              </div>
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>取消</button>
          <button onClick={handleSave} style={styles.saveBtn}>保存并关闭</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
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
    color: C.gray3,
    padding: '0',
    lineHeight: 1
  },
  content: {
    padding: '20px 24px'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: C.gray1,
    marginBottom: '12px'
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px'
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid',
    borderRadius: '20px',
    padding: '4px 10px',
    fontSize: '12px'
  },
  tagRemove: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0',
    lineHeight: 1
  },
  addRow: {
    display: 'flex',
    gap: '8px'
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none'
  },
  addBtn: {
    padding: '8px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  footer: {
    padding: '16px 24px',
    borderTop: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  cancelBtn: {
    padding: '10px 24px',
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    color: C.gray2
  },
  saveBtn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    background: C.primary,
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500
  }
}

export default SettingsDialog
