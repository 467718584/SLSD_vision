"""
模型相关API路由
"""
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
    """上传模型"""
    from modules.model_manager import upload_model as _upload
    try:
        result = _upload(request)
        return jsonify(result)
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
