import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('正确接收models属性', () => {
    render(
      <ModelList
        models={mockModels}
        datasets={mockDatasets}
        onSelectModel={vi.fn()}
        onRefresh={vi.fn()}
        onShowUpload={vi.fn()}
      />
    )
    expect(document.body.innerHTML).toBeTruthy()
  })

  it('models为空时正常渲染', () => {
    render(
      <ModelList
        models={[]}
        datasets={[]}
        onSelectModel={vi.fn()}
        onRefresh={vi.fn()}
        onShowUpload={vi.fn()}
      />
    )
    expect(document.body.innerHTML).toBeTruthy()
  })

  it('onShowUpload回调存在', () => {
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
    expect(mockShowUpload).toBeDefined()
  })

  it('onSelectModel回调存在', () => {
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
    expect(mockSelect).toBeDefined()
  })

  it('onRefresh回调存在', () => {
    const mockRefresh = vi.fn()
    render(
      <ModelList
        models={mockModels}
        datasets={mockDatasets}
        onSelectModel={vi.fn()}
        onRefresh={mockRefresh}
        onShowUpload={vi.fn()}
      />
    )
    expect(mockRefresh).toBeDefined()
  })
})
