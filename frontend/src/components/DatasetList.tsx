import React, { useState, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { C, ALGO_COLORS, SITE_COLORS, TECH_METHOD_COLORS } from '../constants'
import { batchExportDatasets } from '../api'
import { queryKeys } from '../hooks/useApi'
import ConfirmDialog from './ConfirmDialog'
import { SkeletonTable } from './ui/Skeleton'
import EmptyState from './ui/EmptyState'
import { FolderIcon } from './Icons'

// 高级搜索筛选类型
interface DatasetSearchFilters {
  searchQuery: string
  algoType: string
  techMethod: string
  source: string
  dateRange: { start: string; end: string }
  sampleRange: { min: string; max: string }
  hasTest: string
}

interface ModelSearchFilters {
  searchQuery: string
  algoName: string
  techMethod: string
  site: string
  category: string
  dateRange: { start: string; end: string }
  accuracyRange: { min: string; max: string }
}

// 类型定义
interface Dataset {
  id: number
  name: string
  algoType?: string
  techMethod?: string
  total?: number
  split?: string
  hasTest?: boolean
  annotationType?: string
  maintainer?: string
  maintainDate?: string
  desc?: string
  source?: string
  classInfo?: Record<string, number | { name?: string; count?: number }>
}

interface DatasetListProps {
  datasets: Dataset[]
  onSelectDataset: (ds: Dataset) => void
  onRefresh: () => void
  onShowUpload: () => void
  isLoading?: boolean
}

// 基础标签组件
const MemoizedTag = React.memo(({ label, colors }: { label: string; colors?: { bg?: string; border?: string; text?: string } }) => {
  const c = colors || { bg: C.gray6, border: C.border, text: C.gray2 }
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: 500,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      whiteSpace: "nowrap" as const
    }}>
      {label}
    </span>
  )
})

const MemoizedAlgoTag = React.memo(({ type }: { type?: string }) => (
  <MemoizedTag label={type || "-"} colors={ALGO_COLORS[type || ""] || ALGO_COLORS["其他"]} />
))

const MemoizedTechMethodTag = React.memo(({ type }: { type?: string }) => (
  <MemoizedTag label={type || "目标检测算法"} colors={TECH_METHOD_COLORS[type || "目标检测算法"] || TECH_METHOD_COLORS["目标检测算法"]} />
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
  whiteSpace: "nowrap" as const,
  verticalAlign: "middle" as const
})

const td = (w: string, c = false) => ({
  padding: "10px 12px",
  fontSize: "12px",
  color: C.gray2,
  borderBottom: `1px solid ${C.gray6}`,
  textAlign: c ? "center" as const : "left" as const,
  width: w,
  verticalAlign: "middle" as const
})

