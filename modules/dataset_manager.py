import os
import zipfile
import shutil
import json
from datetime import datetime
from werkzeug.utils import secure_filename
from config import DATASETS_DIR, SUPPORTED_IMAGE_FORMATS
from modules.storage import save_file, delete_file, get_directory_size, format_size
from modules.annotation_parser import detect_annotation_format, get_annotation_preview, parse_yolo


# 预设颜色列表用于可视化
VIS_COLORS = [
    (255, 0, 0),      # 红色
    (0, 255, 0),     # 绿色
    (0, 0, 255),     # 蓝色
    (255, 255, 0),   # 黄色
    (255, 0, 255),   # 紫色
    (0, 255, 255),   # 青色
    (255, 128, 0),   # 橙色
    (128, 0, 255),   # 紫罗兰
    (0, 128, 255),   # 天蓝色
    (255, 0, 128),   # 玫瑰红
]


def visualize_dataset(dataset_name, class_names=None):
    """
    为数据集生成可视化图片

    Args:
        dataset_name: 数据集名称
        class_names: 类别名称字典 {class_id: class_name}

    Returns:
        是否成功
    """
    try:
        from PIL import Image, ImageDraw, ImageFont

        dataset_path = os.path.join(DATASETS_DIR, dataset_name)
        if not os.path.exists(dataset_path):
            return False

        # 创建可视化输出目录
        vis_dir = os.path.join(dataset_path, 'vis')
        os.makedirs(vis_dir, exist_ok=True)

        # 检测标注格式
        annotation_format = detect_annotation_format(dataset_path)
        if annotation_format != 'yolo':
            print(f"仅支持YOLO格式可视化，当前格式: {annotation_format}")
            return False

        # 查找图片和标注目录
        images_base = None
        labels_base = None

        # 查找标准YOLO目录结构（支持嵌套目录结构）
        # 检查 dataset_path/images/split 或 dataset_path/{name}/images/split
        for base in [dataset_path, os.path.join(dataset_path, dataset_name)]:
            img_dir = os.path.join(base, 'images')
            lbl_dir = os.path.join(base, 'labels')
            if os.path.isdir(img_dir) and os.path.isdir(lbl_dir):
                images_base = img_dir
                labels_base = lbl_dir
                break

        # 如果没有找到，尝试其他目录结构
        if images_base is None:
            for dir_name in ['images', 'img', 'pictures', 'data']:
                for base in [dataset_path, os.path.join(dataset_path, dataset_name)]:
                    img_path = os.path.join(base, dir_name)
                    if os.path.isdir(img_path):
                        images_base = img_path
                        break
                if images_base:
                    break

        if labels_base is None:
            for dir_name in ['labels']:
                for base in [dataset_path, os.path.join(dataset_path, dataset_name)]:
                    lbl_path = os.path.join(base, dir_name)
                    if os.path.isdir(lbl_path):
                        labels_base = lbl_path
                        break
                if labels_base:
                    break

        if images_base is None or labels_base is None:
            print(f"未找到图片或标注目录: images_base={images_base}, labels_base={labels_base}")
            return False

        # 处理每个split
        splits = []
        for split in ['train', 'val', 'test']:
            img_split_dir = os.path.join(images_base, split) if os.path.exists(os.path.join(images_base, split)) else None
            lbl_split_dir = os.path.join(labels_base, split) if os.path.exists(os.path.join(labels_base, split)) else None

            if img_split_dir and lbl_split_dir and os.path.isdir(img_split_dir):
                splits.append((split, img_split_dir, lbl_split_dir))

        # 如果没有标准split结构，直接使用根目录
        if not splits:
            if os.path.isdir(images_base) and os.path.isdir(labels_base):
                splits.append(('train', images_base, labels_base))

        print(f"找到 splits: {splits}")

        # 处理每个split的图片
        total_processed = 0
        for split, img_dir, lbl_dir in splits:
            # 为每个split创建vis子目录
            split_vis_dir = os.path.join(vis_dir, split)
            os.makedirs(split_vis_dir, exist_ok=True)

            # 获取该split的图片文件
            image_files = []
            for file in os.listdir(img_dir):
                if any(file.lower().endswith(ext) for ext in SUPPORTED_IMAGE_FORMATS):
                    image_files.append(file)

            for img_file in image_files:
                img_path = os.path.join(img_dir, img_file)
                label_file = os.path.splitext(img_file)[0] + '.txt'
                label_path = os.path.join(lbl_dir, label_file)

                if not os.path.exists(label_path):
                    # 如果没有标注文件，复制原图
                    try:
                        with Image.open(img_path) as img:
                            img.save(os.path.join(split_vis_dir, img_file))
                        total_processed += 1
                    except:
                        pass
                    continue

                try:
                    # 读取图片
                    with Image.open(img_path) as img:
                        img = img.convert('RGB')
                        draw = ImageDraw.Draw(img)
                        width, height = img.size

                        # 读取标注文件
                        annotations, class_ids = parse_yolo(label_path, width, height)

                        # 绘制标注
                        for ann in annotations:
                            class_id = ann['class_id']
                            bbox = ann['bbox']
                            annotation_format = ann.get('format', 'detection')
                            color = VIS_COLORS[class_id % len(VIS_COLORS)]

                            # 根据格式绘制不同图形
                            if annotation_format == 'segmentation' and 'polygon' in ann:
                                # 实例分割：绘制多边形（首尾相连）
                                polygon = ann['polygon']
                                if len(polygon) >= 3:
                                    # 绘制多边形边框（首尾自动相连）
                                    draw.polygon(polygon, outline=color, width=2)
                            else:
                                # 目标检测：绘制边界框
                                draw.rectangle(
                                    [bbox['x_min'], bbox['y_min'], bbox['x_max'], bbox['y_max']],
                                    outline=color,
                                    width=3
                                )

                            # 获取类别名称
                            if class_names and str(class_id) in class_names:
                                label_name = class_names[str(class_id)]
                            else:
                                label_name = f"class_{class_id}"

                            # 绘制标签背景
                            text = label_name
                            try:
                                font = ImageFont.truetype("arial.ttf", 20)
                            except:
                                font = ImageFont.load_default()

                            # 计算文字位置
                            bbox_text = draw.textbbox((0, 0), text, font=font)
                            text_width = bbox_text[2] - bbox_text[0]
                            text_height = bbox_text[3] - bbox_text[1]

                            text_bg = [
                                bbox['x_min'],
                                bbox['y_min'] - text_height - 4,
                                bbox['x_min'] + text_width + 4,
                                bbox['y_min']
                            ]

                            # 确保不超出图片范围
                            if text_bg[1] < 0:
                                text_bg[1] = bbox['y_min']
                                text_bg[3] = bbox['y_min'] + text_height + 4

                            draw.rectangle(text_bg, fill=color)
                            draw.text((text_bg[0] + 2, text_bg[1] + 2), text, fill=(255, 255, 255), font=font)

                    # 保存可视化图片
                    vis_path = os.path.join(split_vis_dir, img_file)
                    img.save(vis_path)
                    total_processed += 1

                except Exception as e:
                    print(f"处理图片 {img_file} 时出错: {e}")
                    continue

        print(f"数据集 {dataset_name} 可视化完成，共处理 {total_processed} 张图片")
        return True

    except ImportError:
        print("PIL库未安装，无法进行可视化")
        return False
    except Exception as e:
        print(f"可视化数据集 {dataset_name} 时出错: {e}")
        return False


