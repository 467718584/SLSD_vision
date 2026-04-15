# SLSD Vision Platform (机器视觉管理平台)

**当前版本：v1.7.0**

基于 Flask + React/Babel 的数据集与模型管理系统，用于管理和展示机器视觉相关的数据集、训练模型、应用现场和原始数据。

## 项目文档

本项目包含完整的文档，位于 `文档/` 目录下：

- **PED.md** - 项目立项文档
- **PRD产品需求文档.md** - 产品需求文档
- **需求分析文档.md** - 需求分析文档
- **概要设计文档.md** - 概要设计文档
- **详细设计文档.md** - 详细设计文档
- **用户说明书.md** - 用户使用手册
- **部署与运维指南.md** - Docker部署和运维指南

## 项目概述

本系统是一个 Web 化管理平台，主要功能包括：
- **数据集管理**：上传（支持ZIP压缩包和文件夹）、查看、删除数据集
- **模型管理**：上传、查看、删除训练模型
- **应用现场管理**：管理应用现场站点，关联数据集和模型
- **原始数据管理**：管理未标注或已标注的原始数据
- **数据预览**：查看数据集图片和标注信息
- **版本管理**：数据集版本化管理，支持版本对比
- **搜索筛选**：通过算法类型、名称等条件筛选数据
- **大文件上传**：支持最大5GB的文件上传
- **数据集校验**：YOLO格式4步校验、标签编辑、类别统计
- **审计日志**：记录所有操作行为，支持查询和统计分析
- **用户认证**：用户注册、登录、会话管理
- **性能监控**：实时监控系统性能指标

## 技术栈

- **后端**: Flask (Python)
- **前端**: React 18 + Babel (通过 CDN 加载)
- **数据库**: SQLite
- **数据存储**: 本地文件系统
- **图表生成**: Matplotlib
- **图像处理**: Pillow (PIL)

## Docker 部署

本项目支持 Docker 容器化部署，便于跨机器迁移和部署。

### 快速开始

```bash
# 方式一：使用 docker-compose（推荐）
docker-compose up -d

# 方式二：使用 Docker
docker build -t sldsvision/platform .
docker run -d -p 8501:8501 -v $(pwd)/data:/app/data sldsvision/platform
```

### Windows 用户

双击运行 `docker-build.bat` 或使用 PowerShell:

```powershell
.\docker-build.bat
```

### Linux (Ubuntu) 用户

#### 方式一：使用 Docker Image 部署（推荐生产环境）

```bash
# 1. 拉取镜像（如果已有镜像）
docker pull sldsvision/platform:latest

# 2. 创建数据目录
mkdir -p ~/sldsvision/data

# 3. 运行容器
docker run -d \
  --name sldsvision-platform \
  -p 8501:8501 \
  -v ~/sldsvision/data:/app/data \
  sldsvision/platform:latest

# 4. 查看日志
docker logs -f sldsvision-platform
```

#### 方式二：使用 Docker Compose 部署

```bash
# 1. 克隆项目或复制文件
# 将项目文件复制到服务器

# 2. 创建数据目录
mkdir -p data/datasets data/models

# 3. 使用 docker-compose 启动
docker-compose up -d

# 4. 查看状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f
```

#### 方式三：使用 Dockerfile 本地构建

```bash
# 1. 安装 Docker（如果未安装）
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# 2. 克隆项目
git clone <your-repo-url>
cd SLSD_vision

# 3. 构建镜像
docker build -t sldsvision/platform .

# 4. 创建数据目录
mkdir -p data/datasets data/models

# 5. 运行容器
docker run -d \
  --name sldsvision-platform \
  -p 8501:8501 \
  -v $(pwd)/data:/app/data \
  sldsvision/platform
```

#### Ubuntu 系统 Docker 配置

