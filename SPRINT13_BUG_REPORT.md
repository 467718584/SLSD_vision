# Sprint 13 - 浏览器测试问题报告

**测试日期**: 2026-04-20
**测试地址**: http://1.13.247.173/slsd-vision/
**测试方法**: Playwright浏览器自动化

---

## 一、发现的问题

### 🔴 问题1: 数据集详情页图片显示异常

**现象**: 浏览器测试显示数据集详情页图片数为0

**分析**:
1. API `/api/dataset/{name}/split-images` 正确返回50张验证集图片
2. 图片路径 `http://1.13.247.173/slsd-vision/data/datasets/...` 可访问 (HTTP 200)
3. 前端DatasetDetail组件有正确的ImageSection组件显示train/val/test

**可能原因**:
- 浏览器测试时数据集名称不匹配（用错数据集名）
- 图片加载需要时间，测试等待不足
- 前端getImageUrl路径转换逻辑问题

**验证**:
```bash
# API返回正确
curl "http://1.13.247.173/slsd-vision/api/dataset/crack-seg-yolo_dataset-4000/split-images"
# 返回: {"test":[],"train":[],"val":[50张图片路径...]}

# 图片可访问
curl -I "http://1.13.247.173/slsd-vision/data/datasets/crack-seg-yolo_dataset-4000/.../val/3900.rf.xxx.jpg"
# HTTP/1.1 200 OK
```

---

### 🔴 问题2: Raw Data标签页卡死

**现象**: 点击Raw Data导航后页面可能卡死

**分析**:
1. 侧边栏有Raw Data导航项
2. 浏览器测试显示点击后页面HTML长度为12005（正常页面应更大）
3. 浏览器测试中body可见但后续交互超时

**可能原因**:
- RawData组件可能有无限循环或大量数据渲染
- 组件未使用骨架屏导致加载时UI卡顿
- 大数据集导致浏览器性能问题

**建议检查**:
- 检查RawData.tsx组件代码
- 确认是否有虚拟列表/分页
- 验证骨架屏是否正确应用

---

### 🟡 问题3: 训练/验证/测试集标签页未显示

**现象**: 数据集详情页应该显示训练集、验证集、测试集三个标签页

**分析**:
1. DatasetDetail组件有train/val/test三个ImageSection
2. 但浏览器测试显示页面不包含"训练"、"测试"关键词
3. 只有"验证"返回true（可能是算法类型名称中包含）

**可能原因**:
- API返回的train/test为空数组，只有val有数据
- 但验证集应该显示（val.length=50）
- 可能是截图时机问题，图片未加载完成

---

## 二、API验证结果

### 数据集API正常
| API端点 | 状态 | 数据 |
|---------|------|------|
| GET /api/datasets | ✅ 200 | 1个数据集 |
| GET /api/dataset/{name}/split-images | ✅ 200 | train=0, val=50, test=0 |
| GET /api/models | ✅ 200 | [] |
| GET /api/stats | ✅ 200 | 1数据集/0模型/4029图片 |
| GET /api/settings | ✅ 200 | 5类设置完整 |

### 图片路径验证正常
```bash
# 图片返回HTTP 200
curl -I "http://1.13.247.173/slsd-vision/data/datasets/crack-seg-yolo_dataset-4000/.../val/3900.rf.xxx.jpg"
HTTP/1.1 200 OK
Content-Type: image/jpeg
```

---

## 三、需要修复的内容

### 1. RawData组件问题 (P0)
- 文件: `frontend/src/components/RawData.tsx`
- 问题: 加载大数据集时可能卡死
- 建议: 
  - 添加虚拟滚动/分页
  - 确保骨架屏正确显示
  - 添加加载状态指示

### 2. 数据集详情图片加载 (P1)
- 文件: `frontend/src/components/DatasetDetail.tsx`
- 问题: 图片可能未正确显示
- 建议:
  - 增加图片加载等待时间
  - 添加图片加载错误处理
  - 验证getImageUrl函数正确转换

### 3. 训练/验证/测试集显示 (P1)
- 文件: `frontend/src/components/DatasetDetail.tsx`
- 问题: 只显示验证集，训练集和测试集为空
- 建议:
  - 这个可能是数据问题（数据集本身没有train/test分割）
  - 建议检查数据集上传时的分割比例设置

---

## 四、后续测试建议

### 需要人工测试验证
1. 打开浏览器访问 http://1.13.247.173/slsd-vision/
2. 登录 (admin/admin123)
3. 点击侧边栏"Datasets"
4. 点击数据集名称进入详情页
5. 检查:
   - 是否显示"数据集预览"卡片
   - 是否显示"验证集 (50)"标签
   - 图片是否正常加载显示
6. 点击侧边栏"Raw Data"
7. 检查:
   - 页面是否卡死
   - 数据是否正常加载

### 需要代码检查
1. RawData.tsx组件 - 检查是否有性能问题
2. DatasetDetail.tsx - 检查图片加载逻辑
3. 确认骨架屏是否正确应用

---

## 五、截图文件

测试截图保存在: `screenshots/`
- issue_01_overview.png - 总览页
- issue_02_dataset_list.png - 数据集列表
- issue_03_dataset_detail.png - 数据集详情
- raw_01_before.png - Raw Data点击前
- raw_02_after_click.png - Raw Data点击后
