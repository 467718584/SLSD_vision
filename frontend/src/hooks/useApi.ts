/**
 * React Query Hooks
 * 提供数据获取和缓存管理
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import type { Dataset, Model, Settings, Stats, AuditLog, DatasetVersion } from '../types'

// ============== Query Keys ==============
export const queryKeys = {
  datasets: ['datasets'] as const,
  dataset: (name: string) => ['dataset', name] as const,
  datasetImages: (name: string, page: number) => ['dataset', name, 'images', page] as const,
  datasetVersions: (name: string) => ['dataset', name, 'versions'] as const,
  models: ['models'] as const,
  model: (name: string) => ['model', name] as const,
  stats: ['stats'] as const,
  settings: ['settings'] as const,
  auditLogs: (page: number) => ['auditLogs', page] as const,
}

// ============== Dataset Hooks ==============

/**
 * 获取数据集列表
 */
export function useDatasets(params?: { q?: string; algo_type?: string }) {
  return useQuery({
    queryKey: [...queryKeys.datasets, params] as const,
    queryFn: () => api.fetchDatasets(params),
    staleTime: 1000 * 60 * 5, // 5分钟内不重新获取
  })
}

/**
 * 获取单个数据集详情
 */
export function useDataset(name: string) {
  return useQuery({
    queryKey: queryKeys.dataset(name),
    queryFn: () => api.fetchDataset(name),
    enabled: !!name,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * 获取数据集图片
 */
export function useDatasetImages(name: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.datasetImages(name, page),
    queryFn: () => api.fetchDatasetImages(name, page),
    enabled: !!name,
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * 获取数据集版本列表
 */
export function useDatasetVersions(name: string) {
  return useQuery({
    queryKey: queryKeys.datasetVersions(name),
    queryFn: () => api.fetchDatasetVersions(name),
    enabled: !!name,
    staleTime: 1000 * 60 * 5,
  })
}

// ============== Model Hooks ==============

/**
 * 获取模型列表
 */
export function useModels(params?: { q?: string; algo_name?: string }) {
  return useQuery({
    queryKey: [...queryKeys.models, params] as const,
    queryFn: () => api.fetchModels(params),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * 获取单个模型详情
 */
export function useModel(name: string) {
  return useQuery({
    queryKey: queryKeys.model(name),
    queryFn: () => api.fetchModel(name),
    enabled: !!name,
    staleTime: 1000 * 60 * 5,
  })
}

// ============== Stats Hooks ==============

/**
 * 获取统计信息
 */
export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: api.fetchStats,
    staleTime: 1000 * 60 * 2,
  })
}

// ============== Settings Hooks ==============

/**
 * 获取系统设置
 */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: api.fetchSettings,
    staleTime: 1000 * 60 * 30, // 30分钟
  })
}

/**
 * 更新设置
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (settings: Settings) => api.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
}

// ============== Audit Log Hooks ==============

/**
 * 获取审计日志
 */
export function useAuditLogs(page = 1) {
  return useQuery({
    queryKey: queryKeys.auditLogs(page),
    queryFn: () => api.fetchAuditLogs({ page }),
    staleTime: 1000 * 60 * 2,
  })
}

// ============== Action Mutations ==============

/**
 * 删除数据集
 */
export function useDeleteDataset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (name: string) => api.deleteDataset(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

/**
 * 删除模型
 */
export function useDeleteModel() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (name: string) => api.deleteModel(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.models })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

/**
 * 创建版本
 */
export function useCreateVersion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: { version_name: string; description: string } }) =>
      api.createDatasetVersion(name, data),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.datasetVersions(name) })
    },
  })
}
