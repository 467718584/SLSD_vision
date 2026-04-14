# 组件迁移进度追踪

> 追踪从 monolithic HTML 到模块化组件的迁移进度

## 迁移状态总览

| 组件 | 原文件位置 | 行数 | 优先级 | 状态 |
|------|-----------|------|--------|------|
| App (主容器) | monolithic | ~50 | P0 | ✅ 完成框架 |
| DatasetDetail | monolithic | ~400 | P1 | ✅ 基础框架 |
| ModelDetail | monolithic | ~200 | P1 | ✅ 基础框架 |
| DatasetList | monolithic | ~150 | P1 | 🔄 进行中 |
| ModelList | monolithic | ~150 | P1 | ⏳ 待开始 |
| UploadModal | monolithic | ~300 | P2 | ⏳ 待开始 |
| SettingsDialog | monolithic | ~200 | P2 | ⏳ 待开始 |
| 其他模态框 | monolithic | ~400 | P3 | ⏳ 待开始 |

## 当前瓶颈分析

### Monolithic HTML 结构 (2640行)

```
vision-platform-preview.html
├── 常量定义 (C, ALGO_COLORS, etc.) ~50行
├── 基础组件 (Tag, AlgoTag, etc.) ~30行
├── 图表组件 (DetailChart, ClassHeatmap, etc.) ~100行
├── App组件 ~700行
│   ├── 状态定义
│   ├── 数据获取
│   ├── Tab渲染逻辑
│   │   ├── datasets tab (150行表格)
│   │   ├── models tab (150行表格)
│   │   ├── settings tab
│   │   ├── rawdata tab
│   │   └── overview tab
│   └── 模态框渲染
└── 模态框组件定义 ~400行
```

### 迁移策略

由于App组件和表格逻辑深度耦合，建议分阶段迁移：

**阶段1: 抽取独立组件**
- DatasetDetail ✅
- ModelDetail ✅
- DatasetList 🔄 (进行中)
- ModelList ⏳

**阶段2: 抽取模态框**
- UploadModal
- SettingsDialog
- EditClassInfoModal
- ModelEditModal

**阶段3: 清理App组件**
- 移除内联表格渲染逻辑
- 使用新抽取的组件
- 清理冗余代码

## DatasetList 迁移详情

**目标**: 将数据集列表抽取为独立组件

**需要迁移的元素**:
- 搜索输入框
- 筛选按钮组
- 数据表格 (16列)
- 分页控制（如果有）

**API依赖**:
- GET /api/datasets
- POST /api/dataset/validate-name
- DELETE /api/dataset/{name}

**组件接口设计**:
```typescript
interface DatasetListProps {
  onSelectDataset: (dataset: Dataset) => void;
  onRefresh: () => void;
}
```

## 下一步行动

1. ✅ App.jsx基础框架
2. ✅ DatasetDetail组件
3. ✅ ModelDetail组件
4. 🔄 DatasetList组件 (当前)
5. ⏳ ModelList组件
6. ⏳ UploadModal组件
7. ⏳ SettingsDialog组件

---

*最后更新: 2026-04-14*