def generate_dataset_charts(dataset_name, class_info=None):
    """
    为数据集生成详情图和分布图

    Args:
        dataset_name: 数据集名称
        class_info: 类别信息字典

    Returns:
        是否成功
    """
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import numpy as np

        dataset_path = os.path.join(DATASETS_DIR, dataset_name)
        if not os.path.exists(dataset_path):
            return False

        # 创建charts目录
        charts_dir = os.path.join(dataset_path, 'charts')
        os.makedirs(charts_dir, exist_ok=True)

        # 生成详情图（热力图风格的样本分布）
        detail_path = os.path.join(charts_dir, 'detail.png')
        plt.figure(figsize=(8, 6))

        # 模拟样本分布热力图
        if class_info:
            # 根据类别数量创建数据
            classes = list(class_info.keys()) if class_info else []
            counts = [class_info[k].get('count', 0) if isinstance(class_info[k], dict) else 0 for k in classes]

            if counts and sum(counts) > 0:
                # 创建简单的分布图
                plt.bar(range(len(counts)), counts, color='steelblue', alpha=0.8)
                plt.xlabel('Class Index', fontsize=10)
                plt.ylabel('Count', fontsize=10)
                plt.title('Sample Distribution by Class', fontsize=12)
                plt.xticks(range(len(classes)), classes, rotation=45, fontsize=8)
            else:
                plt.text(0.5, 0.5, 'No class data', ha='center', va='center', fontsize=14)
                plt.title('Sample Distribution', fontsize=12)
        else:
            # 没有类别信息，创建默认热力图
            data = np.random.rand(6, 6)
            plt.imshow(data, cmap='Blues', aspect='auto')
            plt.colorbar(label='Intensity')
            plt.title('Dataset Sample Distribution', fontsize=12)

        plt.tight_layout()
        plt.savefig(detail_path, dpi=80, bbox_inches='tight')
        plt.close()

        # 生成分布图（饼图）
        dist_path = os.path.join(charts_dir, 'distribution.png')
        plt.figure(figsize=(8, 6))

        if class_info:
            classes = list(class_info.keys()) if class_info else []
            counts = [class_info[k].get('count', 0) if isinstance(class_info[k], dict) else 0 for k in classes]

            if counts and sum(counts) > 0:
                # 创建饼图
                colors = plt.cm.Set3(np.linspace(0, 1, len(counts)))
                labels = [f'Class {c}' for c in classes]
                plt.pie(counts, labels=labels, autopct='%1.1f%%', colors=colors, startangle=90)
                plt.title('Class Distribution', fontsize=12)
            else:
                plt.text(0.5, 0.5, 'No data', ha='center', va='center', fontsize=14)
                plt.title('Class Distribution', fontsize=12)
        else:
            plt.text(0.5, 0.5, 'No data', ha='center', va='center', fontsize=14)
            plt.title('Class Distribution', fontsize=12)

        plt.tight_layout()
        plt.savefig(dist_path, dpi=80, bbox_inches='tight')
        plt.close()

        print(f"数据集 {dataset_name} 图表生成完成")
        return True

    except ImportError:
        print("matplotlib库未安装，无法生成图表")
        return False
    except Exception as e:
        print(f"生成图表时出错: {e}")
        return False


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

            # 删除解压目录（保留ZIP文件用于下载）
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

    # 统计图片数量（排除vis目录）
    image_count = 0
    image_files = []
    for root, dirs, files in os.walk(dataset_path):
        # 跳过vis目录
        if 'vis' in dirs:
            dirs.remove('vis')
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


