import React, { useState, useEffect, lazy, Suspense } from 'react'
import { C } from './constants'
import DatasetList from './components/DatasetList'
import ModelList from './components/ModelList'
import ModelCompare from './components/ModelCompare'
import DatasetVersions from './components/DatasetVersions'
import UploadModal from './components/UploadModal'
import ModelUploadModal from './components/ModelUploadModal'
import DatasetEditModal from './components/DatasetEditModal'
import ModelEditModal from './components/ModelEditModal'
import SettingsDialog from './components/SettingsDialog'
import { Login, Register, UserInfo } from './components/Auth'
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from './hooks/useKeyboardShortcuts'

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
  const [showModelUpload, setShowModelUpload] = useState(false)
  const [showDatasetEdit, setShowDatasetEdit] = useState(false)
  const [showModelEdit, setShowModelEdit] = useState(false)
  const [editingDataset, setEditingDataset] = useState(null)
  const [editingModel, setEditingModel] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [versionsDataset, setVersionsDataset] = useState(null)
  const [loading, setLoading] = useState(true)

  // 认证状态
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  // 键盘快捷键 - ESC关闭弹窗
  useKeyboardShortcuts({
    [KEYBOARD_SHORTCUTS.CLOSE]: () => {
      if (showUpload) setShowUpload(false)
      if (showModelUpload) setShowModelUpload(false)
      if (showDatasetEdit) setShowDatasetEdit(false)
      if (showModelEdit) setShowModelEdit(false)
      if (showSettings) setShowSettings(false)
    },
    [KEYBOARD_SHORTCUTS.SAVE]: (e) => {
      // Ctrl+S 保存（如果有编辑中的内容）
      if (showDatasetEdit && editingDataset) {
        e.preventDefault()
        document.getElementById('saveDatasetBtn')?.click()
      }
      if (showModelEdit && editingModel) {
        e.preventDefault()
        document.getElementById('saveModelBtn')?.click()
      }
    },
    [KEYBOARD_SHORTCUTS.DATASETS]: () => setCurrentPage('datasets'),
    [KEYBOARD_SHORTCUTS.MODELS]: () => setCurrentPage('models'),
    [KEYBOARD_SHORTCUTS.OVERVIEW]: () => setCurrentPage('overview'),
    [KEYBOARD_SHORTCUTS.NEW_DATASET]: () => setShowUpload(true),
    [KEYBOARD_SHORTCUTS.NEW_MODEL]: () => setShowModelUpload(true),
  }, { enabled: !authLoading })

  // 检查认证状态
  async function checkAuth() {
    const token = localStorage.getItem('token')
    if (!token) {
      setAuthLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    }
    setAuthLoading(false)
  }

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

  // 登出
  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  // 登录/注册成功
  function handleAuthSuccess(userData) {
    setUser(userData)
  }

  // 加载动画
  if (loading || authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>加载中...</div>
        </div>
      </div>
    )
  }

  // 未登录，显示登录页面
  if (!user) {
    if (showRegister) {
      return (
        <Register
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      )
    }
    return (
      <Login
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => setShowRegister(true)}
      />
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
          onEdit={(ds) => { setEditingDataset(ds); setShowDatasetEdit(true) }}
        />
        <DatasetEditModal
          isOpen={showDatasetEdit}
          onClose={() => { setShowDatasetEdit(false); setEditingDataset(null) }}
          onSave={loadData}
          dataset={editingDataset}
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
          onEdit={(m) => { setEditingModel(m); setShowModelEdit(true) }}
        />
        <ModelEditModal
          isOpen={showModelEdit}
          onClose={() => { setShowModelEdit(false); setEditingModel(null) }}
          onSave={loadData}
          model={editingModel}
          datasets={datasets}
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
          <NavItem active={currentPage === 'versions'} onClick={() => setCurrentPage('versions')}>📦 版本管理</NavItem>
          <NavItem active={currentPage === 'models'} onClick={() => setCurrentPage('models')}>🤖 模型管理</NavItem>
          <NavItem active={currentPage === 'compare'} onClick={() => setCurrentPage('compare')}>📈 模型对比</NavItem>
          <NavItem active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')}>⚙️ 设置</NavItem>
        </nav>
        <div style={{ marginTop: 'auto', padding: '16px', borderTop: `1px solid ${C.border}` }}>
          <UserInfo user={user} onLogout={handleLogout} />
        </div>
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
            onShowUpload={() => setShowModelUpload(true)}
          />
        )}

        {/* 模型对比页面 */}
        {currentPage === 'compare' && (
          <ModelCompare
            models={models}
          />
        )}

        {/* 版本管理页面 */}
        {currentPage === 'versions' && (
          <VersionSelector
            datasets={datasets}
            onSelectDataset={(name) => { setVersionsDataset(name); setCurrentPage('versions-detail') }}
          />
        )}

        {/* 版本详情页面 */}
        {currentPage === 'versions-detail' && versionsDataset && (
          <DatasetVersions
            datasetName={versionsDataset}
            onBack={() => { setVersionsDataset(null); setCurrentPage('versions') }}
          />
        )}

        {/* 设置页面 */}
        {currentPage === 'settings' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.gray1 }}>系统设置</h2>
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  background: C.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                编辑设置
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <SettingsCard title="算法类型" items={stats.settings?.algo_types || []} />
              <SettingsCard title="技术方法" items={stats.settings?.tech_methods || []} />
              <SettingsCard title="应用现场" items={stats.settings?.sites || []} />
              <SettingsCard title="标注格式" items={stats.settings?.annotation_formats || []} />
            </div>
          </div>
        )}

        {/* 总览页面 */}
        {currentPage === 'overview' && (
          <Overview datasets={datasets} models={models} stats={stats} />
        )}
      </div>

      {/* 上传Modal */}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={loadData}
      />

      {/* 模型上传Modal */}
      <ModelUploadModal
        isOpen={showModelUpload}
        onClose={() => setShowModelUpload(false)}
        onSuccess={loadData}
        datasets={datasets}
      />

      {/* 设置Modal */}
      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}

