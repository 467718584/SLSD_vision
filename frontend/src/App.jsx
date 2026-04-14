import React, { useState, useEffect, lazy, Suspense } from 'react'
import { C, ALGO_COLORS, SITE_COLORS, TECH_METHOD_COLORS, MODEL_CAT_COLORS } from './constants'

// 懒加载详情页组件
const DatasetDetail = lazy(() => import('./components/DatasetDetail'))
const ModelDetail = lazy(() => import('./components/ModelDetail'))

// ============== 基础组件 ==============

const Tag = React.memo(({ label, colors }) => {
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

const MemoizedTag = React.memo(Tag)
const MemoizedAlgoTag = React.memo(({ type }) => <MemoizedTag label={type} colors={ALGO_COLORS[type] || ALGO_COLORS["其他"]} />)
const MemoizedTechMethodTag = React.memo(({ type }) => <MemoizedTag label={type} colors={TECH_METHOD_COLORS[type] || TECH_METHOD_COLORS["目标检测算法"]} />)
const MemoizedModelCatTag = React.memo(({ cat }) => <MemoizedTag label={cat} colors={MODEL_CAT_COLORS[cat]} />)
const MemoizedSiteTag = React.memo(({ site }) => <MemoizedTag label={site || "-"} colors={SITE_COLORS[site] || SITE_COLORS["其他"]} />)

// ============== 图表组件 ==============

const MemoizedMiniHeatmap = React.memo(({ seed, size = 52 }) => {
  const cells = 6
  const rects = []
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const v = Math.abs(Math.sin(seed * 17 + r * 5 + c * 7))
      const intensity = Math.round(v * 200)
      const fill = r === c ? C.primary : `rgb(${255 - Math.round(intensity * 0.3)},${255 - Math.round(intensity * 0.6)},255)`
      rects.push(<rect key={`${r}-${c}`} x={c * (size / cells)} y={r * (size / cells)} width={size / cells - 0.5} height={size / cells - 0.5} fill={fill} opacity={r === c ? 0.85 : 0.4 + v * 0.5} />)
    }
  }
  return <svg width={size} height={size} style={{ borderRadius: "3px", flexShrink: 0 }}>{rects}</svg>
})

// ============== API函数 ==============

async function fetchDatasets() {
  const res = await fetch('/api/datasets')
  return res.json()
}

async function fetchModels() {
  const res = await fetch('/api/models')
  return res.json()
}

async function fetchStats() {
  const res = await fetch('/api/stats')
  return res.json()
}

// ============== 主应用 ==============

function App() {
  const [datasets, setDatasets] = useState([])
  const [models, setModels] = useState([])
  const [stats, setStats] = useState({ datasets: { count: 0 }, models: { count: 0 } })
  const [currentPage, setCurrentPage] = useState('overview')
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [selectedModel, setSelectedModel] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [ds, ms, st] = await Promise.all([fetchDatasets(), fetchModels(), fetchStats()])
      setDatasets(ds)
      setModels(ms)
      setStats(st)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
    setLoading(false)
  }

  // 加载动画
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>加载中...</div>
        </div>
      </div>
    )
  }

  // 详情页懒加载
  if (selectedDataset) {
    return (
      <Suspense fallback={<div>加载中...</div>}>
        <DatasetDetail
          ds={selectedDataset}
          onBack={() => setSelectedDataset(null)}
          onRefresh={loadData}
        />
      </Suspense>
    )
  }

  if (selectedModel) {
    return (
      <Suspense fallback={<div>加载中...</div>}>
        <ModelDetail
          model={selectedModel}
          datasets={datasets}
          onBack={() => setSelectedModel(null)}
        />
      </Suspense>
    )
  }

  return (
    <div className="page-container">
      {/* 侧边栏 */}
      <div className="sidebar">
        <div style={{ padding: '0 16px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.primary }}>SLSD Vision</h2>
          <p style={{ fontSize: '11px', color: C.gray3, marginTop: '2px' }}>机器视觉管理平台</p>
        </div>
        <nav>
          <NavItem active={currentPage === 'overview'} onClick={() => setCurrentPage('overview')}>🏠 全体总览</NavItem>
          <NavItem active={currentPage === 'datasets'} onClick={() => setCurrentPage('datasets')}>📁 数据集管理</NavItem>
          <NavItem active={currentPage === 'models'} onClick={() => setCurrentPage('models')}>🤖 模型管理</NavItem>
          <NavItem active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')}>⚙️ 设置</NavItem>
        </nav>
      </div>

      {/* 主内容 */}
      <div className="main-content">
        <div style={{ padding: '16px 0' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: C.gray1 }}>欢迎使用机器视觉管理平台</h1>
          <p style={{ fontSize: '13px', color: C.gray3, marginTop: '4px' }}>
            共 {stats.datasets.count} 个数据集，{stats.models.count} 个模型
          </p>
        </div>

        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <StatCard title="数据集" value={stats.datasets.count} icon="📁" />
          <StatCard title="模型" value={stats.models.count} icon="🤖" />
          <StatCard title="总图片" value={stats.datasets.total_images || 0} icon="🖼️" />
        </div>

        {/* 最近数据集 */}
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>最近数据集</h3>
          {datasets.length === 0 ? (
            <p style={{ color: C.gray3, textAlign: 'center', padding: '20px' }}>暂无数据集</p>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {datasets.slice(0, 5).map(ds => (
                <div key={ds.id} onClick={() => setSelectedDataset(ds)} style={{ cursor: 'pointer', padding: '8px', borderRadius: '6px', background: '#F4F7FA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MemoizedAlgoTag type={ds.algoType} />
                    <span style={{ fontSize: '13px', color: C.primary }}>{ds.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NavItem({ children, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 16px',
        fontSize: '13px',
        color: active ? C.primary : C.gray2,
        background: active ? C.primaryBg : 'transparent',
        borderLeft: active ? `3px solid ${C.primary}` : '3px solid transparent',
        cursor: 'pointer'
      }}
    >
      {children}
    </div>
  )
}

function StatCard({ title, value, icon }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: C.primary }}>{value}</div>
      <div style={{ fontSize: '12px', color: C.gray3 }}>{title}</div>
    </div>
  )
}

export default App
