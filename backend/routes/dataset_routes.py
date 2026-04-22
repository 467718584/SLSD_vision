"""
数据集相关API路由
"""
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
import shutil
import tempfile

from .errors import api_handler, validate_dataset_name, ApiError

# 创建蓝图
dataset_bp = Blueprint('datasets', __name__, url_prefix='/api/dataset')

# 导入依赖（需要在server.py中确保已初始化）
def get_db():
    from modules.database import get_connection
    return get_connection()

def get_all_datasets():
    from modules.database import get_all_datasets as _get
    return _get()

def get_dataset_by_name(name):
    from modules.database import get_dataset_by_name as _get
    return _get(name)

def delete_dataset_by_name(name):
    from modules.database import delete_dataset_by_name as _del
    return _del(name)

def add_dataset(data):
    from modules.database import add_dataset as _add
    return _add(data)

def search_datasets(query, algo_type=None):
    from modules.database import search_datasets as _search
    return _search(query, algo_type)

# 配置
DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'datasets')
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'models')


@dataset_bp.route('/validate-name', methods=['POST'])
@api_handler
def validate_name():
    """检查数据集名称是否已存在"""
    data = request.json
    name = data.get('name', '').strip()

    if not name:
        return jsonify({"exists": False, "storage_type": None})

    validate_dataset_name(name)
    
    existing = get_dataset_by_name(name)
    if existing:
        return jsonify({
            "exists": True,
            "storage_type": existing.get('storage_type', 'folder')
        })
    return jsonify({"exists": False, "storage_type": None})


@dataset_bp.route('/upload', methods=['POST'])
@api_handler
def upload_dataset():
    """上传数据集"""
    from modules.dataset_manager import upload_dataset as _upload

    # 提取参数
    dataset_name = request.form.get('name', '').strip()
    uploaded_file = request.files.get('file')

    if not dataset_name:
        return jsonify({"success": False, "error": "数据集名称不能为空"}), 400
    if not uploaded_file or uploaded_file.filename == '':
        return jsonify({"success": False, "error": "没有上传文件"}), 400

    # 调用上传
    result = _upload(uploaded_file, dataset_name)

    if result:
        # 上传成功后生成图表
        from modules.dataset_manager import generate_dataset_charts
        try:
            generate_dataset_charts(dataset_name)
        except Exception as chart_err:
            print(f"生成图表时出错: {chart_err}")

        return jsonify({"success": True, "dataset": result})
    else:
        return jsonify({"success": False, "error": "上传失败"}), 500


@dataset_bp.route('/<name>/images')
@api_handler
def get_dataset_images(name):
    """获取数据集图片列表"""
    from modules.dataset_manager import get_dataset_images as _get_images
    images = _get_images(name)
    return jsonify(images)


@dataset_bp.route('/<name>/split-images')
def get_split_images(name):
    """获取按split分类的图片（兼容旧接口）"""
    from modules.dataset_manager import get_dataset_images as _get_images
    try:
        images = _get_images(name)
        # 按train/val/test分组
        result = {'train': [], 'val': [], 'test': []}
        for img in images:
            if '/train/' in img:
                result['train'].append(img)
            elif '/val/' in img:
                result['val'].append(img)
            elif '/test/' in img:
                result['test'].append(img)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dataset_bp.route('/<name>/preview-images')
def get_preview_images(name):
    """获取数据集预览图片，分原图和标注图四组"""
    from modules.dataset_manager import get_dataset_split_images as _get_split_images
    try:
        result = _get_split_images(name, max_per_split=8)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dataset_bp.route('/<name>/charts')
def get_dataset_charts(name):
    """获取数据集图表"""
    dataset_path = os.path.join(DATASETS_DIR, name)
    result = {'detail': None, 'distribution': None}

    # 查找detail.png
    for root, dirs, files in os.walk(dataset_path):
        for f in files:
            if f == 'detail.png':
                result['detail'] = os.path.join(root, f)
            if f == 'distribution.png':
                result['distribution'] = os.path.join(root, f)

    return jsonify(result)


@dataset_bp.route('/<name>', methods=['GET'])
@api_handler
def get_dataset(name):
    """获取数据集详情"""
    dataset = get_dataset_by_name(name)
    if not dataset:
        return jsonify({"success": False, "error": "Dataset not found"}), 404
    return jsonify({"success": True, "dataset": dataset})


@dataset_bp.route('/<name>', methods=['DELETE'])
@api_handler
def delete_dataset(name):
    """删除数据集"""
    try:
        success, message = delete_dataset_by_name(name)
        if success:
            # 删除文件
            import shutil
            dataset_path = os.path.join(DATASETS_DIR, name)
            if os.path.exists(dataset_path):
                shutil.rmtree(dataset_path)
        return jsonify({"success": success, "message": message})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@dataset_bp.route('/<name>', methods=['PUT'])
@api_handler
def update_dataset(name):
    """更新数据集信息"""
    from modules.database import update_dataset
    try:
        data = request.json
        update_dataset(name, data)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@dataset_bp.route('/<name>/download')
def download_dataset(name):
    """下载数据集"""
    dataset_path = os.path.join(DATASETS_DIR, name)
    if not os.path.exists(dataset_path):
        return jsonify({"error": "Dataset not found"}), 404

    if os.path.isdir(dataset_path):
        # 目录打包成zip下载
        try:
            # 创建临时zip文件，delete=False手动控制生命周期
            temp_file = tempfile.NamedTemporaryFile(
                suffix='.zip',
                delete=False,
                prefix=f'dataset_{name}_'
            )
            temp_zip_path = temp_file.name
            temp_file.close()

            # shutil.make_archive(base_name, format, root_dir)
            # base_name 不带扩展名，会自动添加 .zip
            archive_base = temp_zip_path[:-4]  # 去掉 .zip
            shutil.make_archive(archive_base, 'zip', root_dir=dataset_path)
            zip_path = archive_base + '.zip'

            # 获取数据集名称作为下载文件名
            download_name = f"{name}.zip"

            # 发送文件后删除临时zip
            response = send_from_directory(
                os.path.dirname(zip_path),
                os.path.basename(zip_path),
                as_attachment=True,
                download_name=download_name
            )

            # 下载完成后清理临时文件
            def cleanup(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

            response.call_on_close(lambda: cleanup(zip_path))
            return response

        except Exception as e:
            return jsonify({"error": f"打包失败: {str(e)}"}), 500
    else:
        # 单文件直接下载
        return send_from_directory(
            os.path.dirname(dataset_path),
            os.path.basename(dataset_path),
            as_attachment=True
        )


@dataset_bp.route('/<name>/class-info', methods=['POST'])
def update_class_info(name):
    """更新类别信息"""
    from modules.database import update_dataset
    try:
        data = request.json
        import json
        class_info = data.get('class_info', {})
        update_dataset(name, {'class_info': json.dumps(class_info)})
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
