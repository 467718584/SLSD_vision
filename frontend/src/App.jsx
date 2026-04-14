import React, { useState, useEffect, lazy, Suspense } from 'react'
import { C } from './constants'
import DatasetList from './components/DatasetList'
import ModelList from './components/ModelList'
import UploadModal from './components/UploadModal'

// 懒加载详情页组件
const DatasetDetail = lazy(() => import('./components/DatasetDetail'))
const ModelDetail = lazy(() => import('./components/ModelDetail'))

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
  const [showUpload, setShowUpload] = useState(false)
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
        {/* 数据集管理页面 */}
        {currentPage === 'datasets' && (
          <DatasetList
            datasets={datasets}
            onSelectDataset={setSelectedDataset}
            onRefresh={loadData}
            onShowUpload={() => setShowUpload(true)}
          />
        )}

        {/* 模型管理页面 */}
        {currentPage === 'models' && (
          <ModelList
            models={models}
            datasets={datasets}
            onSelectModel={setSelectedModel}
            onRefresh={loadData}
            onShowUpload={() => {}}
          />
        )}

        {/* 设置页面 */}
        {currentPage === 'settings' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.gray1 }}>系统设置</h2>
            <p style={{ fontSize: '13px', color: C.gray3, marginTop: '8px' }}>
              功能迁移中...
            </p>
          </div>
        )}

        {/* 全体总览页面 */}
        {currentPage === 'overview' && (
          <>
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
                    <div
                      key={ds.id}
                      onClick={() => { setSelectedDataset(ds); setCurrentPage('datasets') }}
                      style={{ cursor: 'pointer', padding: '8px', borderRadius: '6px', background: '#F4F7FA' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlgoTagInline type={ds.algoType} />
                        <span style={{ fontSize: '13px', color: C.primary }}>{ds.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 上传Modal */}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={loadData}
      />
    </div>
  )
}

// 内联算法标签组件（用于Overview）
const AlgoTagInline = React.memo(({ type }) => {
  const colors = {
    "路面积水检测": { bg: C.primaryBg, border: C.primaryBd, text: C.primary },
    "漂浮物检测": { bg: "#E8F5EE", border: "#A8D5C0", text: "#2E8B57" },
    "墙面裂缝检测": { bg: "#FEF5E7", border: "#F9D9B0", text: "#E67E22" },
    "游泳检测": { bg: "#FDE9E9", border: "#F5BCBC", text: "#C0392B" },
  }[type] || { bg: C.gray6, border: C.border, text: C.gray2 }

  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: 500,
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      color: colors.text,
      whiteSpace: "nowrap"
    }}>
      {type}
    </span>
  )
})

// 导航项组件
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

// 统计卡片组件
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
