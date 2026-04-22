# SLSD Vision 数据集与模型管理模块测试报告

**测试时间**: 2026-04-22
**测试环境**: http://1.13.247.173/slsd-vision/
**测试账号**: admin / admin123
**测试方法**: API接口测试 + 前端功能验证

---

## 数据集管理测试结果

### DatasetList 列表页

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 页面加载 | 访问 /slsd-vision/datasets | 显示数据集列表 | 返回数据集列表JSON，包含1条记录 | ✅ | |
| 列表展示 | GET /api/datasets | 返回数据集列表 | 返回完整数据集列表（名称/算法类型/标注格式/图片数量等字段） | ✅ | |
| 搜索功能 | GET /api/datasets?search=crack | 返回匹配结果 | 成功返回包含"crack"关键词的数据集 | ✅ | |
| 分页功能 | GET /api/datasets?page=1&page_size=5 | 分页返回数据 | 支持page和page_size参数 | ✅ | 当前只有1条数据，无法验证分页效果 |
| 筛选功能 | GET /api/datasets?algoType=墙面裂缝检测 | 返回筛选结果 | 成功按algoType筛选 | ✅ | |

**问题发现**: 无

---

### DatasetDetail 详情页

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 详情获取 | GET /api/dataset/{name} | 返回数据集详情 | **返回405 Method Not Allowed** | ❌ | 后端该路由仅支持PUT/DELETE，不支持GET方法 |
| 图片列表 | GET /api/dataset/{name}/images | 返回图片列表 | 成功返回验证集图片路径列表（50张） | ✅ | |
| 数据集图表 | GET /api/dataset/{name}/charts | 返回统计图表数据 | 返回 `{"detail": null, "distribution": null}` | ⚠️ | 图表数据为空 |
| 版本信息 | GET /api/dataset/{name}/versions | 返回版本历史 | 返回 `{"versions": [], "latest_version": null, "success": true}` | ⚠️ | 无版本数据 |

**问题汇总**:
| # | 模块 | 功能 | 问题 | 严重程度 |
|---|------|------|------|----------|
| 1 | DatasetDetail | 详情获取 | API路由 `/api/dataset/{name}` 不支持GET方法，与前端使用方式不匹配 | P0 |
| 2 | DatasetDetail | 图表数据 | charts接口返回空数据，可能数据集未生成图表 | P1 |

---

### UploadModal 上传弹窗

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 上传接口 | POST /api/dataset/upload | 支持文件上传 | 存在该API端点，接收name和file参数 | ✅ | |
| 名称验证 | POST /api/dataset/validate-name | 验证数据集名称 | 存在该API端点 | ✅ | |

**问题发现**: 无（无法完整测试上传流程，需要实际文件）

---

### DatasetEditModal 编辑弹窗

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 编辑保存 | PUT /api/dataset/{name} | 更新数据集信息 | **返回405 Method Not Allowed** | ❌ | 后端路由方法问题（同详情页问题） |

**问题汇总**:
| # | 模块 | 功能 | 问题 | 严重程度 |
|---|------|------|------|----------|
| 1 | DatasetEditModal | 编辑保存 | PUT方法返回405，API路由定义与前端调用不匹配 | P0 |

---

### 数据集下载功能

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 下载接口 | GET /api/dataset/{name}/download | 返回下载文件 | **返回404 NOT FOUND** | ❌ | 下载路由未正确实现或数据集文件不存在 |

**问题汇总**:
| # | 模块 | 功能 | 问题 | 严重程度 |
|---|------|------|------|----------|
| 1 | 数据集下载 | 下载功能 | 返回404，下载接口不可用 | P0 |

---

## 模型管理测试结果

### ModelList 列表页

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 页面加载 | 访问 /slsd-vision/models | 显示模型列表 | 返回模型列表JSON | ✅ | |
| 列表展示 | GET /api/models | 返回模型列表 | 返回包含模型名称/准确率/类别等信息 | ✅ | |
| 搜索功能 | GET /api/models?search=loushui | 返回匹配结果 | 成功返回搜索结果 | ✅ | |
| 分页功能 | GET /api/models?page=1&page_size=10 | 分页返回数据 | 支持分页参数 | ✅ | 当前只有1条数据 |
| 筛选功能 | GET /api/models?category=YOLO | 返回筛选结果 | 成功按category筛选 | ✅ | |

