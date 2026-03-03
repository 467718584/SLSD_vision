import os
import json
from datetime import datetime
from werkzeug.utils import secure_filename
from config import MODELS_DIR
from modules.storage import save_file, delete_file, get_directory_size, format_size, get_file_hash


# 支持的模型文件扩展名
SUPPORTED_MODEL_EXTENSIONS = ['.pt', '.pth', '.h5', '.pb', '.onnx', '.tflite', '.pkl', '.joblib', '.zip', '.tar', '.gz']


def upload_model(uploaded_file, model_name, description="", model_type=""):
    """
    上传模型文件

    Args:
        uploaded_file: 上传的文件对象
        model_name: 模型名称
        description: 模型描述
        model_type: 模型类型（如 yolo, tensorflow, pytorch 等）

    Returns:
        成功返回模型路径，失败返回None
    """
    model_dir = os.path.join(MODELS_DIR, model_name)
    os.makedirs(model_dir, exist_ok=True)

    filename = secure_filename(uploaded_file.name)

    try:
        # 保存模型文件
        model_path = save_file(uploaded_file, model_dir)

        # 获取文件哈希
        file_hash = get_file_hash(model_path)

        # 获取文件大小
        file_size = os.path.getsize(model_path)

        # 创建元数据文件
        metadata = {
            'name': model_name,
            'description': description,
            'model_type': model_type,
            'filename': filename,
            'file_size': file_size,
            'file_size_formatted': format_size(file_size),
            'file_hash': file_hash,
            'uploaded_at': datetime.now().isoformat(),
            'extension': os.path.splitext(filename)[1]
        }

        metadata_file = os.path.join(model_dir, 'metadata.json')
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)

        return model_dir

    except Exception as e:
        print(f"Error uploading model: {e}")
        # 清理失败的目录
        if os.path.exists(model_dir):
            import shutil
            shutil.rmtree(model_dir)
        return None


def list_models():
    """
    列出所有模型

    Returns:
        模型信息列表
    """
    models = []

    if not os.path.exists(MODELS_DIR):
        return models

    for model_name in os.listdir(MODELS_DIR):
        model_path = os.path.join(MODELS_DIR, model_name)

        if os.path.isdir(model_path):
            info = get_model_info(model_name)
            if info:
                models.append(info)

    return sorted(models, key=lambda x: x.get('uploaded_at', ''), reverse=True)


def get_model_info(model_name):
    """
    获取模型详情

    Args:
        model_name: 模型名称

    Returns:
        模型信息字典
    """
    model_dir = os.path.join(MODELS_DIR, model_name)

    if not os.path.exists(model_dir):
        return None

    # 读取元数据文件
    metadata_file = os.path.join(model_dir, 'metadata.json')
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = {}

    # 获取模型文件列表
    model_files = []
    for file in os.listdir(model_dir):
        if file == 'metadata.json':
            continue
        file_path = os.path.join(model_dir, file)
        if os.path.isfile(file_path):
            file_size = os.path.getsize(file_path)
            model_files.append({
                'name': file,
                'path': file_path,
                'size': file_size,
                'size_formatted': format_size(file_size)
            })

    # 获取目录大小
    total_size = get_directory_size(model_dir)

    # 获取创建时间
    created_at = datetime.fromtimestamp(os.path.getctime(model_dir))
    modified_at = datetime.fromtimestamp(os.path.getmtime(model_dir))

    return {
        'name': model_name,
        'path': model_dir,
        'files': model_files,
        'total_size': total_size,
        'total_size_formatted': format_size(total_size),
        'created_at': created_at,
        'modified_at': modified_at,
        'file_count': len(model_files),
        **metadata
    }


def delete_model(model_name):
    """
    删除模型

    Args:
        model_name: 模型名称

    Returns:
        是否成功删除
    """
    model_path = os.path.join(MODELS_DIR, model_name)
    return delete_file(model_path)


def get_model_files(model_name):
    """
    获取模型的文件列表

    Args:
        model_name: 模型名称

    Returns:
        文件路径列表
    """
    model_dir = os.path.join(MODELS_DIR, model_name)

    if not os.path.exists(model_dir):
        return []

    files = []
    for file in os.listdir(model_dir):
        if file == 'metadata.json':
            continue
        file_path = os.path.join(model_dir, file)
        if os.path.isfile(file_path):
            files.append(file_path)

    return files


def update_model_metadata(model_name, metadata):
    """
    更新模型元数据

    Args:
        model_name: 模型名称
        metadata: 新的元数据

    Returns:
        是否成功更新
    """
    model_dir = os.path.join(MODELS_DIR, model_name)
    metadata_file = os.path.join(model_dir, 'metadata.json')

    if not os.path.exists(model_dir):
        return False

    try:
        # 读取现有元数据
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                existing_metadata = json.load(f)
        else:
            existing_metadata = {}

        # 合并元数据
        existing_metadata.update(metadata)

        # 写入更新后的元数据
        with open(metadata_file, 'w') as f:
            json.dump(existing_metadata, f, indent=2)

        return True

    except Exception as e:
        print(f"Error updating model metadata: {e}")
        return False


def create_model(name, description="", model_type=""):
    """
    创建空模型目录

    Args:
        name: 模型名称
        description: 模型描述
        model_type: 模型类型

    Returns:
        模型路径
    """
    model_dir = os.path.join(MODELS_DIR, name)
    os.makedirs(model_dir, exist_ok=True)

    # 创建元数据文件
    metadata = {
        'name': name,
        'description': description,
        'model_type': model_type,
        'created_at': datetime.now().isoformat()
    }

    metadata_file = os.path.join(model_dir, 'metadata.json')
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

    return model_dir
