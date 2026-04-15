// 科技蓝风格 - 精致设计系统 v2.0
// 基于 Linear/Stripe 风格优化

export const C = {
  // 主色系 - 科技蓝
  primary: "#0066CC",
  primaryLight: "#1976D2",
  primaryDark: "#004999",
  primaryBg: "#EBF3FC",
  primaryBd: "#BFDBF7",
  
  // 成功色
  success: "#10B981",
  successBg: "#D1FAE5",
  successBd: "#6EE7B7",
  
  // 警告色
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  warningBd: "#FCD34D",
  
  // 错误色
  error: "#EF4444",
  errorBg: "#FEE2E2",
  errorBd: "#FECACA",
  
  // 橙色
  orange: "#F97316",
  orangeBg: "#FFF7ED",
  orangeBd: "#FDBA74",
  
  // 灰度色阶
  gray1: "#111827",
  gray2: "#374151", 
  gray3: "#6B7280",
  gray4: "#9CA3AF",
  gray5: "#D1D5DB",
  gray6: "#E5E7EB",
  gray7: "#F3F4F6",
  gray8: "#F9FAFB",
  
  // 背景色
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  
  // 阴影
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)",
  shadowLg: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.06)",
  shadowXl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
};

// 过渡动画
export const TRANSITION = {
  fast: "all 0.15s ease",
  normal: "all 0.2s ease",
  slow: "all 0.3s ease",
};

// 圆角
export const RADIUS = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
};

// 间距
export const SPACE = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
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
  "漂浮物检测": { bg: C.successBg, border: C.successBd, text: C.success },
  "墙面裂缝检测": { bg: C.warningBg, border: C.warningBd, text: C.warning },
  "游泳检测": { bg: C.errorBg, border: C.errorBd, text: C.error },
  "其他": { bg: C.gray7, border: C.gray6, text: C.gray2 }
};

// 应用现场颜色
export const SITE_COLORS: Record<string, ColorConfig> = {
  "苏北灌溉总渠": { bg: "#DBEAFE", border: "#93C5FD", text: "#1D4ED8" },
  "南水北调宝应站": { bg: "#D1FAE5", border: "#6EE7B7", text: "#047857" },
  "慈溪北排": { bg: "#FEF3C7", border: "#FCD34D", text: "#B45309" },
  "慈溪周巷": { bg: "#EDE9FE", border: "#C4B5FD", text: "#6D28D9" },
  "瓯江引水": { bg: "#CFFAFE", border: "#67E8F9", text: "#0E7490" },
  "互联网": { bg: "#FFE4E6", border: "#FECDD3", text: "#BE123C" },
  "其他": { bg: C.gray7, border: C.gray6, text: C.gray2 }
};

// 技术方法颜色
export const TECH_METHOD_COLORS: Record<string, ColorConfig> = {
  "目标检测算法": { bg: "#DBEAFE", border: "#93C5FD", text: "#1D4ED8" },
  "实例分割算法": { bg: "#D1FAE5", border: "#6EE7B7", text: "#047857" }
};

// 标注格式颜色
export const ANNOTATION_COLORS: Record<string, ColorConfig> = {
  "YOLO格式": { bg: C.orangeBg, border: C.orangeBd, text: C.orange },
  "VOC格式": { bg: "#EDE9FE", border: "#C4B5FD", text: "#6D28D9" },
  "COCO格式": { bg: "#FEF3C7", border: "#FCD34D", text: "#B45309" }
};

// 模型类别颜色
export const MODEL_CAT_COLORS: Record<string, ColorConfig> = {
  "多标签实例分割模型（双标签）": { bg: C.primaryBg, border: C.primaryBd, text: C.primary },
  "多标签实例分割模型（三标签）": { bg: "#DBEAFE", border: "#93C5FD", text: "#1E40AF" },
  "单标签实例分割模型（背景负样本）": { bg: C.successBg, border: C.successBd, text: C.success },
  "单标签实例分割模型": { bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46" },
  "单标签目标检测模型": { bg: C.orangeBg, border: C.orangeBd, text: C.orange },
  "其他": { bg: C.gray7, border: C.gray6, text: C.gray2 }
};

// 导出常量
export { C as COLORS };