```bash
# 1. 开机自启动 Docker
sudo systemctl enable docker
sudo systemctl start docker

# 2. 添加当前用户到 docker 组（避免每次使用 sudo）
sudo usermod -aG docker $USER
# 重新登录后生效

# 3. 配置 Docker 镜像加速（可选，提升拉取速度）
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

#### 常用操作命令

```bash
# 停止容器
docker-compose stop

# 重启容器
docker-compose restart

# 更新并重新构建
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 备份数据
tar -czvf sldsvision-backup.tar.gz data/

# 恢复数据
tar -xzvf sldsvision-backup.tar.gz
```

### 访问

容器启动后访问 http://localhost:8501

### 数据持久化

- 数据目录 `./data` 会通过 volume 挂载到容器内
- 迁移时只需复制整个 data 目录即可

### Docker 文件说明

| 文件 | 说明 |
|------|------|
| Dockerfile | Docker 镜像构建文件 |
| docker-compose.yml | Docker Compose 配置 |
| .dockerignore | Docker 构建排除文件 |
| docker-build.sh | Linux/Mac 构建脚本 |
| docker-build.bat | Windows 构建脚本 |

## 项目结构

```
SLSD_vision/
├── app.py                      # Streamlit 主应用 (备用)
├── server.py                   # Flask 服务器 (主入口)
├── config.py                   # 配置文件
├── requirements.txt            # Python 依赖
├── generate_test_data.py       # 测试数据生成脚本
├── start_server.bat            # 启动脚本（推荐）
├── 参考资料/                    # 参考文档和资源
│   └── vision-platform-preview.html  # 前端模板（含上传功能）
├── modules/                    # 功能模块
│   ├── __init__.py
│   ├── database.py            # SQLite 数据库模块
│   ├── dataset_manager.py     # 数据集管理模块
│   ├── model_manager.py       # 模型管理模块
│   ├── annotation_parser.py   # 标注格式解析
│   └── storage.py            # 文件存储管理
└── data/                      # 数据存储目录
    ├── vision_platform.db     # SQLite 数据库文件
    ├── datasets/              # 数据集文件存储
    │   └── [数据集名称]/
    │       ├── images/        # 图片文件
    │       ├── labels/        # 标注文件
    │       └── metadata.json  # 元数据
    └── models/               # 模型文件存储
        └── [模型名称]/
            ├── weights/       # 权重文件
            └── config.json   # 模型配置
