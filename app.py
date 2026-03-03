"""
机器视觉管理平台 - Streamlit应用
"""
import streamlit as st
import pandas as pd
from modules.database import (
    init_database, get_all_datasets, get_all_models,
    get_dataset_by_name, get_model_by_name,
    get_dataset_stats, get_model_stats,
    get_algo_types, get_algo_names
)
from modules.dataset_manager import get_dataset_images
from PIL import Image

# 页面配置
st.set_page_config(
    page_title="机器视觉管理平台",
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

    # 注入CSS样式
    st.markdown("""
    <style>
    /* 主CSS变量 */
    :root {
        --primary: #1462A8;
        --primary-bg: #EBF3FC;
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

    /* 顶部导航 */
    .nav-header {
        background: linear-gradient(135deg, #1462A8 0%, #1E7BC7 100%);
        padding: 0 24px;
        display: flex;
        align-items: center;
        height: 52px;
        gap: 4px;
        box-shadow: 0 2px 10px rgba(20,98,168,0.3);
        margin: -1rem -1rem 1rem -1rem;
        border-radius: 0 0 10px 10px;
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
        margin-bottom: 1rem;
    }

    /* 卡片样式 */
    .stat-card {
        background: linear-gradient(135deg, #1462A8 0%, #1E7BC7 100%);
        border-radius: 12px;
        padding: 20px;
        color: white;
        text-align: center;
    }

    /* 标签 */
    .tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
    }

    /* 表格行hover */
    .dataframe tbody tr:hover {
        background-color: var(--primary-bg) !important;
    }

    /* 详情卡片 */
    .detail-card {
        background: var(--white);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
    }
    </style>
    """, unsafe_allow_html=True)

    # 顶部导航
    st.markdown("""
    <div class="nav-header">
        <span class="nav-title">机器视觉管理平台</span>
    </div>
    """, unsafe_allow_html=True)

    # 侧边栏
    with st.sidebar:
        st.markdown("### 统计")
        ds_stats = get_dataset_stats()
        m_stats = get_model_stats()

        # 使用Streamlit原生指标组件
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

        st.markdown("---")

        # 上传区域
        if tab == "datasets":
            st.markdown("### 上传数据集")
            uploaded_file = st.file_uploader("选择文件", type=['zip'])
            dataset_name = st.text_input("名称")
            if st.button("上传"):
                st.success("上传功能待实现")
        else:
            st.markdown("### 上传模型")
            uploaded_file = st.file_uploader("选择模型", type=['pt', 'pth', 'onnx'])
            model_name = st.text_input("名称")
            if st.button("上传模型"):
                st.success("上传功能待实现")

    # 主体内容
    if st.session_state.current_tab == "datasets":
        if st.session_state.view_dataset:
            render_dataset_detail(st.session_state.view_dataset)
        else:
            render_dataset_list()
    else:
        if st.session_state.view_model:
            render_model_detail(st.session_state.view_model)
        else:
            render_model_list()


def render_dataset_list():
    """渲染数据集列表"""
    # 搜索和筛选
    col1, col2 = st.columns([1, 1])
    with col1:
        search_query = st.text_input("搜索", placeholder="搜索数据集名称...", label_visibility="collapsed", key="ds_search")
    with col2:
        algo_filter = st.selectbox("筛选", options=get_algo_types(), label_visibility="collapsed", key="ds_filter")

    # 获取数据
    if search_query or algo_filter != '全部':
        datasets = search_datasets(search_query, algo_filter if algo_filter != '全部' else None)
    else:
        datasets = get_all_datasets()

    # 标题
    total_samples = sum(ds.get('total', 0) for ds in datasets)
    st.markdown(f'<h2 class="page-title">数据集管理 (共 {len(datasets)} 个数据集 · {total_samples:,} 个样本)</h2>', unsafe_allow_html=True)

    if not datasets:
        st.info("暂无数据集")
        return

    # 使用DataFrame显示数据
    data = []
    for ds in datasets:
        algo_type = ds.get('algo_type', '')
        labels = ds.get('labels', {})
        labels_str = ', '.join([f"{k}: {v}" for k, v in labels.items()]) if labels else '-'

        data.append({
            "编号": ds.get('id', ''),
            "算法类型": algo_type,
            "数据集名称": ds.get('name', ''),
            "分配比例": ds.get('split', '-'),
            "样本数量": ds.get('total', 0),
            "标签数": ds.get('label_count', 0),
            "各标签数量": labels_str,
            "数据集概述": ds.get('description', '')[:60] + '...' if len(ds.get('description', '')) > 60 else ds.get('description', ''),
            "维护日期": ds.get('maintain_date', '-'),
            "维护人员": ds.get('maintainer', '-'),
        })

    df = pd.DataFrame(data)

    # 使用st.dataframe显示表格
    st.dataframe(df, use_container_width=True, hide_index=True)

    # 点击查看详情
    st.markdown("### 查看详情")
    selected_ds = st.selectbox("选择数据集查看详情", options=[ds.get('name', '') for ds in datasets], key="ds_select")
    if selected_ds and st.button("查看"):
        st.session_state.view_dataset = selected_ds
        st.rerun()


def render_model_list():
    """渲染模型列表"""
    # 搜索和筛选
    col1, col2 = st.columns([1, 1])
    with col1:
        search_query = st.text_input("搜索", placeholder="搜索模型名称...", label_visibility="collapsed", key="m_search")
    with col2:
        algo_filter = st.selectbox("筛选", options=get_algo_names(), label_visibility="collapsed", key="m_filter")

    # 获取数据
    if search_query or algo_filter != '全部':
        models = search_models(search_query, algo_filter if algo_filter != '全部' else None)
    else:
        models = get_all_models()

    # 标题
    st.markdown(f'<h2 class="page-title">算法模型管理 (共 {len(models)} 个模型)</h2>', unsafe_allow_html=True)

    if not models:
        st.info("暂无模型")
        return

    # 使用DataFrame显示数据
    data = []
    for m in models:
        accuracy = m.get('accuracy', 0)
        acc_str = f"{accuracy:.1f}%"

        data.append({
            "编号": m.get('id', ''),
            "算法名称": m.get('algo_name', ''),
            "模型名称": m.get('name', ''),
            "模型类别": m.get('category', ''),
            "模型精度": acc_str,
            "模型概述": m.get('description', '')[:60] + '...' if len(m.get('description', '')) > 60 else m.get('description', ''),
            "使用数据集": m.get('dataset', '-'),
            "维护日期": m.get('maintain_date', '-'),
            "维护人员": m.get('maintainer', '-'),
        })

    df = pd.DataFrame(data)

    # 使用st.dataframe显示表格
    st.dataframe(df, use_container_width=True, hide_index=True)

    # 点击查看详情
    st.markdown("### 查看详情")
    selected_model = st.selectbox("选择模型查看详情", options=[m.get('name', '') for m in models], key="m_select")
    if selected_model and st.button("查看模型"):
        st.session_state.view_model = selected_model
        st.rerun()


def render_dataset_detail(name):
    """渲染数据集详情"""
    ds = get_dataset_by_name(name)

    if not ds:
        st.error("数据集不存在")
        return

    # 返回按钮
    if st.button("← 返回数据集列表"):
        st.session_state.view_dataset = None
        st.rerun()

    # 详情卡片
    st.markdown(f"""
    <div class="detail-card">
        <h3 style="margin-bottom: 10px;">{ds.get('name', '')}</h3>
        <p style="color: var(--gray2); margin-bottom: 15px;">{ds.get('description', '')}</p>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div><b>算法类型:</b> {ds.get('algo_type', '-')}</div>
            <div><b>样本数量:</b> {ds.get('total', 0):,}</div>
            <div><b>标签数量:</b> {ds.get('label_count', 0)}</div>
            <div><b>分配比例:</b> {ds.get('split', '-')}</div>
            <div><b>维护日期:</b> {ds.get('maintain_date', '-')}</div>
            <div><b>维护人员:</b> {ds.get('maintainer', '-')}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # 标签统计
    labels = ds.get('labels', {})
    if labels:
        st.markdown("### 各标签数量")
        for k, v in labels.items():
            st.write(f"- **{k}**: {v}")

    # 图片预览
    images = get_dataset_images(ds.get('name', ''), max_images=12)
    if images:
        st.markdown("### 数据集预览")
        cols = st.columns(4)
        for i, img_path in enumerate(images):
            with cols[i % 4]:
                try:
                    img = Image.open(img_path)
                    img.thumbnail((200, 200))
                    st.image(img, caption=f"#{i+1}", use_container_width=True)
                except Exception as e:
                    st.write(f"图片 {i+1}")


def render_model_detail(name):
    """渲染模型详情"""
    m = get_model_by_name(name)

    if not m:
        st.error("模型不存在")
        return

    # 返回按钮
    if st.button("← 返回模型列表"):
        st.session_state.view_model = None
        st.rerun()

    accuracy = m.get('accuracy', 0)

    # 详情卡片
    st.markdown(f"""
    <div class="detail-card">
        <h3 style="margin-bottom: 10px;">{m.get('name', '')}</h3>
        <p style="color: var(--gray2); margin-bottom: 15px;">{m.get('description', '')}</p>
        <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center;">
            <div><b>算法名称:</b> {m.get('algo_name', '-')}</div>
            <div><b>模型类别:</b> {m.get('category', '-')}</div>
            <div style="font-size: 24px; font-weight: bold; color: {'#2E8B57' if accuracy >= 95 else ('#1462A8' if accuracy >= 85 else '#E67E22')};">{accuracy:.1f}%</div>
            <div><b>使用数据集:</b> {m.get('dataset', '-')}</div>
            <div><b>维护日期:</b> {m.get('maintain_date', '-')}</div>
            <div><b>维护人员:</b> {m.get('maintainer', '-')}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
