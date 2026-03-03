import os
import shutil
import hashlib
from werkzeug.utils import secure_filename
from config import DATASETS_DIR, MODELS_DIR


def save_file(uploaded_file, destination_dir, custom_name=None):
    """
    保存上传的文件到指定目录

    Args:
        uploaded_file: Streamlit上传的文件对象
        destination_dir: 目标目录
        custom_name: 自定义文件名（可选）

    Returns:
        保存后的文件路径
    """
    if custom_name is None:
        filename = secure_filename(uploaded_file.name)
    else:
        filename = secure_filename(custom_name)

    filepath = os.path.join(destination_dir, filename)

    # 如果文件已存在，添加后缀
    if os.path.exists(filepath):
        base, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(filepath):
            filename = f"{base}_{counter}{ext}"
            filepath = os.path.join(destination_dir, filename)
            counter += 1

    # 保存文件
    with open(filepath, 'wb') as f:
        f.write(uploaded_file.getbuffer())

    return filepath


def save_dataset_file(uploaded_file, dataset_name, custom_name=None):
    """
    保存数据集文件

    Args:
        uploaded_file: 上传的文件
        dataset_name: 数据集名称
        custom_name: 自定义文件名

    Returns:
        保存后的文件路径
    """
    dataset_dir = os.path.join(DATASETS_DIR, dataset_name)
    os.makedirs(dataset_dir, exist_ok=True)
    return save_file(uploaded_file, dataset_dir, custom_name)


def save_model_file(uploaded_file, model_name, custom_name=None):
    """
    保存模型文件

    Args:
        uploaded_file: 上传的文件
        model_name: 模型名称
        custom_name: 自定义文件名

    Returns:
        保存后的文件路径
    """
    model_dir = os.path.join(MODELS_DIR, model_name)
    os.makedirs(model_dir, exist_ok=True)
    return save_file(uploaded_file, model_dir, custom_name)


def get_file_path(file_dir, filename):
    """
    获取文件路径

    Args:
        file_dir: 目录
        filename: 文件名

    Returns:
        完整文件路径
    """
    return os.path.join(file_dir, filename)


def delete_file(filepath):
    """
    删除文件

    Args:
        filepath: 文件路径

    Returns:
        是否成功删除
    """
    try:
        if os.path.isfile(filepath):
            os.remove(filepath)
            return True
        elif os.path.isdir(filepath):
            shutil.rmtree(filepath)
            return True
        return False
    except Exception:
        return False


def get_file_hash(filepath):
    """
    计算文件哈希值

    Args:
        filepath: 文件路径

    Returns:
        MD5哈希值
    """
    hash_md5 = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def get_directory_size(directory):
    """
    获取目录大小

    Args:
        directory: 目录路径

    Returns:
        目录大小（字节）
    """
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if os.path.isfile(filepath):
                total_size += os.path.getsize(filepath)
    return total_size


def format_size(size_bytes):
    """
    格式化文件大小

    Args:
        size_bytes: 字节数

    Returns:
        格式化后的大小字符串
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"
