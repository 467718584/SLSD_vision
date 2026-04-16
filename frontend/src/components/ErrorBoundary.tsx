import React from 'react'
import { AlertCircleIcon } from './Icons'

// ErrorBoundary Props
interface ErrorBoundaryProps {
  children?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

// React Error Boundary 组件
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新state使下一次渲染能够显示降级的UI
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 记录错误日志
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // 如果有onError回调，调用它
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  handleGoBack = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      // 默认行为：history.back() 保留在当前页面，不跳转首页
      if (window.history.length > 1) {
        window.history.back()
      }
      // 如果没有历史记录，什么都不做，保留当前页面
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.icon}><AlertCircleIcon size={48} /></div>
            <h2 style={styles.title}>出错了</h2>
            <p style={styles.message}>
              抱歉，应用程序遇到了一个错误。
            </p>

            {this.props.showDetails && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>错误详情</summary>
                <pre style={styles.pre}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.buttons}>
              <button onClick={this.handleGoBack} style={styles.secondaryBtn}>
                返回
              </button>
              <button onClick={this.handleReload} style={styles.primaryBtn}>
                重新加载
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#F3F4F6',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1F2937',
    margin: '0 0 12px 0'
  },
  message: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 24px 0',
    lineHeight: 1.6
  },
  details: {
    textAlign: 'left' as const,
    marginBottom: '24px'
  },
  summary: {
    fontSize: '13px',
    color: '#6B7280',
    cursor: 'pointer',
    marginBottom: '8px'
  },
  pre: {
    fontSize: '11px',
    background: '#F3F4F6',
    padding: '12px',
    borderRadius: '6px',
    overflow: 'auto' as const,
    maxHeight: '200px',
    color: '#DC2626'
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  primaryBtn: {
    padding: '10px 24px',
    background: '#1462A8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  secondaryBtn: {
    padding: '10px 24px',
    background: 'white',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  }
}

export default ErrorBoundary
