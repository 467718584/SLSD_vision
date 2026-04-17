import React, { useState, useMemo } from 'react'
import { C, ALGO_COLORS, SITE_COLORS } from '../constants'
import ConfirmDialog from './ConfirmDialog'

// 原始数据类型定义
interface RawData {
  id: number
  name: string
  algoType?: string
  description?: string
  maintainDate?: string
  maintainer?: string
  dataset?: string      // 关联数据集
  isAnnotated?: boolean // 是否标注
  fileSize?: number     // 文件大小(字节)
  fileCount?: number    // 文件数量
  source?: string       // 数据来源
}

interface RawDataProps {
  onRefresh?: () => void
}

// 基础标签组件
const MemoizedTag = React.memo(({ label, colors }: { label: string; colors?: { bg?: string; border?: string; text?: string } }) => {
  const c = colors || { bg: C.gray6, border: C.border, text: C.gray2 }
  return (
    <span
      className="inline-block text-xs font-medium whitespace-nowrap"
      style={{
        padding: "2px 8px",
        borderRadius: "4px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text
      }}
    >
      {label}
    </span>
  )
})

const MemoizedAlgoTag = React.memo(({ type }: { type?: string }) => (
  <MemoizedTag label={type || "-"} colors={ALGO_COLORS[type || ""] || ALGO_COLORS["其他"]} />
))

const MemoizedSiteTag = React.memo(({ site }: { site?: string }) => (
  <MemoizedTag label={site || "-"} colors={SITE_COLORS[site || ""] || SITE_COLORS["其他"]} />
))

// 表格样式辅助函数
const th = (w: string, c = false) => ({
  padding: "10px 12px",
  fontSize: "12px",
  fontWeight: 600,
  color: C.gray1,
  textAlign: c ? "center" as const : "left" as const,
  width: w,
  whiteSpace: "nowrap" as const
})

const td = (w: string, c = false) => ({
  padding: "9px 12px",
  fontSize: "12px",
  color: C.gray2,
  borderBottom: `1px solid ${C.gray6}`,
  textAlign: c ? "center" as const : "left" as const,
  width: w,
  verticalAlign: "middle" as const
})

