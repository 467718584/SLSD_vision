"""
机器视觉管理平台 - Streamlit应用 (简化版测试)
"""
import os
import streamlit as st
from PIL import Image

# 配置
from modules.database import (
    init_database, get_all_datasets, get_all_models,
    get_dataset_by_name, get_model_by_name,
    get_dataset_stats, get_model_stats,
    get_algo_types, get_algo_names
)

# 页面配置
st.set_page_config(
    page_title="机器视觉管理平台",
    page_icon="",
    layout="wide"
)

# 初始化数据库
init_database()


def init_session_state():
    """初始化会话状态"""
    if 'current_tab' not in st.session_state:
        st.session_state.current_tab = 'datasets'
    if 'view_dataset' not in st.session_state:
        st.session_state.view_dataset = None
    if 'view_model' not in st.session_state:
        st.session_state.view_model = None


def main():
    """主函数"""
    init_session_state()

    # 直接注入CSS
    st.markdown("""
    <style>
    /* 主CSS变量 */
    :root {
        --primary: #1462A8;
        --primary-bg: #EBF3FC;
        --primary-bd: #BFDBF7;
        --success: #2E8B57;
        --warning: #E67E22;
        --gray1: #1A2332;
        --gray2: #3D5166;
        --gray3: #6B8299;
        --gray4: #9EAFBE;
        --gray6: #E8F0F5;
        --gray7: #F4F7FA;
        --white: #FFFFFF;
        --border: #D8E4EE;
    }

    /* 背景 */
    .stApp {
        background-color: #F0F4F8 !important;
    }

    /* 隐藏侧边栏 */
    [data-testid="stSidebar"] {
        display: none !important;
    }

    /* 顶部导航 */
    .nav-header {
        background: var(--primary);
        padding: 0 24px;
        display: flex;
        align-items: center;
        height: 52px;
        gap: 4px;
        box-shadow: 0 2px 10px rgba(20,98,168,0.3);
    }
    .nav-title {
        font-weight: 700;
        font-size: 16px;
        color: white;
        letter-spacing: 0.5px;
    }

    /* 页面标题 */
    .page-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--gray1);
    }

    /* 表格 */
    .data-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--white);
        border-radius: 10px;
        overflow: hidden;
    }
    .data-table th {
        background: var(--gray7);
        padding: 10px 12px;
        font-size: 12px;
        font-weight: 600;
        color: var(--gray1);
        text-align: left;
        border-bottom: 2px solid var(--border);
    }
    .data-table td {
        padding: 9px 12px;
        font-size: 12px;
        color: var(--gray2);
        border-bottom: 1px solid var(--gray6);
    }
    .data-table tr:hover td {
        background: var(--primary-bg);
    }

    /* 标签 */
    .tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
    }
    </style>
    """, unsafe_allow_html=True)

    # 渲染顶部导航
    st.markdown("""
    <div class="nav-header">
        <div class="nav-logo">
            <span class="nav-title">机器视觉管理平台</span>
        </div>
        <div style="margin-left: auto; display: flex; gap: 8px;">
            <span style="color: white; font-size: 14px;">数据集管理</span>
            <span style="color: rgba(255,255,255,0.6); font-size: 14px;">算法模型管理</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # 侧边栏
    with st.sidebar:
        st.markdown("### 统计")
        ds_stats = get_dataset_stats()
        m_stats = get_model_stats()
        col1, col2 = st.columns(2)
        with col1:
            st.metric("数据集", ds_stats['count'])
        with col2:
            st.metric("模型", m_stats['count'])

        st.markdown("---")

        # 页面切换
        st.markdown("### 导航")
        tab = st.radio("选择", ["datasets", "models"], format_func=lambda x: "数据集管理" if x == "datasets" else "算法模型管理")
        st.session_state.current_tab = tab

    # 主体内容
    if st.session_state.current_tab == "datasets":
        datasets = get_all_datasets()
        st.markdown(f'<h2 class="page-title">数据集管理 (共{len(datasets)}个)</h2>', unsafe_allow_html=True)

        if datasets:
            # 创建表格HTML
            table_html = """
            <table class="data-table">
                <thead>
                    <tr>
                        <th>编号</th>
                        <th>算法类型</th>
                        <th>数据集名称</th>
                        <th>样本数量</th>
                        <th>标签数</th>
                        <th>维护日期</th>
                    </tr>
                </thead>
                <tbody>
            """
            for ds in datasets:
                algo_type = ds.get('algo_type', '')
                # 根据算法类型设置标签颜色
                tag_colors = {
                    "路面积水检测": "background:#EBF3FC;border:1px solid #BFDBF7;color:#1462A8",
                    "漂浮物检测": "background:#E8F5EE;border:1px solid #A8D5C0;color:#2E8B57",
                    "墙面裂缝检测": "background:#FEF5E7;border:1px solid #F9D9B0;color:#E67E22",
                }
                tag_style = tag_colors.get(algo_type, "background:#F4F7FA;border:1px solid #D8E4EE;color:#3D5166")

                table_html += f"""
                    <tr>
                        <td>{ds.get('id', '')}</td>
                        <td><span class="tag" style="{tag_style}">{algo_type}</span></td>
                        <td>{ds.get('name', '')}</td>
                        <td>{ds.get('total', 0):,}</td>
                        <td>{ds.get('label_count', 0)}</td>
                        <td>{ds.get('maintain_date', '-')}</td>
                    </tr>
                """
            table_html += "</tbody></table>"

            st.markdown(table_html, unsafe_allow_html=True)
        else:
            st.info("暂无数据集")

    else:
        models = get_all_models()
        st.markdown(f'<h2 class="page-title">算法模型管理 (共{len(models)}个)</h2>', unsafe_allow_html=True)

        if models:
            # 创建表格HTML
            table_html = """
            <table class="data-table">
                <thead>
                    <tr>
                        <th>编号</th>
                        <th>算法名称</th>
                        <th>模型名称</th>
                        <th>模型类别</th>
                        <th>精度</th>
                        <th>使用数据集</th>
                    </tr>
                </thead>
                <tbody>
            """
            for m in models:
                accuracy = m.get('accuracy', 0)
                acc_color = "#2E8B57" if accuracy >= 95 else ("#1462A8" if accuracy >= 85 else "#E67E22")

                table_html += f"""
                    <tr>
                        <td>{m.get('id', '')}</td>
                        <td>{m.get('algo_name', '')}</td>
                        <td>{m.get('name', '')}</td>
                        <td>{m.get('category', '')}</td>
                        <td style="color:{acc_color};font-weight:600;">{accuracy:.1f}%</td>
                        <td>{m.get('dataset', '-')}</td>
                    </tr>
                """
            table_html += "</tbody></table>"

            st.markdown(table_html, unsafe_allow_html=True)
        else:
            st.info("暂无模型")


if __name__ == "__main__":
    main()
