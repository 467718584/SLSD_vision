"""
机器视觉管理平台 - 最简测试版
"""
import streamlit as st
from modules.database import init_database, get_all_datasets, get_model_stats

# 页面配置
st.set_page_config(
    page_title="机器视觉管理平台",
    layout="wide"
)

# 初始化
init_database()

# 测试1: 纯文本
st.write("### 测试: 纯文本")

# 测试2: 简单表格
datasets = get_all_datasets()
st.write(f"数据集数量: {len(datasets)}")

if datasets:
    # 使用st.dataframe显示表格
    import pandas as pd
    df = pd.DataFrame(datasets)
    st.dataframe(df[['id', 'algo_type', 'name', 'total', 'label_count']], use_container_width=True)
else:
    st.write("暂无数据")

# 测试3: 指标
col1, col2 = st.columns(2)
with col1:
    st.metric("数据集", len(datasets))
with col2:
    m_stats = get_model_stats()
    st.metric("模型", m_stats['count'])
