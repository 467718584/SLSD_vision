import React, { useState, useMemo } from 'react'
import { C, ALGO_COLORS, SITE_COLORS, TECH_METHOD_COLORS, MODEL_CAT_COLORS } from '../constants'
import ConfirmDialog from './ConfirmDialog'

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
}

// 基础标签组件
const MemoizedTag = React.memo(({ label, colors }: { label: string; colors: { bg?: string; border?: string; text?: string } }) => {
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

// 精度进度条组件
const AccuracyBar = React.memo(({ value, width = 60 }: { value?: number; width?: number }) => {
  const color = (value || 0) >= 95 ? C.success : (value || 0) >= 85 ? C.primary : C.warning
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width, height: "6px", background: C.gray6, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${value || 0}%`, height: "100%", background: color, borderRadius: "3px" }} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 700, color, minWidth: "46px" }}>{value}%</span>
    </div>
  )
})

// 模型列表组件
function ModelList({ models, datasets, onSelectModel, onRefresh, onShowUpload }: ModelListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('全部')
  const [deleteTarget, setDeleteTarget] = useState<{ name: string } | null>(null)
  // 批量选择状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchDeleteTarget, setBatchDeleteTarget] = useState<{ names: string[] } | null>(null)

  // 获取所有算法类型
  const modelAlgos = useMemo(() => {
    const algos = new Set(models.map(m => m.algoName))
    return ['全部', ...Array.from(algos)]
  }, [models])

  // 过滤模型
  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchType = filterType === '全部' || m.algoName === filterType
      return matchSearch && matchType
    })
  }, [models, searchQuery, filterType])

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

  return (
    <div>
      {/* 头部 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: C.gray1 }}>算法模型管理</h2>
          <p style={{ fontSize: "13px", color: C.gray3, marginTop: "2px" }}>
            共 {models.length} 个模型
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
          + 新建模型
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
        flexWrap: "wrap" as const
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索模型名称..."
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
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          {modelAlgos.map(t => (
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
          {selectedIds.size > 0 && (
            <span style={{ marginRight: '12px', color: C.primary }}>
              已选 {selectedIds.size} 项
            </span>
          )}
          显示 {filteredModels.length} 条
        </span>
      </div>

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
            已选择 {selectedIds.size} 个模型
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

      {/* 模型表格 */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
            <thead>
              <tr style={{ background: C.gray7, borderBottom: `2px solid ${C.border}` }}>
                <th style={th("36px", true)}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredModels.length && filteredModels.length > 0}
                    onChange={toggleSelectAll}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                </th>
                <th style={th("48px", true)}>编号</th>
                <th style={th("100px", true)}>算法类型</th>
                <th style={th("110px", true)}>技术方法</th>
                <th style={th("180px")}>模型名称</th>
                <th style={th("120px")}>模型类别</th>
                <th style={th("140px")}>模型概述</th>
                <th style={th("80px", true)}>精度曲线</th>
                <th style={th("80px", true)}>模型精度</th>
                <th style={th("100px", true)}>应用现场</th>
                <th style={th("100px")}>使用数据集</th>
                <th style={th("80px", true)}>维护日期</th>
                <th style={th("70px", true)}>维护人员</th>
                <th style={th("90px", true)}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((m, idx) => {
                const isSelected = selectedIds.has(m.id)
                const accuracyColor = (m.accuracy || 0) >= 95 ? C.success : (m.accuracy || 0) >= 85 ? C.primary : C.warning
                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelectModel(m)}
                    onMouseEnter={e => { e.currentTarget.style.background = isSelected ? C.primaryBg : C.primaryBg }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? C.primaryBg : (idx % 2 === 0 ? C.white : "#FAFCFE") }}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? C.primaryBg : (idx % 2 === 0 ? C.white : "#FAFCFE"),
                      transition: "background .1s"
                    }}
                  >
                    <td style={td("36px", true)} onClick={e => { e.stopPropagation(); toggleSelect(m.id, m.name) }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(m.id, m.name)}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                    </td>
                    <td style={td("48px", true)}>
                      <span style={{ fontWeight: 600, color: C.gray4 }}>{m.id}</span>
                    </td>
                    <td style={td("100px", true)}>
                      <MemoizedAlgoTag type={m.algoName} />
                    </td>
                    <td style={td("110px", true)}>
                      <MemoizedTechMethodTag type={m.techMethod || "目标检测算法"} />
                    </td>
                    <td style={td("220px")}>
                      <div style={{
                        color: C.primary,
                        fontWeight: 500,
                        fontSize: "12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                        maxWidth: "200px"
                      }}
                        title={m.name}
                      >
                        {m.name}
                      </div>
                    </td>
                    <td style={td("120px")}>
                      <MemoizedModelCatTag cat={m.category} />
                    </td>
                    <td style={td("140px")}>
                      <div style={{
                        fontSize: "11px",
                        color: C.gray2,
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden"
                      }}>
                        {m.description || "-"}
                      </div>
                    </td>
                    <td style={td("80px", true)}>
                      <div style={{
                        display: "flex",
                        gap: "2px",
                        flexWrap: "wrap" as const,
                        justifyContent: "center",
                        maxWidth: "70px"
                      }}
                        onClick={e => { e.stopPropagation(); onSelectModel(m) }}
                        title="点击查看精度曲线"
                      >
                        <img
                          src={`/data/models/${encodeURIComponent(m.name)}/curves/map50_curve.png?thumb=1`}
                          alt="mAP50"
                          style={{ width: "18px", height: "14px", objectFit: "cover" as const, borderRadius: "2px", cursor: "pointer", background: C.gray6 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                          loading="lazy"
                        />
                        <img
                          src={`/data/models/${encodeURIComponent(m.name)}/curves/map50_95_curve.png?thumb=1`}
                          alt="mAP50-95"
                          style={{ width: "18px", height: "14px", objectFit: "cover" as const, borderRadius: "2px", cursor: "pointer", background: C.gray6 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                          loading="lazy"
                        />
                        <img
                          src={`/data/models/${encodeURIComponent(m.name)}/curves/train_box_loss_curve.png?thumb=1`}
                          alt="train_loss"
                          style={{ width: "18px", height: "14px", objectFit: "cover" as const, borderRadius: "2px", cursor: "pointer", background: C.gray6 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                          loading="lazy"
                        />
                        <img
                          src={`/data/models/${encodeURIComponent(m.name)}/curves/val_box_loss_curve.png?thumb=1`}
                          alt="val_loss"
                          style={{ width: "18px", height: "14px", objectFit: "cover" as const, borderRadius: "2px", cursor: "pointer", background: C.gray6 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td style={td("80px", true)}>
                      <AccuracyBar value={m.accuracy} width={50} />
                    </td>
                    <td style={td("100px", true)}>
                      <MemoizedSiteTag site={m.site} />
                    </td>
                    <td style={td("100px")}>
                      <span
                        style={{
                          color: C.primary,
                          fontSize: "11px",
                          cursor: "pointer",
                          textDecoration: "underline",
                          textDecorationColor: `${C.primary}50`,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap" as const,
                          display: "block",
                          maxWidth: "90px"
                        }}
                        onClick={e => { e.stopPropagation(); gotoDataset(m.dataset) }}
                        title={m.dataset}
                      >
                        {m.dataset || "-"}
                      </span>
                    </td>
                    <td style={td("80px", true)}>
                      <span style={{ fontSize: "11px", color: C.gray3 }}>{m.maintainDate}</span>
                    </td>
                    <td style={td("70px", true)}>
                      <span style={{ fontSize: "11px", color: C.gray2, fontWeight: 500 }}>{m.maintainer}</span>
                    </td>
                    <td style={td("90px", true)}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={(e) => downloadModel(m.name, e)}
                          title="下载模型"
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
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({ name: m.name }); }}
                          title="删除模型"
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
                )
              })}
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