// 格式化文件大小
function formatFileSize(bytes?: number): string {
  if (!bytes) return "-"
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`
}

// 模拟数据（后端API未就绪时使用）
const mockRawData: RawData[] = [
  {
    id: 1,
    name: "raw_images_20240115",
    algoType: "路面积水检测",
    description: "2024年1月苏北灌溉总渠现场采集图片",
    maintainDate: "2024-01-15",
    maintainer: "张三",
    dataset: "苏北灌溉总渠_2024",
    isAnnotated: true,
    fileSize: 1024 * 1024 * 500,
    fileCount: 1250,
    source: "苏北灌溉总渠"
  },
  {
    id: 2,
    name: "raw_images_20240220",
    algoType: "漂浮物检测",
    description: "南水北调宝应站现场采集图片",
    maintainDate: "2024-02-20",
    maintainer: "李四",
    dataset: "宝应站_漂浮物数据集",
    isAnnotated: false,
    fileSize: 1024 * 1024 * 800,
    fileCount: 2100,
    source: "南水北调宝应站"
  },
  {
    id: 3,
    name: "raw_images_20240310",
    algoType: "墙面裂缝检测",
    description: "慈溪北排墙面巡检图片",
    maintainDate: "2024-03-10",
    maintainer: "王五",
    dataset: "慈溪北排_裂缝数据集",
    isAnnotated: true,
    fileSize: 1024 * 1024 * 300,
    fileCount: 800,
    source: "慈溪北排"
  },
  {
    id: 4,
    name: "raw_images_20240405",
    algoType: "游泳检测",
    description: "瓯江引水工程现场图片",
    maintainDate: "2024-04-05",
    maintainer: "赵六",
    dataset: "瓯江引水_游泳检测",
    isAnnotated: false,
    fileSize: 1024 * 1024 * 1200,
    fileCount: 3500,
    source: "瓯江引水"
  }
]

// 原始数据管理组件
function RawData({ onRefresh }: RawDataProps) {
  const [rawDataList, setRawDataList] = useState<RawData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAlgoType, setFilterAlgoType] = useState('全部')
  const [filterAnnotated, setFilterAnnotated] = useState('全部')
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<RawData | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // 上传表单状态
  const [uploadName, setUploadName] = useState('')
  const [uploadAlgoType, setUploadAlgoType] = useState('路面积水检测')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadMaintainer, setUploadMaintainer] = useState('管理员')
  const [uploadDataset, setUploadDataset] = useState('')
  const [uploadSource, setUploadSource] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // 算法类型选项
  const algoTypes = ['全部', '路面积水检测', '漂浮物检测', '墙面裂缝检测', '游泳检测', '其他']

  // 加载数据
  React.useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/raw-data')
      if (res.ok) {
        const data = await res.json()
        setRawDataList(data)
      } else {
        // 后端API未就绪，使用模拟数据
        setRawDataList(mockRawData)
      }
    } catch {
      // 后端API未就绪，使用模拟数据
      setRawDataList(mockRawData)
    }
    setLoading(false)
  }

  // 过滤数据
  const filteredData = useMemo(() => {
    return rawDataList.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchAlgo = filterAlgoType === '全部' || item.algoType === filterAlgoType
      const matchAnnotated = filterAnnotated === '全部' ||
        (filterAnnotated === '已标注' && item.isAnnotated) ||
        (filterAnnotated === '未标注' && !item.isAnnotated)
      return matchSearch && matchAlgo && matchAnnotated
    })
  }, [rawDataList, searchQuery, filterAlgoType, filterAnnotated])

  // 计算总文件数
  const totalFiles = useMemo(() => {
    return rawDataList.reduce((sum, item) => sum + (item.fileCount || 0), 0)
  }, [rawDataList])

  // 上传原始数据
  async function handleUpload() {
    if (!uploadName) {
      alert('请输入数据名称')
      return
    }
    if (!uploadFile) {
      alert('请选择要上传的文件')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('name', uploadName)
    formData.append('algoType', uploadAlgoType)
    formData.append('description', uploadDescription)
    formData.append('maintainer', uploadMaintainer)
    formData.append('dataset', uploadDataset)
    formData.append('source', uploadSource)
    formData.append('file', uploadFile)

    try {
      // 模拟上传进度
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const res = await fetch('/api/raw-data/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressTimer)

      if (res.ok) {
        setUploadProgress(100)
        setTimeout(() => {
          setShowUpload(false)
          setUploading(false)
          setUploadProgress(0)
          resetUploadForm()
          loadData()
          onRefresh?.()
        }, 500)
      } else {
        // API不存在，模拟成功
        const newItem: RawData = {
          id: Date.now(),
          name: uploadName,
          algoType: uploadAlgoType,
          description: uploadDescription,
          maintainer: uploadMaintainer,
          dataset: uploadDataset,
          source: uploadSource,
          isAnnotated: false,
          fileSize: uploadFile.size,
          fileCount: 1,
          maintainDate: new Date().toISOString().split('T')[0]
        }
        setRawDataList(prev => [newItem, ...prev])
        setUploadProgress(100)
        setTimeout(() => {
          setShowUpload(false)
          setUploading(false)
          setUploadProgress(0)
          resetUploadForm()
          onRefresh?.()
        }, 500)
      }
    } catch {
      setUploading(false)
      setUploadProgress(0)
      alert('上传失败，请重试')
    }
  }

  function resetUploadForm() {
    setUploadName('')
    setUploadAlgoType('路面积水检测')
    setUploadDescription('')
    setUploadMaintainer('管理员')
    setUploadDataset('')
    setUploadSource('')
    setUploadFile(null)
  }

  // 删除原始数据
  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/raw-data/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setRawDataList(prev => prev.filter(item => item.id !== deleteTarget.id))
      } else {
        // 模拟删除
        setRawDataList(prev => prev.filter(item => item.id !== deleteTarget.id))
      }
    } catch {
      // 模拟删除
      setRawDataList(prev => prev.filter(item => item.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  // 全选/取消全选
  function toggleSelectAll() {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)))
    }
  }

  function toggleSelect(id: number) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // 下载原始数据
  function downloadRawData(item: RawData, e: React.MouseEvent) {
    e.stopPropagation()
    window.open(`/api/raw-data/${item.id}/download`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-200">
        <span className="text-gray-3">加载中...</span>
      </div>
    )
  }

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-1">原始数据管理</h2>
          <p className="text-sm text-gray-3 mt-1">
            共 {rawDataList.length} 条记录 · {totalFiles.toLocaleString()} 个文件
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn btn-primary"
        >
          + 上传原始数据
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="card mb-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索数据名称或描述..."
            className="input w-full"
          />
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-gray-3 mr-1">算法:</span>
          {algoTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterAlgoType(type)}
              className={`btn btn-sm ${filterAlgoType === type ? 'btn-primary' : 'btn-ghost'}`}
            >
              {type}
            </button>
          ))}
          <span className="text-xs text-gray-3 ml-2 mr-1">标注:</span>
          {['全部', '已标注', '未标注'].map(status => (
            <button
              key={status}
              onClick={() => setFilterAnnotated(status)}
              className={`btn btn-sm ${filterAnnotated === status ? 'btn-primary' : 'btn-ghost'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <span className="block text-xs text-gray-4 mb-3">
        {selectedIds.size > 0 && (
          <span className="mr-3 text-primary">
            已选 {selectedIds.size} 项
          </span>
        )}
        显示 {filteredData.length} 条
      </span>

      {/* 数据表格 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full min-w-1000">
            <thead>
              <tr className="bg-gray-7 border-b-2">
                <th style={th("36px", true)}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th style={th("48px", true)}>编号</th>
                <th style={th("130px", true)}>算法类型</th>
                <th style={th("180px")}>数据名称</th>
                <th style={th("180px")}>数据概述</th>
                <th style={th("110px")}>关联数据集</th>
                <th style={th("72px", true)}>文件数</th>
                <th style={th("80px", true)}>文件大小</th>
                <th style={th("80px", true)}>标注状态</th>
                <th style={th("86px", true)}>维护日期</th>
                <th style={th("72px", true)}>维护人员</th>
                <th style={th("110px", true)}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => {
                const isSelected = selectedIds.has(item.id)
                return (
                  <tr
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`cursor-pointer transition-all ${isSelected ? 'bg-primary' : (idx % 2 === 0 ? 'bg-white' : '')}`}
                    style={{ background: idx % 2 !== 0 && !isSelected ? '#FAFCFE' : undefined }}
                  >
                    <td style={td("36px", true)} onClick={e => { e.stopPropagation(); toggleSelect(item.id) }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td style={td("48px", true)}>
                      <span className="font-semibold text-gray-4">{item.id}</span>
                    </td>
                    <td style={td("130px", true)}>
                      <MemoizedAlgoTag type={item.algoType} />
                    </td>
                    <td style={td("180px")}>
                      <div className="text-primary font-medium text-xs truncate max-w-170"
                        title={item.name}
                      >
                        {item.name}
                      </div>
                    </td>
                    <td style={td("180px")}>
                      <span className="text-xs text-gray-3 truncate block max-w-170"
                        title={item.description}
                      >
                        {item.description || "-"}
                      </span>
                    </td>
                    <td style={td("110px")}>
                      <MemoizedSiteTag site={item.dataset} />
                    </td>
                    <td style={td("72px", true)}>
                      <span className="font-bold text-gray-1 text-sm">
                        {(item.fileCount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={td("80px", true)}>
                      <span className="text-xs text-gray-3">
                        {formatFileSize(item.fileSize)}
                      </span>
                    </td>
                    <td style={td("80px", true)}>
                      {item.isAnnotated ? (
                        <span className="badge badge-success">
                          已标注
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          未标注
                        </span>
                      )}
                    </td>
                    <td style={td("86px", true)}>
                      <span className="text-xs text-gray-3">{item.maintainDate}</span>
                    </td>
                    <td style={td("72px", true)}>
                      <span className="text-xs text-gray-2 font-medium">{item.maintainer}</span>
                    </td>
                    <td style={td("110px", true)}>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => downloadRawData(item, e)}
                          title="下载"
                          className="btn btn-sm btn-primary"
                        >
                          下载
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(item) }}
                          title="删除"
                          className="btn btn-sm btn-danger"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="p-10 text-center text-gray-3">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="确认删除"
        message={`确定要删除原始数据 "${deleteTarget?.name}" 吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />

      {/* 上传弹窗 */}
      {showUpload && (
        <div
          className="fixed inset-0 bg-black-50 flex items-center justify-center z-10"
          onClick={() => !uploading && setShowUpload(false)}
        >
          <div
            className="bg-white rounded-12 p-6 w-full max-w-120 overflow-auto"
            style={{ maxHeight: "80vh" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-gray-1">上传原始数据</h3>
              {!uploading && (
                <button
                  onClick={() => setShowUpload(false)}
                  className="btn btn-ghost text-gray-3"
                  style={{ fontSize: "20px", padding: "0" }}
                >
                  ×
                </button>
              )}
            </div>

            {uploading ? (
              <div className="text-center py-10">
                <div className="text-2xl mb-4">⬆️</div>
                <div className="text-sm text-gray-2 mb-4">上传中...</div>
                <div className="w-full h-2 bg-gray-6 rounded-4 overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="text-xs text-gray-3 mt-2">{uploadProgress}%</div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-xs text-gray-2 mb-1 font-medium">
                    数据名称 <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={e => setUploadName(e.target.value)}
                    placeholder="请输入数据名称"
                    className="input w-full"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-2 mb-1 font-medium">
                    算法类型
                  </label>
                  <select
                    value={uploadAlgoType}
                    onChange={e => setUploadAlgoType(e.target.value)}
                    className="input w-full"
                  >
                    {algoTypes.filter(t => t !== '全部').map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-2 mb-1 font-medium">
                    关联数据集
                  </label>
                  <input
                    type="text"
                    value={uploadDataset}
                    onChange={e => setUploadDataset(e.target.value)}
                    placeholder="请输入关联的数据集名称"
                    className="input w-full"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-2 mb-1 font-medium">
                    数据来源
                  </label>
                  <input
                    type="text"
                    value={uploadSource}
                    onChange={e => setUploadSource(e.target.value)}
                    placeholder="如：苏北灌溉总渠"
                    className="input w-full"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-2 mb-1 font-medium">
                    数据概述
                  </label>
                  <textarea
                    value={uploadDescription}
                    onChange={e => setUploadDescription(e.target.value)}
                    placeholder="请输入数据描述..."
                    rows={3}
                    className="input w-full resize-vertical"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-2 mb-1 font-medium">
                    维护人员
                  </label>
                  <input
                    type="text"
                    value={uploadMaintainer}
                    onChange={e => setUploadMaintainer(e.target.value)}
                    placeholder="请输入维护人员姓名"
                    className="input w-full"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs text-gray-2 mb-1 font-medium">
                    选择文件 <span className="text-error">*</span>
                  </label>
                  <input
                    type="file"
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                    className="input w-full"
                  />
                  {uploadFile && (
                    <div className="text-xs text-gray-3 mt-1">
                      已选择: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowUpload(false)}
                    className="btn btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpload}
                    className="btn btn-primary"
                  >
                    上传
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RawData
