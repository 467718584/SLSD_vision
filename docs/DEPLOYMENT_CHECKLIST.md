# SLSD Vision Platform 部署检查清单

## 快速部署

### 1. 环境准备
```bash
# 克隆项目
git clone <repository_url> SLSD_vision
cd SLSD_vision

# 复制环境配置文件
cp .env.example .env
# 编辑 .env 设置必要的配置
```

### 2. Docker 部署
```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 验证部署
```bash
# 检查健康状态
curl http://localhost:8501/api/stats

# 访问 Web UI
open http://localhost:8501
```

## 日志配置

### Docker 日志
Docker 日志由 Docker daemon 管理，配置在 `docker-compose.yml`:
- 驱动: json-file
- 单文件最大: 10MB
- 保留文件数: 7

查看 Docker 日志:
```bash
docker logs sldsvision-platform
docker logs --tail 100 sldsvision-platform
```

### 应用日志
应用日志位于 `./logs/app.log`，由 logrotate 管理:
- 每日轮转
- 保留 7 天
- 自动压缩

手动轮转日志:
```bash
# 通知应用重新打开日志文件
touch logs/.reload

# 或者强制轮转
logrotate -f config/logrotate.conf
```

### 生产环境日志配置
编辑 `.env`:
```bash
LOG_LEVEL=INFO        # 日志级别
LOG_FORMAT=json       # 日志格式 (json/text)
LOG_MAX_SIZE=10m      # 单文件大小
LOG_MAX_FILES=7       # 保留文件数
```

## 备份与恢复

### 自动备份
启用自动备份（编辑 docker-compose.yml 移除 profiles）:
```bash
# 手动执行备份
docker-compose run --rm backup
```

### 手动备份
```bash
# 备份数据目录
tar -czf backup_$(date +%Y%m%d).tar.gz data/

# 备份数据库
cp data/vision_platform.db backup.db
```

### 恢复数据
```bash
# 停止服务
docker-compose down

# 恢复数据
tar -xzf backup_20260415.tar.gz

# 重启服务
docker-compose up -d
```

## 生产环境检查清单

### 必需配置
- [ ] 设置 `SECRET_KEY` 环境变量
- [ ] 配置 `LOG_LEVEL=INFO` 或 `WARNING`
- [ ] 设置合适的 `MEM_LIMIT` (建议 2g+)
- [ ] 配置数据目录的定期备份

### 安全检查
- [ ] 更改默认管理员密码
- [ ] 限制数据库访问权限
- [ ] 配置防火墙规则
- [ ] 启用 HTTPS（通过反向代理）
- [ ] 配置 CSRF 密钥（CSRF_SECRET_KEY）
- [ ] 启用审计日志收集

### 性能检查
- [ ] 根据并发需求调整 `CPUS`
- [ ] 监控内存使用，适时调整 `MEM_LIMIT`
- [ ] 检查日志文件大小，避免磁盘满

### 监控检查
- [ ] 配置日志收集
- [ ] 设置告警规则
- [ ] 定期检查磁盘空间
- [ ] 监控服务健康状态
- [ ] 监控审计日志增长（可通过 /api/audit/stats 查看）
- [ ] 监控存储空间（可通过 /api/storage 查看）

## 常见问题

### Q: 服务无法启动？
```bash
# 检查日志
docker-compose logs

# 检查端口占用
netstat -tlnp | grep 8501

# 检查配置文件
cat .env

# 检查健康状态
curl http://localhost:8501/api/health
```

### Q: 审计日志有什么用？
v1.7 新增功能。审计日志记录所有关键操作：
- 数据集/模型的增删改操作
- 用户登录/注册行为
- 查看日志：curl http://localhost:8501/api/audit/logs
- 查看统计：curl http://localhost:8501/api/audit/stats

### Q: 如何管理应用现场和原始数据？
v1.7 新增功能。
- 应用现场管理：GET/POST/DELETE /api/sites
- 原始数据管理：GET/POST/DELETE /api/raw-data
- 可在设置页面配置应用现场和数据来源列表

### Q: 日志文件过大？
日志已配置自动轮转，如需手动清理:
```bash
# 轮转日志
truncate -s 0 logs/app.log

# 或者压缩旧日志
gzip logs/app.log.*.gz
```

### Q: 数据库损坏？
恢复最近的备份:
```bash
docker-compose down
cp backups/vision_platform_backup.db data/vision_platform.db
docker-compose up -d
```

## 升级流程

```bash
# 1. 备份数据
docker-compose run --rm backup
tar -czf data_backup.tar.gz data/

# 2. 拉取新版本
git pull

# 3. 重新构建
docker-compose build

# 4. 重启服务
docker-compose up -d
```
