"""
Flask服务器 - 直接加载参考HTML并注入数据库数据
"""
import os
import uuid
import json
from datetime import datetime
from flask import Flask, render_template_string, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from modules.database import (
    init_database, get_all_datasets, get_all_models,
    get_dataset_by_name, get_model_by_name,
    search_datasets, search_models,
    get_dataset_stats, get_model_stats,
    get_algo_types, get_algo_names,
    add_dataset, add_model, delete_dataset_by_name, delete_model_by_name
)
from modules.dataset_manager import get_dataset_images
from modules.model_manager import get_model_files
from config import DATASETS_DIR, MODELS_DIR

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


# ==================== 数据集上传API ====================

@app.route('/api/dataset/upload', methods=['POST'])
def upload_dataset():
    """上传数据集"""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "没有上传文件"}), 400

    file = request.files['file']
    dataset_name = request.form.get('name', '').strip()
    algo_type = request.form.get('algoType', '其他')
    description = request.form.get('description', '')
    maintainer = request.form.get('maintainer', '管理员')

    if not dataset_name:
        # 如果没有提供名称，使用文件名
        dataset_name = secure_filename(file.filename).replace('.zip', '')
        if not dataset_name:
            dataset_name = f"dataset_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    if file.filename == '':
        return jsonify({"success": False, "error": "没有选择文件"}), 400

    try:
        # 保存上传的文件
        dataset_dir = os.path.join(DATASETS_DIR, dataset_name)
        os.makedirs(dataset_dir, exist_ok=True)

        filename = secure_filename(file.filename)
        if filename.endswith('.zip'):
            # 解压ZIP文件
            import zipfile
            zip_path = os.path.join(dataset_dir, filename)
            file.save(zip_path)

            extract_dir = os.path.join(dataset_dir, 'temp_extract')
            os.makedirs(extract_dir, exist_ok=True)

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)

            # 处理解压内容
            for item in os.listdir(extract_dir):
                src = os.path.join(extract_dir, item)
                dst = os.path.join(dataset_dir, item)
                if os.path.exists(dst):
                    if os.path.isdir(dst):
                        import shutil
                        shutil.rmtree(dst)
                    else:
                        os.remove(dst)
                shutil.move(src, dst)

            # 清理临时文件
            os.remove(zip_path)
            shutil.rmtree(extract_dir)
        else:
            # 直接保存文件夹
            file.save(os.path.join(dataset_dir, filename))

        # 统计图片数量
        from config import SUPPORTED_IMAGE_FORMATS
        image_count = 0
        labels = {}
        for root, dirs, files in os.walk(dataset_dir):
            for f in files:
                if any(f.lower().endswith(ext) for ext in SUPPORTED_IMAGE_FORMATS):
                    image_count += 1
                # 统计标注文件
                if f.endswith('.txt'):
                    label_name = f.replace('.txt', '')
                    with open(os.path.join(root, f), 'r', encoding='utf-8', errors='ignore') as lf:
                        lines = len(lf.readlines())
                        labels[label_name] = lines

        # 保存元数据
        metadata = {
            "name": dataset_name,
            "algo_type": algo_type,
            "description": description,
            "split": "8:2",
            "total": image_count,
            "label_count": len(labels),
            "labels": labels,
            "maintain_date": datetime.now().strftime('%Y/%m/%d'),
            "maintainer": maintainer,
            "preview_count": 8
        }

        with open(os.path.join(dataset_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        # 保存到数据库
        add_dataset({
            'name': dataset_name,
            'algo_type': algo_type,
            'description': description,
            'split': "8:2",
            'total': image_count,
            'label_count': len(labels),
            'labels': labels,
            'maintain_date': datetime.now().strftime('%Y/%m/%d'),
            'maintainer': maintainer
        })

        return jsonify({
            "success": True,
            "message": "数据集上传成功",
            "dataset": metadata
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/dataset/<name>/images')
def dataset_images(name):
    """获取数据集图片"""
    images = get_dataset_images(name, max_images=50)
    # 转换为相对路径供前端访问
    base_dir = os.path.dirname(os.path.dirname(__file__))
    relative_paths = []
    for img in images:
        rel_path = os.path.relpath(img, base_dir)
        # 替换反斜杠为正斜杠
        relative_paths.append(rel_path.replace('\\', '/'))

    return jsonify({
        "name": name,
        "images": relative_paths,
        "count": len(relative_paths)
    })


@app.route('/api/dataset/<name>', methods=['DELETE'])
def delete_dataset(name):
    """删除数据集"""
    try:
        # 删除文件
        dataset_dir = os.path.join(DATASETS_DIR, name)
        if os.path.exists(dataset_dir):
            import shutil
            shutil.rmtree(dataset_dir)

        # 删除数据库记录
        delete_dataset_by_name(name)

        return jsonify({"success": True, "message": "数据集已删除"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==================== 模型上传API ====================

@app.route('/api/model/upload', methods=['POST'])
def upload_model():
    """上传模型"""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "没有上传文件"}), 400

    file = request.files['file']
    model_name = request.form.get('name', '').strip()
    algo_name = request.form.get('algoName', '其他')
    category = request.form.get('category', 'YOLO')
    accuracy = float(request.form.get('accuracy', 0))
    description = request.form.get('description', '')
    dataset = request.form.get('dataset', '')
    maintainer = request.form.get('maintainer', '管理员')

    if not model_name:
        model_name = secure_filename(file.filename)
        if not model_name:
            model_name = f"model_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    if file.filename == '':
        return jsonify({"success": False, "error": "没有选择文件"}), 400

    try:
        # 保存上传的文件
        model_dir = os.path.join(MODELS_DIR, model_name)
        os.makedirs(model_dir, exist_ok=True)

        filename = secure_filename(file.filename)
        file.save(os.path.join(model_dir, filename))

        # 保存元数据
        metadata = {
            "name": model_name,
            "algo_name": algo_name,
            "category": category,
            "accuracy": accuracy,
            "description": description,
            "dataset": dataset,
            "maintain_date": datetime.now().strftime('%Y/%m/%d'),
            "maintainer": maintainer,
            "filename": filename
        }

        with open(os.path.join(model_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        # 保存到数据库
        add_model({
            'name': model_name,
            'algo_name': algo_name,
            'category': category,
            'accuracy': accuracy,
            'description': description,
            'dataset': dataset,
            'maintain_date': datetime.now().strftime('%Y/%m/%d'),
            'maintainer': maintainer
        })

        return jsonify({
            "success": True,
            "message": "模型上传成功",
            "model": metadata
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/model/<name>', methods=['DELETE'])
def delete_model(name):
    """删除模型"""
    try:
        # 删除文件
        model_dir = os.path.join(MODELS_DIR, name)
        if os.path.exists(model_dir):
            import shutil
            shutil.rmtree(model_dir)

        # 删除数据库记录
        delete_model_by_name(name)

        return jsonify({"success": True, "message": "模型已删除"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==================== 文件访问API ====================

@app.route('/data/<path:filename>')
def serve_data_file(filename):
    """提供数据文件访问"""
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'data'), filename)


if __name__ == '__main__':
    print("=" * 50)
    print("启动机器视觉管理平台...")
    print("访问地址: http://localhost:8501")
    print("=" * 50)
    app.run(host='0.0.0.0', port=8501, debug=True)
