"""
模型相关API路由
"""
from datetime import datetime
import json
import csv
from flask import Blueprint, request, jsonify
import os

# 创建蓝图
model_bp = Blueprint('models', __name__, url_prefix='/api/model')

# 配置
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'models')


def get_all_models():
    from modules.database import get_all_models as _get
    return _get()


def get_model_by_name(name):
    from modules.database import get_model_by_name as _get
    return _get(name)


def delete_model_by_name(name):
    from modules.database import delete_model_by_name as _del
    return _del(name)


def add_model(data):
    from modules.database import add_model as _add
    return _add(data)


def update_model(name, data):
    from modules.database import update_model as _update
    return _update(name, data)


@model_bp.route('/upload', methods=['POST'])
def upload_model():
    """上传模型（支持文件夹上传）"""
    # 检查是单文件还是文件夹
    files = request.files.getlist('files')
    single_file = request.files.get('file')

    model_name = request.form.get('name', '').strip()
    algo_name = request.form.get('algoName', '其他')
    tech_method = request.form.get('techMethod', '目标检测算法')
    category = request.form.get('category', 'YOLO')
    accuracy = float(request.form.get('accuracy', 0))
    description = request.form.get('description', '')
    dataset = request.form.get('dataset', '')
    maintainer = request.form.get('maintainer', '管理员')

    if not model_name:
        return jsonify({"success": False, "error": "请输入模型名称"}), 400

    # 检查是否有文件上传
    if files and len(files) > 0:
        # 文件夹上传模式
        file_list = files
    elif single_file:
        # 单文件上传模式（兼容旧版）
        file_list = [single_file]
    else:
        return jsonify({"success": False, "error": "没有上传文件"}), 400

    try:
        # 创建模型目录
        model_dir = os.path.join(MODELS_DIR, model_name)
        os.makedirs(model_dir, exist_ok=True)

        # 创建子目录
        weights_dir = os.path.join(model_dir, 'weights')
        curves_dir = os.path.join(model_dir, 'curves')
        batches_dir = os.path.join(model_dir, 'batches')
        os.makedirs(weights_dir, exist_ok=True)
        os.makedirs(curves_dir, exist_ok=True)
        os.makedirs(batches_dir, exist_ok=True)

        # 解析并保存文件
        results_data = None
        saved_files = {}

        for uploaded_file in file_list:
            if uploaded_file.filename:
                filename = uploaded_file.filename.replace('\\', '/').split('/')[-1]
                
                # 验证文件扩展名
                from modules.upload_validator import ALLOWED_MODEL_EXTENSIONS, MAX_MODEL_SIZE, validate_file_extension, validate_file_size
                valid, error = validate_file_extension(filename, ALLOWED_MODEL_EXTENSIONS)
                if not valid:
                    return jsonify({"success": False, "error": f"文件 '{filename}' {error}"}), 400
                
                # 验证文件大小
                uploaded_file.seek(0, 2)
                file_size = uploaded_file.tell()
                uploaded_file.seek(0)
                valid, error = validate_file_size(file_size, MAX_MODEL_SIZE)
                if not valid:
                    return jsonify({"success": False, "error": f"文件 '{filename}' {error}"}), 400

                parts = filename.split('/')
                if len(parts) >= 2 and parts[0] == 'weights':
                    target_path = os.path.join(weights_dir, parts[-1])
                    uploaded_file.save(target_path)
                    saved_files[parts[-1]] = f"weights/{parts[-1]}"
                elif 'results.csv' in filename.lower():
                    target_path = os.path.join(model_dir, 'results.csv')
                    uploaded_file.save(target_path)
                    saved_files['results_csv'] = 'results.csv'
                    try:
                        uploaded_file.seek(0)
                        content = uploaded_file.read().decode('utf-8', errors='ignore')
                        reader = csv.reader(content.splitlines())
                        rows = list(reader)
                        if len(rows) > 1:
                            header = rows[0] if rows else []
                            map50_idx = None
                            map50_95_idx = None
                            for i, h in enumerate(header):
                                if 'map50' in h.lower() and '95' not in h:
                                    map50_idx = i
                                elif 'map50-95' in h.lower() or 'map50-95(b)' in h.lower():
                                    map50_95_idx = i

                            max_map50 = 0
                            max_map50_95 = 0
                            for row in rows[1:]:
                                if map50_idx is not None and len(row) > map50_idx:
                                    try:
                                        val = float(row[map50_idx])
                                        if val > max_map50:
                                            max_map50 = val
                                    except:
                                        pass
                                if map50_95_idx is not None and len(row) > map50_95_idx:
                                    try:
                                        val = float(row[map50_95_idx])
                                        if val > max_map50_95:
                                            max_map50_95 = val
                                    except:
                                        pass

                            results_data = {
                                'total_epochs': len(rows) - 1,
                                'max_map50': round(max_map50 * 100, 2),
                                'max_map50_95': round(max_map50_95 * 100, 2),
                            }
                            if max_map50 > 0:
                                accuracy = round(max_map50 * 100, 2)
                    except Exception as e:
                        pass
                elif 'curve' in filename.lower() or 'f1' in filename.lower() or 'p_curve' in filename.lower() or 'r_curve' in filename.lower() or 'pr_curve' in filename.lower():
                    target_path = os.path.join(curves_dir, parts[-1])
                    uploaded_file.save(target_path)
                    saved_files[f'curve_{parts[-1]}'] = f"curves/{parts[-1]}"
                elif 'confusion' in filename.lower():
                    target_path = os.path.join(curves_dir, parts[-1])
                    uploaded_file.save(target_path)
                    saved_files[f'confusion_{parts[-1]}'] = f"curves/{parts[-1]}"
                elif 'train_batch' in filename.lower():
                    target_path = os.path.join(batches_dir, parts[-1])
                    uploaded_file.save(target_path)
                    saved_files[f'train_{parts[-1]}'] = f"batches/{parts[-1]}"
                elif 'val_batch' in filename.lower():
                    target_path = os.path.join(batches_dir, parts[-1])
                    uploaded_file.save(target_path)
                    saved_files[f'val_{parts[-1]}'] = f"batches/{parts[-1]}"
                elif 'labels.jpg' in filename.lower():
                    target_path = os.path.join(curves_dir, 'labels.jpg')
                    uploaded_file.save(target_path)
                    saved_files['labels'] = 'curves/labels.jpg'
                elif 'results.png' in filename.lower():
                    target_path = os.path.join(curves_dir, 'results.png')
                    uploaded_file.save(target_path)
                    saved_files['results_png'] = 'curves/results.png'
                else:
                    target_path = os.path.join(model_dir, parts[-1])
                    uploaded_file.save(target_path)

        # 保存元数据
        metadata = {
            "name": model_name,
            "algo_name": algo_name,
            "tech_method": tech_method,
            "category": category,
            "accuracy": accuracy,
            "description": description,
            "dataset": dataset,
            "maintain_date": datetime.now().strftime('%Y/%m/%d'),
            "maintainer": maintainer,
            "saved_files": saved_files,
            "results_data": results_data
        }

        with open(os.path.join(model_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        # 统计预览图片数量
        preview_count = len([k for k in saved_files.keys() if k.startswith('train_') or k.startswith('val_')])

        # 保存到数据库
        add_model({
            'name': model_name,
            'algo_name': algo_name,
            'category': category,
            'accuracy': accuracy,
            'description': description,
            'dataset': dataset,
            'maintain_date': datetime.now().strftime('%Y/%m/%d'),
            'maintainer': maintainer,
            'preview_count': preview_count
        })

        return jsonify({
            "success": True,
            "message": "模型上传成功",
            "model": metadata
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/detail/<name>')
def model_detail(name):
    """获取模型详情"""
    try:
        model = get_model_by_name(name)
        if not model:
            return jsonify({"error": "Model not found"}), 404

        model_path = os.path.join(MODELS_DIR, name)
        charts = {}

        # 查找图表
        curves_dir = os.path.join(model_path, 'curves')
        if os.path.exists(curves_dir):
            for f in os.listdir(curves_dir):
                if f.endswith('.png'):
                    charts[f.replace('.png', '')] = f'/data/models/{name}/curves/{f}'

        return jsonify({
            "model": model,
            "charts": charts
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@model_bp.route('/<name>', methods=['PUT'])
def update_model_api(name):
    """更新模型信息"""
    try:
        data = request.json
        update_model(name, data)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/<name>', methods=['DELETE'])
def delete_model(name):
    """删除模型"""
    try:
        success, message = delete_model_by_name(name)
        if success:
            # 删除文件
            import shutil
            model_path = os.path.join(MODELS_DIR, name)
            if os.path.exists(model_path):
                shutil.rmtree(model_path)
        return jsonify({"success": success, "message": message})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/<name>/download')
def download_model(name):
    """下载模型"""
    from flask import send_from_directory
    model_path = os.path.join(MODELS_DIR, name)
    if os.path.exists(model_path):
        return send_from_directory(
            os.path.dirname(model_path),
            os.path.basename(model_path),
            as_attachment=True
        )
    return jsonify({"error": "Model not found"}), 404
