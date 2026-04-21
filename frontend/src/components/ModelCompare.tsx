import React, { useState } from 'react'
import { C } from '../constants'
import { BarChartIcon, CpuIcon } from './Icons'

// 模型类型定义
interface Model {
  name: string
  algoName?: string
  accuracy?: number | string
  category?: string
  techMethod?: string
  site?: string
  dataset?: string
  maintainer?: string
  maintainDate?: string
  charts?: {
    map50_curve?: string
    map50_95_curve?: string
    PR_curve?: string
    [key: string]: string | undefined
  }
}

// ModelCompare Props
interface ModelCompareProps {
  models: Model[]
  onBack?: () => void
}

// 模型性能对比组件
function ModelCompare({ models, onBack }: ModelCompareProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [compareData, setCompareData] = useState<Model[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 切换模型选择
  function toggleModel(modelName: string) {
    setSelectedModels(prev => {
      if (prev.includes(modelName)) {
        return prev.filter(n => n !== modelName)
      }
      if (prev.length >= 5) {
        setError('最多支持5个模型同时对比')
        return prev
      }
      return [...prev, modelName]
    })
    setError('')
  }

  // 执行对比
  async function handleCompare() {
    if (selectedModels.length < 2) {
      setError('请至少选择2个模型')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/models/compare?models=${selectedModels.join(',')}`)
      const data = await res.json()
      if (data.success) {
        setCompareData(data.models)
      } else {
        setError(data.error || '获取对比数据失败')
      }
    } catch (err: any) {
      setError('请求失败: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <div className="p-5">
      {/* 头部 */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center">
          {onBack && (
            <button onClick={onBack} className="btn mr-3">
              ← 返回
            </button>
          )}
          <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
            <CpuIcon size={18} /> 模型性能对比
          </h2>
        </div>
        {selectedModels.length >= 2 && (
          <button
            onClick={handleCompare}
            disabled={loading}
            className="btn btn-primary transition-all"
          >
            {loading ? '加载中...' : '开始对比'}
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 px-4 bg-[#FEE2E2] text-[#DC2626] rounded text-sm mb-4">
          {error}
        </div>
      )}

      {/* 模型选择 */}
      <div className="card mb-5">
        <h3 className="text-sm font-semibold mb-4 text-[#111827]">
          选择模型 (已选 {selectedModels.length}/5)
        </h3>
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {models.map(model => {
            const isSelected = selectedModels.includes(model.name)
            return (
              <div
                key={model.name}
                onClick={() => toggleModel(model.name)}
                className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-2 border-[#0066CC] bg-[#0066CC]/10' : 'border border-[#E2E8F0] bg-white'}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[#111827]">
                    {model.name}
                  </span>
                </div>
                <div className="text-xs text-muted mt-1 ml-6">
                  {model.algoName} · {model.accuracy}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 对比结果 */}
      {compareData && compareData.length > 0 && (
        <>
          {/* 精度对比表 */}
          <div className="card mb-5">
            <h3 className="text-sm font-semibold mb-4 text-[#111827]">
              <BarChartIcon size={16} /> 性能指标对比
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left bg-[#F3F4F6] border-b border-[#E2E8F0] font-semibold text-[#374151]">指标</th>
                    {compareData.map(m => (
                      <th key={m.name} className="p-3 text-left bg-[#F3F4F6] border-b border-[#E2E8F0] font-semibold text-[#374151]">{m.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-secondary transition-colors">
                    <td className="p-3 border-b border-[#E2E8F0] text-[#111827]">算法名称</td>
                    {compareData.map(m => (
                      <td key={m.name} className="p-3 border-b border-[#E2E8F0] text-[#111827]">{m.algoName}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-[#E2E8F0] text-[#111827]">模型精度</td>
                    {compareData.map(m => (
                      <td key={m.name} className="p-3 border-b border-[#E2E8F0] font-bold text-[#0066CC]">
                        {m.accuracy}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-[#E2E8F0] text-[#111827]">模型类别</td>
                    {compareData.map(m => (
                      <td key={m.name} className="p-3 border-b border-[#E2E8F0] text-[#111827]">{m.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-[#E2E8F0] text-[#111827]">技术方法</td>
                    {compareData.map(m => (
                      <td key={m.name} className="p-3 border-b border-[#E2E8F0] text-[#111827]">{m.techMethod}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-[#E2E8F0] text-[#111827]">应用现场</td>
                    {compareData.map(m => (
                      <td key={m.name} className="p-3 border-b border-[#E2E8F0] text-[#111827]">{m.site || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-[#E2E8F0] text-[#111827]">关联数据集</td>
                    {compareData.map(m => (
                      <td key={m.name} className="p-3 border-b border-[#E2E8F0] text-[#111827]">{m.dataset || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-[#E2E8F0] text-[#111827]">维护人员</td>
                    {compareData.map(m => (
                      <td key={m.name} className="p-3 border-b border-[#E2E8F0] text-[#111827]">{m.maintainer}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-[#E2E8F0] text-[#111827]">维护日期</td>
                    {compareData.map(m => (
                      <td key={m.name} className="p-3 border-b border-[#E2E8F0] text-[#111827]">{m.maintainDate}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 精度柱状图 */}
          <div className="card mb-5">
            <h3 className="text-sm font-semibold mb-4 text-[#111827]">
              <BarChartIcon size={16} /> 精度对比
            </h3>
            <div className="flex items-end gap-5 h-[200px] p-5">
              {compareData.map((m, idx) => {
                const maxAccuracy = Math.max(...compareData.map(x => parseFloat(String(x.accuracy)) || 0))
                const height = (parseFloat(String(m.accuracy)) || 0) / maxAccuracy * 150
                const colors = [C.primary, '#E8631A', C.success, '#8E44AD', '#C0392B']
                return (
                  <div key={m.name} className="flex-1 text-center">
                    <div className="text-sm font-bold mb-2" style={{ color: colors[idx % colors.length] }}>
                      {m.accuracy}%
                    </div>
                    <div
                      className="w-full rounded-t transition-all duration-300"
                      style={{
                        height: `${height}px`,
                        background: colors[idx % colors.length]
                      }}
                    />
                    <div className="text-xs text-muted mt-2 break-all">
                      {m.name}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 曲线对比 */}
          <div className="card mb-5">
            <h3 className="text-sm font-semibold mb-4 text-[#111827]">
              📉 训练曲线对比
            </h3>
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
              {(['map50_curve', 'map50_95_curve', 'PR_curve'] as const).map(chartKey => {
                const hasAny = compareData.some(m => m.charts && m.charts[chartKey])
                if (!hasAny) return null
                return (
                  <div key={chartKey}>
                    <div className="text-xs text-muted mb-2">
                      {chartKey.replace('_curve', '').toUpperCase()} 曲线
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      {compareData.map((m, idx) => {
                        if (!m.charts || !m.charts[chartKey]) {
                          return <div key={m.name} className="w-[80px] h-[60px] bg-[#F3F4F6] rounded shrink-0" />
                        }
                        const colors = [C.primary, '#E8631A', C.success, '#8E44AD', '#C0392B']
                        return (
                          <img
                            key={m.name}
                            src={m.charts[chartKey]}
                            alt={m.name}
                            className="w-[80px] h-[60px] object-cover rounded shrink-0 transition-all"
                            style={{
                              border: `2px solid ${colors[idx % colors.length]}`
                            }}
                            title={m.name}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* 空状态 */}
      {compareData && compareData.length === 0 && (
        <div className="text-center p-10 text-muted">
          未找到对比数据
        </div>
      )}
    </div>
  )
}

export default ModelCompare