def get_dataset_split_images(dataset_name, max_per_split=8):
    """
    获取数据集按split分类的图片（训练集、验证集、测试集），分原图和标注图

    Args:
        dataset_name: 数据集名称
        max_per_split: 每个split最多返回的图片数

    Returns:
        字典，包含:
        - train_original: 训练集原图
        - train_vis: 训练集标注图
        - val_original: 验证集原图
        - val_vis: 验证集标注图
        - test_original: 测试集原图
        - test_vis: 测试集标注图
    """
    dataset_path = os.path.join(DATASETS_DIR, dataset_name)

    if not os.path.exists(dataset_path):
        return {
            'train_original': [], 'train_vis': [],
            'val_original': [], 'val_vis': [],
            'test_original': [], 'test_vis': []
        }

    # 使用os.walk递归查找图片，支持嵌套目录结构
    train_original, val_original, test_original = [], [], []
    train_vis, val_vis, test_vis = [], [], []

    for root, dirs, files in os.walk(dataset_path):
        # 判断当前目录是否为vis目录或其子目录
        is_vis_branch = '/vis/' in root or root.endswith('/vis')
        
        # 根据路径判断split（更精确的匹配）
        # 检查路径是否以 /train, /val, /test 结尾或是其子路径
        has_train = '/train/' in root or root.endswith('/train')
        has_val = '/val/' in root or root.endswith('/val')
        has_test = '/test/' in root or root.endswith('/test')
        
        for file in files:
            if any(file.lower().endswith(ext) for ext in SUPPORTED_IMAGE_FORMATS):
                full_path = os.path.join(root, file)
                
                # vis目录下的图片
                if is_vis_branch:
                    if has_train:
                        train_vis.append(full_path)
                    elif has_val:
                        val_vis.append(full_path)
                    elif has_test:
                        test_vis.append(full_path)
                else:
                    # 非vis目录，只处理images或嵌套dataset子目录中的图片
                    # 跳过vis目录中的文件
                    if '/vis/' in full_path:
                        continue
                    # 根据路径中的split进行分类
                    if has_train:
                        train_original.append(full_path)
                    elif has_val:
                        val_original.append(full_path)
                    elif has_test:
                        test_original.append(full_path)

    result = {
        'train_original': train_original[:max_per_split],
        'train_vis': train_vis[:max_per_split],
        'val_original': val_original[:max_per_split],
        'val_vis': val_vis[:max_per_split],
        'test_original': test_original[:max_per_split],
        'test_vis': test_vis[:max_per_split]
    }

    return result


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
