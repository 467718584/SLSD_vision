import React, { useState, useEffect } from 'react'
import { C } from '../constants'
import { LayersIcon, BarChartIcon } from './Icons'

// 版本类型定义
interface Version {
  id: number
  version: string
  description?: string
  created_at?: string
  created_by?: string
  file_count?: number
  total?: number
  parent_version?: string
}

interface VersionComparison {
  version1?: Version
  version2?: Version
  changes?: {
    file_count_diff?: number
    total_diff?: number
  }
}

interface DatasetVersionsProps {
  datasetName: string
  onBack?: () => void
}

interface CreateVersionModalProps {
  datasetName: string
  latestVersion: Version | null
  onClose: () => void
  onSuccess: () => void
}

// 创建版本弹窗组件
function CreateVersionModal({ datasetName, latestVersion, onClose, onSuccess }: CreateVersionModalProps) {
  const [version, setVersion] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function generateVersion() {
    if (!latestVersion) {
      return 'v1.0'
    }
    const current = latestVersion.version
    const match = current.match(/v(\d+)\.(\d+)/)
    if (match) {
      const major = parseInt(match[1])
      const minor = parseInt(match[2]) + 1
      return `v${major}.${minor}`
    }
    return 'v1.0'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!version.trim()) {
      setError('版本号不能为空')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/dataset/${encodeURIComponent(datasetName)}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, description })
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || '创建失败')
      }
    } catch (err: any) {
      setError('请求失败: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>创建新版本</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalContent}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>版本号 *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="如 v1.0"
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setVersion(generateVersion())}
                style={{ ...styles.autoBtn, background: C.primary }}
              >
                自动
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>版本描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="描述此版本的变更..."
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }}
            />
          </div>

          <div style={styles.modalFooter}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>取消</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 数据集版本管理组件
