import React, { useState, useMemo } from 'react'
import { C, ALGO_COLORS, SITE_COLORS, TECH_METHOD_COLORS } from '../constants'
import ConfirmDialog from './ConfirmDialog'

// 基础标签组件
const MemoizedTag = React.memo(({ label, colors }) => {
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
      whiteSpace: "nowrap"
    }}>
      {label}
    </span>
  )
})

const MemoizedAlgoTag = React.memo(({ type }) => (
  <MemoizedTag label={type} colors={ALGO_COLORS[type] || ALGO_COLORS["其他"]} />
))

const MemoizedTechMethodTag = React.memo(({ type }) => (
  <MemoizedTag label={type} colors={TECH_METHOD_COLORS[type] || TECH_METHOD_COLORS["目标检测算法"]} />
))

const MemoizedSiteTag = React.memo(({ site }) => (
  <MemoizedTag label={site || "-"} colors={SITE_COLORS[site] || SITE_COLORS["其他"]} />
))

// 表格样式辅助函数
const th = (w, c = false) => ({
  padding: "10px 12px",
  fontSize: "12px",
  fontWeight: 600,
  color: C.gray1,
  textAlign: c ? "center" : "left",
  width: w,
  whiteSpace: "nowrap"
})

const td = (w, c = false) => ({
  padding: "9px 12px",
  fontSize: "12px",
  color: C.gray2,
  borderBottom: `1px solid ${C.gray6}`,
  textAlign: c ? "center" : "left",
  width: w,
  verticalAlign: "middle"
})

// 详情图组件
const DetailChart = React.memo(({ datasetName, size = 50 }) => {
  const [chartUrl, setChartUrl] = useState(null)
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
      style={{ width: size, height: size, objectFit: "cover", borderRadius: "3px", cursor: "pointer" }}
      loading="lazy"
    />
  )
})

// 分布图组件
const DistChart = React.memo(({ datasetName, size = 50 }) => {
  const [chartUrl, setChartUrl] = useState(null)
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
      style={{ width: size, height: size, objectFit: "cover", borderRadius: "3px", cursor: "pointer" }}
      loading="lazy"
    />
  )
})

// 数据集列表组件
function DatasetList({ datasets, onSelectDataset, onRefresh, onShowUpload }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('全部')
  const [deleteTarget, setDeleteTarget] = useState(null)

  // 获取所有算法类型
  const algoTypes = useMemo(() => {
    const types = new Set(datasets.map(ds => ds.algoType))
    return ['全部', ...Array.from(types)]
  }, [datasets])

  // 过滤数据集
  const filteredDatasets = useMemo(() => {
    return datasets.filter(ds => {
      const matchSearch = ds.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchType = filterType === '全部' || ds.algoType === filterType
      return matchSearch && matchType
    })
  }, [datasets, searchQuery, filterType])

  // 计算总样本数
  const totalSamples = useMemo(() => {
    return datasets.reduce((sum, ds) => sum + (ds.total || 0), 0)
  }, [datasets])

  // 删除数据集
  async function deleteDataset(name, e) {
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
    } catch (err) {
      alert(`删除失败: ${err.message}`)
    }
    setDeleteTarget(null)
  }

  // 下载数据集
  async function downloadDataset(name, e) {
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

      {/* 搜索和筛选 */}
      <div style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: "10px",
        padding: "14px 18px",
        marginBottom: "14px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap"
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索数据集名称..."
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "13px",
            color: C.gray1,
            background: C.gray7,
            width: "220px",
            outline: "none"
          }}
        />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {algoTypes.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                background: filterType === t ? C.primary : "none",
                border: `1px solid ${filterType === t ? C.primary : C.border}`,
                borderRadius: "20px",
                padding: "3px 12px",
                fontSize: "12px",
                cursor: "pointer",
                color: filterType === t ? "white" : C.gray3,
                transition: "all .15s"
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: "12px", color: C.gray4 }}>
          显示 {filteredDatasets.length} 条
        </span>
      </div>

      {/* 数据表格 */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1180px" }}>
            <thead>
              <tr style={{ background: C.gray7, borderBottom: `2px solid ${C.border}` }}>
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
              {filteredDatasets.map((ds, idx) => (
                <tr
                  key={ds.id}
                  onClick={() => onSelectDataset(ds)}
                  onMouseEnter={e => { e.currentTarget.style.background = C.primaryBg }}
                  onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? C.white : "#FAFCFE" }}
                  style={{
                    cursor: "pointer",
                    background: idx % 2 === 0 ? C.white : "#FAFCFE",
                    transition: "background .1s"
                  }}
                >
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
                      whiteSpace: "nowrap",
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
                      {ds.total.toLocaleString()}
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
              ))}
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
    </div>
  )
}

export default DatasetList
