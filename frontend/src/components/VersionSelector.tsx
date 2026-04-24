import React, { useState } from 'react'
import { C } from '../constants'
import { ChevronDownIcon, CheckIcon } from './Icons'

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
  params?: ModelParam[]
}

export interface ModelParam {
  id: number
  versionId: number
  paramType: string
  fileName: string
  filePath: string
  fileSize: number
  description?: string
  isPrimary: boolean
  createdAt: string
}

// 参数类型颜色映射
const PARAM_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  onnx: { bg: '#e3f2fd', text: '#1565c0' },
  om: { bg: '#fff3e0', text: '#e65100' },
  rknn: { bg: '#e8f5e9', text: '#2e7d32' },
  tflite: { bg: '#fce4ec', text: '#c2185b' },
  saved_model: { bg: '#f3e5f5', text: '#7b1fa2' },
  pb: { bg: '#e0f7fa', text: '#00838f' },
  others: { bg: C.gray6, text: C.gray2 }
}

interface VersionSelectorProps {
  versions: ModelVersion[]
  activeVersion: string
  onVersionChange: (versionName: string) => void
  onCreateVersion: () => void
  onSetDefault?: (versionName: string) => void
  loading?: boolean
}

// 版本选择器组件
export function VersionSelector({
  versions,
  activeVersion,
  onVersionChange,
  onCreateVersion,
  onSetDefault,
  loading
}: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeVer = versions.find(v => v.versionName === activeVersion)
  const isDefault = activeVer?.isDefault

  return (
    <div className="version-selector" style={{ position: 'relative' }}>
      <div className="flex items-center gap-2">
        {/* 版本下拉选择器 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              minWidth: '140px'
            }}
          >
            <span style={{ fontWeight: 600 }}>{activeVersion || '选择版本'}</span>
            {isDefault && (
              <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>
                默认
              </span>
            )}
            <ChevronDownIcon size={14} style={{ marginLeft: 'auto', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* 下拉列表 */}
          {isOpen && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
                onClick={() => setIsOpen(false)}
              />
              <div
                className="version-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  zIndex: 1000
                }}
              >
                {loading ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: C.gray4 }}>
                    加载中...
                  </div>
                ) : versions.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: C.gray4 }}>
                    暂无版本
                  </div>
                ) : (
                  <>
                    {versions.map(v => (
                      <div
                        key={v.versionName}
                        onClick={() => {
                          onVersionChange(v.versionName)
                          setIsOpen(false)
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: v.versionName === activeVersion ? C.gray6 : 'transparent',
                          borderBottom: `1px solid ${C.gray6}`,
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => {
                          if (v.versionName !== activeVersion) {
                            (e.target as HTMLElement).style.background = C.gray7
                          }
                        }}
                        onMouseLeave={e => {
                          if (v.versionName !== activeVersion) {
                            (e.target as HTMLElement).style.background = 'transparent'
                          }
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: C.gray1 }}>{v.versionName}</span>
                            {v.isDefault && (
                              <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 4px' }}>
                                默认
                              </span>
                            )}
                            {v.accuracy ? (
                              <span style={{ fontSize: '11px', color: C.gray4 }}>
                                mAP: {v.accuracy}%
                              </span>
                            ) : null}
                          </div>
                          {v.description && (
                            <div style={{ fontSize: '11px', color: C.gray4, marginTop: '2px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {v.description}
                            </div>
                          )}
                        </div>
                        {v.versionName === activeVersion && (
                          <CheckIcon size={14} style={{ color: C.primary }} />
                        )}
                      </div>
                    ))}
                  </>
                )}

                {/* 新建版本按钮 */}
                <div
                  onClick={() => {
                    onCreateVersion()
                    setIsOpen(false)
                  }}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    color: C.primary,
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderTop: `1px solid ${C.border}`
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.gray7)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
                  新建版本
                </div>
              </div>
            </>
          )}
        </div>

        {/* 版本信息 */}
        {activeVer && (
          <div className="flex items-center gap-2">
            {activeVer.accuracy && (
              <span className="text-xs text-muted">
                mAP50-95: <strong style={{ color: C.primary }}>{activeVer.accuracy}%</strong>
              </span>
            )}
            {activeVer.total_epochs && (
              <span className="text-xs text-muted">
                Epochs: <strong>{activeVer.total_epochs}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 参数文件列表组件
interface ParamListProps {
  params: ModelParam[]
  onDelete?: (paramId: number) => void
  onDownload?: (paramId: number) => void
}

export function ParamList({ params, onDelete, onDownload }: ParamListProps) {
  if (!params || params.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: C.gray4,
        background: C.gray7,
        borderRadius: '6px',
        border: `1px dashed ${C.border}`
      }}>
        暂无补充参数文件
      </div>
    )
  }

  // 按类型分组
  const groupedParams = params.reduce((acc, p) => {
    const type = p.paramType || 'others'
    if (!acc[type]) acc[type] = []
    acc[type].push(p)
    return acc
  }, {} as Record<string, ModelParam[]>)

  return (
    <div className="param-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Object.entries(groupedParams).map(([type, items]) => {
        const colors = PARAM_TYPE_COLORS[type] || PARAM_TYPE_COLORS.others
        return (
          <div key={type} style={{
            padding: '12px',
            background: colors.bg,
            borderRadius: '8px',
            border: `1px solid ${C.border}`
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: colors.text,
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              {type} ({items.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map(param => (
                <div
                  key={param.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'white',
                    borderRadius: '4px',
                    border: `1px solid ${C.border}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', color: C.gray1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {param.fileName}
                    </span>
                    <span style={{ fontSize: '11px', color: C.gray4 }}>
                      ({(param.fileSize / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {onDownload && (
                      <button
                        onClick={() => onDownload(param.id)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        下载
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(param.id)}
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