```

## 核心模块说明

### 1. server.py (Flask 服务器)

主入口服务器，负责：
- 加载外部 HTML 模板并注入数据库数据
- 提供 RESTful API 接口
- 支持大文件上传（最大500MB）
- 运行在 http://localhost:8501

主要路由：
- `/` - 主页面（加载 HTML 模板）
- `/api/datasets` - 数据集查询 API
- `/api/models` - 模型查询 API
- `/api/stats` - 统计信息 API
- `/api/dataset/upload` - 上传数据集（支持ZIP和文件夹）
- `/api/model/upload` - 上传模型
- `/api/dataset/<name>/images` - 获取数据集图片

### 2. modules/database.py

数据库模块，负责：
- SQLite 数据库连接管理
- 数据集和模型的 CRUD 操作
- 搜索和筛选功能

核心函数：
- `init_database()` - 初始化数据库表
- `get_all_datasets()` - 获取所有数据集
- `get_all_models()` - 获取所有模型
- `search_datasets(query, algo_type)` - 搜索数据集
- `search_models(query, algo_name)` - 搜索模型
- `get_dataset_stats()` - 获取数据集统计
- `get_model_stats()` - 获取模型统计

### 3. modules/dataset_manager.py

数据集管理模块：
- `upload_dataset()` - 上传数据集
- `list_datasets()` - 列出数据集
- `get_dataset_info()` - 获取数据集详情
- `delete_dataset()` - 删除数据集
- `get_dataset_images()` - 获取数据集图片

### 4. modules/model_manager.py

模型管理模块：
- `upload_model()` - 上传模型
- `list_models()` - 列出模型
- `get_model_info()` - 获取模型详情
- `delete_model()` - 删除模型

### 5. modules/annotation_parser.py

标注解析模块，支持：
- YOLO 格式 (.txt)
- COCO JSON 格式
- VOC XML 格式

### 6. config.py

项目配置文件，包含：
- BASE_DIR - 项目根目录
- DATA_DIR - 数据存储目录
- DATASETS_DIR - 数据集存储目录
- MODELS_DIR - 模型存储目录
- SUPPORTED_ANNOTATION_FORMATS - 支持的标注格式
- SUPPORTED_IMAGE_FORMATS - 支持的图片格式

## v1.7 新增功能 (2026-04-15)

### 1. 应用现场管理
- 新增「应用现场」管理模块（sites表）
- 预置应用现场列表：苏北灌溉总渠、南水北调宝应站、慈溪北排、慈溪周巷、瓯江引水
- 数据集可关联应用现场（source字段）
- 模型可关联应用现场（site字段）
- 应用现场详情展示：数据集数量、模型数量、维护人、维护日期

### 2. 原始数据管理
- 新增「原始数据」管理模块（raw_data表）
- 支持添加/删除原始数据记录
- 原始数据字段：名称、算法类型、描述、关联数据集、数据来源、是否已标注、维护日期、维护人
- 数据来源可选：互联网、本地采集、合作伙伴、公开数据集

### 3. 数据集版本管理
- 支持为数据集创建版本快照
- 支持查看版本详情和历史版本列表
- 支持版本对比分析
- 支持删除指定版本

### 4. 审计日志
- 记录所有关键操作行为（数据集/模型增删改）
- 审计字段：用户、操作类型、资源类型、资源名称、详情、IP地址、操作状态、错误信息、时间
- 提供审计日志查询接口
- 提供审计统计数据（按操作类型/资源类型统计）

### 5. 用户认证
- 用户注册接口（用户名、密码）
- 用户登录接口（会话Cookie）
- 当前用户信息查询
- CSRF令牌保护

### 6. 性能监控
- 实时性能指标端点（响应时间、请求量）
- 系统健康检查端点
- 存储空间详情统计

### 7. 批量操作
- 批量删除数据集
- 批量删除模型
- 批量导出模型（ZIP打包下载）

### 8. 模型详情页增强
- 模型验证集识别结果分离：标注图片 vs 预测图片
- PR曲线、F1曲线、精确率曲线、召回率曲线、混淆矩阵展示
- 训练曲线自动生成（mAP50、mAP50-95、边框损失）

### 9. 设置页面增强
- 支持配置应用现场列表
- 支持配置数据来源列表

## v1.3 新增功能 (2026-03-05)

### 1. 新增字段：算法类型与技术方法
- **算法类型**：应用场景（路面积水检测、漂浮物检测、墙面裂缝检测、游泳检测等）
- **技术方法**：技术手段（目标检测算法、实例分割算法）
- 数据集详情页面展示两种标签，通过颜色区分

### 2. 标注可视化增强
- 支持实例分割（polygon多边形）标注显示
- 支持目标检测（bbox矩形框）标注显示
- 自动检测标注类型并渲染对应图形

### 3. ZIP文件保留
- 数据集上传后保留原始ZIP文件
- 支持下载原始ZIP包
- 方便数据备份和共享

### 4. 设置页面
- 新增"设置"导航按钮
- 可配置算法类型、技术方法、标注格式
- 设置持久化保存到数据库
- 支持添加/删除自定义选项

### 5. 全体总览页面
- 新增"全体总览"作为默认显示标签页
- 展示所有数据集和模型的统计概览
- 方便快速了解平台整体状况

### 6. 数据分析图表
- 上传数据集时自动生成 matplotlib 图表
- **detail.png**：数据集详情图（train/val/test分布）
- **distribution.png**：类别分布图
- 在数据集列表和详情页面展示图表缩略图
- 支持查看大图

### 7. 示例数量修复
- 修复样本数量计算，排除vis目录中的可视化图片
- 统计更准确的真实样本数量

### 8. 数据库增强
- 新增 settings 表：存储系统设置
- 新增 tech_method 字段到 datasets 表

## v1.4 新增功能 (2026-03-06)

### 1. 标注分布热力图（真实数据）
- 新增 ClassHeatmap 组件
- 使用 classInfo 数据生成真实的类别标注数量热力图
- 在数据集详情页面显示每个类别的热力图和数量

### 2. 数据分析图表点击查看大图
- 为 DetailChart 和 DistChart 组件添加 onClick 回调
- 点击图表后可弹出大图预览
- 显示图表标题（样本分布/类别分布）

### 3. 算法类型颜色背景框
- 数据集详情中的算法类型使用 AlgoTag 组件显示
- 显示与数据集列表一致的颜色背景框

### 4. 数据集详情编辑功能
- 新增"编辑"按钮，点击弹出编辑弹窗
- 支持修改算法类型（下拉选择）
- 支持修改技术方法（下拉选择）
- 支持上传/更换样本分布图(detail.png)
- 支持上传/更换类别分布图(distribution.png)

### 5. 编辑标签与类别数量同行显示
- 将类别数量和编辑按钮合并到一行显示
- 显示格式："共X类 | 编辑标签"

### 6. 新建数据集成功后保留当前界面
- 上传成功后自动刷新数据列表
- 不再跳转页面，保留在当前视图

### 7. 后端API增强
- 新增 PUT /api/dataset/<name> - 更新数据集信息
- 新增 POST /api/dataset/<name>/chart-upload - 上传图表文件

### 1. 数据集上传校验功能
- **名称重复检测**：上传前检查数据集名称是否已存在
- **标注类型选择**：新增下拉框选择 YOLO/VOC/COCO 标注格式
- **YOLO格式校验**：4步校验流程
  - 步骤1：文件夹结构检测（images/train/val/test, labels/train/val/test）
  - 步骤2：统计图片数量
  - 步骤3：计算背景图片数量
  - 步骤4：统计类别数量
- **跳过校验选项**：可选择跳过校验快速上传

### 2. 标签编辑功能
- 在数据集详情页面可编辑类别标签名称
- 保留原有类别数量统计
- 实时保存到数据库和元数据文件

### 3. 数据集总览预览功能
- 表格中显示数据集真实缩略图（最多6张）
- 点击缩略图弹出大图预览（页面内悬浮）
- 与详情页面一致的预览体验
- 加载失败时显示模拟方块

### 4. 数据库增强
- 新增字段：
  - `storage_type`: 存储方式（zip/folder）
  - `annotation_type`: 标注类型（yolo/voc/coco）
  - `split_ratio`: 划分比例
  - `has_test`: 是否存在测试集
  - `bg_count_*`: 背景图片数量统计
  - `img_count_*`: 各子集图片数量统计
  - `class_info`: 类别信息（包含名称和数量）

### 5. 编码问题修复
- 修复数据库中损坏的中文字符
- 修复JSON解析错误处理

### 6. 启动脚本
- 新增 `start_server.bat` 启动脚本
- 使用指定Python环境（transformer-clip）

## v1.5 新增功能 (2026-03-07)

### 1. 模型上传功能增强
- 支持文件夹上传（通过 webkitdirectory）
- 自动解析 results.csv 获取模型精度（mAP50）
- 自动生成训练曲线图表（mAP50、mAP50-95、边框损失）
- 支持选择算法类型、技术方法、模型类别

### 2. 模型概览页面优化
- 显示精度进度条（95%以上绿色，85-95%蓝色，其他黄色）
- 列表列：编号、算法类型、技术方法、模型名称、模型类别、模型精度、使用数据集、维护日期、维护人员

### 3. 模型详情页面优化
- 缩略图放大显示（200px宽度）
- 验证集识别结果模块：分离显示"验证集标注图片"和"验证集预测图片"
- 修复图片筛选条件，支持更多命名格式
- 新增"PR曲线与混淆矩阵"卡片，显示F1曲线、精确率曲线、召回率曲线、PR曲线、混淆矩阵、归一化混淆矩阵

### 4. CSV训练曲线图生成
- 从 results.csv 自动生成4个曲线图：
  - mAP50 曲线（IoU=0.5）
  - mAP50-95 曲线（IoU=0.5:0.95）
  - 训练集边框损失曲线
  - 验证集边框损失曲线
- 添加中文字体支持，解决中文显示问题

### 5. 图表布局优化
- 模型详情页面采用三列布局
- 曲线图和PR曲线图片尺寸统一为 300x200px
- 训练集/验证集边框损失曲线顺序调整：训练集在左，验证集在右

### 6. API路由修复
- 修复模型详情API路由 `/api/model/<name>/detail` 与删除路由冲突问题

## v1.1 新增功能 (2026-03-04)

### 1. 文件夹上传支持
- 支持通过 `webkitdirectory` 属性上传整个文件夹
- 自动保留文件夹结构
- 支持ZIP压缩包和文件夹两种上传模式

### 2. 数据集图片预览
- 在数据集详情页面显示图片预览
- 支持最多50张图片的预览
- 点击图片可查看大图

### 3. 大文件上传支持
- 配置最大上传文件大小为500MB
- 支持大型数据集和模型文件上传

### 4. 服务器稳定性优化
- 禁用 Flask 自动重载（`use_reloader=False`）
- 防止上传文件时触发服务器重启

### 5. 数据安全处理
- 自动转义数据集描述中的特殊字符（换行符、制表符等）
- 防止JavaScript注入导致的页面空白问题

## 数据模型

### 数据集表 (datasets)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 数据集名称（唯一） |
| algo_type | TEXT | 算法类型 |
| description | TEXT | 数据集描述 |
| split | TEXT | 数据分割比例 |
| total | INTEGER | 样本总数 |
| label_count | INTEGER | 标签数量 |
| labels | TEXT | 标签统计（JSON） |
| maintain_date | TEXT | 维护日期 |
| maintainer | TEXT | 维护人员 |
| preview_count | INTEGER | 预览图片数量 |
| annotation_format | TEXT | 标注格式 |
| storage_type | TEXT | 存储方式（zip/folder） |
| annotation_type | TEXT | 标注类型（yolo/voc/coco） |
| split_ratio | TEXT | 划分比例（如 8.0:2.0:0.0） |
| has_test | BOOLEAN | 是否存在测试集 |
| bg_count_train | INTEGER | 训练集背景图片数 |
| bg_count_val | INTEGER | 验证集背景图片数 |
| bg_count_test | INTEGER | 测试集背景图片数 |
| bg_count_total | INTEGER | 总背景图片数 |
| img_count_train | INTEGER | 训练集图片数 |
| img_count_val | INTEGER | 验证集图片数 |
| img_count_test | INTEGER | 测试集图片数 |
| class_info | TEXT | 类别信息（JSON） |
| tech_method | TEXT | 技术方法 |
| source | TEXT | 数据来源/应用现场 |

### 模型表 (models)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 模型名称（唯一） |
| algo_name | TEXT | 算法名称 |
| category | TEXT | 模型类别 |
| accuracy | REAL | 模型精度 |
| description | TEXT | 模型描述 |
| dataset | TEXT | 关联数据集 |
| maintain_date | TEXT | 维护日期 |
| maintainer | TEXT | 维护人员 |
| preview_count | INTEGER | 预览数量 |
| site | TEXT | 关联应用现场 |

### 数据集版本表 (dataset_versions)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| dataset_name | TEXT | 数据集名称 |
| version | TEXT | 版本号 |
| description | TEXT | 版本描述 |
| total | INTEGER | 样本总数 |
| label_count | INTEGER | 标签数量 |
| class_info | TEXT | 类别信息（JSON） |
| parent_version | TEXT | 父版本号 |
| created_at | TIMESTAMP | 创建时间 |

### 原始数据表 (raw_data)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 原始数据名称（唯一） |
| algo_type | TEXT | 算法类型 |
| description | TEXT | 描述 |
| dataset | TEXT | 关联数据集 |
| source | TEXT | 数据来源 |
| is_annotated | BOOLEAN | 是否已标注 |
| maintain_date | TEXT | 维护日期 |
| maintainer | TEXT | 维护人员 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 应用现场表 (sites)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 应用现场名称（唯一） |
| description | TEXT | 描述 |
| dataset | TEXT | 关联数据集 |
| model | TEXT | 关联模型 |
| maintain_date | TEXT | 维护日期 |
| maintainer | TEXT | 维护人员 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 审计日志表 (audit_logs)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | TEXT | 用户ID |
| username | TEXT | 用户名 |
| action | TEXT | 操作类型 |
| resource_type | TEXT | 资源类型 |
| resource_name | TEXT | 资源名称 |
| details | TEXT | 操作详情（JSON） |
| ip_address | TEXT | IP地址 |
| user_agent | TEXT | User-Agent |
| status | TEXT | 操作状态 |
| error_message | TEXT | 错误信息 |
| created_at | TIMESTAMP | 操作时间 |

### 设置表 (settings)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键（固定为1） |
| algo_types | TEXT | 算法类型列表（JSON） |
| tech_methods | TEXT | 技术方法列表（JSON） |
| annotation_types | TEXT | 标注格式列表（JSON） |
| sites | TEXT | 应用现场列表（JSON） |
| sources | TEXT | 数据来源列表（JSON） |
| updated_at | TIMESTAMP | 更新时间 |

## 启动方式

### 方式一：使用启动脚本（推荐）

```bash
# 直接运行启动脚本
./start_server.bat