// 详情图组件
const DetailChart = React.memo(({ datasetName, size = 50 }: { datasetName: string; size?: number }) => {
  const [chartUrl, setChartUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    setLoading(true)
    fetch(`/api/dataset/${encodeURIComponent(datasetName)}/charts`)
      .then(res => res.json())
      .then(data => {
        if (data.detail) {
          // 移除常见的路径前缀，获取相对路径
          let path = data.detail
            .replace(/^.*data\/datasets\//, 'datasets/')
            .replace(/^.*\/data\//, 'data/')
            .replace(/^data\//, '')
          setChartUrl(`/data/${path}`)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [datasetName])

  if (loading) {
    return <div style={{ width: size, height: size, background: C.gray6, borderRadius: "3px" }} />
  }

  if (!chartUrl) {
    return <div style={{ width: size, height: size, background: C.gray6, borderRadius: "3px" }} />
  }

  return (
    <img
      src={chartUrl}
      alt="detail"
      style={{ width: size, height: size, objectFit: "cover" as const, borderRadius: "3px", cursor: "pointer" }}
      loading="lazy"
    />
  )
})

// 分布图组件
const DistChart = React.memo(({ datasetName, size = 50 }: { datasetName: string; size?: number }) => {
  const [chartUrl, setChartUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    setLoading(true)
    fetch(`/api/dataset/${encodeURIComponent(datasetName)}/charts`)
      .then(res => res.json())
      .then(data => {
        if (data.distribution) {
          // 移除常见的路径前缀，获取相对路径
          let path = data.distribution
            .replace(/^.*data\/datasets\//, 'datasets/')
            .replace(/^.*\/data\//, 'data/')
            .replace(/^data\//, '')
          setChartUrl(`/data/${path}`)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [datasetName])

  if (loading) {
    return <div style={{ width: size, height: size, background: C.gray6, borderRadius: "3px" }} />
  }

  if (!chartUrl) {
    return <div style={{ width: size, height: size, background: C.gray6, borderRadius: "3px" }} />
  }

  return (
    <img
      src={chartUrl}
      alt="distribution"
      style={{ width: size, height: size, objectFit: "cover" as const, borderRadius: "3px", cursor: "pointer" }}
      loading="lazy"
    />
  )
})

// 数据集列表组件
function DatasetList({ datasets, onSelectDataset, onRefresh, onShowUpload, isLoading }: DatasetListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('全部')
  const [deleteTarget, setDeleteTarget] = useState<{ name: string } | null>(null)
  const queryClient = useQueryClient()
  // 批量选择状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchDeleteTarget, setBatchDeleteTarget] = useState<{ names: string[] } | null>(null)

  // 高级搜索条件
  const [searchFilters, setSearchFilters] = useState<DatasetSearchFilters>({
    searchQuery: '',
    algoType: '全部',
    techMethod: '目标检测算法',
    source: '全部',
    dateRange: { start: '', end: '' },
    sampleRange: { min: '', max: '' },
    hasTest: '全部'
  })

  // 高级筛选面板显示状态
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // 计算活跃筛选条件数量
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchFilters.hasTest !== '全部') count++
    if (searchFilters.dateRange.start) count++
    if (searchFilters.dateRange.end) count++
    if (searchFilters.sampleRange.min) count++
    if (searchFilters.sampleRange.max) count++
    return count
  }, [searchFilters.hasTest, searchFilters.dateRange, searchFilters.sampleRange])

  // 初始化从localStorage加载保存的搜索条件
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dataset_search_filters')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSearchFilters(prev => ({ ...prev, ...parsed }))
        setSearchQuery(parsed.searchQuery || '')
        setFilterType(parsed.algoType || '全部')
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // 保存搜索条件到localStorage
  const persistFilters = (filters: DatasetSearchFilters) => {
    try {
      localStorage.setItem('dataset_search_filters', JSON.stringify(filters))
    } catch (e) {
      // ignore
    }
  }

  // 获取所有算法类型
  const algoTypes = useMemo(() => {
    const types = new Set(datasets.map(ds => ds.algoType))
    return ['全部', ...Array.from(types)]
  }, [datasets])

  // 获取所有数据来源
  const sources = useMemo(() => {
    const srcs = new Set(datasets.map(ds => ds.source).filter(Boolean))
    return ['全部', ...Array.from(srcs)]
  }, [datasets])



  // 拖拽排序状态
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  // 过滤数据集 - 必须在sortedDatasets之前定义
  const filteredDatasets = useMemo(() => {
    return datasets.filter(ds => {
      const matchSearch = ds.name.toLowerCase().includes(searchFilters.searchQuery.toLowerCase())
      const matchType = searchFilters.algoType === '全部' || ds.algoType === searchFilters.algoType
      const matchTech = searchFilters.techMethod === '全部' || searchFilters.techMethod === '目标检测算法' || ds.techMethod === searchFilters.techMethod
      const matchSource = searchFilters.source === '全部' || ds.source === searchFilters.source
      // 日期范围
      let matchDate = true
      if (searchFilters.dateRange.start || searchFilters.dateRange.end) {
        const dsDate = ds.maintainDate || ''
        if (searchFilters.dateRange.start && dsDate < searchFilters.dateRange.start) matchDate = false
        if (searchFilters.dateRange.end && dsDate > searchFilters.dateRange.end) matchDate = false
      }
      
      // 样本数量范围
      let matchSample = true
      const total = ds.total || 0
      if (searchFilters.sampleRange.min && total < parseInt(searchFilters.sampleRange.min)) matchSample = false
      if (searchFilters.sampleRange.max && total > parseInt(searchFilters.sampleRange.max)) matchSample = false
      
      // 是否有测试集筛选
      let matchHasTest = true
      if (searchFilters.hasTest === '有测试集') matchHasTest = ds.hasTest === true
      else if (searchFilters.hasTest === '无测试集') matchHasTest = ds.hasTest === false

      return matchSearch && matchType && matchTech && matchSource && matchHasTest && matchDate && matchSample
    })
  }, [datasets, searchFilters])

  // 初始化从localStorage加载排序顺序
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dataset_order')
      if (saved) {
        const orderMap = JSON.parse(saved) as Record<number, number>
        // 应用保存的排序顺序
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // 拖拽排序后的数据集
  const sortedDatasets = useMemo(() => {
    const orderKey = 'dataset_order'
    try {
      const saved = localStorage.getItem(orderKey)
      if (saved) {
        const orderMap = JSON.parse(saved) as Record<number, number>
        return [...filteredDatasets].sort((a, b) => {
          const orderA = orderMap[a.id] ?? filteredDatasets.indexOf(a)
          const orderB = orderMap[b.id] ?? filteredDatasets.indexOf(b)
          return orderA - orderB
        })
      }
    } catch (e) {
      // ignore
    }
    return filteredDatasets
  }, [filteredDatasets])

  // 计算总样本数
  const totalSamples = useMemo(() => {
    return datasets.reduce((sum, ds) => sum + (ds.total || 0), 0)
  }, [datasets])

  // 拖拽处理
  function handleDragStart(e: React.DragEvent, idx: number) {
    setDraggedIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(idx)
  }

  function handleDragLeave() {
    setDragOverIdx(null)
  }

  function handleDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null)
      setDragOverIdx(null)
      return
    }
    // 构建新的排序顺序
    const orderKey = 'dataset_order'
    try {
      const saved = localStorage.getItem(orderKey)
      const orderMap = (saved ? JSON.parse(saved) : {}) as Record<number, number>
      // 调整受影响的项的顺序
      const draggedId = sortedDatasets[draggedIdx].id
      const targetId = sortedDatasets[targetIdx].id
      // 重新计算所有项的顺序
      const newOrder: Record<number, number> = {}
      sortedDatasets.forEach((ds, i) => {
        if (ds.id === draggedId) {
          newOrder[ds.id] = targetIdx
        } else if (ds.id === targetId) {
          newOrder[ds.id] = draggedIdx
        } else {
          newOrder[ds.id] = i
        }
      })
      localStorage.setItem(orderKey, JSON.stringify(newOrder))
    } catch (e) {
      // ignore
    }
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  function handleDragEnd() {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  // 删除数据集
  function deleteDataset(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDeleteTarget({ name })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/dataset/${encodeURIComponent(deleteTarget.name)}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.datasets })
        queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      } else {
        alert(`删除失败: ${data.error}`)
      }
    } catch (err: any) {
      alert(`删除失败: ${err.message}`)
    }
    setDeleteTarget(null)
  }

  // 批量删除确认
  async function confirmBatchDelete() {
    if (!batchDeleteTarget || batchDeleteTarget.names.length === 0) return
    try {
      const res = await fetch('/api/dataset/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': localStorage.getItem('csrf_token') || '',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        },
        body: JSON.stringify({ names: batchDeleteTarget.names })
      })
      const data = await res.json()
      if (data.success) {
        const results = data.results
        if (results.failed.length > 0) {
          alert(`批量删除完成: ${results.success.length}成功, ${results.failed.length}失败\n失败项: ${results.failed.map((f: any) => f.name).join(', ')}`)
        } else {
          alert(`批量删除成功: ${results.success.length}个数据集已删除`)
        }
        setSelectedIds(new Set())
        onRefresh()
      } else {
        alert(`批量删除失败: ${data.error}`)
      }
    } catch (err: any) {
      alert(`批量删除失败: ${err.message}`)
    }
    setBatchDeleteTarget(null)
  }

  // 全选/取消全选
  function toggleSelectAll() {
    if (selectedIds.size === filteredDatasets.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredDatasets.map(ds => ds.id)))
    }
  }

  // 切换单选
  function toggleSelect(id: number, name: string) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // 批量删除按钮点击
  function handleBatchDelete() {
    const selectedNames = filteredDatasets
      .filter(ds => selectedIds.has(ds.id))
      .map(ds => ds.name)
    if (selectedNames.length === 0) {
      alert('请先选择要删除的数据集')
      return
    }
    setBatchDeleteTarget({ names: selectedNames })
  }

  // 批量导出数据集
  async function handleBatchExport() {
    const selectedNames = filteredDatasets
      .filter(ds => selectedIds.has(ds.id))
      .map(ds => ds.name)
    if (selectedNames.length === 0) {
      alert('请先选择要导出的数据集')
      return
    }
    try {
      await batchExportDatasets(selectedNames)
      setSelectedIds(new Set())
    } catch (err: any) {
      alert('导出失败: ' + err.message)
    }
  }

  // 下载数据集
  function downloadDataset(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    window.open(`/api/dataset/${encodeURIComponent(name)}/download`, '_blank')
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-4 space-y-2">
          <Skeleton height={32} width="200px" />
          <Skeleton height={16} width="150px" />
        </div>
        <SkeletonTable rows={8} columns={14} />
      </div>
    )
  }

  // 空状态
  if (datasets.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FolderIcon size={64} />}
          title="暂无数据集"
          description="上传数据集开始使用"
          action={{
            label: "上传数据集",
            onClick: onShowUpload,
            variant: "primary"
          }}
        />
      </div>
    )
  }

  return (
    <div>
      {/* 头部 */}
      <div className="page-header mb-4" style={{ paddingRight: "8px" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">数据集管理</h2>
            <p className="text-sm text-muted mt-1">
              共 {datasets.length} 个数据集 · {totalSamples.toLocaleString()} 个样本
            </p>
          </div>
          <button
            onClick={onShowUpload}
            className="btn btn-primary"
            style={{ marginLeft: "16px" }}
          >
            + 新建数据集
          </button>
        </div>
      </div>

        <div className="card p-4 mb-3">
          {/* 搜索栏 */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <input
              type="text"
              value={searchFilters.searchQuery}
              onChange={e => {
                const newFilters = { ...searchFilters, searchQuery: e.target.value }
                setSearchFilters(newFilters)
                setSearchQuery(e.target.value)
                persistFilters(newFilters)
              }}
              placeholder="搜索数据集名称..."
              style={{
                flex: 1,
                padding: "8px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: "6px",
                fontSize: "13px",
                outline: "none",
                transition: "border-color .2s"
              }}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>

          {/* 筛选按钮组 */}
          <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
            <span className="text-sm text-muted mr-1">算法:</span>
            {algoTypes.map(type => (
              <button
                key={type}
                onClick={() => {
                  const newFilters = { ...searchFilters, algoType: type }
                  setSearchFilters(newFilters)
                  setFilterType(type)
                  persistFilters(newFilters)
                }}
                className={`btn btn-sm ${searchFilters.algoType === type ? 'btn-primary' : 'btn-secondary'}`}
              >
                {type}
              </button>
            ))}
            <span className="text-sm text-muted ml-2 mr-1">技术:</span>
            {['目标检测算法', '实例分割算法'].map(tech => (
              <button
                key={tech}
                onClick={() => {
                  const newFilters = { ...searchFilters, techMethod: tech }
                  setSearchFilters(newFilters)
                  persistFilters(newFilters)
                }}
                className={`btn btn-sm ${searchFilters.techMethod === tech ? 'btn-primary' : 'btn-secondary'}`}
              >
                {tech}
              </button>
            ))}
            <span className="text-sm text-muted ml-2 mr-1">来源:</span>
            {sources.slice(0, 5).map(src => (
              <button
                key={src}
                onClick={() => {
                  const newFilters = { ...searchFilters, source: src }
                  setSearchFilters(newFilters)
                  persistFilters(newFilters)
                }}
                className={`btn btn-sm ${searchFilters.source === src ? 'btn-primary' : 'btn-secondary'}`}
              >
                {src}
              </button>
            ))}

            <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
              {/* 高级筛选按钮 */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`btn btn-sm ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                高级 {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
              {/* 重置按钮 */}
              {(searchFilters.dateRange.start || searchFilters.dateRange.end || searchFilters.sampleRange.min || searchFilters.sampleRange.max) && (
                <button
                  onClick={() => {
                    const newFilters = { ...searchFilters, hasTest: '全部', dateRange: { start: '', end: '' }, sampleRange: { min: '', max: '' } }
                    setSearchFilters(newFilters)
                    persistFilters(newFilters)
                  }}
                  className="btn btn-sm btn-secondary"
                >
                  重置
                </button>
              )}
            </div>
          </div>

          {/* 高级筛选面板 */}
          {showAdvancedFilters && (
            <div style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              gap: "24px",
              flexWrap: "wrap"
            }}>
              {/* 是否有测试集 */}
              <div>
                <div style={{ fontSize: "11px", color: C.gray3, marginBottom: "4px", fontWeight: 500 }}>是否有测试集</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      const newFilters = { ...searchFilters, hasTest: '全部' }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    className={`btn btn-sm ${searchFilters.hasTest === '全部' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => {
                      const newFilters = { ...searchFilters, hasTest: '有测试集' }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    className={`btn btn-sm ${searchFilters.hasTest === '有测试集' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    有测试集
                  </button>
                  <button
                    onClick={() => {
                      const newFilters = { ...searchFilters, hasTest: '无测试集' }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    className={`btn btn-sm ${searchFilters.hasTest === '无测试集' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    无测试集
                  </button>
                </div>
              </div>

              {/* 日期范围 */}
              <div>
                <div style={{ fontSize: "11px", color: C.gray3, marginBottom: "4px", fontWeight: 500 }}>维护日期范围</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="date"
                    value={searchFilters.dateRange.start}
                    onChange={e => {
                      const newFilters = { ...searchFilters, dateRange: { ...searchFilters.dateRange, start: e.target.value } }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    style={{
                      padding: "4px 8px",
                      border: `1px solid ${C.border}`,
                      borderRadius: "4px",
                      fontSize: "12px",
                      outline: "none"
                    }}
                  />
                  <span style={{ color: C.gray3 }}>至</span>
                  <input
                    type="date"
                    value={searchFilters.dateRange.end}
                    onChange={e => {
                      const newFilters = { ...searchFilters, dateRange: { ...searchFilters.dateRange, end: e.target.value } }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    style={{
                      padding: "4px 8px",
                      border: `1px solid ${C.border}`,
                      borderRadius: "4px",
                      fontSize: "12px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* 样本数量范围 */}
              <div>
                <div style={{ fontSize: "11px", color: C.gray3, marginBottom: "4px", fontWeight: 500 }}>样本数量范围</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="number"
                    value={searchFilters.sampleRange.min}
                    onChange={e => {
                      const newFilters = { ...searchFilters, sampleRange: { ...searchFilters.sampleRange, min: e.target.value } }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    placeholder="最少"
                    style={{
                      width: "80px",
                      padding: "4px 8px",
                      border: `1px solid ${C.border}`,
                      borderRadius: "4px",
                      fontSize: "12px",
                      outline: "none"
                    }}
                  />
                  <span style={{ color: C.gray3 }}>至</span>
                  <input
                    type="number"
                    value={searchFilters.sampleRange.max}
                    onChange={e => {
                      const newFilters = { ...searchFilters, sampleRange: { ...searchFilters.sampleRange, max: e.target.value } }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    placeholder="最多"
                    style={{
                      width: "80px",
                      padding: "4px 8px",
                      border: `1px solid ${C.border}`,
                      borderRadius: "4px",
                      fontSize: "12px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

      <div className="text-sm text-muted mb-3">
        {selectedIds.size > 0 && (
          <span style={{ marginRight: '12px', color: C.primary }}>
            已选 {selectedIds.size} 项
          </span>
        )}
        显示 {filteredDatasets.length} 条
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="card p-3 mb-3 batch-action-card">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-accent">
              已选择 {selectedIds.size} 个数据集
            </span>
            <button
              onClick={handleBatchDelete}
              className="btn btn-danger btn-sm"
            >
              批量删除
            </button>
            <button
              onClick={handleBatchExport}
              className="btn btn-primary btn-sm"
            >
              批量导出
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn btn-secondary btn-sm"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* 数据表格 */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="table min-w-1200">
            <thead>
              <tr className="table-tr-header">
                <th style={th("36px", true)}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredDatasets.length && filteredDatasets.length > 0}
                    onChange={toggleSelectAll}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                </th>
                <th style={th("48px", true)}>编号</th>
                <th style={th("100px", true)}>算法类型</th>
                <th style={th("110px", true)}>技术方法</th>
                <th style={th("210px")}>数据集名称</th>
                <th style={th("70px", true)}>分配比例</th>
                <th style={th("72px", true)}>样本数量</th>
                <th style={th("84px", true)}>详情图</th>
                <th style={th("84px", true)}>分布图</th>
                <th style={th("64px", true)}>标签数</th>
                <th style={th("145px")}>类别统计</th>
                <th style={th("100px", true)}>数据来源</th>
                <th style={th("86px", true)}>维护日期</th>
                <th style={th("72px", true)}>维护人员</th>
                <th style={th("110px", true)}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedDatasets.map((ds, idx) => {
                const isSelected = selectedIds.has(ds.id)
                const isDragging = draggedIdx === idx
                const isDragOver = dragOverIdx === idx
                return (
                <tr
                  key={ds.id}
                  draggable
                  onDragStart={e => handleDragStart(e, idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectDataset(ds)}
                  onMouseEnter={e => { e.currentTarget.style.background = isSelected ? C.primaryBg : C.primaryBg }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSelected ? C.primaryBg : (idx % 2 === 0 ? C.white : "#FAFCFE") }}
                  className={`cursor-pointer ${isSelected ? 'bg-primary' : (idx % 2 === 0 ? 'bg-white' : '')}`}
                  style={{
                    cursor: "pointer",
                    background: isDragOver ? C.primaryBg : isSelected ? C.primaryBg : (idx % 2 === 0 ? C.white : "#FAFCFE"),
                    transition: "background .1s",
                    opacity: isDragging ? 0.5 : 1,
                    borderTop: isDragOver && draggedIdx !== null && draggedIdx < idx ? `2px solid ${C.primary}` : undefined,
                    borderBottom: isDragOver && draggedIdx !== null && draggedIdx > idx ? `2px solid ${C.primary}` : undefined,
                  }}
                >
                  <td style={td("36px", true)} onClick={e => { e.stopPropagation(); toggleSelect(ds.id, ds.name) }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(ds.id, ds.name)}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                  </td>
                  <td style={td("48px", true)}>
                    <span style={{ fontWeight: 600, color: C.gray4 }}>{ds.id}</span>
                  </td>
                  <td style={td("100px", true)}>
                    <MemoizedAlgoTag type={ds.algoType} />
                  </td>
                  <td style={td("110px", true)}>
                    <MemoizedTechMethodTag type={ds.techMethod || "目标检测算法"} />
                  </td>
                  <td style={td("210px")}>
                    <div style={{
                      color: C.primary,
                      fontWeight: 500,
                      fontSize: "12px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const,
                      maxWidth: "200px"
                    }}
                      title={ds.name}
                    >
                      {ds.name}
                    </div>
                  </td>
                  <td style={td("70px", true)}>
                    <span style={{
                      background: C.primaryBg,
                      color: C.primary,
                      border: `1px solid ${C.primaryBd}`,
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "11px",
                      fontWeight: 600
                    }}>
                      {ds.split}
                    </span>
                  </td>
                  <td style={td("72px", true)}>
                    <span style={{ fontWeight: 700, color: C.gray1, fontSize: "13px" }}>
                      {(ds.total || 0).toLocaleString()}
                    </span>
                  </td>
                  <td style={td("84px", true)}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <DetailChart datasetName={ds.name} size={50} />
                    </div>
                  </td>
                  <td style={td("84px", true)}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <DistChart datasetName={ds.name} size={50} />
                    </div>
                  </td>
                  <td style={td("64px", true)}>
                    <span style={{
                      background: C.primaryBg,
                      color: C.primary,
                      border: `1px solid ${C.primaryBd}`,
                      borderRadius: "12px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 600
                    }}>
                      {Object.keys(ds.classInfo || {}).length}
                    </span>
                  </td>
                  <td style={td("145px")}>
                    {Object.keys(ds.classInfo || {}).length > 0 ? (
                      <div style={{ fontSize: "11px", color: C.gray2, lineHeight: 1.7 }}>
                        {Object.entries(ds.classInfo).map(([k, v]) => {
                          const itemCount = typeof v === "number" ? v : (v && v.count ? v.count : 0)
                          const itemName = typeof v === "number" ? `类${k}` : (v && v.name ? v.name : `类${k}`)
                          return (
                            <div key={k}>
                              <span style={{ color: C.primary, fontWeight: 600 }}>{itemName}: </span>
                              <span style={{ fontWeight: 600 }}>{itemCount.toLocaleString()}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: "11px", color: C.gray3, padding: "5px" }}>—</div>
                    )}
                  </td>
                  <td style={td("100px", true)}>
                    <MemoizedSiteTag site={ds.source} />
                  </td>
                  <td style={td("86px", true)}>
                    <span style={{ fontSize: "11px", color: C.gray3 }}>{ds.maintainDate}</span>
                  </td>
                  <td style={td("72px", true)}>
                    <span style={{ fontSize: "11px", color: C.gray2, fontWeight: 500 }}>{ds.maintainer}</span>
                  </td>
                  <td style={{ ...td("110px", true), textAlign: 'right' }}>
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={(e) => downloadDataset(ds.name, e)}
                        title="下载数据集"
                        className="btn btn-sm btn-primary"
                      >
                        下载
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ name: ds.name }); }}
                        title="删除数据集"
                        className="btn btn-sm btn-danger"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="确认删除数据集"
        message={`确定要删除数据集 "${deleteTarget?.name}" 吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />

      {/* 批量删除确认弹窗 */}
      <ConfirmDialog
        isOpen={!!batchDeleteTarget}
        onClose={() => setBatchDeleteTarget(null)}
        onConfirm={confirmBatchDelete}
        title="确认批量删除数据集"
        message={`确定要删除选中的 ${batchDeleteTarget?.names.length || 0} 个数据集吗？此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        type="danger"
      />
    </div>
  )
}

export default DatasetList
