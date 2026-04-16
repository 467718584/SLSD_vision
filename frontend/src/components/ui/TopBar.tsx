// Roboflow风格顶部栏组件
import React, { useState } from 'react'
import { SearchIcon, BellIcon, ChevronRightIcon, UserIcon, SettingsIcon, LogOutIcon } from '../Icons'
import { Badge } from './Badge'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

export interface TopBarProps {
  breadcrumbs?: BreadcrumbItem[]
  user?: {
    username: string
    role?: string
    avatar?: string
  }
  notifications?: {
    id: string
    title: string
    message: string
    time: string
    read?: boolean
  }[]
  onSearch?: (query: string) => void
  onNotificationClick?: (id: string) => void
  onUserMenuClick?: (action: string) => void
  className?: string
}

const TopBar: React.FC<TopBarProps> = ({
  breadcrumbs = [],
  user,
  notifications = [],
  onSearch,
  onNotificationClick,
  onUserMenuClick,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    padding: '0 24px',
    background: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  }

  const leftSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  }

  const searchWrapperStyles: React.CSSProperties = {
    position: 'relative',
    width: '320px',
  }

  const searchInputStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px 8px 36px',
    fontSize: '13px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    background: '#F7F8FA',
    outline: 'none',
    transition: 'all 150ms ease',
  }

  const searchIconStyles: React.CSSProperties = {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94A3B8',
    pointerEvents: 'none',
  }

  const rightSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const iconButtonStyles = (active?: boolean): React.CSSProperties => ({
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '8px',
    background: active ? '#EFF6FF' : 'transparent',
    color: active ? '#2563EB' : '#64748B',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    position: 'relative',
  })

  const notificationBadgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    minWidth: '16px',
    height: '16px',
    padding: '0 4px',
    fontSize: '10px',
    fontWeight: 600,
    color: '#FFFFFF',
    background: '#EF4444',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const userButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px 6px 6px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    background: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  }

  const avatarStyles: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#EFF6FF',
    color: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
  }

  const usernameStyles: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1E293B',
  }

  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '4px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    minWidth: '280px',
    zIndex: 100,
    animation: 'dropdownFadeIn 150ms ease',
  }

  const notificationItemStyles: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #F1F5F9',
    cursor: 'pointer',
    transition: 'background 100ms ease',
  }

  const menuItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    fontSize: '13px',
    color: '#1E293B',
    cursor: 'pointer',
    transition: 'background 100ms ease',
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchQuery)
    }
  }

  return (
    <div style={containerStyles} className={className}>
      {/* Left: Breadcrumbs */}
      <div style={leftSectionStyles}>
        {breadcrumbs.length > 0 && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRightIcon size={14} style={{ color: '#94A3B8' }} />
                )}
                {item.onClick ? (
                  <button
                    onClick={item.onClick}
                    style={{
                      fontSize: '13px',
                      color: index === breadcrumbs.length - 1 ? '#1E293B' : '#64748B',
                      fontWeight: index === breadcrumbs.length - 1 ? 500 : 400,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={(e) => {
                      if (index !== breadcrumbs.length - 1) {
                        e.currentTarget.style.background = '#F1F5F9'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    style={{
                      fontSize: '13px',
                      color: index === breadcrumbs.length - 1 ? '#1E293B' : '#64748B',
                      fontWeight: index === breadcrumbs.length - 1 ? 500 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
      </div>

      {/* Right: Search + Notifications + User */}
      <div style={rightSectionStyles}>
        {/* Search */}
        <div style={searchWrapperStyles}>
          <span style={searchIconStyles}>
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            placeholder="搜索数据集、模型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            style={searchInputStyles}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563EB'
              e.target.style.background = '#FFFFFF'
              e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E2E8F0'
              e.target.style.background = '#F7F8FA'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            style={iconButtonStyles(showNotifications)}
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowUserMenu(false)
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F1F5F9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showNotifications ? '#EFF6FF' : 'transparent'
            }}
          >
            <BellIcon size={18} />
            {unreadCount > 0 && (
              <span style={notificationBadgeStyles}>{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div style={dropdownStyles}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
                  通知
                </span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                  暂无通知
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    style={notificationItemStyles}
                    onClick={() => {
                      onNotificationClick?.(notification.id)
                      setShowNotifications(false)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F7F8FA'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B', marginBottom: '4px' }}>
                      {notification.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                      {notification.message}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {notification.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              style={userButtonStyles}
              onClick={() => {
                setShowUserMenu(!showUserMenu)
                setShowNotifications(false)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1'
                e.currentTarget.style.background = '#F7F8FA'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0'
                e.currentTarget.style.background = '#FFFFFF'
              }}
            >
              <div style={avatarStyles}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <span style={usernameStyles}>{user.username}</span>
            </button>

            {showUserMenu && (
              <div style={dropdownStyles}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>
                    {user.username}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {user.role === 'admin' ? '管理员' : '用户'}
                  </div>
                </div>
                <div
                  style={menuItemStyles}
                  onClick={() => {
                    onUserMenuClick?.('settings')
                    setShowUserMenu(false)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F7F8FA'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <SettingsIcon size={16} />
                  <span>设置</span>
                </div>
                <div
                  style={{ ...menuItemStyles, color: '#EF4444' }}
                  onClick={() => {
                    onUserMenuClick?.('logout')
                    setShowUserMenu(false)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FEF2F2'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <LogOutIcon size={16} />
                  <span>退出登录</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default TopBar
