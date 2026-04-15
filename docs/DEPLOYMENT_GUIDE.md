# SLSD Vision Platform v1.7.0 部署指南

## 📦 项目结构

```
SLSD_vision/
├── backend/               # 后端路由模块
│   └── routes/           # API路由
│       └── stats_routes.py
├── config/               # 配置文件
│   └── logrotate.conf
├── data/                 # 数据目录 (运行时创建)
│   ├── datasets/         # 数据集存储
│   ├── models/          # 模型存储
│   └── vision_platform.db # SQLite数据库
├── docs/                 # 文档
│   ├── CHANGELOG.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── TEST_REPORT.md
├── frontend/            # 前端源码
│   ├── src/
│   │   ├── components/  # 20个React组件
│   │   ├── hooks/       # 自定义Hooks
│   │   ├── api.ts       # API调用
│   │   └── constants.ts  # 常量定义
│   └── dist/            # 构建输出
├── logs/                # 日志目录
├── modules/             # 后端业务模块
├── scripts/             # 运维脚本
│   ├── backup.sh
│   └── restore.sh
├── server.py            # Flask主服务器
├── docker-compose.yml    # Docker编排
├── Dockerfile           # Docker镜像
└── requirements.txt     # Python依赖
```

## 🚀 快速部署

### 方式一：Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone <repository_url> SLSD_vision
cd SLSD_vision

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 设置端口等配置

# 3. 构建并启动
docker-compose up -d --build

# 4. 验证服务
curl http://localhost:8501/api/health
```

### 方式二：本地开发部署

```bash
# 1. 安装后端依赖
pip install -r requirements.txt

# 2. 安装前端依赖
cd frontend
npm install

# 3. 构建前端
npm run build

# 4. 启动服务器
cd ..
python server.py
```

## 🔧 配置说明

### 环境变量 (.env)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| APP_PORT | 8501 | 服务端口 |
| FLASK_ENV | production | 运行环境 |
| LOG_LEVEL | INFO | 日志级别 |
| LOG_FORMAT | json | 日志格式 |
| DATA_DIR | ./data | 数据目录 |
| LOG_DIR | ./logs | 日志目录 |
| MEM_LIMIT | 2g | 内存限制 |
| CPUS | 1.0 | CPU限制 |

## 📊 功能模块

| 模块 | 说明 |
|------|------|
| 数据集管理 | 上传/编辑/删除/版本/批量导出 |
| 模型管理 | 上传/编辑/删除/对比/批量导出 |
| 用户认证 | 注册/登录/JWT/CSRF |
| 系统设置 | 算法类型/技术方法/应用现场/数据来源 |
| 应用现场管理 | 现场联动数据集/模型统计 |
| 原始数据管理 | 原始数据上传与标注管理 |
| 使用统计 | 日/周/月使用报表 |

## 🛡️ 安全配置

生产环境部署建议：
1. 配置反向代理启用 HTTPS
2. 设置 `SECRET_KEY` 环境变量
3. 配置防火墙限制访问
4. 定期备份数据

## 📚 更多文档

- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)
- [测试报告](./TEST_REPORT.md)
- [更新日志](./CHANGELOG.md)
- [README](../README.md)