# 访问 http://localhost:8501
```

### 方式二：手动启动

```bash
# 激活 conda 环境
conda activate transformer-clip

# 启动服务器
python server.py

# 访问 http://localhost:8501
```

### 备用：Streamlit 应用

```bash
# 激活 conda 环境
conda activate transformer-clip

# 启动 Streamlit
streamlit run app.py

# 访问 http://localhost:8501
```

## 前端特性

- 使用 React 18 + Babel 在浏览器端渲染
- 响应式设计，支持多种屏幕尺寸
- 数据集卡片展示，包含：
  - 算法类型标签（颜色区分）
  - 样本数量可视化（热力图）
  - 标签分布图表
  - 训练曲线预览
- 模型卡片展示，包含：
  - 算法名称标签
  - 精度进度条
  - 精度百分比显示
- 数据集/模型详情页面，包含：
  - 图片预览功能
  - 标签统计信息
- 上传功能：
  - 支持ZIP压缩包上传
  - 支持文件夹上传
  - 上传进度显示
- 搜索和筛选功能

## 算法类型

系统支持的算法类型（可在设置页面或数据库中配置）：
- 路面积水检测
- 漂浮物检测
- 墙面裂缝检测
- 游泳检测
- 其他（默认灰色）

## 技术方法

系统支持的技术方法（可在设置页面或数据库中配置）：
- 目标检测算法
- 实例分割算法

## 应用现场

系统支持的应用现场（可在设置页面或数据库中配置）：
- 苏北灌溉总渠
- 南水北调宝应站
- 慈溪北排
- 慈溪周巷
- 瓯江引水
- 其他（默认灰色）

## 数据来源

系统支持的数据来源（可在设置页面或数据库中配置）：
- 互联网
- 本地采集
- 合作伙伴
- 公开数据集

## 模型类别

系统支持的模型类别（可在 MODEL_CAT_COLORS 中扩展）：
- YOLO
- 多标签实例分割模型（双标签）
- 多标签实例分割模型（三标签）
- 单标签实例分割模型（背景负样本）
- 单标签实例分割模型
- 单标签目标检测模型
- 其他（默认灰色）

## 开发指南

### 添加新的算法类型

1. 在 `server.py` 中修改 ALGO_COLORS 颜色定义
2. 或在数据库中添加对应的 algo_type

### 添加新的模型类别

1. 在 `server.py` 中修改 MODEL_CAT_COLORS 颜色定义
2. 或在数据库中添加对应的 category

### 自定义前端样式

修改 `参考资料/vision-platform-preview.html` 文件，系统会自动加载并注入数据。

## 依赖

```
flask>=2.0.0
streamlit>=1.20.0
pandas>=1.5.0
Pillow>=9.0.0
werkzeug>=2.0.0
```

## 版本历史

### v1.7.0 (2026-04-15)
- 新增：应用现场管理模块（sites表、/api/sites接口）
- 新增：原始数据管理模块（raw_data表、/api/raw-data接口）
- 新增：数据集版本管理（/api/dataset/<name>/versions接口）
- 新增：审计日志模块（/api/audit/logs、/api/audit/stats接口）
- 新增：用户认证模块（注册、登录、会话管理）
- 新增：性能监控端点（/api/performance）
- 新增：系统健康检查端点（/api/health）
- 新增：存储空间详情端点（/api/storage）
- 新增：批量删除数据集接口（/api/datasets/batch-delete）
- 新增：批量删除模型接口（/api/models/batch-delete）
- 新增：批量导出模型接口（/api/models/batch-export）
- 新增：模型详情v2页面（/api/model/<name>/detail-v2）
- 新增：数据集版本对比接口（/api/versions/compare）
- 优化：PR曲线、混淆矩阵等图表展示
- 优化：验证集识别结果分离显示（标注vs预测）
- 修复：多项Bug修复和稳定性优化

### v1.6 (2026-03-??)
- (功能迭代中，与v1.7合并发布)

### v1.5 (2026-03-07)
- 新增：模型文件夹上传功能（支持results.csv解析）
- 新增：模型精度进度条显示
- 新增：验证集标注/预测图片分离显示
- 新增：PR曲线与混淆矩阵卡片
- 新增：CSV训练曲线图自动生成（mAP50、mAP50-95、边框损失）
- 新增：中文字体支持（解决matplotlib中文显示问题）
- 优化：图片尺寸放大（300x200px）
- 优化：曲线图顺序调整（训练集左，验证集右）
- 修复：API路由冲突问题

### v1.4 (2026-03-06)
- 新增：标注分布热力图（使用classInfo真实数据）
- 新增：数据分析图表点击查看大图功能
- 新增：数据集详情编辑功能（算法类型、技术方法、图表上传）
- 新增：编辑标签与类别数量同行显示
- 优化：新建数据集成功后保留当前界面
- 修复：编辑保存后页面刷新
- 修复：模型详情页面datasetsState引用错误

### v1.3 (2026-03-05)
- 新增：算法类型和技术方法字段
- 新增：设置页面（支持算法类型、技术方法、标注格式配置）
- 新增：全体总览页面作为默认标签页
- 新增：数据分析图表（matplotlib生成detail.png和distribution.png）
- 新增：ZIP文件保留和下载功能
- 优化：实例分割（polygon）与目标检测（bbox）标注可视化
- 优化：样本数量统计（排除vis目录）
- 修复：设置持久化到数据库

### v1.2 (2026-03-05)
- 新增：数据集上传校验功能（名称重复检测、YOLO格式4步校验）
- 新增：标注类型选择（YOLO/VOC/COCO）
- 新增：标签编辑功能
- 新增：数据集总览真实缩略图预览
- 新增：数据库新字段（storage_type, annotation_type, split_ratio, class_info等）
- 优化：大文件上传支持（5GB）
- 修复：数据库编码问题

### v1.1 (2026-03-04)
- 新增：文件夹上传支持（webkitdirectory）
- 新增：数据集详情图片预览功能
- 新增：大文件上传支持（500MB）
- 优化：禁用Flask自动重载，提升上传稳定性
- 修复：数据集描述特殊字符转义问题

### v1.0 (初始版本)
- 数据集和模型的基本CRUD功能
- ZIP压缩包上传
- 数据集和模型卡片展示
- 搜索和筛选功能

### API 接口文档

#### 数据集 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/datasets` | 获取数据集列表 |
| GET | `/api/datasets?q=xxx` | 搜索数据集 |
| GET | `/api/dataset/<name>/images` | 获取数据集图片 |
| POST | `/api/dataset/upload` | 上传数据集 |
| POST | `/api/dataset/validate-name` | 校验数据集名称 |
| POST | `/api/dataset/<name>/class-info` | 更新类别信息 |
| DELETE | `/api/dataset/<name>` | 删除数据集 |