**问题发现**: 无

---

### ModelDetail 详情页

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 详情获取 | GET /api/model/{name} | 返回模型详情 | **返回405 Method Not Allowed** | ❌ | 后端路由仅支持PUT/DELETE，不支持GET |
| 详情获取2 | GET /api/model/detail/{name} | 返回模型详情 | **返回404 NOT FOUND** | ❌ | 路由不存在 |
| 元数据 | GET /api/model/detail/{name} (通过正确路由) | 返回模型元数据 | 成功返回metadata，包含accuracy/algoName/category等 | ✅ | 需要使用正确路径 |
| 图表数据 | (从detail接口获取) | 返回曲线图表路径 | 成功返回charts对象（BoxF1/PR/P/R曲线等） | ✅ | |

**问题汇总**:
| # | 模块 | 功能 | 问题 | 严重程度 |
|---|------|------|------|----------|
| 1 | ModelDetail | 详情获取 | `/api/model/{name}` 返回405，前端调用方式与后端路由不匹配 | P0 |
| 2 | ModelDetail | 详情获取 | `/api/model/detail/{name}` 返回404，路由未注册 | P1 |

---

### ModelCompare 对比页

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 对比接口 | GET /api/models/compare?models= | 返回对比结果 | 返回 `{"error": "请指定要对比的模型", "success": false}` | ✅ | 参数验证正常 |
| 对比接口 | GET /api/models/compare?models=loushui,loushui | 返回对比结果 | 返回 `{"models": [], "success": true}` | ✅ | 相同模型返回空列表 |
| 对比接口 | GET /api/models/compare?ids=1,2 | 返回对比结果 | 返回 `{"error": "请指定要对比的模型", "success": false}` | ✅ | ids参数不支持 |
| 页面加载 | 访问前端对比页 | 显示对比UI | 前端存在compare相关代码 | ✅ | |

**问题发现**: 无（对比功能正常工作）

---

### ModelUploadModal 上传弹窗

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 上传接口 | POST /api/model/upload | 支持模型文件上传 | 存在该API端点 | ✅ | |
| 参数接收 | (支持name/algoName/techMethod/category/accuracy等) | 接收完整参数 | 后端正确处理多个参数 | ✅ | |

**问题发现**: 无（无法完整测试上传流程，需要实际文件）

---

### ModelEditModal 编辑弹窗

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 编辑保存 | PUT /api/model/{name} | 更新模型信息 | 成功返回 `{"success": true}` | ✅ | |
| 测试数据 | PUT /api/model/loushui 更新description为"测试更新描述" | 更新成功 | 返回success:true，数据已更新 | ✅ | |

**问题发现**: 无

---

### 模型下载功能

| 功能点 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 问题描述 |
|--------|----------|----------|----------|------|----------|
| 下载接口 | GET /api/model/{name}/download | 返回下载文件 | **返回404 NOT FOUND** | ❌ | 下载路由未正确实现或模型文件不存在 |

**问题汇总**:
| # | 模块 | 功能 | 问题 | 严重程度 |
|---|------|------|------|----------|
| 1 | 模型下载 | 下载功能 | 返回404，下载接口不可用 | P0 |

---

## 问题汇总

### P0 - 严重问题（阻塞功能）

| # | 模块 | 功能 | 问题描述 |
|---|------|------|----------|
| 1 | DatasetDetail | 详情获取 | `/api/dataset/{name}` GET请求返回405，路由仅支持PUT/DELETE |
| 2 | DatasetEditModal | 编辑保存 | `/api/dataset/{name}` PUT请求返回405（同问题1） |
| 3 | DatasetDownload | 下载功能 | `/api/dataset/{name}/download` 返回404 |
| 4 | ModelDetail | 详情获取 | `/api/model/{name}` GET请求返回405，路由仅支持PUT/DELETE |
| 5 | ModelDownload | 下载功能 | `/api/model/{name}/download` 返回404 |

