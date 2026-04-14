import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ModelList from '../components/ModelList'

// Mock数据
const mockModels = [
  {
    name: '测试模型1',
    algoName: '路面积水检测',
    techMethod: '目标检测算法',
    accuracy: '95.5',
    category: 'YOLO',
    maintainer: '管理员',
    maintainDate: '2026-04-01',
    dataset: '测试数据集1',
    site: '苏北灌溉总渠'
  },
  {
    name: '测试模型2',
    algoName: '漂浮物检测',
    techMethod: '实例分割算法',
    accuracy: '88.2',
    category: 'YOLO',
    maintainer: '张三',
    maintainDate: '2026-04-02',
    dataset: '测试数据集2',
    site: ''
  }
]

const mockDatasets = [
  { name: '测试数据集1' },
  { name: '测试数据集2' }
]

describe('ModelList 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('显示模型列表', () => {
    render(
      <ModelList
        models={mockModels}
        datasets={mockDatasets}
        onSelectModel={vi.fn()}
        onRefresh={vi.fn()}
        onShowUpload={vi.fn()}
      />
    )

    expect(screen.getByText('测试模型1')).toBeDefined()
    expect(screen.getByText('测试模型2')).toBeDefined()
  })

  it('显示模型精度', () => {
    render(
      <ModelList
        models={mockModels}
        datasets={mockDatasets}
        onSelectModel={vi.fn()}
        onRefresh={vi.fn()}
        onShowUpload={vi.fn()}
      />
    )

    expect(screen.getByText('95.5%')).toBeDefined()
    expect(screen.getByText('88.2%')).toBeDefined()
  })

  it('点击模型行触发选择回调', () => {
    const mockSelect = vi.fn()
    render(
      <ModelList
        models={mockModels}
        datasets={mockDatasets}
        onSelectModel={mockSelect}
        onRefresh={vi.fn()}
        onShowUpload={vi.fn()}
      />
    )

    const rows = screen.getAllByText('测试模型1')
    fireEvent.click(rows[0])

    expect(mockSelect).toHaveBeenCalled()
  })

  it('搜索框过滤模型', () => {
    render(
      <ModelList
        models={mockModels}
        datasets={mockDatasets}
        onSelectModel={vi.fn()}
        onRefresh={vi.fn()}
        onShowUpload={vi.fn()}
      />
    )

    const searchInput = screen.getByPlaceholderText('搜索模型...')
    fireEvent.change(searchInput, { target: { value: '测试模型1' } })

    expect(screen.getByText('测试模型1')).toBeDefined()
  })

  it('点击新建模型按钮', () => {
    const mockShowUpload = vi.fn()
    render(
      <ModelList
        models={mockModels}
        datasets={mockDatasets}
        onSelectModel={vi.fn()}
        onRefresh={vi.fn()}
        onShowUpload={mockShowUpload}
      />
    )

    const newBtn = screen.getByText('+ 新建模型')
    fireEvent.click(newBtn)

    expect(mockShowUpload).toHaveBeenCalled()
  })
})
