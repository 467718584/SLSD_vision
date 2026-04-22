import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import { C } from '../constants'
import { CheckIcon, XIcon, AlertCircleIcon, InfoIcon } from '../components/Icons'

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

// 通知接口
export interface Notification {
  id: string
  type: NotificationType
  message: string
}

// 通知上下文接口
interface NotificationContextType {
  notifications: Notification[]
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
  removeNotification: (id: string) => void
}

// 颜色配置
const NOTIFICATION_COLORS: Record<NotificationType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: { bg: C.successBg, border: '#A8D5C0', icon: <CheckIcon size={14} /> },
  error: { bg: '#FDECEC', border: '#F5BCBC', icon: <XIcon size={14} /> },
  warning: { bg: C.warningBg, border: '#F9D9B0', icon: <AlertCircleIcon size={14} /> },
  info: { bg: C.primaryBg, border: C.primaryBd, icon: <InfoIcon size={14} /> }
}

const NOTIFICATION_TEXT_COLORS: Record<NotificationType, string> = {
  success: C.success,
  error: '#C0392B',
  warning: C.warning,
  info: C.primary
}

// 最大通知数量
const MAX_NOTIFICATIONS = 3
// 自动消失时间（毫秒）
const AUTO_DISMISS_MS = 3000

function NotificationToast({ 
  notification, 
  onRemove 
}: { 
  notification: Notification
  onRemove: (id: string) => void
}) {
  const [isExiting, setIsExiting] = useState(false)
  const colors = NOTIFICATION_COLORS[notification.type]
  const textColor = NOTIFICATION_TEXT_COLORS[notification.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onRemove(notification.id), 300)
    }, AUTO_DISMISS_MS)

    return () => clearTimeout(timer)
  }, [notification.id, onRemove])

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => onRemove(notification.id), 300)
  }, [notification.id, onRemove])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        minWidth: '280px',
        maxWidth: '400px',
        animation: isExiting ? 'slideOut 0.3s ease-out forwards' : 'slideIn 0.3s ease-out',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
      }}
    >
      {/* 图标 */}
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: colors.border,
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {colors.icon}
      </div>

      {/* 消息 */}
      <div
        style={{
          flex: 1,
          fontSize: '13px',
          color: C.gray1,
          lineHeight: 1.4,
        }}
      >
        {notification.message}
      </div>

      {/* 关闭按钮 */}
      <button
        onClick={handleClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: C.gray3,
          fontSize: '16px',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.border
          e.currentTarget.style.color = textColor
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = C.gray3
        }}
      >
        <XIcon size={14} />
      </button>
    </div>
  )
}

// 样式
const styleSheet = `
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
`

// 创建样式元素
if (typeof document !== 'undefined') {
  const styleId = 'notification-toast-styles'
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style')
    styleEl.id = styleId
    styleEl.textContent = styleSheet
    document.head.appendChild(styleEl)
  }
}

// Toast 容器组件
export function NotificationToastContainer({ 
  notifications, 
  onRemove 
}: { 
  notifications: Notification[]
  onRemove: (id: string) => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'hidden',
      }}
    >
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

// 通知上下文
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const idCounter = useRef(0)

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = `notification-${++idCounter.current}`
    const notification: Notification = { id, type, message }

    setNotifications(prev => {
      // 限制最多 MAX_NOTIFICATIONS 条
      const newNotifications = [...prev, notification]
      if (newNotifications.length > MAX_NOTIFICATIONS) {
        return newNotifications.slice(-MAX_NOTIFICATIONS)
      }
      return newNotifications
    })
  }, [])

  const showSuccess = useCallback((message: string) => addNotification('success', message), [addNotification])
  const showError = useCallback((message: string) => addNotification('error', message), [addNotification])
  const showWarning = useCallback((message: string) => addNotification('warning', message), [addNotification])
  const showInfo = useCallback((message: string) => addNotification('info', message), [addNotification])

  return (
    <NotificationContext.Provider 
      value={{ notifications, showSuccess, showError, showWarning, showInfo, removeNotification }}
    >
      {children}
      <NotificationToastContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

// 自定义 hook
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
