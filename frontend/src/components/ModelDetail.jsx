import React from 'react'
import { C } from '../constants'

// 模型详情页组件
// 完整实现从 monolithic HTML 迁移
function ModelDetail({ model, datasets, onBack }) {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={onBack} className="btn" style={{ marginRight: '12px' }}>
          ← 返回
        </button>
        <span style={{ fontSize: '18px', fontWeight: 600, color: C.gray1 }}>
          {model.name}
        </span>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: C.gray3 }}>算法名称</label>
            <div style={{ marginTop: '4px' }}>{model.algoName}</div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: C.gray3 }}>模型精度</label>
            <div style={{ marginTop: '4px', fontWeight: 600, color: C.primary }}>
              {model.accuracy}%
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: C.gray3 }}>模型类别</label>
            <div style={{ marginTop: '4px' }}>{model.category}</div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: C.gray3 }}>维护人员</label>
            <div style={{ marginTop: '4px' }}>{model.maintainer}</div>
          </div>
        </div>

        {model.description && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '12px', color: C.gray3 }}>描述</label>
            <p style={{ marginTop: '4px', color: C.gray2 }}>{model.description}</p>
          </div>
        )}

        {model.dataset && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '12px', color: C.gray3 }}>使用数据集</label>
            <div style={{ marginTop: '4px', color: C.primary }}>{model.dataset}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelDetail
