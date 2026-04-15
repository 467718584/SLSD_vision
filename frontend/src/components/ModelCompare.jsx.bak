import React, { useState } from 'react'
import { C } from '../constants'

// 模型性能对比组件
function ModelCompare({ models, onBack }) {
  const [selectedModels, setSelectedModels] = useState([])
  const [compareData, setCompareData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 切换模型选择
  function toggleModel(modelName) {
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
    } catch (err) {
      setError('请求失败: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* 头部 */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {onBack && (
            <button onClick={onBack} className="btn" style={{ marginRight: '12px' }}>
              ← 返回
            </button>
          )}
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.gray1 }}>
            🤖 模型性能对比
          </h2>
        </div>
        {selectedModels.length >= 2 && (
          <button
            onClick={handleCompare}
            disabled={loading}
            className="btn"
            style={{ background: C.primary, color: 'white' }}
          >
            {loading ? '加载中...' : '开始对比'}
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={styles.error}>{error}</div>
      )}

      {/* 模型选择 */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
          选择模型 (已选 {selectedModels.length}/5)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {models.map(model => {
            const isSelected = selectedModels.includes(model.name)
            return (
              <div
                key={model.name}
                onClick={() => toggleModel(model.name)}
                style={{
                  ...styles.modelCard,
                  border: isSelected ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                  background: isSelected ? `${C.primary}10` : 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, fontSize: '13px', color: C.gray1 }}>
                    {model.name}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: C.gray3, marginTop: '4px', marginLeft: '24px' }}>
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
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
              📊 性能指标对比
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>指标</th>
                    {compareData.map(m => (
                      <th key={m.name} style={styles.th}>{m.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.td}>算法名称</td>
                    {compareData.map(m => (
                      <td key={m.name} style={styles.td}>{m.algoName}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={styles.td}>模型精度</td>
                    {compareData.map(m => (
                      <td key={m.name} style={{ ...styles.td, fontWeight: 700, color: C.primary }}>
                        {m.accuracy}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={styles.td}>模型类别</td>
                    {compareData.map(m => (
                      <td key={m.name} style={styles.td}>{m.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={styles.td}>技术方法</td>
                    {compareData.map(m => (
                      <td key={m.name} style={styles.td}>{m.techMethod}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={styles.td}>应用现场</td>
                    {compareData.map(m => (
                      <td key={m.name} style={styles.td}>{m.site || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={styles.td}>关联数据集</td>
                    {compareData.map(m => (
                      <td key={m.name} style={styles.td}>{m.dataset || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={styles.td}>维护人员</td>
                    {compareData.map(m => (
                      <td key={m.name} style={styles.td}>{m.maintainer}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={styles.td}>维护日期</td>
                    {compareData.map(m => (
                      <td key={m.name} style={styles.td}>{m.maintainDate}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 精度柱状图 */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
              📈 精度对比
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '200px', padding: '20px' }}>
              {compareData.map((m, idx) => {
                const maxAccuracy = Math.max(...compareData.map(x => parseFloat(x.accuracy) || 0))
                const height = (parseFloat(m.accuracy) || 0) / maxAccuracy * 150
                const colors = [C.primary, '#E8631A', C.success, '#8E44AD', '#C0392B']
                return (
                  <div key={m.name} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: colors[idx % colors.length], marginBottom: '8px' }}>
                      {m.accuracy}%
                    </div>
                    <div style={{
                      width: '100%',
                      height: `${height}px`,
                      background: colors[idx % colors.length],
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s'
                    }} />
                    <div style={{ fontSize: '11px', color: C.gray3, marginTop: '8px', wordBreak: 'break-all' }}>
                      {m.name}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 曲线对比 */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
              📉 训练曲线对比
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {['map50_curve', 'map50_95_curve', 'PR_curve'].map(chartKey => {
                const hasAny = compareData.some(m => m.charts && m.charts[chartKey])
                if (!hasAny) return null
                return (
                  <div key={chartKey}>
                    <div style={{ fontSize: '12px', color: C.gray3, marginBottom: '8px' }}>
                      {chartKey.replace('_curve', '').toUpperCase()} 曲线
                    </div>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                      {compareData.map((m, idx) => {
                        if (!m.charts || !m.charts[chartKey]) {
                          return <div key={m.name} style={{ width: '80px', height: '60px', background: C.gray7, borderRadius: '4px', flexShrink: 0 }} />
                        }
                        const colors = [C.primary, '#E8631A', C.success, '#8E44AD', '#C0392B']
                        return (
                          <img
                            key={m.name}
                            src={m.charts[chartKey]}
                            alt={m.name}
                            style={{
                              width: '80px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: `2px solid ${colors[idx % colors.length]}`,
                              flexShrink: 0
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
        <div style={{ textAlign: 'center', padding: '60px', color: C.gray3 }}>
          未找到对比数据
        </div>
      )}
    </div>
  )
}

const styles = {
  error: {
    padding: '12px 16px',
    background: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px'
  },
  modelCard: {
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    background: C.gray7,
    borderBottom: `1px solid ${C.border}`,
    fontWeight: 600,
    color: C.gray2
  },
  td: {
    padding: '10px 12px',
    borderBottom: `1px solid ${C.border}`,
    color: C.gray1
  }
}

export default ModelCompare
