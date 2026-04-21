import React from 'react'
import { UploadIcon, PlusIcon, FolderIcon, CpuIcon } from './Icons'

interface QuickActionsProps {
  onUploadDataset: () => void
  onCreateModel: () => void
  onViewDatasets: () => void
  onViewModels: () => void
}

export default function QuickActions({
  onUploadDataset,
  onCreateModel,
  onViewDatasets,
  onViewModels,
}: QuickActionsProps) {
  return (
    <div className="card" style={{ marginTop: '16px' }}>
      <div className="card-header">
        <h3 className="card-title">快捷操作</h3>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-2 gap-3">
          <button
            className="btn btn-primary flex items-center gap-2 justify-center"
            onClick={onUploadDataset}
          >
            <UploadIcon size={18} />
            <span>上传数据集</span>
          </button>
          <button
            className="btn btn-primary flex items-center gap-2 justify-center"
            onClick={onCreateModel}
          >
            <PlusIcon size={18} />
            <span>新建模型</span>
          </button>
          <button
            className="btn btn-secondary flex items-center gap-2 justify-center"
            onClick={onViewDatasets}
          >
            <FolderIcon size={18} />
            <span>查看数据集</span>
          </button>
          <button
            className="btn btn-secondary flex items-center gap-2 justify-center"
            onClick={onViewModels}
          >
            <CpuIcon size={18} />
            <span>查看模型</span>
          </button>
        </div>
      </div>
    </div>
  )
}
