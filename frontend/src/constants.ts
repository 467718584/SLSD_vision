// 颜色常量系统
export const C = {
  primary: "#1462A8",
  primaryBg: "#EBF3FC",
  primaryBd: "#BFDBF7",
  success: "#2E8B57",
  successBg: "#E8F5EE",
  warning: "#E67E22",
  warningBg: "#FEF5E7",
  orange: "#E8631A",
  orangeBg: "#FDF0E7",
  gray1: "#1A2332",
  gray2: "#3D5166",
  gray3: "#6B8299",
  gray4: "#9EAFBE",
  gray5: "#C8D6E1",
  gray6: "#E8F0F5",
  gray7: "#F4F7FA",
  bg: "#F0F4F8",
  white: "#FFFFFF",
  border: "#D8E4EE"
};

// 颜色配置接口
export interface ColorConfig {
  bg: string;
  border: string;
  text: string;
}

// 算法类型颜色
export const ALGO_COLORS: Record<string, ColorConfig> = {
  "路面积水检测": { bg: C.primaryBg, border: C.primaryBd, text: C.primary },
  "漂浮物检测": { bg: C.successBg, border: "#A8D5C0", text: C.success },
  "墙面裂缝检测": { bg: C.warningBg, border: "#F9D9B0", text: C.warning },
  "游泳检测": { bg: "#FDE9E9", border: "#F5BCBC", text: "#C0392B" },
  "其他": { bg: C.gray6, border: C.border, text: C.gray2 }
};

// 应用现场颜色
export const SITE_COLORS: Record<string, ColorConfig> = {
  "苏北灌溉总渠": { bg: "#E3F2FD", border: "#90CAF9", text: "#1565C0" },
  "南水北调宝应站": { bg: "#E8F5E9", border: "#A5D6A7", text: "#2E7D32" },
  "慈溪北排": { bg: "#FFF3E0", border: "#FFB74D", text: "#E65100" },
  "慈溪周巷": { bg: "#F3E5F5", border: "#CE93D8", text: "#7B1FA2" },
  "瓯江引水": { bg: "#E0F7FA", border: "#80DEEA", text: "#00838F" },
  "互联网": { bg: "#FBE9E7", border: "#FFAB91", text: "#BF360C" },
  "其他": { bg: C.gray6, border: C.border, text: C.gray2 }
};

// 技术方法颜色
export const TECH_METHOD_COLORS: Record<string, ColorConfig> = {
  "目标检测算法": { bg: "#E3F2FD", border: "#90CAF9", text: "#1565C0" },
  "实例分割算法": { bg: "#E8F5E9", border: "#A5D6A7", text: "#2E7D32" }
};

// 标注格式颜色
export const ANNOTATION_COLORS: Record<string, ColorConfig> = {
  "YOLO格式": { bg: C.orangeBg, border: "#F5C8A8", text: C.orange },
  "VOC格式": { bg: "#F3E5F5", border: "#CE93D8", text: "#7B1FA2" },
  "COCO格式": { bg: "#FFF3E0", border: "#FFB74D", text: "#E65100" }
};

// 模型类别颜色
export const MODEL_CAT_COLORS: Record<string, ColorConfig> = {
  "多标签实例分割模型（双标签）": { bg: C.primaryBg, border: C.primaryBd, text: C.primary },
  "多标签实例分割模型（三标签）": { bg: "#E8F4FE", border: "#A8D0F5", text: "#0A4D8C" },
  "单标签实例分割模型（背景负样本）": { bg: C.successBg, border: "#A8D5C0", text: C.success },
  "单标签实例分割模型": { bg: "#EDF6E8", border: "#B0D9A0", text: "#276B27" },
  "单标签目标检测模型": { bg: C.orangeBg, border: "#F5C8A8", text: C.orange },
  "其他": { bg: C.gray6, border: C.border, text: C.gray2 }
};

// 导出常量
export { C as COLORS };
