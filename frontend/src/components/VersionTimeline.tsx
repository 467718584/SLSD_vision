import React from 'react'
import { C } from '../constants'

// 版本类型定义
export interface ModelVersion {
  id: number
  modelName: string
  versionName: string
  description?: string
  datasetName?: string
  datasetVersion?: string
  accuracy?: number
  map50?: number
  map50_95?: number
  total_epochs?: number
  createdAt: string
  createdBy?: string
  isDefault?: boolean
  isActive?: boolean
}

interface VersionTimelineProps {
  versions: ModelVersion[]
  activeVersion?: string
  onVersionSelect: (versionName: string) => void
  onSetDefault?: (versionName: string) => void
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

// 版本对比组件 - 用于两个版本之间的对比
interface VersionDiffProps {
  version1: ModelVersion
  version2?: ModelVersion
}

export function VersionDiff({ version1, version2 }: VersionDiffProps) {
  if (!version2) {
    return (
      <div className="text-center text-muted" style={{ padding: '20px' }}>
        请选择一个版本进行对比
      </div>
    )
  }

  const metrics = [
    { label: 'mAP50', v1: version1.map50, v2: version2.map50, unit: '%' },
    { label: 'mAP50-95', v1: version1.map50_95, v2: version2.map50_95, unit: '%' },
    { label: '精度', v1: version1.accuracy, v2: version2.accuracy, unit: '%' },
    { label: '训练轮次', v1: version1.total_epochs, v2: version2.total_epochs, unit: '' }
  ]

  return (
    <div className="card">
      <div className="card-header" style={{ padding: '16px 20px' }}>
        <h3 className="card-title">版本对比</h3>
      </div>
      <div className="card-body" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
          {/* 版本1 */}
          <div style={{ textAlign: 'center' }}>
            <div className="badge badge-primary" style={{ fontSize: '14px', padding: '6px 12px' }}>
              {version1.versionName}
            </div>
            {version1.description && (
              <p className="text-sm text-muted" style={{ marginTop: '8px' }}>
                {version1.description}
              </p>
            )}
          </div>
          
          {/* 对比箭头 */}
          <div style={{ fontSize: '24px', color: C.gray4 }}>↔</div>
          
          {/* 版本2 */}
          <div style={{ textAlign: 'center' }}>
            <div className="badge badge-secondary" style={{ fontSize: '14px', padding: '6px 12px' }}>
              {version2.versionName}
            </div>
            {version2.description && (
              <p className="text-sm text-muted" style={{ marginTop: '8px' }}>
                {version2.description}
              </p>
            )}
          </div>
        </div>

        {/* 指标对比表 */}
        <div style={{ marginTop: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: C.gray4 }}>指标</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: C.primary }}>{version1.versionName}</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: C.gray2 }}>{version2.versionName}</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>变化</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(metric => {
                const v1 = metric.v1 || 0
                const v2 = metric.v2 || 0
                const diff = v1 - v2
                const diffPercent = v2 !== 0 ? ((diff / v2) * 100).toFixed(1) : '0'
                
                return (
                  <tr key={metric.label} style={{ borderBottom: `1px solid ${C.gray6}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{metric.label}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: C.primary, fontWeight: 600 }}>
                      {metric.v1 !== undefined ? `${v1.toFixed(2)}${metric.unit}` : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: C.gray2 }}>
                      {metric.v2 !== undefined ? `${v2.toFixed(2)}${metric.unit}` : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {diff !== 0 ? (
                        <span style={{ color: diff > 0 ? C.success : C.danger, fontWeight: 600 }}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(2)}{metric.unit}
                          <span className="text-xs" style={{ marginLeft: '4px' }}>
                            ({diff > 0 ? '+' : ''}{diffPercent}%)
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// 版本历史时间线组件
export function VersionTimeline({ versions, activeVersion, onVersionSelect, onSetDefault }: VersionTimelineProps) {
  if (!versions || versions.length === 0) {
    return (
      <div className="text-center" style={{ padding: '40px 20px', color: C.gray4 }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
        <div className="text-lg font-medium">暂无版本记录</div>
        <div className="text-sm" style={{ marginTop: '8px' }}>
          点击上方「新建版本」创建第一个版本
        </div>
      </div>
    )
  }

  return (
    <div className="version-timeline" style={{ padding: '16px 0' }}>
      <div style={{ 
        borderLeft: `2px solid ${C.gray6}`, 
        marginLeft: '20px',
        paddingLeft: '24px'
      }}>
        {versions.map((version, index) => {
          const isActive = version.versionName === activeVersion
          const isLatest = index === 0 // 按时间倒序，第一条是最新的
          
          return (
            <div
              key={version.versionName}
              onClick={() => onVersionSelect(version.versionName)}
              style={{
                position: 'relative',
                marginBottom: index === versions.length - 1 ? 0 : '20px',
                cursor: 'pointer'
              }}
            >
              {/* 时间线节点 */}
              <div style={{
                position: 'absolute',
                left: '-31px',
                top: '4px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: isActive ? C.primary : isLatest ? C.success : C.gray4,
                border: `2px solid ${isActive ? C.primary : 'white'}`,
                boxShadow: isActive ? `0 0 0 4px ${C.primary}30` : 'none',
                transition: 'all 0.2s'
              }} />
              
              {/* 版本卡片 */}
              <div style={{
                background: isActive ? `${C.primary}08` : 'white',
                border: `1px solid ${isActive ? C.primary : C.border}`,
                borderRadius: '8px',
                padding: '12px 16px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.borderColor = C.primary
                  ;(e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px ${C.primary}20`
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.borderColor = C.border
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }
              }}
              >
                {/* 版本头部 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{
                      fontWeight: 700,
                      fontSize: '15px',
                      color: isActive ? C.primary : C.gray1
                    }}>
                      {version.versionName}
                    </span>
                    {version.isDefault && (
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>
                        默认
                      </span>
                    )}
                    {isLatest && !version.isDefault && (
                      <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                        最新
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted">
                    {formatDate(version.createdAt)}
                  </span>
                </div>
                
                {/* 版本描述 */}
                {version.description && (
                  <p className="text-sm text-muted mb-2" style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {version.description}
                  </p>
                )}
                
                {/* 版本指标 */}
                <div className="flex items-center gap-4 text-xs">
                  {version.map50 !== undefined && version.map50 > 0 && (
                    <span style={{ color: C.gray4 }}>
                      mAP50: <strong style={{ color: C.success }}>{version.map50}%</strong>
                    </span>
                  )}
                  {version.map50_95 !== undefined && version.map50_95 > 0 && (
                    <span style={{ color: C.gray4 }}>
                      mAP50-95: <strong style={{ color: C.success }}>{version.map50_95}%</strong>
                    </span>
                  )}
                  {version.accuracy !== undefined && version.accuracy > 0 && (
                    <span style={{ color: C.gray4 }}>
                      精度: <strong style={{ color: C.primary }}>{version.accuracy}%</strong>
                    </span>
                  )}
                  {version.total_epochs !== undefined && version.total_epochs > 0 && (
                    <span style={{ color: C.gray4 }}>
                      Epochs: <strong>{version.total_epochs}</strong>
                    </span>
                  )}
                  {version.datasetName && (
                    <span style={{ color: C.gray4 }}>
                      数据集: <strong>{version.datasetName}</strong>
                    </span>
                  )}
                </div>
                
                {/* 操作按钮 */}
                {isActive && onSetDefault && !version.isDefault && (
                  <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${C.gray6}` }}>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onSetDefault(version.versionName)
                      }}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '11px' }}
                    >
                      设为默认版本
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
