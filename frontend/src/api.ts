/**
 * API 统一管理模块
 * 提供类型安全的 API 调用函数
 */

import type {
  Dataset,
  Model,
  Settings,
  Stats,
  AuditLog,
  DatasetVersion,
  ApiResponse,
  SearchParams,
  UploadFormData
} from './types'

// CSRF Token 获取
function getCsrfToken(): string {
  return localStorage.getItem('csrf_token') || ''
}

// 通用请求头
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }
  return headers
}

// ============== 数据集 API ==============

/**
 * 获取数据集列表
 */
export async function fetchDatasets(params?: SearchParams): Promise<ApiResponse<Dataset[]>> {
  const query = new URLSearchParams()
  if (params?.q) query.set('q', params.q)
  if (params?.algo_type) query.set('algo_type', params.algo_type)
  if (params?.annotation_type) query.set('annotation_type', params.annotation_type)
  
  const url = `/api/datasets${query.toString() ? `?${query.toString()}` : ''}`
  const res = await fetch(url, { headers: getHeaders() })
  return res.json()
}

/**
 * 获取单个数据集详情
 */
export async function fetchDataset(name: string): Promise<ApiResponse<Dataset>> {
  const res = await fetch(`/api/dataset/${encodeURIComponent(name)}`, {
    headers: getHeaders()
  })
  return res.json()
}

/**
 * 获取数据集图片
 */
export async function fetchDatasetImages(name: string, page = 1): Promise<ApiResponse<any>> {
  const res = await fetch(`/api/dataset/${encodeURIComponent(name)}/images?page=${page}`, {
    headers: getHeaders()
  })
  return res.json()
}

/**
 * 获取数据集图表
 */
export async function fetchDatasetCharts(name: string): Promise<ApiResponse<any>> {
  const res = await fetch(`/api/dataset/${encodeURIComponent(name)}/charts`, {
    headers: getHeaders()
  })
  return res.json()
}

/**
 * 上传数据集
 */
export async function uploadDataset(formData: UploadFormData, files: FileList | File[]): Promise<ApiResponse<Dataset>> {
  const formDataObj = new FormData()
  formDataObj.append('name', formData.name)
  formDataObj.append('algoType', formData.algoType)
  if (formData.techMethod) formDataObj.append('techMethod', formData.techMethod)
  formDataObj.append('description', formData.description)
  formDataObj.append('maintainer', formData.maintainer)
  formDataObj.append('uploadMode', formData.uploadMode)
  if (formData.annotationType) formDataObj.append('annotationType', formData.annotationType)
  if (formData.skipValidation) formDataObj.append('skipValidation', 'true')
  
  // 添加文件
  const fileArray = files instanceof FileList ? Array.from(files) : files
  fileArray.forEach(file => {
    formDataObj.append('files', file)
  })

  const res = await fetch('/api/dataset/upload', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': getCsrfToken(),
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: formDataObj
  })
  return res.json()
}

/**
 * 更新数据集信息
 */
export async function updateDataset(name: string, data: Partial<Dataset>): Promise<ApiResponse<Dataset>> {
  const res = await fetch(`/api/dataset/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  return res.json()
}

/**
 * 删除数据集
 */
export async function deleteDataset(name: string): Promise<ApiResponse<void>> {
  const res = await fetch(`/api/dataset/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  return res.json()
}

/**
 * 校验数据集名称
 */
export async function validateDatasetName(name: string): Promise<ApiResponse<{ valid: boolean }>> {
  const res = await fetch('/api/dataset/validate-name', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name })
  })
  return res.json()
}

// ============== 模型 API ==============

/**
 * 获取模型列表
 */
export async function fetchModels(params?: SearchParams): Promise<ApiResponse<Model[]>> {
  const query = new URLSearchParams()
  if (params?.q) query.set('q', params.q)
  if (params?.algo_type) query.set('algo_name', params.algo_type)
  
  const url = `/api/models${query.toString() ? `?${query.toString()}` : ''}`
  const res = await fetch(url, { headers: getHeaders() })
  return res.json()
}

