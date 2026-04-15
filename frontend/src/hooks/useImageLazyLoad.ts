import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * 图片懒加载 Hook
 * 使用 IntersectionObserver 实现延迟加载
 */
export function useImageLazyLoad(options?: {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}) {
  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options || {}
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // 如果已经加载过且只需要触发一次，直接显示
    if (triggerOnce && hasLoaded) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            setHasLoaded(true)
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce, hasLoaded])

  return { elementRef, isVisible }
}

/**
 * 批量图片懒加载 Hook
 * 用于图片列表
 */
export function useBatchImageLazyLoad(
  imageCount: number,
  options?: {
    threshold?: number
    rootMargin?: string
    batchSize?: number
  }
) {
  const { threshold = 0.1, rootMargin = '50px', batchSize = 10 } = options || {}
  const [loadedCount, setLoadedCount] = useState(0)
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(() => {
    setLoadedCount(prev => {
      const next = prev + batchSize
      return Math.min(next, imageCount)
    })
  }, [batchSize, imageCount])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(container)

    // 初始加载
    loadMore()

    return () => observer.disconnect()
  }, [threshold, rootMargin, loadMore])

  return { containerRef, loadedCount, loadMore }
}

export default useImageLazyLoad
