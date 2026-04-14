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

describe('App 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockResolvedValue({
      json: () => Promise.resolve(mockDatasets)
    })
  })

  it('显示加载状态', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}))
    render(<App />)
    expect(screen.getByText('加载中...')).toBeDefined()
  })

  it('加载完成后显示侧边栏', async () => {
    global.fetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockDatasets) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockModels) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockStats) })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('SLSD Vision')).toBeDefined()
    })
  })

  it('导航到数据集管理', async () => {
    global.fetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockDatasets) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockModels) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockStats) })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('数据集管理')).toBeDefined()
    })
  })

  it('导航到模型管理', async () => {
    global.fetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockDatasets) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockModels) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockStats) })

    render(<App />)

    await waitFor(() => {
      const modelNav = screen.getByText('🤖 模型管理')
      fireEvent.click(modelNav)
    })

    await waitFor(() => {
      expect(screen.getByText('模型管理')).toBeDefined()
    })
  })

  it('显示总览页面统计', async () => {
    global.fetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockDatasets) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockModels) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockStats) })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('全体总览')).toBeDefined()
      expect(screen.getByText('数据集总数')).toBeDefined()
      expect(screen.getByText('模型总数')).toBeDefined()
    })
  })
})
