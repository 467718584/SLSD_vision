import React, { useState, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { C, ALGO_COLORS, SITE_COLORS, TECH_METHOD_COLORS, MODEL_CAT_COLORS } from '../constants'
import { batchExportModels } from '../api'
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
  split: string
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
interface Model {
  id: number
  name: string
  algoName?: string
  techMethod?: string
  category?: string
  accuracy?: number
  site?: string
  dataset?: string
  maintainer?: string
  maintainDate?: string
  description?: string
}

interface Dataset {
  name: string
}

interface ModelListProps {
  models: Model[]
  datasets: Dataset[]
  onSelectModel: (m: Model) => void
  onRefresh: () => void
  onShowUpload: () => void
  isLoading?: boolean
}

// 基础标签组件
const MemoizedTag = React.memo(({ label, colors }: { label: string; colors: { bg?: string; border?: string; text?: string } }) => {
  const c = colors || { bg: C.gray6, border: C.border, text: C.gray2 }
  return (
    <span className="inline-block text-xs font-medium whitespace-nowrap model-tag"
      style={{
        padding: "2px 8px",
        borderRadius: "4px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text
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

const MemoizedModelCatTag = React.memo(({ cat }: { cat?: string }) => (
  <MemoizedTag label={cat || "-"} colors={MODEL_CAT_COLORS[cat || ""]} />
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
  minWidth: w,
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
  minWidth: w,
  verticalAlign: "middle" as const
})

// 精度进度条组件
const AccuracyBar = React.memo(({ value, width = 60 }: { value?: number; width?: number }) => {
  const color = (value || 0) >= 95 ? C.success : (value || 0) >= 85 ? C.primary : C.warning
  return (
    <div className="flex items-center gap-2">
      <div style={{ width, height: "6px", background: C.gray6, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${value || 0}%`, height: "100%", background: color, borderRadius: "3px" }} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 700, color, minWidth: "46px" }}>{value}%</span>
    </div>
  )
})

// 模型列表组件
function ModelList({ models, datasets, onSelectModel, onRefresh, onShowUpload, isLoading }: ModelListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('全部')
  const [deleteTarget, setDeleteTarget] = useState<{ name: string } | null>(null)
  const queryClient = useQueryClient()
  // 批量选择状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchDeleteTarget, setBatchDeleteTarget] = useState<{ names: string[] } | null>(null)

  // 高级搜索条件
  const [searchFilters, setSearchFilters] = useState<ModelSearchFilters>({
    searchQuery: '',
    algoName: '全部',
    techMethod: '目标检测算法',
    site: '全部',
    category: '全部',
    dateRange: { start: '', end: '' },
    accuracyRange: { min: '', max: '' }
  })

  // 高级筛选面板显示状态
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // 计算活跃筛选条件数量
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchFilters.dateRange.start) count++
    if (searchFilters.dateRange.end) count++
    if (searchFilters.accuracyRange.min) count++
    if (searchFilters.accuracyRange.max) count++
    return count
  }, [searchFilters.dateRange, searchFilters.accuracyRange])

  // 初始化从localStorage加载保存的搜索条件
  useEffect(() => {
    try {
      const saved = localStorage.getItem('model_search_filters')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSearchFilters(prev => ({ ...prev, ...parsed }))
        setSearchQuery(parsed.searchQuery || '')
        setFilterType(parsed.algoName || '全部')
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // 保存搜索条件到localStorage
  const persistFilters = (filters: ModelSearchFilters) => {
    try {
      localStorage.setItem('model_search_filters', JSON.stringify(filters))
    } catch (e) {
      // ignore
    }
  }

  // 获取所有算法类型
  const modelAlgos = useMemo(() => {
    const algos = new Set(models.map(m => m.algoName))
    return ['全部', ...Array.from(algos)]
  }, [models])

  // 获取所有应用现场
  const sites = useMemo(() => {
    const s = new Set(models.map(m => m.site).filter(Boolean))
    return ['全部', ...Array.from(s)]
  }, [models])

  // 获取所有模型类别
  const categories = useMemo(() => {
    const c = new Set(models.map(m => m.category).filter(Boolean))
    return ['全部', ...Array.from(c)]
  }, [models])

  // 过滤模型
  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchFilters.searchQuery.toLowerCase())
      const matchType = searchFilters.algoName === '全部' || m.algoName === searchFilters.algoName
      const matchTech = searchFilters.techMethod === '全部' || searchFilters.techMethod === '目标检测算法' || m.techMethod === searchFilters.techMethod
      const matchSite = searchFilters.site === '全部' || m.site === searchFilters.site
      const matchCat = searchFilters.category === '全部' || m.category === searchFilters.category
      
      // 日期范围
      let matchDate = true
      if (searchFilters.dateRange.start || searchFilters.dateRange.end) {
        const mDate = m.maintainDate || ''
        if (searchFilters.dateRange.start && mDate < searchFilters.dateRange.start) matchDate = false
        if (searchFilters.dateRange.end && mDate > searchFilters.dateRange.end) matchDate = false
      }
      
      // 精度范围
      let matchAccuracy = true
      const accuracy = m.accuracy || 0
      if (searchFilters.accuracyRange.min && accuracy < parseFloat(searchFilters.accuracyRange.min)) matchAccuracy = false
      if (searchFilters.accuracyRange.max && accuracy > parseFloat(searchFilters.accuracyRange.max)) matchAccuracy = false
      
      return matchSearch && matchType && matchTech && matchSite && matchCat && matchDate && matchAccuracy
    })
  }, [models, searchFilters])

  // 拖拽排序状态
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  // 拖拽排序后的模型
  const sortedModels = useMemo(() => {
    const orderKey = 'model_order'
    try {
      const saved = localStorage.getItem(orderKey)
      if (saved) {
        const orderMap = JSON.parse(saved) as Record<number, number>
        return [...filteredModels].sort((a, b) => {
          const orderA = orderMap[a.id] ?? filteredModels.indexOf(a)
          const orderB = orderMap[b.id] ?? filteredModels.indexOf(b)
          return orderA - orderB
        })
      }
    } catch (e) {
      // ignore
    }
    return filteredModels
  }, [filteredModels])

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
    const orderKey = 'model_order'
    try {
      const newOrder: Record<number, number> = {}
      sortedModels.forEach((m, i) => {
        if (i === draggedIdx) {
          newOrder[m.id] = targetIdx
        } else if (i === targetIdx) {
          newOrder[m.id] = draggedIdx
        } else {
          newOrder[m.id] = i
        }
      })
      localStorage.setItem(orderKey, JSON.stringify(newOrder))
    } catch (err) {
      // ignore
    }
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  function handleDragEnd() {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  // 删除模型
  function deleteModel(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDeleteTarget({ name })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/model/${encodeURIComponent(deleteTarget.name)}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.models })
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
      const res = await fetch('/api/model/batch-delete', {
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
          alert(`批量删除成功: ${results.success.length}个模型已删除`)
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
    if (selectedIds.size === filteredModels.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredModels.map(m => m.id)))
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
    const selectedNames = filteredModels
      .filter(m => selectedIds.has(m.id))
      .map(m => m.name)
    if (selectedNames.length === 0) {
      alert('请先选择要删除的模型')
      return
    }
    setBatchDeleteTarget({ names: selectedNames })
  }

  // 批量导出
  async function handleBatchExport() {
    const selectedNames = filteredModels
      .filter(m => selectedIds.has(m.id))
      .map(m => m.name)
    if (selectedNames.length === 0) {
      alert('请先选择要导出的模型')
      return
    }
    if (selectedNames.length > 10) {
      alert('最多只能导出10个模型')
      return
    }
    try {
      await batchExportModels(selectedNames)
    } catch (err: any) {
      alert(`导出失败: ${err.message}`)
    }
  }

  // 下载模型
  function downloadModel(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    window.open(`/api/model/${encodeURIComponent(name)}/download`, '_blank')
  }

  // 跳转到数据集
  function gotoDataset(datasetName?: string) {
    if (!datasetName) return
    const ds = datasets.find(d => d.name === datasetName)
    if (ds) {
      onSelectModel(null)
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-4 space-y-2">
          <Skeleton height={32} width="180px" />
          <Skeleton height={16} width="120px" />
        </div>
        <SkeletonTable rows={8} columns={13} />
      </div>
    )
  }

  // 空状态
  if (models.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FolderIcon size={64} />}
          title="暂无模型"
          description="上传模型开始使用"
          action={{
            label: "上传模型",
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
          <h2 className="page-title">算法模型管理</h2>
          <p className="text-sm text-muted mt-1">
            共 {models.length} 个模型
          </p>
        </div>
        <button
          onClick={onShowUpload}
          className="btn btn-primary"
          style={{ marginLeft: "16px" }}
        >
          + 新建模型
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
              placeholder="搜索模型名称..."
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted mr-1">算法:</span>
            {modelAlgos.slice(0, 6).map(algo => (
              <button
                key={algo}
                onClick={() => {
                  const newFilters = { ...searchFilters, algoName: algo }
                  setSearchFilters(newFilters)
                  setFilterType(algo)
                  persistFilters(newFilters)
                }}
                className={`btn btn-sm ${searchFilters.algoName === algo ? 'btn-primary' : 'btn-secondary'}`}
              >
                {algo}
              </button>
            ))}
            <span className="text-sm text-muted mr-1">技术:</span>
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
            <span className="text-sm text-muted mr-1">现场:</span>
            {sites.slice(0, 5).map(site => (
              <button
                key={site}
                onClick={() => {
                  const newFilters = { ...searchFilters, site: site }
                  setSearchFilters(newFilters)
                  persistFilters(newFilters)
                }}
                className={`btn btn-sm ${searchFilters.site === site ? 'btn-primary' : 'btn-secondary'}`}
              >
                {site}
              </button>
            ))}
            <span className="text-sm text-muted mr-1">类别:</span>
            {categories.slice(0, 5).map(cat => (
              <button
                key={cat}
                onClick={() => {
                  const newFilters = { ...searchFilters, category: cat }
                  setSearchFilters(newFilters)
                  persistFilters(newFilters)
                }}
                className={`btn btn-sm ${searchFilters.category === cat ? 'btn-primary' : 'btn-secondary'}`}
              >
                {cat}
              </button>
            ))}
            <div className="ml-auto flex gap-2 items-center">
              {/* 高级筛选按钮 */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`btn btn-sm ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontWeight: showAdvancedFilters ? 600 : 400, gap: "4px" }}
              >
                高级 {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
              {/* 重置按钮 */}
              {(searchFilters.dateRange.start || searchFilters.dateRange.end || searchFilters.accuracyRange.min || searchFilters.accuracyRange.max) && (
                <button
                  onClick={() => {
                    const newFilters = { ...searchFilters, dateRange: { start: '', end: '' }, accuracyRange: { min: '', max: '' } }
                    setSearchFilters(newFilters)
                    persistFilters(newFilters)
                  }}
                  className="btn btn-sm btn-secondary border-default"
                >
                  重置
                </button>
              )}
            </div>
          </div>

          {/* 高级筛选面板 */}
          {showAdvancedFilters && (
            <div className="flex gap-6 flex-wrap mt-3 pt-3 border-top-default">
              {/* 日期范围 */}
              <div className="form-group">
                <div className="form-label">维护日期范围</div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={searchFilters.dateRange.start}
                    onChange={e => {
                      const newFilters = { ...searchFilters, dateRange: { ...searchFilters.dateRange, start: e.target.value } }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    className="input w-140"
                  />
                  <span className="text-muted">至</span>
                  <input
                    type="date"
                    value={searchFilters.dateRange.end}
                    onChange={e => {
                      const newFilters = { ...searchFilters, dateRange: { ...searchFilters.dateRange, end: e.target.value } }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    className="input w-140"
                  />
                </div>
              </div>

              {/* 精度范围 */}
              <div className="form-group">
                <div className="form-label">模型精度范围 (%)</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={searchFilters.accuracyRange.min}
                    onChange={e => {
                      const newFilters = { ...searchFilters, accuracyRange: { ...searchFilters.accuracyRange, min: e.target.value } }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    placeholder="最低"
                    min="0"
                    max="100"
                    className="input w-70"
                  />
                  <span className="text-muted">至</span>
                  <input
                    type="number"
                    value={searchFilters.accuracyRange.max}
                    onChange={e => {
                      const newFilters = { ...searchFilters, accuracyRange: { ...searchFilters.accuracyRange, max: e.target.value } }
                      setSearchFilters(newFilters)
                      persistFilters(newFilters)
                    }}
                    placeholder="最高"
                    min="0"
                    max="100"
                    className="input w-70"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

      <div className="text-sm text-muted mb-3">
        {selectedIds.size > 0 && (
          <span className="text-accent mr-3">
            已选 {selectedIds.size} 项
          </span>
        )}
        显示 {filteredModels.length} 条
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="card p-3 mb-3 batch-action-card">
          <div className="flex items-center gap-3">
            <span className="text-accent font-medium">
              已选择 {selectedIds.size} 个模型
            </span>
            <button onClick={handleBatchExport} className="btn btn-primary btn-sm">
              批量导出
            </button>
            <button onClick={handleBatchDelete} className="btn btn-danger btn-sm">
              批量删除
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="btn btn-secondary btn-sm">
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* 模型表格 */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="table min-w-1200">
            <thead>
              <tr className="table-tr-header">
                <th style={th("36px", true)}>                  <input type="checkbox" checked={selectedIds.size === filteredModels.length && filteredModels.length > 0} onChange={toggleSelectAll} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                </th>
                <th style={th("48px", true)}>编号</th>
                <th style={th("90px", true)}>算法类型</th>
                <th style={th("100px", true)}>技术方法</th>
                <th style={th("150px")}>模型名称</th>
                <th style={th("80px")}>类别</th>
                <th style={th("100px")}>模型概述</th>
                <th style={th("70px", true)}>曲线</th>
                <th style={th("80px", true)}>精度</th>
                <th style={th("90px", true)}>应用现场</th>
                <th style={th("120px")}>使用数据集</th>
                <th style={th("80px", true)}>维护日期</th>
                <th style={th("70px", true)}>维护人</th>
                <th style={th("90px", true)}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedModels.map((m, idx) => {
                const isSelected = selectedIds.has(m.id)
                const isDragging = draggedIdx === idx
                const isDragOver = dragOverIdx === idx
                const accuracyColor = (m.accuracy || 0) >= 95 ? C.success : (m.accuracy || 0) >= 85 ? C.primary : C.warning
                return (
                  <tr
                    key={m.id}
                    draggable
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectModel(m)}
                    onMouseEnter={e => { e.currentTarget.style.background = isSelected ? C.primaryBg : C.primaryBg }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? C.primaryBg : (idx % 2 === 0 ? C.white : "#FAFCFE") }}
                    className={`cursor-pointer ${isSelected ? 'bg-primary' : (idx % 2 === 0 ? 'bg-white' : '')}`}
                    style={{
                      opacity: isDragging ? 0.5 : 1,
                      background: isDragOver ? C.primaryBg : isSelected ? C.primaryBg : (idx % 2 === 0 ? C.white : "#FAFCFE"),
                      borderTop: isDragOver && draggedIdx !== null && draggedIdx < idx ? `2px solid ${C.primary}` : undefined,
                      borderBottom: isDragOver && draggedIdx !== null && draggedIdx > idx ? `2px solid ${C.primary}` : undefined,
                    }}
                  >
                    <td style={td("36px", true)} className="td-base td-c" onClick={e => { e.stopPropagation(); toggleSelect(m.id, m.name) }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(m.id, m.name)} className="cursor-pointer" style={{ width: "16px", height: "16px" }} />
                    </td>
                    <td style={td("48px", true)} className="td-base td-c">
                      <span className="font-semibold text-gray-4">{m.id}</span>
                    </td>
                    <td style={td("90px", true)} className="td-base td-c">
                      <MemoizedAlgoTag type={m.algoName} />
                    </td>
                    <td style={td("100px", true)} className="td-base td-c">
                      <MemoizedTechMethodTag type={m.techMethod || "目标检测算法"} />
                    </td>
                    <td style={td("150px")} className="td-base td-l">
                      <div className="truncate model-name" title={m.name}>
                        {m.name}
                      </div>
                    </td>
                    <td style={td("80px")} className="td-base td-l">
                      <MemoizedModelCatTag cat={m.category} />
                    </td>
                    <td style={td("100px")} className="td-base td-l">
                      <div className="truncate-2 model-desc">
                        {m.description || "-"}
                      </div>
                    </td>
                    <td style={td("70px", true)} className="td-base td-c">
                      <div className="flex gap-1 flex-wrap justify-center" style={{ maxWidth: "70px" }} onClick={e => { e.stopPropagation(); onSelectModel(m) }} title="点击查看精度曲线">
                        <img
                          src={`/data/models/${encodeURIComponent(m.name)}/curves/map50_curve.png?thumb=1`}
                          alt="mAP50"
                          className="accuracy-thumb"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                          loading="lazy"
                        />
                        <img
                          src={`/data/models/${encodeURIComponent(m.name)}/curves/map50_95_curve.png?thumb=1`}
                          alt="mAP50-95"
                          className="accuracy-thumb"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                          loading="lazy"
                        />
                        <img
                          src={`/data/models/${encodeURIComponent(m.name)}/curves/train_box_loss_curve.png?thumb=1`}
                          alt="train_loss"
                          className="accuracy-thumb"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                          loading="lazy"
                        />
                        <img
                          src={`/data/models/${encodeURIComponent(m.name)}/curves/val_box_loss_curve.png?thumb=1`}
                          alt="val_loss"
                          className="accuracy-thumb"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td style={td("80px", true)} className="td-base td-c">
                      <AccuracyBar value={m.accuracy} width={50} />
                    </td>
                    <td style={td("90px", true)} className="td-base td-c">
                      <MemoizedSiteTag site={m.site} />
                    </td>
                    <td style={td("120px")} className="td-base td-l">
                      <span className="truncate text-accent text-sm dataset-link"
                        onClick={e => { e.stopPropagation(); gotoDataset(m.dataset) }} title={m.dataset}>
                        {m.dataset || "-"}
                      </span>
                    </td>
                    <td style={td("90px", true)} className="td-base td-c">
                      <span className="text-sm text-muted">{m.maintainDate}</span>
                    </td>
                    <td style={td("80px", true)} className="td-base td-c">
                      <span className="text-sm font-medium text-gray-2">{m.maintainer}</span>
                    </td>
                    <td style={td("90px", true)} className="td-base td-c">
                      <div className="flex gap-1 justify-end">
                        <button onClick={(e) => downloadModel(m.name, e)} title="下载模型" className="btn btn-primary btn-sm">下载</button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ name: m.name }); }} title="删除模型" className="btn btn-danger btn-sm">删除</button>
                      </div>
                    </td>
                  </tr>
                )}
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="确认删除模型"
        message={`确定要删除模型 "${deleteTarget?.name}" 吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />

      {/* 批量删除确认弹窗 */}
      <ConfirmDialog
        isOpen={!!batchDeleteTarget}
        onClose={() => setBatchDeleteTarget(null)}
        onConfirm={confirmBatchDelete}
        title="确认批量删除模型"
        message={`确定要删除选中的 ${batchDeleteTarget?.names.length || 0} 个模型吗？此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        type="danger"
      />
    </div>
  )
}

export default ModelList
