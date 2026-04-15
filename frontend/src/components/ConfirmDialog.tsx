import React from 'react'
import { C } from '../constants'

// ConfirmDialog Props 类型定义
export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

// 确认删除弹窗组件
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '确认删除',
  message = '确定要删除吗？此操作不可撤销。',
  confirmText = '删除',
  cancelText = '取消',
  type = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const colors = {
    danger: { bg: '#FEE2E2', border: '#FECACA', text: '#DC2626', btn: '#DC2626' },
    warning: { bg: '#FEF3C7', border: '#FDE68A', text: '#D97706', btn: '#D97706' },
    info: { bg: '#E3F2FD', border: '#90CAF9', text: '#1565C0', btn: '#1565C0' }
  }

  const c = colors[type] || colors.danger

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div style={{ ...styles.header, borderBottom: `2px solid ${c.border}` }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: c.text }}>
            {title}
          </h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {/* 内容 */}
        <div style={styles.content}>
          <div style={{
            padding: '16px',
            background: c.bg,
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: c.text }}>
              {message}
            </p>
          </div>
        </div>

        {/* 按钮 */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            style={{
              ...styles.confirmBtn,
              background: c.btn
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden'
  },
  header: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#9CA3AF',
    padding: '0',
    lineHeight: 1
  },
  content: {
    padding: '0 20px 16px'
  },
  footer: {
    padding: '12px 20px',
    background: '#F9FAFB',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid #E5E7EB'
  },
  cancelBtn: {
    padding: '10px 20px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: 'white',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500
  },
  confirmBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500
  }
}

export default ConfirmDialog
