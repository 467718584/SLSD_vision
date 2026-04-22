import React, { useState, useEffect } from 'react'
import { C, MODEL_CAT_COLORS, SITE_COLORS } from '../constants'
import { BarChartIcon, CheckIcon, XIcon, RulerIcon, RepeatIcon, PackageIcon } from './Icons'

// 模型详情页组件
function ModelDetail({ model, datasets, onBack, onEdit }) {
  const [charts, setCharts] = useState({})
  const [predictions, setPredictions] = useState([])
  const [previewImage, setPreviewImage] = useState(null)
  const [predictionMode, setPredictionMode] = useState('single') // 单张/多张预测切换
  const [selectedPrediction, setSelectedPrediction] = useState(0)

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
      if (data.predictions) {
        setPredictions(data.predictions)
      }
    } catch (err) {
      console.error('Failed to load model detail:', err)
    }
  }

  // 精度颜色
  const accuracyColor = model.accuracy >= 95 ? C.success : model.accuracy >= 85 ? C.primary : C.warning

  // 模拟统计数据（实际应从API获取）
  const stats = {
    totalSamples: model.totalSamples || 1250,
    positiveSamples: model.positiveSamples || 892,
    negativeSamples: model.negativeSamples || 358,
    classes: model.classes || ['积水', '漂浮物', '裂缝'],
    imageSize: model.imageSize || '640×640',
    epochs: model.epochs || 100,
    batchSize: model.batchSize || 16,
    trainingTime: model.trainingTime || '2h 34m'
  }

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

      {/* 基本信息 + 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', marginBottom: '16px' }}>
        {/* 基本信息卡片 */}
        <div className="card">
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
            <InfoItem label="模型精度" value={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '60px', height: '6px', background: C.gray6, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${model.accuracy}%`, height: '100%', background: accuracyColor, borderRadius: '3px' }} />
                </div>
                <span style={{ fontWeight: 700, color: accuracyColor }}>{model.accuracy}%</span>
              </div>
            } />
          </div>
          {model.description && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: C.gray8, borderRadius: '6px' }}>
              <label style={{ fontSize: '12px', color: C.gray3 }}>描述</label>
              <p style={{ marginTop: '2px', color: C.gray2, fontSize: '13px', lineHeight: 1.5 }}>{model.description}</p>
            </div>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: C.gray1 }}>
            数据统计
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <StatCard label="总样本数" value={stats.totalSamples} icon={<BarChartIcon size={18} />} color={C.primary} />
            <StatCard label="正样本数" value={stats.positiveSamples} icon={<CheckIcon size={18} />} color={C.success} />
            <StatCard label="负样本数" value={stats.negativeSamples} icon={<XIcon size={18} />} color={C.orange} />
            <StatCard label="图像尺寸" value={stats.imageSize} icon={<RulerIcon size={18} />} color={C.gray2} isText />
            <StatCard label="训练轮次" value={`${stats.epochs} epochs`} icon={<RepeatIcon size={18} />} color={C.primary} />
            <StatCard label="批大小" value={stats.batchSize} icon={<PackageIcon size={18} />} color={C.gray2} />
          </div>
          <div style={{ marginTop: '12px', padding: '10px 12px', background: C.gray8, borderRadius: '6px' }}>
            <label style={{ fontSize: '11px', color: C.gray3 }}>检测类别</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              {stats.classes.map((cls, i) => (
                <span key={i} style={{
                  padding: '2px 8px',
                  background: C.primaryBg,
                  color: C.primary,
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>{cls}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 训练指标曲线 - 合并展示 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
          训练指标曲线
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <ChartItem title="mAP50" src={charts['map50_curve']} onPreview={setPreviewImage} />
          <ChartItem title="mAP50-95" src={charts['map50_95_curve']} onPreview={setPreviewImage} />
          <ChartItem title="训练损失" src={charts['train_box_loss_curve']} onPreview={setPreviewImage} />
          <ChartItem title="验证损失" src={charts['val_box_loss_curve']} onPreview={setPreviewImage} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '16px' }}>
          <ChartItem title="F1曲线" src={charts['BoxF1_curve']} onPreview={setPreviewImage} />
          <ChartItem title="精确率曲线" src={charts['BoxP_curve']} onPreview={setPreviewImage} />
          <ChartItem title="召回率曲线" src={charts['BoxR_curve']} onPreview={setPreviewImage} />
          <ChartItem title="PR曲线" src={charts['BoxPR_curve']} onPreview={setPreviewImage} />
          <ChartItem title="混淆矩阵" src={charts['confusion_matrix']} onPreview={setPreviewImage} />
        </div>
      </div>

      {/* 预测效果展示 - 带标签页切换 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: C.gray1 }}>预测效果</h3>
          {/* 标签页切换 */}
          <div style={{ display: 'flex', background: C.gray7, borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setPredictionMode('single')}
              style={{
                padding: '6px 16px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: predictionMode === 'single' ? C.white : 'transparent',
                color: predictionMode === 'single' ? C.primary : C.gray3,
                boxShadow: predictionMode === 'single' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              单张预测
            </button>
            <button
              onClick={() => setPredictionMode('multi')}
              style={{
                padding: '6px 16px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: predictionMode === 'multi' ? C.white : 'transparent',
                color: predictionMode === 'multi' ? C.primary : C.gray3,
                boxShadow: predictionMode === 'multi' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              多张预测
            </button>
          </div>
        </div>

        {predictionMode === 'single' ? (
          /* 单张预测模式 - 原图与预测结果对比 */
          <div>
            {predictions && predictions.length > 0 ? (
              <div>
                {/* 缩略图选择器 */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {predictions.map((pred, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPrediction(idx)}
                      style={{
                        width: '80px',
                        height: '60px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: `2px solid ${selectedPrediction === idx ? C.primary : C.gray6}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <img
                        src={pred}
                        alt={`预测${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
                {/* 原图与预测结果对比 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: C.gray3, marginBottom: '8px', textAlign: 'center' }}>原图</div>
                    <div style={{
                      background: C.gray7,
                      borderRadius: '8px',
                      padding: '12px',
                      border: `1px solid ${C.border}`
                    }}>
                      <img
                        src={predictions[selectedPrediction]}
                        alt="原图"
                        style={{
                          width: '100%',
                          height: '280px',
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: C.gray3, marginBottom: '8px', textAlign: 'center' }}>预测结果图 [带检测框]</div>
                    <div style={{
                      background: C.gray7,
                      borderRadius: '8px',
                      padding: '12px',
                      border: `1px solid ${C.primaryBd}`
                    }}>
                      <img
                        src={predictions[selectedPrediction]}
                        alt="预测结果"
                        style={{
                          width: '100%',
                          height: '280px',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => onPreview(predictions[selectedPrediction])}
                      />
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        background: C.primaryBg,
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: C.primary,
                        textAlign: 'center'
                      }}>
                        点击图片放大查看
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.chartItem}>
                <div style={styles.chartPlaceholder}>
                  <div style={{ fontSize: '12px', color: C.gray3 }}>预测效果</div>
                  <div style={{ fontSize: '11px', color: C.gray4, marginTop: '4px' }}>暂无预测效果</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 多张预测模式 - 网格展示 */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {predictions && predictions.length > 0 ? (
              predictions.map((src, index) => (
                <div key={index} style={{
                  background: C.gray7,
                  borderRadius: '8px',
                  padding: '8px',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => onPreview(src)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = C.primary}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
                >
                  <img
                    src={src}
                    alt={`预测${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                  />
                  <div style={{ fontSize: '10px', color: C.gray3, marginTop: '4px', textAlign: 'center' }}>
                    预测图 {index + 1}
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.chartItem}>
                <div style={styles.chartPlaceholder}>
                  <div style={{ fontSize: '12px', color: C.gray3 }}>预测效果</div>
                  <div style={{ fontSize: '11px', color: C.gray4, marginTop: '4px' }}>暂无预测效果</div>
                </div>
              </div>
            )}
          </div>
        )}
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
    objectFit: 'contain',
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

// 统计卡片组件
function StatCard({ label, value, icon, color, isText }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: C.gray8,
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        background: isText ? C.gray6 : `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '11px', color: C.gray3 }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: isText ? C.gray2 : color }}>
          {value}
        </div>
      </div>
    </div>
  )
}

export default ModelDetail
