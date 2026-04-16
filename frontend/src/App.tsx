import React, { useState, useEffect, lazy, Suspense } from 'react'
import { C } from './constants'
import { LayersIcon, ActivityIcon } from './components/Icons'
import DatasetList from './components/DatasetList'
import RawData from './components/RawData'
import ModelList from './components/ModelList'
import ModelCompare from './components/ModelCompare'
import DatasetVersions from './components/DatasetVersions'
import UploadModal from './components/UploadModal'
import ModelUploadModal from './components/ModelUploadModal'
import DatasetEditModal from './components/DatasetEditModal'
import ModelEditModal from './components/ModelEditModal'
import SettingsDialog from './components/SettingsDialog'
import AuditLogs from './components/AuditLogs'
import UsageStats from './components/UsageStats'
import SiteManagement from './components/SiteManagement'
import { Login, Register, UserInfo } from './components/Auth'
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from './hooks/useKeyboardShortcuts'
import {
  HomeIcon, DatabaseIcon, BoxIcon, CpuIcon, BarChartIcon,
  SettingsIcon, FileTextIcon, LayersIcon, MapPinIcon,
  ActivityIcon, SearchIcon, BellIcon, UserIcon
} from './components/Icons'

// 类型定义
interface User {
  id: number
  username: string
  role: 'admin' | 'user' | 'viewer'
  email?: string
}

interface Dataset {
  name: string
  algoType?: string
  total?: number
  [key: string]: any
}

interface Model {
  name: string
  accuracy?: string | number
  algoName?: string
  [key: string]: any
}

interface Stats {
  datasets?: {
    count?: number
    totalImages?: number
  }
  models?: {
    count?: number
  }
  settings?: {
    algo_types?: string[]
    tech_methods?: string[]
    sites?: string[]
    annotation_formats?: string[]
  }
}

// 懒加载详情页组件
const DatasetDetail = lazy(() => import('./components/DatasetDetail'))
const ModelDetail = lazy(() => import('./components/ModelDetail'))

// ============== API函数 ==============

async function fetchDatasets(): Promise<Dataset[]> {
  const res = await fetch('/api/datasets')
  return res.json()
}

async function fetchModels(): Promise<Model[]> {
  const res = await fetch('/api/models')
  return res.json()
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch('/api/stats')
  return res.json()
}

// ============== 子组件类型 ==============

interface NavItemProps {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}

interface SettingsCardProps {
  title: string
  items: string[]
}

interface VersionSelectorProps {
  datasets: Dataset[]
  onSelectDataset: (name: string) => void
}

interface OverviewProps {
  datasets: Dataset[]
  models: Model[]
  stats: Stats
}

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  color: string
}

// ============== 子组件 ==============

function NavItem({ children, active, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      className={`nav-item ${active ? 'active' : ''}`}
    >
      {children}
    </div>
  )
}

function SettingsCard({ title, items }: SettingsCardProps) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: C.gray1 }}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
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

function VersionSelector({ datasets, onSelectDataset }: VersionSelectorProps) {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: C.gray1 }}><LayersIcon size={18} /> 数据集版本管理</h2>
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

