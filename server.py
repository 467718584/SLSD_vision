"""
Flask服务器 - 直接加载参考HTML并注入数据库数据
"""
from flask import Flask, render_template_string, jsonify, request
from modules.database import (
    init_database, get_all_datasets, get_all_models,
    get_dataset_by_name, get_model_by_name,
    search_datasets, search_models,
    get_dataset_stats, get_model_stats,
    get_algo_types, get_algo_names
)

app = Flask(__name__)

# 初始化数据库
init_database()


def dict_to_js(obj, indent=0):
    """将Python对象转换为JavaScript对象字面量格式"""
    if isinstance(obj, dict):
        if not obj:
            return "{}"
        items = []
        for k, v in obj.items():
            items.append(f"{k}: {dict_to_js(v, indent + 1)}")
        return "{" + ", ".join(items) + "}"
    elif isinstance(obj, list):
        if not obj:
            return "[]"
        items = [dict_to_js(item, indent + 1) for item in obj]
        return "[" + ", ".join(items) + "]"
    elif isinstance(obj, str):
        return f'"{obj}"'
    elif isinstance(obj, (int, float)):
        return str(obj)
    elif obj is None:
        return "null"
    elif isinstance(obj, bool):
        return "true" if obj else "false"
    else:
        return f'"{obj}"'


def load_reference_html():
    """加载参考HTML文件"""
    import os
    html_path = os.path.join(os.path.dirname(__file__), '参考资料', 'vision-platform-preview.html')
    if os.path.exists(html_path):
        with open(html_path, 'r', encoding='utf-8') as f:
            return f.read()
    return None


@app.route('/')
def index():
    """主页 - 加载参考HTML并注入数据"""
    html_content = load_reference_html()
    if not html_content:
        return "<h1>参考HTML文件未找到</h1>", 404

    # 获取所有数据
    datasets = get_all_datasets()
    models = get_all_models()

    # 准备数据集数据
    datasets_data = []
    for ds in datasets:
        labels = ds.get('labels', {})
        # 处理标签数据
        labels_processed = {}
        for k, v in labels.items():
            labels_processed[k] = v if isinstance(v, int) else "-"

        datasets_data.append({
            "id": ds.get('id', 0),
            "algoType": ds.get('algo_type', ''),
            "name": ds.get('name', ''),
            "split": ds.get('split', '8:2'),
            "total": ds.get('total', 0),
            "labelCount": ds.get('label_count', 0),
            "labels": labels_processed,
            "desc": ds.get('description', ''),
            "maintainDate": ds.get('maintain_date', ''),
            "maintainer": ds.get('maintainer', ''),
            "previewCount": ds.get('preview_count', 8)
        })

    # 准备模型数据
    models_data = []
    for m in models:
        models_data.append({
            "id": m.get('id', 0),
            "algoName": m.get('algo_name', ''),
            "name": m.get('name', ''),
            "category": m.get('category', ''),
            "accuracy": m.get('accuracy', 0),
            "desc": m.get('description', ''),
            "dataset": m.get('dataset', ''),
            "maintainDate": m.get('maintain_date', ''),
            "maintainer": m.get('maintainer', ''),
            "previewCount": m.get('preview_count', 8)
        })

    # 将Python数据转换为JavaScript格式并注入
    js_datasets = dict_to_js(datasets_data)
    js_models = dict_to_js(models_data)

    # 替换DATASETS数组 - 需要移除旧的完整数组包括结尾的 ];
    import re
    # 匹配 const DATASETS=[ 到 ]; 之间的所有内容
    html_content = re.sub(
        r'const DATASETS=\[.*?\];',
        f'const DATASETS={js_datasets};',
        html_content,
        flags=re.DOTALL
    )

    # 替换MODELS数组
    html_content = re.sub(
        r'const MODELS=\[.*?\];',
        f'const MODELS={js_models};',
        html_content,
        flags=re.DOTALL
    )

    # 添加 "其他" 到 ALGO_COLORS 如果不存在
    # 注意：需要检查ALGO_COLORS中是否有"其他"，而不是检查整个HTML（因为数据中可能有"其他"）
    algo_colors_match = re.search(r'const ALGO_COLORS=({[^}]+})', html_content)
    if algo_colors_match:
        algo_colors_str = algo_colors_match.group(1)
        if '"其他"' not in algo_colors_str:
            html_content = html_content.replace(
                '"游泳检测":{bg:"#FDE9E9"',
                '"其他":{bg:C.gray6,border:C.border,text:C.gray2},"游泳检测":{bg:"#FDE9E9"'
            )

    # 添加默认 MODEL_CAT_COLORS 如果不存在
    model_cat_match = re.search(r'const MODEL_CAT_COLORS=({[^}]+})', html_content)
    if model_cat_match:
        model_cat_str = model_cat_match.group(1)
        if '"YOLO"' not in model_cat_str:
            html_content = html_content.replace(
                'const MODEL_CAT_COLORS={',
                'const MODEL_CAT_COLORS={"其他":{bg:C.gray6,border:C.border,text:C.gray2},"YOLO":{bg:C.primaryBg,border:C.primaryBd,text:C.primary},'
            )

    return html_content


@app.route('/api/datasets')
def api_datasets():
    """数据集API"""
    query = request.args.get('q', '')
    algo_type = request.args.get('type', '')

    if query or (algo_type and algo_type != '全部'):
        datasets = search_datasets(query, algo_type if algo_type != '全部' else None)
    else:
        datasets = get_all_datasets()

    return jsonify(datasets)


@app.route('/api/models')
def api_models():
    """模型API"""
    query = request.args.get('q', '')
    algo_name = request.args.get('name', '')

    if query or (algo_name and algo_name != '全部'):
        models = search_models(query, algo_name if algo_name != '全部' else None)
    else:
        models = get_all_models()

    return jsonify(models)


@app.route('/api/stats')
def api_stats():
    """统计API"""
    ds_stats = get_dataset_stats()
    m_stats = get_model_stats()
    return jsonify({
        "datasets": ds_stats,
        "models": m_stats
    })


if __name__ == '__main__':
    print("=" * 50)
    print("启动机器视觉管理平台...")
    print("访问地址: http://localhost:8501")
    print("=" * 50)
    app.run(host='0.0.0.0', port=8501, debug=True)
