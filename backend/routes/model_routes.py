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

# 配置 - 使用os.path.abspath确保正确获取项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(PROJECT_ROOT, 'data', 'models')


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
    from modules.database import update_model_by_name as _update
    # 字段映射：camelCase -> snake_case
    update_data = {}
    if 'algoName' in data:
        update_data['algo_name'] = data['algoName']
    if 'techMethod' in data:
        update_data['tech_method'] = data['techMethod']
    if 'category' in data:
        update_data['category'] = data['category']
    if 'description' in data:
        update_data['description'] = data['description']
    if 'site' in data:
        update_data['site'] = data['site']
    if 'modelType' in data:
        update_data['model_type'] = data['modelType']
    if 'dataset' in data:
        update_data['dataset'] = data['dataset']
    if 'maintainer' in data:
        update_data['maintainer'] = data['maintainer']
    if 'accuracy' in data:
        update_data['accuracy'] = data['accuracy']
    return _update(name, update_data)


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
                # 保留完整相对路径，用于判断文件类型
                full_path = uploaded_file.filename.replace('\\', '/')
                parts = full_path.split('/')
                filename = parts[-1]  # 只取文件名
                
                # 验证文件扩展名
                from modules.upload_validator import ALLOWED_MODEL_EXTENSIONS, MAX_MODEL_SIZE, validate_file_extension, validate_file_size
                valid, error = validate_file_extension(filename, ALLOWED_MODEL_EXTENSIONS)
                if not valid:
                    # 允许所有类型的文件通过（包括.zip, .png, .csv等）
                    pass  # 跳过验证，允许任意文件
                
                # 验证文件大小
                uploaded_file.seek(0, 2)
                file_size = uploaded_file.tell()
                uploaded_file.seek(0)
                valid, error = validate_file_size(file_size, MAX_MODEL_SIZE)
                if not valid:
                    return jsonify({"success": False, "error": f"文件 '{filename}' {error}"}), 400

                # 根据原始路径判断文件类型
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
            'site': request.form.get('site', ''),
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
        
        # 读取metadata.json
        metadata_path = os.path.join(model_path, 'metadata.json')
        metadata = {}
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)

        charts = {}
        curves_dir = os.path.join(model_path, 'curves')
        if os.path.exists(curves_dir):
            for f in os.listdir(curves_dir):
                if f.endswith('.png'):
                    charts[f.replace('.png', '')] = f'/data/models/{name}/curves/{f}'

        # 生成CSV曲线图
        from server import generate_model_csv_charts
        csv_charts = generate_model_csv_charts(model_path, curves_dir)

        # 获取预测效果图列表
        predictions = []
        predictions_dir = os.path.join(model_path, 'predictions')
        if os.path.exists(predictions_dir) and os.path.isdir(predictions_dir):
            for f in sorted(os.listdir(predictions_dir)):
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp')):
                    predictions.append(f'/data/models/{name}/predictions/{f}')

        # 获取pred_summary图表
        pred_summary_path = os.path.join(predictions_dir, 'summary.jpg') if os.path.exists(predictions_dir) else None
        if pred_summary_path and os.path.exists(pred_summary_path):
            charts['pred_summary'] = f'/data/models/{name}/predictions/summary.jpg'

        return jsonify({
            "success": True,
            "model": model,
            "metadata": metadata,
            "charts": charts,
            "csv_charts": csv_charts,
            "predictions": predictions
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@model_bp.route('/<name>', methods=['GET'])
def get_model(name):
    """获取模型详情"""
    try:
        model = get_model_by_name(name)
        if not model:
            return jsonify({"success": False, "error": "Model not found"}), 404
        return jsonify({"success": True, "model": model})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


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


# ==================== 模型版本管理 API ====================

def get_model_versions_db(model_name):
    from modules.database import get_model_versions as _get
    return _get(model_name)


def get_model_version_by_name_db(model_name, version_name):
    from modules.database import get_model_version_by_name as _get
    return _get(model_name, version_name)


def add_model_version_db(data):
    from modules.database import add_model_version as _add
    return _add(data)


def update_model_version_db(model_name, version_name, data):
    from modules.database import update_model_version as _update
    return _update(model_name, version_name, data)


def delete_model_version_db(model_name, version_name):
    from modules.database import delete_model_version as _del
    return _del(model_name, version_name)


def set_default_model_version_db(model_name, version_name):
    from modules.database import set_default_model_version as _set
    return _set(model_name, version_name)


def get_default_model_version_db(model_name):
    from modules.database import get_default_model_version as _get
    return _get(model_name)


@model_bp.route('/<name>/versions', methods=['GET'])
def get_model_versions(name):
    """获取模型的所有版本"""
    try:
        versions = get_model_versions_db(name)
        return jsonify({"success": True, "versions": versions})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/<name>/versions', methods=['POST'])
def create_model_version(name):
    """创建新版本"""
    try:
        data = request.json or {}
        version_name = data.get('version_name', '').strip()
        
        if not version_name:
            return jsonify({"success": False, "error": "请输入版本名称"}), 400
        
        # 检查版本是否已存在
        existing = get_model_version_by_name_db(name, version_name)
        if existing:
            return jsonify({"success": False, "error": "版本已存在"}), 400
        
        # 创建版本记录
        storage_path = os.path.join(MODELS_DIR, name, 'versions', version_name)
        os.makedirs(storage_path, exist_ok=True)
        
        version_data = {
            'model_name': name,
            'version_name': version_name,
            'description': data.get('description', ''),
            'dataset_name': data.get('dataset_name'),
            'dataset_version': data.get('dataset_version'),
            'accuracy': data.get('accuracy', 0),
            'map50': data.get('map50', 0),
            'map50_95': data.get('map50_95', 0),
            'total_epochs': data.get('total_epochs', 0),
            'storage_path': storage_path,
            'created_by': data.get('created_by', '管理员')
        }
        
        # 如果是第一个版本，设为默认
        existing_versions = get_model_versions_db(name)
        if not existing_versions:
            version_data['is_default'] = 1
        
        version_id = add_model_version_db(version_data)
        version_data['id'] = version_id
        
        return jsonify({"success": True, "version": version_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/<name>/versions/<version_name>', methods=['GET'])
def get_version_detail(name, version_name):
    """获取版本详情"""
    try:
        version = get_model_version_by_name_db(name, version_name)
        if not version:
            return jsonify({"success": False, "error": "版本不存在"}), 404
        
        # 获取该版本的参数文件
        from modules.database import get_model_params
        params = get_model_params(version['id'])
        version['params'] = params
        
        return jsonify({"success": True, "version": version})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/<name>/versions/<version_name>', methods=['PUT'])
def update_version(name, version_name):
    """更新版本信息"""
    try:
        data = request.json or {}
        success = update_model_version_db(name, version_name, data)
        if success:
            return jsonify({"success": True})
        return jsonify({"success": False, "error": "版本不存在"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/<name>/versions/<version_name>', methods=['DELETE'])
def delete_version(name, version_name):
    """删除版本"""
    try:
        success = delete_model_version_db(name, version_name)
        if success:
            return jsonify({"success": True, "message": "版本已删除"})
        return jsonify({"success": False, "error": "版本不存在"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/<name>/versions/<version_name>/default', methods=['PUT'])
def set_default_version(name, version_name):
    """设为默认版本"""
    try:
        success = set_default_model_version_db(name, version_name)
        if success:
            return jsonify({"success": True, "message": "已设为默认版本"})
        return jsonify({"success": False, "error": "版本不存在"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==================== 模型参数文件 API ====================

def add_model_param_db(data):
    from modules.database import add_model_param as _add
    return _add(data)


def get_model_params_db(version_id):
    from modules.database import get_model_params as _get
    return _get(version_id)


def get_model_param_by_id_db(param_id):
    from modules.database import get_model_param_by_id as _get
    return _get(param_id)


def delete_model_param_db(param_id):
    from modules.database import delete_model_param as _del
    return _del(param_id)


@model_bp.route('/<name>/versions/<version_name>/params', methods=['GET'])
def get_version_params(name, version_name):
    """获取版本参数文件列表"""
    try:
        version = get_model_version_by_name_db(name, version_name)
        if not version:
            return jsonify({"success": False, "error": "版本不存在"}), 404
        
        params = get_model_params_db(version['id'])
        return jsonify({"success": True, "params": params})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/<name>/versions/<version_name>/params', methods=['POST'])
def add_version_param(name, version_name):
    """补充参数文件"""
    try:
        version = get_model_version_by_name_db(name, version_name)
        if not version:
            return jsonify({"success": False, "error": "版本不存在"}), 404
        
        # 处理文件上传
        file = request.files.get('file')
        if not file:
            return jsonify({"success": False, "error": "请选择文件"}), 400
        
        param_type = request.form.get('param_type', 'others')
        description = request.form.get('description', '')
        
        # 验证参数类型
        valid_types = ['onnx', 'om', 'rknn', 'tflite', 'saved_model', 'pb', 'others']
        if param_type not in valid_types:
            return jsonify({"success": False, "error": f"不支持的参数类型，可选: {', '.join(valid_types)}"}), 400
        
        # 创建参数目录
        params_dir = os.path.join(MODELS_DIR, name, 'versions', version_name, 'params', param_type)
        os.makedirs(params_dir, exist_ok=True)
        
        # 保存文件
        file_name = file.filename
        file_path = os.path.join(params_dir, file_name)
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        # 写入数据库
        param_data = {
            'version_id': version['id'],
            'param_type': param_type,
            'file_name': file_name,
            'file_path': file_path,
            'file_size': file_size,
            'description': description,
            'is_primary': 0
        }
        
        param_id = add_model_param_db(param_data)
        param_data['id'] = param_id
        
        return jsonify({"success": True, "param": param_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/<name>/versions/<version_name>/params/<int:param_id>', methods=['DELETE'])
def delete_version_param(name, version_name, param_id):
    """删除参数文件"""
    try:
        # 获取参数文件信息
        param = get_model_param_by_id_db(param_id)
        if not param:
            return jsonify({"success": False, "error": "参数文件不存在"}), 404
        
        # 删除物理文件
        if os.path.exists(param['file_path']):
            os.remove(param['file_path'])
        
        # 删除数据库记录
        delete_model_param_db(param_id)
        
        return jsonify({"success": True, "message": "参数文件已删除"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@model_bp.route('/<name>/versions/<version_name>/params/<int:param_id>/download', methods=['GET'])
def download_param(name, version_name, param_id):
    """下载参数文件"""
    from flask import send_from_directory
    
    try:
        param = get_model_param_by_id_db(param_id)
        if not param:
            return jsonify({"error": "参数文件不存在"}), 404
        
        file_path = param['file_path']
        if os.path.exists(file_path):
            return send_from_directory(
                os.path.dirname(file_path),
                os.path.basename(file_path),
                as_attachment=True
            )
        return jsonify({"error": "文件不存在"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