#### 模型 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/models` | 获取模型列表 |
| GET | `/api/models?q=xxx` | 搜索模型 |
| GET | `/api/model/<name>/detail` | 获取模型详情（含图表路径） |
| POST | `/api/model/upload` | 上传模型（文件夹模式） |
| DELETE | `/api/model/<name>` | 删除模型 |
| POST | `/api/models/batch-delete` | 批量删除模型 |
| POST | `/api/models/batch-export` | 批量导出模型（ZIP） |

#### 数据集版本 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dataset/<name>/versions` | 获取数据集版本列表 |
| POST | `/api/dataset/<name>/versions` | 创建数据集版本 |
| GET | `/api/version/<version_id>` | 获取版本详情 |
| POST | `/api/versions/compare` | 对比两个版本 |
| DELETE | `/api/version/<version_id>` | 删除指定版本 |

#### 统计 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取统计信息 |
| GET | `/api/performance` | 获取性能指标 |
| GET | `/api/health` | 系统健康检查 |
| GET | `/api/storage` | 存储空间详情 |

#### 设置 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取系统设置 |
| POST | `/api/settings` | 更新系统设置 |

#### 图表 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dataset/<name>/charts` | 获取数据集图表 |
| POST | `/api/dataset/<name>/chart-upload` | 上传图表文件 |

