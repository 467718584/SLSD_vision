import { useEffect, useCallback } from 'react'

/**
 * 键盘快捷键Hook
 * @param {Object} shortcuts - 快捷键映射 { 'ctrl+s': handler, 'escape': handler }
 * @param {Object} options - 选项 { enabled: true, preventDefault: true }
 */
export function useKeyboardShortcuts(shortcuts, options = {}) {
  const { enabled = true, preventDefault = true } = options

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return

    // 构建快捷键标识
    const keys = []
    if (event.ctrlKey || event.metaKey) keys.push('ctrl')
    if (event.shiftKey) keys.push('shift')
    if (event.altKey) keys.push('alt')
    
    const key = event.key.toLowerCase()
    if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
      keys.push(key)
    }
    
    const shortcutId = keys.join('+')
    
    // 检查是否有对应的处理器
    const handler = shortcuts[shortcutId]
    if (handler) {
      if (preventDefault) {
        event.preventDefault()
      }
      handler(event)
    }
  }, [shortcuts, enabled, preventDefault])

  useEffect(() => {
    if (!enabled) return
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}

// 预设的快捷键配置
export const KEYBOARD_SHORTCUTS = {
  // 全局
  SAVE: 'ctrl+s',
  CLOSE: 'escape',
  REFRESH: 'ctrl+r',
  
  // 导航
  DATASETS: 'ctrl+1',
  MODELS: 'ctrl+2',
  OVERVIEW: 'ctrl+0',
  
  // 操作
  NEW_DATASET: 'ctrl+n',
  NEW_MODEL: 'ctrl+m',
  UPLOAD: 'ctrl+u',
  DELETE: 'delete',
  
  // 搜索
  SEARCH: 'ctrl+k',
}

// 快捷键说明文档
export const KEYBOARD_SHORTCUTS_HELP = [
  { key: 'Ctrl + S', description: '保存' },
  { key: 'Escape', description: '关闭弹窗' },
  { key: 'Ctrl + 1', description: '数据集' },
  { key: 'Ctrl + 2', description: '模型' },
  { key: 'Ctrl + 0', description: '总览' },
  { key: 'Ctrl + N', description: '新建数据集' },
  { key: 'Ctrl + M', description: '新建模型' },
  { key: 'Ctrl + K', description: '搜索' },
  { key: 'Delete', description: '删除选中项' },
]

export default useKeyboardShortcuts
