import React from 'react'
import { C } from '../constants'

// 数据集详情页组件
// 完整实现从 monolithic HTML 迁移
function DatasetDetail({ ds, onBack, onRefresh }) {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={onBack} className="btn" style={{ marginRight: '12px' }}>
          ← 返回
        </button>
        <span style={{ fontSize: '18px', fontWeight: 600, color: C.gray1 }}>
          {ds.name}
        </span>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: C.gray3 }}>算法类型</label>
            <div style={{ marginTop: '4px' }}>{ds.algoType}</div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: C.gray3 }}>样本数量</label>
            <div style={{ marginTop: '4px', fontWeight: 600 }}>{ds.total}</div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: C.gray3 }}>维护人员</label>
            <div style={{ marginTop: '4px' }}>{ds.maintainer}</div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: C.gray3 }}>维护日期</label>
            <div style={{ marginTop: '4px' }}>{ds.maintainDate}</div>
          </div>
        </div>

        {ds.desc && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '12px', color: C.gray3 }}>描述</label>
            <p style={{ marginTop: '4px', color: C.gray2 }}>{ds.desc}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DatasetDetail
