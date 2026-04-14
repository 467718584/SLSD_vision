import React, { useState, useEffect } from 'react'
import { C } from '../constants'

// 数据集详情页组件
function DatasetDetail({ ds, onBack, onRefresh, onEdit }) {
  const [splitImages, setSplitImages] = useState({ train: [], val: [], test: [] })
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    loadImages()
  }, [ds.name])

  async function loadImages() {
    setLoading(true)
    try {
      const res = await fetch(`/api/dataset/${encodeURIComponent(ds.name)}/split-images`)
      const data = await res.json()
      setSplitImages({
        train: data.train || [],
        val: data.val || [],
        test: data.test || []
      })
    } catch (err) {
      console.error('Failed to load images:', err)
    }
    setLoading(false)
  }

  // 获取图片URL
  function getImageUrl(path) {
    return `/data/${path.replace('SLSD_vision/data/', '')}`
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
            {ds.name}
          </span>
        </div>
        {onEdit && (
          <button onClick={() => onEdit(ds)} className="btn" style={{ background: C.primary, color: 'white' }}>
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
          <InfoItem label="算法类型" value={ds.algoType} />
          <InfoItem label="技术方法" value={ds.techMethod || '目标检测算法'} />
          <InfoItem label="样本数量" value={ds.total?.toLocaleString()} />
          <InfoItem label="标签数" value={Object.keys(ds.classInfo || {}).length} />
          <InfoItem label="分配比例" value={ds.split} />
          <InfoItem label="标注格式" value={ds.annotationType?.toUpperCase() || 'YOLO'} />
          <InfoItem label="维护人员" value={ds.maintainer} />
          <InfoItem label="维护日期" value={ds.maintainDate} />
        </div>
        {ds.desc && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '12px', color: C.gray3 }}>描述</label>
            <p style={{ marginTop: '4px', color: C.gray2, fontSize: '13px' }}>{ds.desc}</p>
          </div>
        )}
        {ds.source && (
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '12px', color: C.gray3 }}>数据来源</label>
            <div style={{ marginTop: '4px' }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                background: '#E3F2FD',
                border: '1px solid #90CAF9',
                color: '#1565C0'
              }}>
                {ds.source}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 类别统计卡片 */}
      {ds.classInfo && Object.keys(ds.classInfo).length > 0 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
            类别统计
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {Object.entries(ds.classInfo).map(([key, value]) => {
              const count = typeof value === 'number' ? value : (value.count || 0)
              const name = typeof value === 'object' ? (value.name || key) : key
              return (
                <div key={key} style={{
                  background: C.primaryBg,
                  border: `1px solid ${C.primaryBd}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  minWidth: '120px'
                }}>
                  <div style={{ fontSize: '11px', color: C.primary, marginBottom: '4px' }}>{name}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: C.primary }}>
                    {count.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 数据集预览卡片 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.gray1 }}>
          数据集预览
        </h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: C.gray3 }}>加载中...</div>
        ) : (
          <>
            {/* Train集 */}
            {splitImages.train.length > 0 && (
              <ImageSection title={`训练集 (${splitImages.train.length})`} images={splitImages.train.slice(0, 6)} onPreview={setPreviewImage} getImageUrl={getImageUrl} />
            )}
            {/* Val集 */}
            {splitImages.val.length > 0 && (
              <ImageSection title={`验证集 (${splitImages.val.length})`} images={splitImages.val.slice(0, 6)} onPreview={setPreviewImage} getImageUrl={getImageUrl} />
            )}
            {/* Test集 */}
            {splitImages.test.length > 0 && (
              <ImageSection title={`测试集 (${splitImages.test.length})`} images={splitImages.test.slice(0, 6)} onPreview={setPreviewImage} getImageUrl={getImageUrl} />
            )}
            {splitImages.train.length === 0 && splitImages.val.length === 0 && splitImages.test.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: C.gray3 }}>暂无预览图片</div>
            )}
          </>
        )}
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div style={styles.previewOverlay} onClick={() => setPreviewImage(null)}>
          <img src={getImageUrl(previewImage)} alt="preview" style={styles.previewImage} />
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
      <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 500, color: C.gray1 }}>
        {value || '-'}
      </div>
    </div>
  )
}

// 图片分区组件
function ImageSection({ title, images, onPreview, getImageUrl }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: C.gray2, marginBottom: '8px' }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {images.map((img, idx) => (
          <img
            key={idx}
            src={getImageUrl(img)}
            alt={`train-${idx}`}
            style={{
              width: '100px',
              height: '75px',
              objectFit: 'cover',
              borderRadius: '6px',
              cursor: 'pointer',
              border: `1px solid ${C.border}`
            }}
            onClick={() => onPreview(img)}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  )
}

const styles = {
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

export default DatasetDetail
