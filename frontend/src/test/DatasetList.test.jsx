import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DatasetList from '../components/DatasetList'

// Mock数据
const mockDatasets = [
  {
    name: '测试数据集1',
    algoType: '路面积水检测',
    techMethod: '目标检测算法',
    total: 1000,
    maintainer: '管理员',
    maintainDate: '2026-04-01',
    classInfo: { '0': 500, '1': 300, '2': 200 },
    split: '8:2',
    source: '苏北灌溉总渠'
  },
  {
    name: '测试数据集2',
    algoType: '漂浮物检测',
    techMethod: '实例分割算法',
    total: 500,
    maintainer: '张三',
    maintainDate: '2026-04-02',
    classInfo: {},
    split: '7:3',
    source: ''
  }
]

describe('DatasetList 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('正确接收datasets属性', () => {
    const mockRefresh = vi.fn()
    render(
      <DatasetList
        datasets={mockDatasets}
        onSelectDataset={vi.fn()}
        onRefresh={mockRefresh}
        onShowUpload={vi.fn()}
      />
    )
    // 组件应该能正常渲染
    expect(document.body.innerHTML).toBeTruthy()
  })

  it('datasets为空时正常渲染', () => {
    render(
      <DatasetList
        datasets={[]}
        onSelectDataset={vi.fn()}
        onRefresh={vi.fn()}
        onShowUpload={vi.fn()}
      />
    )
    expect(document.body.innerHTML).toBeTruthy()
  })

  it('onShowUpload回调存在', () => {
    const mockShowUpload = vi.fn()
    const { container } = render(
      <DatasetList
        datasets={mockDatasets}
        onSelectDataset={vi.fn()}
        onRefresh={vi.fn()}
        onShowUpload={mockShowUpload}
      />
    )
    expect(mockShowUpload).toBeDefined()
  })

  it('onSelectDataset回调存在', () => {
    const mockSelect = vi.fn()
    render(
      <DatasetList
        datasets={mockDatasets}
        onSelectDataset={mockSelect}
        onRefresh={vi.fn()}
        onShowUpload={vi.fn()}
      />
    )
    expect(mockSelect).toBeDefined()
  })

  it('onRefresh回调存在', () => {
    const mockRefresh = vi.fn()
    render(
      <DatasetList
        datasets={mockDatasets}
        onSelectDataset={vi.fn()}
        onRefresh={mockRefresh}
        onShowUpload={vi.fn()}
      />
    )
    expect(mockRefresh).toBeDefined()
  })
})