/**
 * 获取单个模型详情
 */
export async function fetchModel(name: string): Promise<ApiResponse<Model>> {
  const res = await fetch(`/api/model/${encodeURIComponent(name)}/detail`, {
    headers: getHeaders()
  })
  return res.json()
}

/**
 * 上传模型
 */
export async function uploadModel(formData: FormData): Promise<ApiResponse<Model>> {
  const res = await fetch('/api/model/upload', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': getCsrfToken(),
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: formData
  })
  return res.json()
}

/**
 * 删除模型
 */
export async function deleteModel(name: string): Promise<ApiResponse<void>> {
  const res = await fetch(`/api/model/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  return res.json()
}

// ============== 版本管理 API ==============

/**
 * 获取数据集版本列表
 */
export async function fetchDatasetVersions(name: string): Promise<ApiResponse<DatasetVersion[]>> {
  const res = await fetch(`/api/dataset/${encodeURIComponent(name)}/versions`, {
    headers: getHeaders()
  })
  return res.json()
}

/**
 * 创建数据集版本
 */
export async function createDatasetVersion(name: string, data: { version_name: string; description: string }): Promise<ApiResponse<DatasetVersion>> {
  const res = await fetch(`/api/dataset/${encodeURIComponent(name)}/versions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  return res.json()
}

/**
 * 获取版本详情
 */
export async function fetchVersionDetail(versionId: number): Promise<ApiResponse<DatasetVersion>> {
  const res = await fetch(`/api/dataset/versions/${versionId}`, {
    headers: getHeaders()
  })
  return res.json()
}

/**
 * 对比版本
 */
export async function compareVersions(versionId1: number, versionId2: number): Promise<ApiResponse<any>> {
  const res = await fetch(`/api/dataset/versions/compare?vid1=${versionId1}&vid2=${versionId2}`, {
    headers: getHeaders()
  })
  return res.json()
}

/**
 * 删除版本
 */
export async function deleteVersion(versionId: number): Promise<ApiResponse<void>> {
  const res = await fetch(`/api/dataset/versions/${versionId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  return res.json()
}

// ============== 统计 API ==============

/**
 * 获取统计信息
 */
export async function fetchStats(): Promise<ApiResponse<Stats>> {
  const res = await fetch('/api/stats', { headers: getHeaders() })
  return res.json()
}

// ============== 设置 API ==============

/**
 * 获取系统设置
 */
export async function fetchSettings(): Promise<ApiResponse<Settings>> {
  const res = await fetch('/api/settings', { headers: getHeaders() })
  return res.json()
}

/**
 * 更新系统设置
 */
export async function updateSettings(settings: Settings): Promise<ApiResponse<Settings>> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(settings)
  })
  return res.json()
}

// ============== 认证 API ==============

/**
 * 用户登录
 */
export async function login(username: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  // 登录成功后会设置 CSRF token
  const data = await res.json()
  if (data.success && data.token) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('csrf_token', data.csrf_token || '')
  }
  return data
}

/**
 * 用户注册
 */
export async function register(username: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json()
  if (data.success && data.token) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('csrf_token', data.csrf_token || '')
  }
  return data
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: getHeaders()
  })
  localStorage.removeItem('token')
  localStorage.removeItem('csrf_token')
}

/**
 * 验证token
 */
export async function verifyToken(): Promise<ApiResponse<any>> {
  const res = await fetch('/api/auth/verify', {
    headers: getHeaders()
  })
  return res.json()
}

// ============== 审计日志 API ==============

/**
 * 获取审计日志
 */
export async function fetchAuditLogs(params?: { page?: number; page_size?: number }): Promise<ApiResponse<{ logs: AuditLog[]; total: number }>> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  
  const url = `/api/audit-logs${query.toString() ? `?${query.toString()}` : ''}`
  const res = await fetch(url, { headers: getHeaders() })
  return res.json()
}
