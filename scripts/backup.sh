#!/bin/bash
# ==================== 数据备份脚本 ====================
# 用途: 备份视觉平台数据 (数据库 + 数据集 + 模型)
# 使用: ./scripts/backup.sh
# 定时任务示例: 0 2 * * * /path/to/backup.sh

set -e

# ==================== 配置 ====================

# 备份目录
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATA_DIR="${DATA_DIR:-./data}"

# 备份保留天数
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# 时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="vision_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# 日志
LOG_FILE="${BACKUP_DIR}/backup.log"

# ==================== 函数 ====================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

cleanup_old_backups() {
    log "清理超过 ${RETENTION_DAYS} 天的旧备份..."
    find "${BACKUP_DIR}" -name "vision_backup_*" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true
    find "${BACKUP_DIR}" -name "vision_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    log "清理完成"
}

# ==================== 主流程 ====================

log "========== 开始备份 =========="
log "备份目录: ${BACKUP_PATH}"

# 创建备份目录
mkdir -p "${BACKUP_PATH}"

# 备份数据库
if [ -f "${DATA_DIR}/vision_platform.db" ]; then
    log "备份数据库..."
    cp "${DATA_DIR}/vision_platform.db" "${BACKUP_PATH}/"
    log "数据库备份完成"
else
    log "警告: 数据库文件不存在，跳过"
fi

# 备份数据集
if [ -d "${DATA_DIR}/datasets" ]; then
    log "备份数据集..."
    tar -czf "${BACKUP_PATH}/datasets.tar.gz" -C "${DATA_DIR}" datasets/ 2>/dev/null || true
    log "数据集备份完成"
fi

# 备份模型
if [ -d "${DATA_DIR}/models" ]; then
    log "备份模型..."
    tar -czf "${BACKUP_PATH}/models.tar.gz" -C "${DATA_DIR}" models/ 2>/dev/null || true
    log "模型备份完成"
fi

# 创建备份信息
cat > "${BACKUP_PATH}/backup_info.txt" << EOF
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
主机名: $(hostname)
数据目录: ${DATA_DIR}
备份内容:
  - vision_platform.db
  - datasets.tar.gz
  - models.tar.gz
EOF

# 创建压缩包
log "创建压缩包..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"
rm -rf "${BACKUP_NAME}"

# 计算备份大小
BACKUP_SIZE=$(du -h "${BACKUP_PATH}.tar.gz" | cut -f1)
log "备份完成! 大小: ${BACKUP_SIZE}"

# 清理旧备份
cleanup_old_backups

log "========== 备份完成 =========="
echo ""
echo "备份文件: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "备份大小: ${BACKUP_SIZE}"