function Overview({ datasets, models, stats }: OverviewProps) {
  const avgAccuracy = models.length > 0
    ? (models.reduce((s, m) => s + (parseFloat(String(m.accuracy)) || 0), 0) / models.length).toFixed(1)
    : '-'

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Overview</h2>
      <div className="stats-grid">
        <StatCard label="Datasets" value={datasets.length} icon={<DatabaseIcon size={20} />} color="blue" />
        <StatCard label="Models" value={models.length} icon={<CpuIcon size={20} />} color="green" />
        <StatCard label="Images" value={(stats.datasets?.totalImages || 0).toLocaleString()} icon={<FileTextIcon size={20} />} color="orange" />
        <StatCard label="Accuracy" value={`${avgAccuracy}%`} icon={<BarChartIcon size={20} />} color="blue" />
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

// ============== 主应用 ==============

function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [stats, setStats] = useState<Stats>({ datasets: { count: 0 }, models: { count: 0 } })
  const [currentPage, setCurrentPage] = useState<string>('overview')
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showModelUpload, setShowModelUpload] = useState(false)
  const [showDatasetEdit, setShowDatasetEdit] = useState(false)
  const [showModelEdit, setShowModelEdit] = useState(false)
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAuditLogs, setShowAuditLogs] = useState(false)
  const [versionsDataset, setVersionsDataset] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 认证状态
  const [user, setUser] = useState<User | null>(null)
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
  function handleAuthSuccess(userData: User) {
    setUser(userData)
  }

  // 加载动画
  if (loading || authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}><ActivityIcon size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>
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
          onEdit={(ds: Dataset) => { setEditingDataset(ds); setShowDatasetEdit(true) }}
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
          onEdit={(m: Model) => { setEditingModel(m); setShowModelEdit(true) }}
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
      {/* 侧边栏 - Roboflow 风格 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <BoxIcon size={24} />
            SLSD Vision
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Project</div>
            <NavItem active={currentPage === 'overview'} onClick={() => setCurrentPage('overview')}><HomeIcon /> Overview</NavItem>
            <NavItem active={currentPage === 'datasets'} onClick={() => setCurrentPage('datasets')}><DatabaseIcon /> Datasets</NavItem>
            <NavItem active={currentPage === 'models'} onClick={() => setCurrentPage('models')}><CpuIcon /> Models</NavItem>
            <NavItem active={currentPage === 'compare'} onClick={() => setCurrentPage('compare')}><BarChartIcon /> Compare</NavItem>
          </div>
          <div className="nav-section">
            <div className="nav-section-title">Data</div>
            <NavItem active={currentPage === 'rawdata'} onClick={() => setCurrentPage('rawdata')}><FileTextIcon /> Raw Data</NavItem>
            <NavItem active={currentPage === 'versions'} onClick={() => setCurrentPage('versions')}><LayersIcon /> Versions</NavItem>
            <NavItem active={currentPage === 'sites'} onClick={() => setCurrentPage('sites')}><MapPinIcon /> Sites</NavItem>
          </div>
          <div className="nav-section">
            <div className="nav-section-title">System</div>
            <NavItem active={currentPage === 'usage'} onClick={() => setCurrentPage('usage')}><ActivityIcon /> Usage</NavItem>
            <NavItem active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')}><SettingsIcon /> Settings</NavItem>
            {user?.role === 'admin' && (
              <NavItem active={showAuditLogs} onClick={() => setShowAuditLogs(true)}><FileTextIcon /> Audit</NavItem>
            )}
          </div>
        </nav>
        <div className="sidebar-footer">
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAuditLogs(true)}
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '12px' }}
            >
              <FileTextIcon size={14} /> 审计日志
            </button>
          )}
          <UserInfo user={user} onLogout={handleLogout} />
        </div>
      </div>

      {/* 主内容 */}
      <div className="main-content">
        {/* 原始数据管理页面 */}
        {currentPage === 'rawdata' && (
          <RawData onRefresh={loadData} />
        )}

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
            onSelectDataset={(name: string) => { setVersionsDataset(name); setCurrentPage('versions-detail') }}
          />
        )}

        {/* 版本详情页面 */}
        {currentPage === 'versions-detail' && versionsDataset && (
          <DatasetVersions
            datasetName={versionsDataset}
            onBack={() => { setVersionsDataset(null); setCurrentPage('versions') }}
          />
        )}

        {/* 应用现场管理页面 */}
        {currentPage === 'sites' && (
          <SiteManagement />
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

        {/* 使用统计页面 */}
        {currentPage === 'usage' && (
          <UsageStats onBack={() => setCurrentPage('overview')} />
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

      {/* 审计日志 */}
      {showAuditLogs && (
        <AuditLogs
          onClose={() => setShowAuditLogs(false)}
        />
      )}
    </div>
  )
}

export default App
