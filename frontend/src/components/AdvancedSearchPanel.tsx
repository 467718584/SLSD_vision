import React, { useState, useEffect, useMemo } from 'react'
import { C } from '../constants'

// 搜索条件类型
export interface DatasetSearchFilters {
  searchQuery: string
  algoType: string
  techMethod: string
  source: string
  dateRange: { start: string; end: string }
  sampleRange: { min: string; max: string }
  split: string
}

export interface ModelSearchFilters {
  searchQuery: string
  algoName: string
  techMethod: string
  site: string
  category: string
  dateRange: { start: string; end: string }
}

export interface ActiveFilter {
  key: string
  label: string
  value: string
  onRemove: () => void
}

interface AdvancedSearchPanelProps {
  type: 'dataset' | 'model'
  filters: DatasetSearchFilters | ModelSearchFilters
  onFiltersChange: (filters: DatasetSearchFilters | ModelSearchFilters) => void
  algoTypes: string[]
  techMethods: string[]
  extraFilters?: {
    sources?: string[]  // for dataset
    sites?: string[]    // for model
    categories?: string[] // for model
    splits?: string[]   // for dataset
  }
}

// localStorage key
const getStorageKey = (type: 'dataset' | 'model') => `${type}_search_filters`

// 加载保存的搜索条件
function loadSavedFilters(type: 'dataset' | 'model'): Partial<DatasetSearchFilters | ModelSearchFilters> {
  try {
    const saved = localStorage.getItem(getStorageKey(type))
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    // ignore
  }
  return {}
}

// 保存搜索条件到 localStorage
function saveFilters(type: 'dataset' | 'model', filters: DatasetSearchFilters | ModelSearchFilters) {
  try {
    localStorage.setItem(getStorageKey(type), JSON.stringify(filters))
  } catch (e) {
    // ignore
  }
}

