import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'

// Mock数据
const mockDatasets = [
  { name: '测试数据集1', algoType: '路面积水检测', total: 1000, maintainer: '管理员', maintainDate: '2026-04-01' },
  { name: '测试数据集2', algoType: '漂浮物检测', total: 500, maintainer: '管理员', maintainDate: '2026-04-02' }
]

const mockModels = [
  { name: '测试模型1', algoName: '路面积水检测', accuracy: '95.5', category: 'YOLO', maintainer: '管理员' },
  { name: '测试模型2', algoName: '漂浮物检测', accuracy: '88.2', category: 'YOLO', maintainer: '管理员' }
]

const mockStats = {
  datasets: { count: 2, totalImages: 1500 },
  models: { count: 2, avgAccuracy: 91.85 },
  settings: {
    algo_types: ['路面积水检测', '漂浮物检测'],
    tech_methods: ['目标检测算法'],
    sites: ['苏北灌溉总渠'],
    annotation_formats: ['YOLO']
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

describe('App 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 默认未登录
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return null
      return null
    })
  })

  it('显示登录页面 (未登录状态)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockDatasets)
    })

    render(<App />)

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeNull()
    }, { timeout: 3000 })
  })
})