// ============== 子组件 ==============

function NavItem({ children, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 16px',
        cursor: 'pointer',
        color: active ? C.primary : C.gray2,
        background: active ? `${C.primary}15` : 'transparent',
        borderLeft: active ? `3px solid ${C.primary}` : '3px solid transparent',
        fontSize: '13px',
        fontWeight: active ? 500 : 400,
        transition: 'all 0.2s'
      }}
    >
      {children}
    </div>
  )
}

function SettingsCard({ title, items }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: C.gray1 }}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {items.length > 0 ? items.map((item, i) => (
          <span key={i} style={{
            padding: '4px 12px',
            background: C.gray7,
            borderRadius: '4px',
            fontSize: '12px',
            color: C.gray2
          }}>{item}</span>
        )) : <span style={{ color: C.gray4, fontSize: '12px' }}>暂无</span>}
      </div>
    </div>
  )
}

function VersionSelector({ datasets, onSelectDataset }) {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: C.gray1 }}>📦 数据集版本管理</h2>
      <p style={{ fontSize: '13px', color: C.gray3, marginBottom: '24px' }}>
        选择一个数据集来管理其版本历史
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {datasets.map(ds => (
          <div
            key={ds.name}
            onClick={() => onSelectDataset(ds.name)}
            className="card"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <div style={{ fontWeight: 600, color: C.gray1, marginBottom: '8px' }}>{ds.name}</div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: C.gray3 }}>
              <span>算法: {ds.algoType}</span>
              <span>样本: {ds.total?.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Overview({ datasets, models, stats }) {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: C.gray1 }}>全体总览</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="数据集总数" value={datasets.length} icon="📁" color={C.primary} />
        <StatCard label="模型总数" value={models.length} icon="🤖" color="#E8631A" />
        <StatCard label="样本总数" value={(stats.datasets?.totalImages || 0).toLocaleString()} icon="🖼️" color={C.success} />
        <StatCard label="总精度" value={models.length > 0 ? `${(models.reduce((s, m) => s + (parseFloat(m.accuracy) || 0), 0) / models.length).toFixed(1)}%` : '-'} icon="📊" color="#8E44AD" />
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '12px', color: C.gray3, marginTop: '4px' }}>{label}</div>
    </div>
  )
}

export default App