#### 应用现场管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sites` | 获取应用现场列表（含关联统计） |
| POST | `/api/sites` | 添加应用现场 |
| DELETE | `/api/sites/<name>` | 删除应用现场 |

#### 原始数据管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/raw-data` | 获取原始数据列表 |
| POST | `/api/raw-data` | 添加原始数据 |
| DELETE | `/api/raw-data/<name>` | 删除原始数据 |

#### 审计日志 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/audit/logs` | 查询审计日志 |
| GET | `/api/audit/stats` | 获取审计统计数据 |

#### 用户认证 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/register` | 用户注册 |
| POST | `/api/login` | 用户登录 |
| GET | `/api/me` | 获取当前用户信息 |
| GET | `/api/csrf` | 获取CSRF令牌 |

### 上传示例

```javascript
// 上传ZIP压缩包
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('name', 'my_dataset');
formData.append('algoType', '路面积水检测');
formData.append('description', '数据集描述');
formData.append('maintainer', '管理员');
formData.append('uploadMode', 'zip');

fetch('/api/dataset/upload', {
  method: 'POST',
  body: formData
}).then(res => res.json()).then(data => console.log(data));

// 上传文件夹
const folderFormData = new FormData();
folderFormData.append('files', fileInput.files); // 多个文件
folderFormData.append('name', 'my_folder_dataset');
folderFormData.append('algoType', '其他');
folderFormData.append('uploadMode', 'folder');

fetch('/api/dataset/upload', {
  method: 'POST',
  body: folderFormData
}).then(res => res.json()).then(data => console.log(data));
```

## 许可证

MIT License
