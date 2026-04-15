// 数据集类型定义
export interface Dataset {
  id: number;
  name: string;
  algo_type: string;
  description: string;
  split: string;
  total: number;
  label_count: number;
  labels: string;
  maintain_date: string;
  maintainer: string;
  preview_count: number;
  annotation_format: string;
  storage_type: 'zip' | 'folder';
  annotation_type: 'yolo' | 'voc' | 'coco';
  split_ratio: string;
  has_test: boolean;
  img_count_train: number;
  img_count_val: number;
  img_count_test: number;
  class_info: ClassInfo[];
  tech_method: string;
  preview_images?: string[];
  charts?: DatasetCharts;
}

export interface DatasetCharts {
  detail?: string;
  distribution?: string;
}

export interface ClassInfo {
  name: string;
  count: number;
}

// 模型类型定义
export interface Model {
  id: number;
  name: string;
  algo_name: string;
  category: string;
  accuracy: number;
  description: string;
  dataset: string;
  maintain_date: string;
  maintainer: string;
  preview_count: number;
  preview_images?: string[];
  charts?: ModelCharts;
}

export interface ModelCharts {
  pr_curve?: string;
  confusion_matrix?: string;
  train_loss?: string;
  val_loss?: string;
  map_curve?: string;
}

// 用户类型定义
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user' | 'viewer';
  created_at: string;
}

// 设置类型定义
export interface Settings {
  algo_types: string[];
  tech_methods: string[];
  annotation_types: string[];
}

// 审计日志类型定义
export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource_type: 'dataset' | 'model' | 'settings' | 'auth';
  resource_name: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

// 版本类型定义
export interface DatasetVersion {
  id: number;
  dataset_name: string;
  version_name: string;
  description: string;
  created_at: string;
  created_by: string;
  stats: VersionStats;
}

export interface VersionStats {
  total_images: number;
  total_labels: number;
  class_distribution: Record<string, number>;
}

// API 响应类型定义
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Stats {
  dataset_count: number;
  model_count: number;
  total_images: number;
  total_labels: number;
}

// 搜索/筛选参数
export interface SearchParams {
  q?: string;
  algo_type?: string;
  site?: string;
  annotation_type?: string;
}

// 上传表单数据
export interface UploadFormData {
  name: string;
  algoType: string;
  techMethod?: string;
  description: string;
  maintainer: string;
  uploadMode: 'zip' | 'folder';
  annotationType?: 'yolo' | 'voc' | 'coco';
  skipValidation?: boolean;
}

// 分页类型
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 表格列定义
export interface TableColumn {
  key: string;
  title: string;
  width?: number;
  sortable?: boolean;
}

// 筛选选项
export interface FilterOption {
  label: string;
  value: string;
  color?: {
    bg: string;
    border: string;
    text: string;
  };
}
