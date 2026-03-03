import os
import zipfile
import shutil
import json
from datetime import datetime
from werkzeug.utils import secure_filename
from config import DATASETS_DIR, SUPPORTED_IMAGE_FORMATS
from modules.storage import save_file, delete_file, get_directory_size, format_size
from modules.annotation_parser import detect_annotation_format, get_annotation_preview


def upload_dataset(uploaded_file, dataset_name):
    """
    上传数据集（支持ZIP压缩包或文件夹）

    Args:
        uploaded_file: 上传的文件对象
        dataset_name: 数据集名称

    Returns:
        成功返回数据集路径，失败返回None
    """
    dataset_dir = os.path.join(DATASETS_DIR, dataset_name)
    os.makedirs(dataset_dir, exist_ok=True)

    filename = secure_filename(uploaded_file.name)

    try:
        # 如果是ZIP文件，解压
        if filename.endswith('.zip'):
            zip_path = os.path.join(dataset_dir, filename)
            with open(zip_path, 'wb') as f:
                f.write(uploaded_file.getbuffer())

            # 解压ZIP文件
            extract_dir = os.path.join(dataset_dir, 'extracted')
            os.makedirs(extract_dir, exist_ok=True)

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)

            # 将解压内容移动到数据集根目录
            for item in os.listdir(extract_dir):
                item_path = os.path.join(extract_dir, item)
                dest_path = os.path.join(dataset_dir, item)
                if os.path.exists(dest_path):
                    if os.path.isdir(dest_path):
                        shutil.rmtree(dest_path)
                    else:
                        os.remove(dest_path)
                shutil.move(item_path, dest_path)

            # 删除ZIP文件和解压目录
            os.remove(zip_path)
            if os.path.exists(extract_dir):
                shutil.rmtree(extract_dir)

        else:
            # 直接保存文件
            save_file(uploaded_file, dataset_dir)

        return dataset_dir

    except Exception as e:
        print(f"Error uploading dataset: {e}")
        # 清理失败的目录
        if os.path.exists(dataset_dir):
            shutil.rmtree(dataset_dir)
        return None


def list_datasets():
    """
    列出所有数据集

    Returns:
        数据集信息列表
    """
    datasets = []

    if not os.path.exists(DATASETS_DIR):
        return datasets

    for dataset_name in os.listdir(DATASETS_DIR):
        dataset_path = os.path.join(DATASETS_DIR, dataset_name)

        if os.path.isdir(dataset_path):
            info = get_dataset_info(dataset_name)
            if info:
                datasets.append(info)

    return sorted(datasets, key=lambda x: x['created_at'], reverse=True)


def get_dataset_info(dataset_name):
    """
    获取数据集详情

    Args:
        dataset_name: 数据集名称

    Returns:
        数据集信息字典
    """
    dataset_path = os.path.join(DATASETS_DIR, dataset_name)

    if not os.path.exists(dataset_path):
        return None

    # 获取创建时间
    created_at = datetime.fromtimestamp(os.path.getctime(dataset_path))
    modified_at = datetime.fromtimestamp(os.path.getmtime(dataset_path))

    # 获取数据集大小
    size = get_directory_size(dataset_path)

    # 统计图片数量
    image_count = 0
    image_files = []
    for root, dirs, files in os.walk(dataset_path):
        for file in files:
            if any(file.lower().endswith(ext) for ext in SUPPORTED_IMAGE_FORMATS):
                image_count += 1
                if len(image_files) < 10:
                    image_files.append(os.path.join(root, file))

    # 检测标注格式
    annotation_format = detect_annotation_format(dataset_path)

    # 获取标注预览
    annotation_preview = None
    if annotation_format:
        annotation_preview = get_annotation_preview(dataset_path, annotation_format)

    return {
        'name': dataset_name,
        'path': dataset_path,
        'created_at': created_at,
        'modified_at': modified_at,
        'size': size,
        'size_formatted': format_size(size),
        'image_count': image_count,
        'sample_images': image_files,
        'annotation_format': annotation_format,
        'annotation_preview': annotation_preview
    }


def delete_dataset(dataset_name):
    """
    删除数据集

    Args:
        dataset_name: 数据集名称

    Returns:
        是否成功删除
    """
    dataset_path = os.path.join(DATASETS_DIR, dataset_name)
    return delete_file(dataset_path)


def parse_annotations(dataset_name):
    """
    解析数据集的标注文件

    Args:
        dataset_name: 数据集名称

    Returns:
        标注信息字典
    """
    dataset_path = os.path.join(DATASETS_DIR, dataset_name)

    if not os.path.exists(dataset_path):
        return None

    # 检测标注格式
    annotation_format = detect_annotation_format(dataset_path)

    if not annotation_format:
        return {
            'format': None,
            'message': '未检测到标注文件'
        }

    # 获取标注预览
    preview = get_annotation_preview(dataset_path, annotation_format)

    return {
        'format': annotation_format,
        'preview': preview
    }


def get_dataset_images(dataset_name, max_images=50):
    """
    获取数据集的图片列表

    Args:
        dataset_name: 数据集名称
        max_images: 最大返回数量

    Returns:
        图片路径列表
    """
    dataset_path = os.path.join(DATASETS_DIR, dataset_name)

    if not os.path.exists(dataset_path):
        return []

    images = []
    for root, dirs, files in os.walk(dataset_path):
        for file in files:
            if any(file.lower().endswith(ext) for ext in SUPPORTED_IMAGE_FORMATS):
                images.append(os.path.join(root, file))
                if len(images) >= max_images:
                    return images

    return images


def create_dataset(name, description=""):
    """
    创建空数据集

    Args:
        name: 数据集名称
        description: 数据集描述

    Returns:
        数据集路径
    """
    dataset_dir = os.path.join(DATASETS_DIR, name)
    os.makedirs(dataset_dir, exist_ok=True)

    # 创建元数据文件
    metadata = {
        'name': name,
        'description': description,
        'created_at': datetime.now().isoformat()
    }

    metadata_file = os.path.join(dataset_dir, 'metadata.json')
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

    return dataset_dir