// 通用高级搜索面板
export function AdvancedSearchPanel({ type, filters, onFiltersChange, algoTypes, techMethods, extraFilters }: AdvancedSearchPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [savedFilters, setSavedFilters] = useState<Partial<DatasetSearchFilters | ModelSearchFilters>>({})

  // 初始化时加载保存的搜索条件
  useEffect(() => {
    const saved = loadSavedFilters(type)
    setSavedFilters(saved)
  }, [type])

  // 获取活动过滤器（可视化展示）
  function getActiveFilters(): ActiveFilter[] {
    const active: ActiveFilter[] = []

    if (filters.searchQuery) {
      active.push({
        key: 'searchQuery',
        label: '关键词',
        value: filters.searchQuery,
        onRemove: () => onFiltersChange({ ...filters, searchQuery: '' })
      })
    }

    if (filters.algoType && filters.algoType !== '全部') {
      active.push({
        key: 'algoType',
        label: '算法类型',
        value: filters.algoType,
        onRemove: () => onFiltersChange({ ...filters, algoType: '全部' })
      })
    }

    if (filters.techMethod && filters.techMethod !== '全部' && filters.techMethod !== '目标检测算法') {
      active.push({
        key: 'techMethod',
        label: '技术方法',
        value: filters.techMethod,
        onRemove: () => onFiltersChange({ ...filters, techMethod: '全部' })
      })
    }

    // 数据集特有
    if (type === 'dataset') {
      const dsFilters = filters as DatasetSearchFilters
      if (dsFilters.source && dsFilters.source !== '全部') {
        active.push({
          key: 'source',
          label: '数据来源',
          value: dsFilters.source,
          onRemove: () => onFiltersChange({ ...filters, source: '全部' } as DatasetSearchFilters)
        })
      }
      if (dsFilters.split && dsFilters.split !== '全部') {
        active.push({
          key: 'split',
          label: '分配比例',
          value: dsFilters.split,
          onRemove: () => onFiltersChange({ ...filters, split: '全部' } as DatasetSearchFilters)
        })
      }
      if (dsFilters.dateRange.start || dsFilters.dateRange.end) {
        const label = dsFilters.dateRange.start && dsFilters.dateRange.end
          ? `${dsFilters.dateRange.start} ~ ${dsFilters.dateRange.end}`
          : dsFilters.dateRange.start || dsFilters.dateRange.end
        active.push({
          key: 'dateRange',
          label: '维护日期',
          value: label,
          onRemove: () => onFiltersChange({ ...filters, dateRange: { start: '', end: '' } } as DatasetSearchFilters)
        })
      }
      if (dsFilters.sampleRange.min || dsFilters.sampleRange.max) {
        const label = dsFilters.sampleRange.min && dsFilters.sampleRange.max
          ? `${dsFilters.sampleRange.min} - ${dsFilters.sampleRange.max}`
          : dsFilters.sampleRange.min ? `≥ ${dsFilters.sampleRange.min}` : `≤ ${dsFilters.sampleRange.max}`
        active.push({
          key: 'sampleRange',
          label: '样本数量',
          value: label,
          onRemove: () => onFiltersChange({ ...filters, sampleRange: { min: '', max: '' } } as DatasetSearchFilters)
        })
      }
    }

    // 模型特有
    if (type === 'model') {
      const mFilters = filters as ModelSearchFilters
      if (mFilters.site && mFilters.site !== '全部') {
        active.push({
          key: 'site',
          label: '应用现场',
          value: mFilters.site,
          onRemove: () => onFiltersChange({ ...filters, site: '全部' } as ModelSearchFilters)
        })
      }
      if (mFilters.category && mFilters.category !== '全部') {
        active.push({
          key: 'category',
          label: '模型类别',
          value: mFilters.category,
          onRemove: () => onFiltersChange({ ...filters, category: '全部' } as ModelSearchFilters)
        })
      }
      if (mFilters.dateRange.start || mFilters.dateRange.end) {
        const label = mFilters.dateRange.start && mFilters.dateRange.end
          ? `${mFilters.dateRange.start} ~ ${mFilters.dateRange.end}`
          : mFilters.dateRange.start || mFilters.dateRange.end
        active.push({
          key: 'dateRange',
          label: '维护日期',
          value: label,
          onRemove: () => onFiltersChange({ ...filters, dateRange: { start: '', end: '' } } as ModelSearchFilters)
        })
      }
    }

    return active
  }

  // 清除所有筛选条件
  function clearAllFilters() {
    const cleared = {
      searchQuery: '',
      algoType: '全部',
      techMethod: type === 'dataset' ? '目标检测算法' : '目标检测算法',
      dateRange: { start: '', end: '' },
      ...(type === 'dataset' ? {
        source: '全部',
        split: '全部',
        sampleRange: { min: '', max: '' }
      } : {
        site: '全部',
        category: '全部'
      })
    }
    if (type === 'dataset') {
      onFiltersChange(cleared as DatasetSearchFilters)
    } else {
      onFiltersChange(cleared as ModelSearchFilters)
    }
    saveFilters(type, cleared as DatasetSearchFilters | ModelSearchFilters)
  }

  // 保存当前条件
  function handleSaveFilters() {
    saveFilters(type, filters)
    setSavedFilters({ ...filters })
    alert('搜索条件已保存')
  }

  // 加载保存的条件
  function handleLoadSavedFilters() {
    if (Object.keys(savedFilters).length === 0) {
      alert('没有保存的搜索条件')
      return
    }
    onFiltersChange({ ...filters, ...savedFilters } as DatasetSearchFilters | ModelSearchFilters)
  }

  const activeFilters = getActiveFilters()

  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: "10px",
      marginBottom: "14px",
      overflow: "hidden"
    }}>
      {/* 搜索和筛选头部 */}
      <div style={{
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap" as const
      }}>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={e => {
            if (type === 'dataset') {
              onFiltersChange({ ...filters, searchQuery: e.target.value } as DatasetSearchFilters)
            } else {
              onFiltersChange({ ...filters, searchQuery: e.target.value } as ModelSearchFilters)
            }
          }}
          placeholder="搜索名称..."
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "13px",
            color: C.gray1,
            background: C.gray7,
            width: "200px",
            outline: "none"
          }}
        />

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          {algoTypes.map(t => (
            <button
              key={t}
              onClick={() => {
                if (type === 'dataset') {
                  onFiltersChange({ ...filters, algoType: t } as DatasetSearchFilters)
                } else {
                  onFiltersChange({ ...filters, algoName: t } as ModelSearchFilters)
                }
              }}
              style={{
                background: (type === 'dataset' ? (filters as DatasetSearchFilters).algoType : (filters as ModelSearchFilters).algoName) === t ? C.primary : "none",
                border: `1px solid ${(type === 'dataset' ? (filters as DatasetSearchFilters).algoType : (filters as ModelSearchFilters).algoName) === t ? C.primary : C.border}`,
                borderRadius: "20px",
                padding: "3px 12px",
                fontSize: "12px",
                cursor: "pointer",
                color: (type === 'dataset' ? (filters as DatasetSearchFilters).algoType : (filters as ModelSearchFilters).algoName) === t ? "white" : C.gray3,
                transition: "all .15s"
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: isExpanded ? C.primaryBg : "none",
            border: `1px solid ${isExpanded ? C.primaryBd : C.border}`,
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "12px",
            cursor: "pointer",
            color: isExpanded ? C.primary : C.gray2,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "all .15s"
          }}
        >
          <span>⚙️ 高级筛选</span>
          <span style={{ fontSize: "10px", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>▼</span>
        </button>

        {activeFilters.length > 0 && (
          <button
            onClick={clearAllFilters}
            style={{
              background: "#FEE2E2",
              border: "1px solid #FECACA",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
              color: "#DC2626",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            🗑️ 清除全部
          </button>
        )}

        <span style={{ marginLeft: "auto", fontSize: "12px", color: C.gray4 }}>
          {activeFilters.length > 0 && (
            <span style={{ marginRight: '12px', color: C.primary }}>
              {activeFilters.length} 个筛选条件
            </span>
          )}
        </span>
      </div>

      {/* 活动过滤器可视化展示 */}
      {activeFilters.length > 0 && (
        <div style={{
          padding: "0 18px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px"
        }}>
          {activeFilters.map((f, idx) => (
            <div
              key={f.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: C.gray7,
                border: `1px solid ${C.border}`,
                borderRadius: "6px",
                padding: "4px 8px 4px 10px",
                fontSize: "12px"
              }}
            >
              <span style={{ color: C.gray3 }}>{f.label}:</span>
              <span style={{ color: C.gray1, fontWeight: 500 }}>{f.value}</span>
              <button
                onClick={f.onRemove}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: C.gray4,
                  padding: "0",
                  fontSize: "14px",
                  lineHeight: 1,
                  borderRadius: "2px"
                }}
                title="移除此条件"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 高级筛选面板 */}
      {isExpanded && (
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: "16px 18px",
          background: C.gray7
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {/* 技术方法筛选 */}
            <div>
              <label style={{ fontSize: "12px", color: C.gray3, display: "block", marginBottom: "6px", fontWeight: 500 }}>
                技术方法
              </label>
              <select
                value={filters.techMethod}
                onChange={e => {
                  if (type === 'dataset') {
                    onFiltersChange({ ...filters, techMethod: e.target.value } as DatasetSearchFilters)
                  } else {
                    onFiltersChange({ ...filters, techMethod: e.target.value } as ModelSearchFilters)
                  }
                }}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: `1px solid ${C.border}`,
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: C.gray1,
                  background: C.white,
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="全部">全部</option>
                {techMethods.filter(t => t !== '全部').map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* 数据来源（数据集特有） */}
            {type === 'dataset' && extraFilters?.sources && (
              <div>
                <label style={{ fontSize: "12px", color: C.gray3, display: "block", marginBottom: "6px", fontWeight: 500 }}>
                  数据来源
                </label>
                <select
                  value={(filters as DatasetSearchFilters).source}
                  onChange={e => {
                    onFiltersChange({ ...filters, source: e.target.value } as DatasetSearchFilters)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: C.gray1,
                    background: C.white,
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="全部">全部</option>
                  {extraFilters.sources.filter(s => s !== '全部').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 分配比例（数据集特有） */}
            {type === 'dataset' && extraFilters?.splits && (
              <div>
                <label style={{ fontSize: "12px", color: C.gray3, display: "block", marginBottom: "6px", fontWeight: 500 }}>
                  分配比例
                </label>
                <select
                  value={(filters as DatasetSearchFilters).split}
                  onChange={e => {
                    onFiltersChange({ ...filters, split: e.target.value } as DatasetSearchFilters)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: C.gray1,
                    background: C.white,
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="全部">全部</option>
                  {extraFilters.splits.filter(s => s !== '全部').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 应用现场（模型特有） */}
            {type === 'model' && extraFilters?.sites && (
              <div>
                <label style={{ fontSize: "12px", color: C.gray3, display: "block", marginBottom: "6px", fontWeight: 500 }}>
                  应用现场
                </label>
                <select
                  value={(filters as ModelSearchFilters).site}
                  onChange={e => {
                    onFiltersChange({ ...filters, site: e.target.value } as ModelSearchFilters)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: C.gray1,
                    background: C.white,
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="全部">全部</option>
                  {extraFilters.sites.filter(s => s !== '全部').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 模型类别（模型特有） */}
            {type === 'model' && extraFilters?.categories && (
              <div>
                <label style={{ fontSize: "12px", color: C.gray3, display: "block", marginBottom: "6px", fontWeight: 500 }}>
                  模型类别
                </label>
                <select
                  value={(filters as ModelSearchFilters).category}
                  onChange={e => {
                    onFiltersChange({ ...filters, category: e.target.value } as ModelSearchFilters)
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: C.gray1,
                    background: C.white,
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="全部">全部</option>
                  {extraFilters.categories.filter(c => c !== '全部').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 日期范围筛选 */}
            <div>
              <label style={{ fontSize: "12px", color: C.gray3, display: "block", marginBottom: "6px", fontWeight: 500 }}>
                维护日期起止
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={e => {
                    if (type === 'dataset') {
                      onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } } as DatasetSearchFilters)
                    } else {
                      onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } } as ModelSearchFilters)
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: C.gray1,
                    background: C.white,
                    outline: "none"
                  }}
                />
                <span style={{ color: C.gray3, fontSize: "12px" }}>至</span>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={e => {
                    if (type === 'dataset') {
                      onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } } as DatasetSearchFilters)
                    } else {
                      onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } } as ModelSearchFilters)
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: C.gray1,
                    background: C.white,
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* 样本数量范围（数据集特有） */}
            {type === 'dataset' && (
              <div>
                <label style={{ fontSize: "12px", color: C.gray3, display: "block", marginBottom: "6px", fontWeight: 500 }}>
                  样本数量范围
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="number"
                    value={(filters as DatasetSearchFilters).sampleRange.min}
                    onChange={e => {
                      onFiltersChange({ ...filters, sampleRange: { ...(filters as DatasetSearchFilters).sampleRange, min: e.target.value } } as DatasetSearchFilters)
                    }}
                    placeholder="最小值"
                    min="0"
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      border: `1px solid ${C.border}`,
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: C.gray1,
                      background: C.white,
                      outline: "none"
                    }}
                  />
                  <span style={{ color: C.gray3, fontSize: "12px" }}>至</span>
                  <input
                    type="number"
                    value={(filters as DatasetSearchFilters).sampleRange.max}
                    onChange={e => {
                      onFiltersChange({ ...filters, sampleRange: { ...(filters as DatasetSearchFilters).sampleRange, max: e.target.value } } as DatasetSearchFilters)
                    }}
                    placeholder="最大值"
                    min="0"
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      border: `1px solid ${C.border}`,
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: C.gray1,
                      background: C.white,
                      outline: "none"
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 保存/加载按钮 */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button
              onClick={handleSaveFilters}
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                cursor: "pointer",
                color: C.gray2,
                fontWeight: 500
              }}
            >
              💾 保存条件
            </button>
            {Object.keys(savedFilters).length > 0 && (
              <button
                onClick={handleLoadSavedFilters}
                style={{
                  background: C.primaryBg,
                  border: `1px solid ${C.primaryBd}`,
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  cursor: "pointer",
                  color: C.primary,
                  fontWeight: 500
                }}
              >
                📂 加载已保存
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedSearchPanel
