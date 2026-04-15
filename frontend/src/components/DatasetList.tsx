import React, { useState, useMemo } from 'react'
import { C, ALGO_COLORS, SITE_COLORS, TECH_METHOD_COLORS } from '../constants'
import ConfirmDialog from './ConfirmDialog'

// 类型定义
interface Dataset {
  id: number
  name: string
  algoType?: string
  techMethod?: string
  total?: number
  split?: string
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
          setChartUrl(`/data/${data.detail.replace("SLSD_vision/data/", "")}`)
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
          setChartUrl(`/data/${data.distribution.replace("SLSD_vision/data/", "")}`)
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
function DatasetList({ datasets, onSelectDataset, onRefresh, onShowUpload }: DatasetListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('全部')
  const [deleteTarget, setDeleteTarget] = useState<{ name: string } | null>(null)
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
    split: '全部'
  })

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

  // 获取所有分配比例
  const splits = useMemo(() => {
    const sp = new Set(datasets.map(ds => ds.split).filter(Boolean))
    return ['全部', ...Array.from(sp)]
  }, [datasets])

  // 过滤数据集
  const filteredDatasets = useMemo(() => {
    return datasets.filter(ds => {
      const matchSearch = ds.name.toLowerCase().includes(searchFilters.searchQuery.toLowerCase())
      const matchType = searchFilters.algoType === '全部' || ds.algoType === searchFilters.algoType
      const matchTech = searchFilters.techMethod === '全部' || searchFilters.techMethod === '目标检测算法' || ds.techMethod === searchFilters.techMethod
      const matchSource = searchFilters.source === '全部' || ds.source === searchFilters.source
      const matchSplit = searchFilters.split === '全部' || ds.split === searchFilters.split
      
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
      
      return matchSearch && matchType && matchTech && matchSource && matchSplit && matchDate && matchSample
    })
  }, [datasets, searchFilters])

  // 计算总样本数
  const totalSamples = useMemo(() => {
    return datasets.reduce((sum, ds) => sum + (ds.total || 0), 0)
  }, [datasets])

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
        onRefresh()
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

  // 下载数据集
  function downloadDataset(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    window.open(`/api/dataset/${encodeURIComponent(name)}/download`, '_blank')
  }

  return (
    <div>
      {/* 头部 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: C.gray1 }}>数据集管理</h2>
          <p style={{ fontSize: "13px", color: C.gray3, marginTop: "2px" }}>
            共 {datasets.length} 个数据集 · {totalSamples.toLocaleString()} 个样本
          </p>
        </div>
        <button
          onClick={onShowUpload}
          style={{
            background: C.primary,
            color: "white",
            border: "none",
            borderRadius: "7px",
            padding: "8px 18px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500
          }}
        >
          + 新建数据集
        </button>
      </div>

      {/* 搜索和筛选 - 使用高级搜索面板 */}
      <AdvancedSearchPanel
        type="dataset"
        filters={searchFilters}
        onFiltersChange={(filters) => {
          const f = filters as DatasetSearchFilters
          setSearchFilters(f)
          setSearchQuery(f.searchQuery)
          setFilterType(f.algoType)
          persistFilters(f)
        }}
        algoTypes={algoTypes}
        techMethods={['目标检测算法', '实例分割算法']}
        extraFilters={{ sources, splits }}
      />

      <span style={{ marginLeft: "0", marginBottom: "12px", display: "block", fontSize: "12px", color: C.gray4 }}>
        {selectedIds.size > 0 && (
          <span style={{ marginRight: '12px', color: C.primary }}>
            已选 {selectedIds.size} 项
          </span>
        )}
        显示 {filteredDatasets.length} 条
      </span>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div style={{
          background: C.primaryBg,
          border: `1px solid ${C.primaryBd}`,
          borderRadius: "8px",
          padding: "10px 16px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>
            已选择 {selectedIds.size} 个数据集
          </span>
          <button
            onClick={handleBatchDelete}
            style={{
              background: "#DC2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            批量删除
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "12px",
              cursor: "pointer",
              color: C.gray2
            }}
          >
            取消选择
          </button>
        </div>
      )}

      {/* 数据表格 */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1180px" }}>
            <thead>
              <tr style={{ background: C.gray7, borderBottom: `2px solid ${C.border}` }}>
                <th style={th("36px", true)}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredDatasets.length && filteredDatasets.length > 0}
                    onChange={toggleSelectAll}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                </th>
                <th style={th("48px", true)}>编号</th>
                <th style={th("110px", true)}>算法类型</th>
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
              {filteredDatasets.map((ds, idx) => {
                const isSelected = selectedIds.has(ds.id)
                return (
                <tr
                  key={ds.id}
                  onClick={() => onSelectDataset(ds)}
                  onMouseEnter={e => { e.currentTarget.style.background = isSelected ? C.primaryBg : C.primaryBg }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSelected ? C.primaryBg : (idx % 2 === 0 ? C.white : "#FAFCFE") }}
                  style={{
                    cursor: "pointer",
                    background: isSelected ? C.primaryBg : (idx % 2 === 0 ? C.white : "#FAFCFE"),
                    transition: "background .1s"
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
                  <td style={td("110px", true)}>
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
                  <td style={td("110px", true)}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={(e) => downloadDataset(ds.name, e)}
                        title="下载数据集"
                        style={{
                          background: C.primary,
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: 500
                        }}
                      >
                        下载
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ name: ds.name }); }}
                        title="删除数据集"
                        style={{
                          background: "#FEE2E2",
                          color: "#DC2626",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: 500
                        }}
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
