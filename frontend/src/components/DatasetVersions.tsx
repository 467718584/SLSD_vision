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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold">创建新版本</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="text-error p-3 mb-4">{error}</div>}

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-4 mb-2">版本号 *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="如 v1.0"
                className="w-full p-3 border rounded text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setVersion(generateVersion())}
                className="btn btn-primary"
              >
                自动
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-4 mb-2">版本描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="描述此版本的变更..."
              className="w-full p-3 border rounded text-sm"
              style={{ minHeight: '80px', resize: 'vertical' as const }}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">取消</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
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
    <div className="p-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="btn">
              ← 返回
            </button>
          )}
          <h2 className="text-lg font-bold text-gray-2">
            <LayersIcon size={20} /> {datasetName} - 版本管理
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setCompareMode(!compareMode); setSelectedVersions([]); setCompareResult(null); }}
            className={compareMode ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            {compareMode ? '退出对比' : '版本对比'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + 创建版本
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="text-error p-3 mb-4">{error}</div>
      )}

      {/* 对比模式提示 */}
      {compareMode && (
        <div className="text-accent p-3 mb-4">
          请选择2个版本进行对比 (已选 {selectedVersions.length}/2)
          {selectedVersions.length === 2 && (
            <button onClick={handleCompare} className="btn btn-primary ml-4">
              开始对比
            </button>
          )}
        </div>
      )}

      {/* 对比结果 */}
      {compareResult && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-4 text-gray-2">
            <BarChartIcon size={18} /> 版本对比结果
          </h3>
          <table className="table">
            <thead>
              <tr>
                <th className="text-sm font-medium">指标</th>
                <th className="text-sm font-medium">{compareResult.version1?.version}</th>
                <th className="text-sm font-medium">{compareResult.version2?.version}</th>
                <th className="text-sm font-medium">差异</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>文件数量</td>
                <td>{compareResult.version1?.file_count}</td>
                <td>{compareResult.version2?.file_count}</td>
                <td className={(compareResult.changes?.file_count_diff || 0) > 0 ? 'text-success' : 'text-error'}>
                  {(compareResult.changes?.file_count_diff || 0) > 0 ? '+' : ''}{compareResult.changes?.file_count_diff}
                </td>
              </tr>
              <tr>
                <td>样本总数</td>
                <td>{compareResult.version1?.total}</td>
                <td>{compareResult.version2?.total}</td>
                <td className={(compareResult.changes?.total_diff || 0) > 0 ? 'text-success' : 'text-error'}>
                  {(compareResult.changes?.total_diff || 0) > 0 ? '+' : ''}{compareResult.changes?.total_diff}
                </td>
              </tr>
              <tr>
                <td>创建时间</td>
                <td>{compareResult.version1?.created_at?.split('T')[0]}</td>
                <td>{compareResult.version2?.created_at?.split('T')[0]}</td>
                <td>-</td>
              </tr>
              <tr>
                <td>创建人</td>
                <td>{compareResult.version1?.created_by || '-'}</td>
                <td>{compareResult.version2?.created_by || '-'}</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 版本列表 */}
      {loading ? (
        <div className="text-center p-6 text-muted">加载中...</div>
      ) : versions.length === 0 ? (
        <div className="text-center p-6 text-muted">
          暂无版本记录
        </div>
      ) : (
        <div className="card">
          <h3 className="font-semibold mb-4 text-gray-2">
            版本列表 ({versions.length})
          </h3>
          <div className="flex flex-col gap-3">
            {versions.map((version, idx) => (
              <div
                key={version.id}
                onClick={() => toggleVersionSelect(version.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedVersions.includes(version.id) ? 'border-2' : ''
                }`}
                style={{
                  borderColor: selectedVersions.includes(version.id) ? C.primary : C.border,
                  background: selectedVersions.includes(version.id) ? `${C.primary}08` : 'white'
                }}
              >
                {compareMode && (
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(version.id)}
                    onChange={() => {}}
                    className="w-5 h-5 mr-3"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`badge ${idx === 0 ? 'badge-success' : 'badge-primary'}`}>
                      {version.version}
                    </span>
                    {idx === 0 && <span className="badge badge-warning">最新</span>}
                    <span className="text-xs text-muted">
                      {version.created_at?.split('T')[0]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-4">
                    {version.description || '无描述'}
                  </div>
                  <div className="flex gap-6 mt-2 text-xs text-muted">
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

export default DatasetVersions
