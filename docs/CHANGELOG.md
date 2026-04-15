# CHANGELOG - SLSD Vision Platform

所有重要的版本更新都会记录在此文件中。

---

## v1.7.0 (2026-04-15)

### 新增功能

#### 应用现场管理
- 新增「应用现场」管理模块（sites 数据库表）
- 预置应用现场列表：苏北灌溉总渠、南水北调宝应站、慈溪北排、慈溪周巷、瓯江引水
- 数据集可关联应用现场（source 字段）
- 模型可关联应用现场（site 字段）
- 应用现场详情展示：数据集数量、模型数量、维护人、维护日期
- API 接口：`GET /api/sites`、`POST /api/sites`、`DELETE /api/sites/<name>`

#### 原始数据管理
- 新增「原始数据」管理模块（raw_data 数据库表）
- 支持添加/删除原始数据记录
- 原始数据字段：名称、算法类型、描述、关联数据集、数据来源、是否已标注、维护日期、维护人
- 数据来源可选：互联网、本地采集、合作伙伴、公开数据集
- API 接口：`GET /api/raw-data`、`POST /api/raw-data`、`DELETE /api/raw-data/<name>`

#### 数据集版本管理
- 支持为数据集创建版本快照（dataset_versions 表）
- 支持查看版本详情和历史版本列表
- 支持版本对比分析
- 支持删除指定版本
- API 接口：
  - `GET /api/dataset/<name>/versions` - 获取版本列表
  - `POST /api/dataset/<name>/versions` - 创建版本
  - `GET /api/version/<version_id>` - 获取版本详情
  - `POST /api/versions/compare` - 对比两个版本
  - `DELETE /api/version/<version_id>` - 删除版本

#### 审计日志
- 记录所有关键操作行为（数据集/模型增删改）
- 审计字段：用户、操作类型、资源类型、资源名称、详情、IP地址、操作状态、错误信息、时间
- 提供审计日志查询接口和分页支持
- 提供审计统计数据（按操作类型/资源类型统计）
- API 接口：`GET /api/audit/logs`、`GET /api/audit/stats`

#### 用户认证
- 用户注册接口（用户名、密码）
- 用户登录接口（会话 Cookie）
- 当前用户信息查询
- CSRF 令牌保护
- API 接口：`POST /api/register`、`POST /api/login`、`GET /api/me`、`GET /api/csrf`

#### 性能监控
- 实时性能指标端点（响应时间、请求量统计）
- 系统健康检查端点
- 存储空间详情统计（各数据目录大小）
- API 接口：`GET /api/performance`、`GET /api/health`、`GET /api/storage`

#### 批量操作
- 批量删除数据集（支持多选）
- 批量删除模型（支持多选）
- 批量导出模型（ZIP 打包下载）
- API 接口：`POST /api/datasets/batch-delete`、`POST /api/models/batch-delete`、`POST /api/models/batch-export`

#### 模型详情页增强
- 模型验证集识别结果分离：标注图片 vs 预测图片
- PR曲线、F1曲线、精确率曲线、召回率曲线、混淆矩阵展示
- 训练曲线自动生成（mAP50、mAP50-95、边框损失）

#### 设置页面增强
- 支持配置应用现场列表
- 支持配置数据来源列表
- 新增 sites 和 sources 字段到 settings 表

### 优化改进
- PR曲线、混淆矩阵等图表展示优化
- 验证集识别结果分离显示（标注 vs 预测）
- 数据来源与应用现场关联管理
- 多项 Bug 修复和稳定性优化

### 数据库变更
- 新增 `dataset_versions` 表：数据集版本记录
- 新增 `raw_data` 表：原始数据记录
- 新增 `sites` 表：应用现场记录
- 新增 `audit_logs` 表：操作审计日志
- `datasets` 表新增 `source` 字段
- `models` 表新增 `site` 字段
- `settings` 表新增 `sites` 和 `sources` 字段

---

## v1.6 (2026-03-??)

*功能迭代中，与 v1.7 合并发布*

---

## v1.5 (2026-03-07)

- 新增：模型文件夹上传功能（支持 results.csv 解析）
- 新增：模型精度进度条显示
- 新增：验证集标注/预测图片分离显示
- 新增：PR曲线与混淆矩阵卡片
- 新增：CSV训练曲线图自动生成（mAP50、mAP50-95、边框损失）
- 新增：中文字体支持（解决 matplotlib 中文显示问题）
- 优化：图片尺寸放大（300x200px）
- 优化：曲线图顺序调整（训练集左，验证集右）
- 修复：API路由冲突问题

---

## v1.4 (2026-03-06)

- 新增：标注分布热力图（使用 classInfo 真实数据）
- 新增：数据分析图表点击查看大图功能
- 新增：数据集详情编辑功能（算法类型、技术方法、图表上传）
- 新增：编辑标签与类别数量同行显示
- 优化：新建数据集成功后保留当前界面
- 修复：编辑保存后页面刷新
- 修复：模型详情页面 datasetsState 引用错误

---

## v1.3 (2026-03-05)

- 新增：算法类型和技术方法字段
- 新增：设置页面（支持算法类型、技术方法、标注格式配置）
- 新增：全体总览页面作为默认标签页
- 新增：数据分析图表（matplotlib 生成 detail.png 和 distribution.png）
- 新增：ZIP文件保留和下载功能
- 优化：实例分割（polygon）与目标检测（bbox）标注可视化
- 优化：样本数量统计（排除 vis 目录）
- 修复：设置持久化到数据库

---

## v1.2 (2026-03-05)

- 新增：数据集上传校验功能（名称重复检测、YOLO格式4步校验）
- 新增：标注类型选择（YOLO/VOC/COCO）
- 新增：标签编辑功能
- 新增：数据集总览真实缩略图预览
- 新增：数据库新字段（storage_type, annotation_type, split_ratio, class_info 等）
- 优化：大文件上传支持（5GB）
- 修复：数据库编码问题

---

## v1.1 (2026-03-04)

- 新增：文件夹上传支持（webkitdirectory）
- 新增：数据集详情图片预览功能
- 新增：大文件上传支持（500MB）
- 优化：禁用 Flask 自动重载，提升上传稳定性
- 修复：数据集描述特殊字符转义问题

---

## v1.0 (初始版本)

- 数据集和模型的基本 CRUD 功能
- ZIP 压缩包上传
- 数据集和模型卡片展示
- 搜索和筛选功能
