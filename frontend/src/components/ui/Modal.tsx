// Roboflow风格弹窗组件
import React, { useEffect, useCallback } from 'react'
import { XIcon } from '../Icons'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  footer?: React.ReactNode
  className?: string
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  footer,
  className = '',
}) => {
  // ESC键关闭
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const sizeMap = {
    sm: '380px',
    md: '480px',
    lg: '600px',
    xl: '800px',
  }

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    animation: 'fadeIn 150ms ease',
  }

  const modalStyles: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '12px',
    width: '100%',
    maxWidth: sizeMap[size],
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    animation: 'slideUp 150ms ease',
    margin: '16px',
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
  }

  const titleStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1E293B',
    margin: 0,
  }

  const closeButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    background: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#94A3B8',
    transition: 'all 150ms ease',
  }

  const contentStyles: React.CSSProperties = {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  }

  const footerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '16px 20px',
    borderTop: '1px solid #E2E8F0',
    background: '#F7F8FA',
  }

  if (!isOpen) return null

  return (
    <div style={overlayStyles} onClick={closeOnOverlay ? onClose : undefined}>
      <div
        className={className}
        style={modalStyles}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div style={headerStyles}>
            {title && <h3 style={titleStyles}>{title}</h3>}
            {showCloseButton && (
              <button
                style={closeButtonStyles}
                onClick={onClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F1F5F9'
                  e.currentTarget.style.color = '#64748B'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#94A3B8'
                }}
              >
                <XIcon size={18} />
              </button>
            )}
          </div>
        )}
        <div style={contentStyles}>{children}</div>
        {footer && <div style={footerStyles}>{footer}</div>}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// 确认对话框组件
export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  type?: 'default' | 'danger'
  loading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'default',
  loading = false,
}) => {
  const confirmButtonStyles: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    background: type === 'danger' ? '#EF4444' : '#2563EB',
    color: '#FFFFFF',
    transition: 'all 150ms ease',
  }

  const cancelButtonStyles: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  }

  const messageStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748B',
    lineHeight: 1.6,
    marginBottom: '8px',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" showCloseButton={false}>
      <p style={messageStyles}>{message}</p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button
          style={cancelButtonStyles}
          onClick={onClose}
          disabled={loading}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F7F8FA'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF'
          }}
        >
          {cancelText}
        </button>
        <button
          style={confirmButtonStyles}
          onClick={onConfirm}
          disabled={loading}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = type === 'danger' ? '#DC2626' : '#1D4ED8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = type === 'danger' ? '#EF4444' : '#2563EB'
          }}
        >
          {loading ? '处理中...' : confirmText}
        </button>
      </div>
    </Modal>
  )
}

export default Modal
