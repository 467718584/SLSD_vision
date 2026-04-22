# Sprint 14 问题修复工作清单

**创建日期**: 2026-04-22
**目标**: 修复所有P0/P1问题
**测试环境**: http://1.13.247.173/slsd-vision/

---

## P0 问题 (必须立即修复)

| # | 问题 | 模块 | 原因分析 | 修复方案 | 状态 | 验收标准 |
|---|------|------|----------|----------|------|----------|
| 1 | GET `/api/dataset/{name}` 返回405 | 后端 | dataset_routes.py没有GET方法 | 添加`@dataset_bp.route('/<name>', methods=['GET'])` | ⏳ | curl测试返回200 |
| 2 | GET `/api/model/{name}` 返回405 | 后端 | model_routes.py没有GET方法 | 添加`@model_bp.route('/<name>', methods=['GET'])` | ⏳ | curl测试返回200 |
| 3 | PUT `/api/dataset/{name}` 返回405 | 后端 | DELETE/PUT路由缺少装饰器 | 添加`@api_handler`装饰器 | ⏳ | curl测试返回200 |
| 4 | 数据集下载返回404 | 后端 | 文件路径或路由问题 | 检查DATASETS_DIR配置和路由 | ⏳ | curl测试返回文件 |
| 5 | 模型下载返回404 | 后端 | 文件路径或路由问题 | 检查MODELS_DIR配置和路由 | ⏳ | curl测试返回文件 |
| 6 | 审计日志API返回404 | 后端 | 前端调用`/api/audit/logs` vs `/api/logs` | 确认路由是否存在或添加别名 | ⏳ | curl测试返回JSON |
| 7 | 应用现场统计NaN | 前端/后端 | 字段名不匹配`dataset` vs `dataset_count` | 统一后端返回字段名 | ⏳ | 前端显示正确数字 |

---

## P1 问题 (重要)

| # | 问题 | 模块 | 修复方案 | 状态 | 验收标准 |
|---|------|------|----------|------|----------|
| 1 | 图表数据为空 | 后端 | 检查`generate_dataset_charts`函数 | ⏳ | 图表API返回真实数据 |
| 2 | 版本数据为空 | 后端 | 实现版本管理API或提供模拟数据 | ⏳ | versions API返回数据 |
| 3 | Images显示0 | 前端/后端 | 修复stats API统计逻辑 | ⏳ | Overview显示正确图片数 |

---

## UI整改问题

| # | 问题 | 页面 | 优先级 | 整改方案 | 状态 |
|---|------|------|--------|----------|------|
| 1 | 间距不统一 | 全局 | P1 | 建立8px间距系统 | ⏳ |
| 2 | 空状态设计差 | 所有列表页 | P1 | 添加引导式空状态 | ⏳ |
| 3 | 缺少图标 | 全局 | P2 | 统一图标系统 | ⏳ |
| 4 | Roboflow色差 | 全局 | P2 | 统一品牌色#2563EB | ⏳ |
| 5 | 卡片圆角小 | 全局 | P2 | 增大圆角至12-16px | ⏳ |

---

## 修复执行记录

| 日期时间 | 修复项 | 执行者 | 结果 | 验收人 |
|----------|--------|--------|------|--------|
| 2026-04-22 11:20 | P0问题修复启动 | 后端专家A | 进行中 | - |
| 2026-04-22 11:20 | P1问题修复启动 | 后端专家B | 进行中 | - |
| 2026-04-22 11:20 | UI整改启动 | 前端专家 | 进行中 | - |

---

## 测试验证清单

### 后端API测试
```bash
# 1. 数据集详情GET
curl -X GET http://1.13.247.173:8501/api/dataset/crack-seg-yolo_dataset-4000
# 预期: 200 OK

# 2. 模型详情GET
curl -X GET http://1.13.247.173:8501/api/model/loushui
# 预期: 200 OK (或404如果模型不存在)

# 3. 数据集下载
curl -I http://1.13.247.173:8501/api/dataset/crack-seg-yolo_dataset-4000/download
# 预期: 200 OK 或 文件下载

# 4. 模型下载
curl -I http://1.13.247.173:8501/api/model/loushui/download
# 预期: 200 OK 或 文件下载

# 5. 审计日志
curl http://1.13.247.173:8501/api/audit/logs?limit=10
# 预期: 200 OK

# 6. 应用现场统计
curl http://1.13.247.173:8501/api/sites
# 预期: dataset_count 和 model_count 有值(非NaN)
```

### 前端功能测试
```markdown
- [ ] DatasetList: 点击数据集名称 → 进入详情页
- [ ] DatasetDetail: 显示完整数据集信息
- [ ] ModelDetail: 显示完整模型信息
- [ ] 数据集下载: 点击下载按钮 → 触发下载
- [ ] 模型下载: 点击下载按钮 → 触发下载
- [ ] SiteManagement: 显示正确的关联统计
- [ ] Overview: Images数量显示正确
```

---

## 交付物

| 文件 | 说明 |
|------|------|
| SPRINT14_FIX_TODO.md | 本工作清单 |
| SPRINT14_FIX_LOG.md | 修复执行日志 |
| SPRINT14_FIX_REPORT.md | 修复完成报告 |
