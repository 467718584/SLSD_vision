# 机器视觉管理平台 (SLSD Vision Platform)

基于 Flask + React/Babel 的数据集与模型管理系统，用于管理和展示机器视觉相关的数据集和训练模型。

## 项目概述

本系统是一个 Web 化管理平台，主要功能包括：
- 数据集管理：上传（支持ZIP压缩包和文件夹）、查看、删除数据集
- 模型管理：上传、查看、删除训练模型
- 数据预览：查看数据集图片和标注信息
- 搜索筛选：通过算法类型、名称等条件筛选数据
- 大文件上传：支持最大500MB的文件上传

## 技术栈

- **后端**: Flask (Python)
- **前端**: React 18 + Babel (通过 CDN 加载)
- **数据库**: SQLite
- **数据存储**: 本地文件系统

## 项目结构

```
SLSD_vision/
├── app.py                      # Streamlit 主应用 (备用)
├── server.py                   # Flask 服务器 (主入口)
├── config.py                   # 配置文件
├── requirements.txt            # Python 依赖
├── generate_test_data.py       # 测试数据生成脚本
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

## 启动方式

### Flask 服务器（推荐）

```bash
# 激活 conda 环境
conda activate transformer-clip

# 或使用 Anaconda Python
/d/Anaconda/python.exe server.py

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

系统支持的算法类型（可在 ALGO_COLORS 中扩展）：
- 路面积水检测
- 漂浮物检测
- 墙面裂缝检测
- 游泳检测
- 其他（默认灰色）

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
| DELETE | `/api/dataset/<name>` | 删除数据集 |

#### 模型 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/models` | 获取模型列表 |
| GET | `/api/models?q=xxx` | 搜索模型 |
| POST | `/api/model/upload` | 上传模型 |
| DELETE | `/api/model/<name>` | 删除模型 |

#### 统计 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取统计信息 |

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
