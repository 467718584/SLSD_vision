#!/bin/bash
# ==================== 数据恢复脚本 ====================
# 用途: 从备份恢复视觉平台数据
# 使用: ./scripts/restore.sh <backup_file>
# 示例: ./scripts/restore.sh ./backups/vision_backup_20260415_020000.tar.gz

set -e

# ==================== 配置 ====================

BACKUP_FILE="$1"
DATA_DIR="${DATA_DIR:-./data}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# ==================== 函数 ====================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

show_usage() {
    echo "用法: $0 <备份文件>"
    echo ""
    echo "示例:"
    echo "  $0 ./backups/vision_backup_20260415_020000.tar.gz"
    echo ""
    echo "可用备份:"
    ls -lh "${BACKUP_DIR}"/vision_backup_*.tar.gz 2>/dev/null || echo "  无可用备份"
}

# ==================== 主流程 ====================

# 检查参数
if [ -z "$BACKUP_FILE" ]; then
    echo "错误: 请指定备份文件"
    show_usage
    exit 1
fi

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 备份文件不存在: $BACKUP_FILE"
    show_usage
    exit 1
fi

# 确认操作
echo "=========================================="
echo "警告: 此操作将覆盖现有数据!"
echo "备份文件: $BACKUP_FILE"
echo "数据目录: $DATA_DIR"
echo "=========================================="
read -p "确认恢复? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "取消恢复操作"
    exit 0
fi

log "========== 开始恢复 =========="

# 创建临时目录
TEMP_DIR=$(mktemp -d)
log "临时目录: $TEMP_DIR"

# 解压备份
log "解压备份文件..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# 获取解压后的目录
EXTRACTED_DIR=$(ls -d ${TEMP_DIR}/*/ 2>/dev/null | head -1)

if [ -z "$EXTRACTED_DIR" ]; then
    echo "错误: 备份文件格式不正确"
    rm -rf "$TEMP_DIR"
    exit 1
fi

log "恢复数据库..."
if [ -f "${EXTRACTED_DIR}/vision_platform.db" ]; then
    # 停止 Flask 服务 (如果运行)
    docker stop sldsvision-platform 2>/dev/null || true
    
    # 备份当前数据库
    if [ -f "${DATA_DIR}/vision_platform.db" ]; then
        cp "${DATA_DIR}/vision_platform.db" "${DATA_DIR}/vision_platform.db.bak.$(date +%s)"
    fi
    
    # 恢复数据库
    cp "${EXTRACTED_DIR}/vision_platform.db" "${DATA_DIR}/"
    log "数据库恢复完成"
else
    log "警告: 备份中无数据库文件"
fi

# 恢复数据集
if [ -f "${EXTRACTED_DIR}/datasets.tar.gz" ]; then
    log "恢复数据集..."
    tar -xzf "${EXTRACTED_DIR}/datasets.tar.gz" -C "${DATA_DIR}/"
    log "数据集恢复完成"
fi

# 恢复模型
if [ -f "${EXTRACTED_DIR}/models.tar.gz" ]; then
    log "恢复模型..."
    tar -xzf "${EXTRACTED_DIR}/models.tar.gz" -C "${DATA_DIR}/"
    log "模型恢复完成"
fi

# 清理
rm -rf "$TEMP_DIR"

# 重启服务
log "重启服务..."
docker start sldsvision-platform 2>/dev/null || true

log "========== 恢复完成 =========="
echo ""
echo "数据已恢复到: $DATA_DIR"
echo "如需查看备份内容，请查看: $BACKUP_FILE"