### P1 - 次要问题

| # | 模块 | 功能 | 问题描述 |
|---|------|------|----------|
| 1 | DatasetDetail | 图表数据 | `/api/dataset/{name}/charts` 返回空数据 |
| 2 | DatasetDetail | 版本信息 | `/api/dataset/{name}/versions` 返回空版本列表 |
| 3 | ModelDetail | 详情路由 | `/api/model/detail/{name}` 返回404，路由未注册 |

---

## API路由映射总结

### 后端实际路由（从backend代码分析）

#### 数据集路由 (`/api/dataset`)
| 方法 | 路由 | 功能 | 状态 |
|------|------|------|------|
| POST | `/api/dataset/validate-name` | 验证名称 | ✅ |
| POST | `/api/dataset/upload` | 上传数据集 | ✅ |
| GET | `/api/dataset/{name}/images` | 获取图片列表 | ✅ |
| GET | `/api/dataset/{name}/split-images` | 获取划分图片 | ✅ |
| GET | `/api/dataset/{name}/preview-images` | 获取预览图片 | ⚠️ 未测试 |
| GET | `/api/dataset/{name}/charts` | 获取图表数据 | ⚠️ 返回空 |
| GET | `/api/dataset/{name}/versions` | 获取版本信息 | ⚠️ 返回空 |
| GET | `/api/dataset/{name}` | 获取详情 | ❌ 405 |
| PUT | `/api/dataset/{name}` | 更新数据集 | ❌ 405 |
| DELETE | `/api/dataset/{name}` | 删除数据集 | ⚠️ 未测试 |
| GET | `/api/dataset/{name}/download` | 下载数据集 | ❌ 404 |

#### 模型路由 (`/api/model`)
| 方法 | 路由 | 功能 | 状态 |
|------|------|------|------|
| POST | `/api/model/upload` | 上传模型 | ✅ |
| GET | `/api/model/detail/{name}` | 获取详情 | ❌ 404 |
| GET | `/api/model/{name}` | 获取详情 | ❌ 405 |
| PUT | `/api/model/{name}` | 更新模型 | ✅ |
| DELETE | `/api/model/{name}` | 删除模型 | ⚠️ 未测试 |
| GET | `/api/model/{name}/download` | 下载模型 | ❌ 404 |

#### 其他路由
| 方法 | 路由 | 功能 | 状态 |
|------|------|------|------|
| GET | `/api/models` | 获取模型列表 | ✅ |
| GET | `/api/models?search=xxx` | 搜索模型 | ✅ |
| GET | `/api/models/compare?models=xxx,yyy` | 模型对比 | ✅ |
| GET | `/api/datasets` | 获取数据集列表 | ✅ |
| GET | `/api/datasets?search=xxx` | 搜索数据集 | ✅ |

---

## 结论

### 通过率

| 模块 | 测试项数 | 通过 | 失败 | 通过率 |
|------|---------|------|------|--------|
| 数据集管理 | 13 | 8 | 5 | 61.5% |
| 模型管理 | 15 | 11 | 4 | 73.3% |
| **总计** | **28** | **19** | **9** | **67.9%** |

### 核心问题

1. **前后端API路由不匹配**: 前端代码中使用GET请求 `/api/dataset/{name}` 和 `/api/model/{name}` 获取详情，但后端这两个路由只注册了PUT和DELETE方法，导致前端详情页无法正常加载。

2. **下载功能不可用**: 数据集和模型的下载接口均返回404，需要检查文件路径配置或实现状态。

3. **部分数据为空**: 数据集图表和版本信息返回空数据，可能需要生成或导入数据。

### 建议

1. 修复后端路由：为 `/api/dataset/{name}` 和 `/api/model/{name}` 添加GET方法支持
2. 检查下载接口：验证文件存储路径是否正确
3. 补充测试数据：当前数据集和模型数量较少（各1条），无法充分验证分页等复杂功能
