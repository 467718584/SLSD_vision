import React, { useState, useEffect } from 'react'
import { C, MODEL_CAT_COLORS, SITE_COLORS } from '../constants'

// 模型详情页组件
function ModelDetail({ model, datasets, onBack, onEdit }) {
  const [charts, setCharts] = useState({})
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    loadModelDetail()
  }, [model.name])

  async function loadModelDetail() {
    try {
      const res = await fetch(`/api/model/detail/${encodeURIComponent(model.name)}`)
      const data = await res.json()
      if (data.charts) {
        setCharts(data.charts)
      }
    } catch (err) {
      console.error('Failed to load model detail:', err)
    }
  }

  // 精度颜色
  const accuracyColor = model.accuracy >= 95 ? C.success : model.accuracy >= 85 ? C.primary : C.warning

  return (
    <div style={{ padding: '20px' }}>
      {/* 头部 */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} className="btn" style={{ marginRight: '12px' }}>
            ← 返回
          </button>
          <span style={{ fontSize: '18px', fontWeight: 600, color: C.gray1 }}>
            {model.name}
          </span>
        </div>
        {onEdit && (
          <button onClick={() => onEdit(model)} className="btn" style={{ background: C.primary, color: 'white' }}>
            编辑
          </button>
        )}
      </div>

      {/* 基本信息卡片 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
          基本信息
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <InfoItem label="算法名称" value={model.algoName} />
          <InfoItem label="技术方法" value={model.techMethod || '目标检测算法'} />
          <InfoItem label="模型类别" value={
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              background: MODEL_CAT_COLORS[model.category]?.bg || C.gray6,
              color: MODEL_CAT_COLORS[model.category]?.text || C.gray2
            }}>
              {model.category}
            </span>
          } />
          <InfoItem label="模型精度" value={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '60px', height: '6px', background: C.gray6, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${model.accuracy}%`, height: '100%', background: accuracyColor, borderRadius: '3px' }} />
              </div>
              <span style={{ fontWeight: 700, color: accuracyColor }}>{model.accuracy}%</span>
            </div>
          } />
          <InfoItem label="应用现场" value={
            model.site ? (
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                background: SITE_COLORS[model.site]?.bg || C.gray6,
                color: SITE_COLORS[model.site]?.text || C.gray2
              }}>
                {model.site}
              </span>
            ) : '-'
          } />
          <InfoItem label="使用数据集" value={
            <span style={{ color: C.primary }}>{model.dataset || '-'}</span>
          } />
          <InfoItem label="维护人员" value={model.maintainer} />
          <InfoItem label="维护日期" value={model.maintainDate} />
        </div>
        {model.description && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '12px', color: C.gray3 }}>描述</label>
            <p style={{ marginTop: '4px', color: C.gray2, fontSize: '13px' }}>{model.description}</p>
          </div>
        )}
      </div>

      {/* 训练曲线卡片 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
          训练曲线
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <ChartItem
            title="mAP50"
            src={charts['map50_curve']}
            onPreview={setPreviewImage}
          />
          <ChartItem
            title="mAP50-95"
            src={charts['map50_95_curve']}
            onPreview={setPreviewImage}
          />
          <ChartItem
            title="训练损失"
            src={charts['train_box_loss_curve']}
            onPreview={setPreviewImage}
          />
          <ChartItem
            title="验证损失"
            src={charts['val_box_loss_curve']}
            onPreview={setPreviewImage}
          />
        </div>
      </div>

      {/* PR曲线和混淆矩阵 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
          PR曲线与混淆矩阵
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          <ChartItem title="F1曲线" src={charts['F1_curve']} onPreview={setPreviewImage} />
          <ChartItem title="精确率曲线" src={charts['precision_curve']} onPreview={setPreviewImage} />
          <ChartItem title="召回率曲线" src={charts['recall_curve']} onPreview={setPreviewImage} />
          <ChartItem title="PR曲线" src={charts['PR_curve']} onPreview={setPreviewImage} />
          <ChartItem title="混淆矩阵" src={charts['confusion_matrix']} onPreview={setPreviewImage} />
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div style={styles.previewOverlay} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="preview" style={styles.previewImage} />
          <button onClick={() => setPreviewImage(null)} style={styles.previewClose}>×</button>
        </div>
      )}
    </div>
  )
}

// 信息项组件
function InfoItem({ label, value }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: C.gray3 }}>{label}</label>
      <div style={{ marginTop: '4px', fontSize: '13px', color: C.gray1 }}>
        {value}
      </div>
    </div>
  )
}

// 图表项组件
function ChartItem({ title, src, onPreview }) {
  if (!src) {
    return (
      <div style={styles.chartItem}>
        <div style={styles.chartPlaceholder}>
          <div style={{ fontSize: '12px', color: C.gray3 }}>{title}</div>
          <div style={{ fontSize: '11px', color: C.gray4, marginTop: '4px' }}>暂无数据</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.chartItem}>
      <img
        src={src}
        alt={title}
        style={styles.chartImage}
        onClick={() => onPreview(src)}
      />
      <div style={styles.chartLabel}>{title}</div>
    </div>
  )
}

const styles = {
  chartItem: {
    textAlign: 'center'
  },
  chartImage: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: `1px solid ${C.border}`,
    cursor: 'pointer'
  },
  chartPlaceholder: {
    width: '100%',
    height: '120px',
    background: C.gray7,
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${C.border}`
  },
  chartLabel: {
    fontSize: '11px',
    color: C.gray3,
    marginTop: '6px'
  },
  previewOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  previewImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: '8px'
  },
  previewClose: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontSize: '20px',
    cursor: 'pointer'
  }
}

export default ModelDetail
