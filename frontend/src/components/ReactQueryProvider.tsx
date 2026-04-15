/**
 * React Query Provider
 * 配置 React Query 客户端
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 全局默认配置
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5分钟
    },
    mutations: {
      retry: 0,
    },
  },
})

interface ReactQueryProviderProps {
  children: React.ReactNode
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export { queryClient }
export default ReactQueryProvider