function DatasetVersions({ datasetName, onBack }: DatasetVersionsProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [latestVersion, setLatestVersion] = useState<Version | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<number[]>([])
  const [compareResult, setCompareResult] = useState<VersionComparison | null>(null)

  useEffect(() => {
    loadVersions()
  }, [datasetName])

  async function loadVersions() {
    setLoading(true)
    try {
      const res = await fetch(`/api/dataset/${encodeURIComponent(datasetName)}/versions`)
      const data = await res.json()
      if (data.success) {
        setVersions(data.versions || [])
        setLatestVersion(data.latest_version)
      } else {
        setError('加载版本失败')
      }
    } catch (err: any) {
      setError('加载失败: ' + err.message)
    }
    setLoading(false)
  }

  function toggleVersionSelect(versionId: number) {
    if (!compareMode) return
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      }
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, versionId]
    })
  }

  async function handleCompare() {
    if (selectedVersions.length !== 2) {
      setError('请选择2个版本进行对比')
      return
    }

    try {
      const res = await fetch(`/api/dataset/versions/compare?v1=${selectedVersions[0]}&v2=${selectedVersions[1]}`)
      const data = await res.json()
      if (data.success) {
        setCompareResult(data.comparison)
      } else {
        setError(data.error || '对比失败')
      }
    } catch (err) {
      setError('对比请求失败')
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* 头部 */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {onBack && (
            <button onClick={onBack} className="btn" style={{ marginRight: '12px' }}>
              ← 返回
            </button>
          )}
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.gray1 }}>
            <LayersIcon size={20} /> {datasetName} - 版本管理
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => { setCompareMode(!compareMode); setSelectedVersions([]); setCompareResult(null); }}
            className="btn"
            style={{ background: compareMode ? C.primary : C.gray5, color: 'white' }}
          >
            {compareMode ? '退出对比' : '版本对比'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn"
            style={{ background: C.primary, color: 'white' }}
          >
            + 创建版本
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={styles.error}>{error}</div>
      )}

      {/* 对比模式提示 */}
      {compareMode && (
        <div style={styles.info}>
          请选择2个版本进行对比 (已选 {selectedVersions.length}/2)
          {selectedVersions.length === 2 && (
            <button onClick={handleCompare} className="btn" style={{ marginLeft: '16px', background: C.success, color: 'white' }}>
              开始对比
            </button>
          )}
        </div>
      )}

      {/* 对比结果 */}
      {compareResult && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
            <BarChartIcon size={18} /> 版本对比结果
          </h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>指标</th>
                <th style={styles.th}>{compareResult.version1?.version}</th>
                <th style={styles.th}>{compareResult.version2?.version}</th>
                <th style={styles.th}>差异</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}>文件数量</td>
                <td style={styles.td}>{compareResult.version1?.file_count}</td>
                <td style={styles.td}>{compareResult.version2?.file_count}</td>
                <td style={{ ...styles.td, color: (compareResult.changes?.file_count_diff || 0) > 0 ? C.success : C.warning }}>
                  {(compareResult.changes?.file_count_diff || 0) > 0 ? '+' : ''}{compareResult.changes?.file_count_diff}
                </td>
              </tr>
              <tr>
                <td style={styles.td}>样本总数</td>
                <td style={styles.td}>{compareResult.version1?.total}</td>
                <td style={styles.td}>{compareResult.version2?.total}</td>
                <td style={{ ...styles.td, color: (compareResult.changes?.total_diff || 0) > 0 ? C.success : C.warning }}>
                  {(compareResult.changes?.total_diff || 0) > 0 ? '+' : ''}{compareResult.changes?.total_diff}
                </td>
              </tr>
              <tr>
                <td style={styles.td}>创建时间</td>
                <td style={styles.td}>{compareResult.version1?.created_at?.split('T')[0]}</td>
                <td style={styles.td}>{compareResult.version2?.created_at?.split('T')[0]}</td>
                <td style={styles.td}>-</td>
              </tr>
              <tr>
                <td style={styles.td}>创建人</td>
                <td style={styles.td}>{compareResult.version1?.created_by || '-'}</td>
                <td style={styles.td}>{compareResult.version2?.created_by || '-'}</td>
                <td style={styles.td}>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 版本列表 */}
      {loading ? (
        <div style={{ textAlign: 'center' as const, padding: '60px', color: C.gray3 }}>加载中...</div>
      ) : versions.length === 0 ? (
        <div style={{ textAlign: 'center' as const, padding: '60px', color: C.gray3 }}>
          暂无版本记录
        </div>
      ) : (
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
            版本列表 ({versions.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
            {versions.map((version, idx) => (
              <div
                key={version.id}
                onClick={() => toggleVersionSelect(version.id)}
                style={{
                  ...styles.versionCard,
                  border: selectedVersions.includes(version.id) ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                  background: selectedVersions.includes(version.id) ? `${C.primary}08` : 'white'
                }}
              >
                {compareMode && (
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(version.id)}
                    onChange={() => {}}
                    style={{ width: '18px', height: '18px', marginRight: '12px' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ ...styles.versionBadge, background: idx === 0 ? C.success : C.gray5 }}>
                      {version.version}
                    </span>
                    {idx === 0 && <span style={styles.latestBadge}>最新</span>}
                    <span style={{ fontSize: '12px', color: C.gray3 }}>
                      {version.created_at?.split('T')[0]}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: C.gray2 }}>
                    {version.description || '无描述'}
                  </div>
                  <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '12px', color: C.gray3 }}>
                    <span>文件数: {version.file_count || 0}</span>
                    <span>样本数: {version.total || 0}</span>
                    <span>创建人: {version.created_by || '-'}</span>
                    {version.parent_version && <span>父版本: {version.parent_version}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 创建版本弹窗 */}
      {showCreateModal && (
        <CreateVersionModal
          datasetName={datasetName}
          latestVersion={latestVersion}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); loadVersions(); }}
        />
      )}
    </div>
  )
}

const styles = {
  error: {
    padding: '12px 16px',
    background: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px'
  },
  info: {
    padding: '12px 16px',
    background: '#E3F2FD',
    color: '#1565C0',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px'
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left' as const,
    background: C.gray7,
    borderBottom: `1px solid ${C.border}`,
    fontWeight: 600,
    color: C.gray2
  },
  td: {
    padding: '10px 12px',
    borderBottom: `1px solid ${C.border}`,
    color: C.gray1
  },
  versionCard: {
    padding: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    transition: 'all 0.2s'
  },
  versionBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'white'
  },
  latestBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    background: C.orange,
    color: 'white'
  },
  modalOverlay: {
    position: 'fixed' as const,
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
    width: '480px',
    maxHeight: '90vh',
    overflow: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  modalHeader: {
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
  modalContent: {
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
  autoBtn: {
    padding: '10px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  modalFooter: {
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

export default DatasetVersions
