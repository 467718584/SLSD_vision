import os
import json
import xml.etree.ElementTree as ET
from config import SUPPORTED_IMAGE_FORMATS


def parse_yolo(annotation_file, image_width, image_height):
    """
    解析YOLO格式标注文件

    Args:
        annotation_file: 标注文件路径
        image_width: 图片宽度
        image_height: 图片高度

    Returns:
        标注列表，每项包含 class_id, class_name, bbox (x_center, y_center, width, height)
    """
    annotations = []
    class_names = []

    try:
        with open(annotation_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                parts = line.split()
                if len(parts) >= 5:
                    class_id = int(parts[0])
                    x_center = float(parts[1])
                    y_center = float(parts[2])
                    width = float(parts[3])
                    height = float(parts[4])

                    # 转换为像素坐标
                    x_center_px = x_center * image_width
                    y_center_px = y_center * image_height
                    width_px = width * image_width
                    height_px = height * image_height

                    # 计算左上角和右下角坐标
                    x_min = x_center_px - width_px / 2
                    y_min = y_center_px - height_px / 2
                    x_max = x_center_px + width_px / 2
                    y_max = y_center_px + height_px / 2

                    annotations.append({
                        'class_id': class_id,
                        'class_name': f"class_{class_id}",
                        'bbox': {
                            'x_min': int(x_min),
                            'y_min': int(y_min),
                            'x_max': int(x_max),
                            'y_max': int(y_max),
                            'width': int(width_px),
                            'height': int(height_px)
                        },
                        'format': 'yolo'
                    })

                    if class_id not in class_names:
                        class_names.append(class_id)

    except Exception as e:
        print(f"Error parsing YOLO file {annotation_file}: {e}")

    return annotations, class_names


def parse_coco(annotation_file):
    """
    解析COCO JSON格式标注文件

    Args:
        annotation_file: 标注文件路径

    Returns:
        标注列表，每项包含 image_id, category_id, bbox 等
    """
    annotations = []
    categories = []
    images = []

    try:
        with open(annotation_file, 'r') as f:
            data = json.load(f)

        # 提取类别信息
        if 'categories' in data:
            for cat in data['categories']:
                categories.append({
                    'id': cat.get('id'),
                    'name': cat.get('name'),
                    'supercategory': cat.get('supercategory', '')
                })

        # 提取图片信息
        if 'images' in data:
            for img in data['images']:
                images.append({
                    'id': img.get('id'),
                    'file_name': img.get('file_name'),
                    'width': img.get('width'),
                    'height': img.get('height')
                })

        # 提取标注信息
        if 'annotations' in data:
            for ann in data['annotations']:
                bbox = ann.get('bbox', [0, 0, 0, 0])
                annotations.append({
                    'id': ann.get('id'),
                    'image_id': ann.get('image_id'),
                    'category_id': ann.get('category_id'),
                    'category_name': get_coco_category_name(categories, ann.get('category_id')),
                    'bbox': {
                        'x_min': int(bbox[0]),
                        'y_min': int(bbox[1]),
                        'width': int(bbox[2]),
                        'height': int(bbox[3]),
                        'x_max': int(bbox[0] + bbox[2]),
                        'y_max': int(bbox[1] + bbox[3])
                    },
                    'area': ann.get('area'),
                    'iscrowd': ann.get('iscrowd', 0),
                    'format': 'coco'
                })

    except Exception as e:
        print(f"Error parsing COCO file {annotation_file}: {e}")

    return annotations, categories, images


def get_coco_category_name(categories, category_id):
    """获取COCO类别名称"""
    for cat in categories:
        if cat['id'] == category_id:
            return cat['name']
    return f"category_{category_id}"


def parse_voc(annotation_file):
    """
    解析VOC XML格式标注文件

    Args:
        annotation_file: 标注文件路径

    Returns:
        标注列表，每项包含 class_name, bbox 等
    """
    annotations = []

    try:
        tree = ET.parse(annotation_file)
        root = tree.getroot()

        # 获取图片信息
        size = root.find('size')
        if size is not None:
            width = int(size.find('width').text)
            height = int(size.find('height').text)
        else:
            width, height = 0, 0

        # 获取文件名
        filename = root.find('filename').text if root.find('filename') is not None else ''

        # 解析每个对象
        for obj in root.findall('object'):
            class_name = obj.find('name').text if obj.find('name') is not None else ''

            bndbox = obj.find('bndbox')
            if bndbox is not None:
                xmin = int(bndbox.find('xmin').text)
                ymin = int(bndbox.find('ymin').text)
                xmax = int(bndbox.find('xmax').text)
                ymax = int(bndbox.find('ymax').text)

                annotations.append({
                    'class_name': class_name,
                    'filename': filename,
                    'bbox': {
                        'x_min': xmin,
                        'y_min': ymin,
                        'x_max': xmax,
                        'y_max': ymax,
                        'width': xmax - xmin,
                        'height': ymax - ymin
                    },
                    'format': 'voc'
                })

    except Exception as e:
        print(f"Error parsing VOC file {annotation_file}: {e}")

    return annotations


def detect_annotation_format(dataset_path):
    """
    自动检测标注格式

    Args:
        dataset_path: 数据集路径

    Returns:
        检测到的格式 ('yolo', 'coco', 'voc') 或 None
    """
    # 检查YOLO格式
    yolo_labels_dir = os.path.join(dataset_path, 'labels')
    if os.path.isdir(yolo_labels_dir):
        yolo_files = [f for f in os.listdir(yolo_labels_dir) if f.endswith('.txt')]
        if yolo_files:
            return 'yolo'

    # 检查COCO格式
    for filename in os.listdir(dataset_path):
        if filename.endswith('.json'):
            try:
                with open(os.path.join(dataset_path, filename), 'r') as f:
                    data = json.load(f)
                    if 'annotations' in data or 'images' in data:
                        return 'coco'
            except:
                pass

    # 检查VOC格式
    voc_dirs = ['Annotations', 'VOCAnnotations', 'annotations']
    for voc_dir in voc_dirs:
        voc_path = os.path.join(dataset_path, voc_dir)
        if os.path.isdir(voc_path):
            xml_files = [f for f in os.listdir(voc_path) if f.endswith('.xml')]
            if xml_files:
                return 'voc'

    # 检查根目录下的VOC XML文件
    for filename in os.listdir(dataset_path):
        if filename.endswith('.xml'):
            return 'voc'

    return None


def get_annotation_preview(dataset_path, format_type, max_samples=5):
    """
    获取标注预览信息

    Args:
        dataset_path: 数据集路径
        format_type: 标注格式
        max_samples: 最大预览数量

    Returns:
        预览信息字典
    """
    preview = {
        'format': format_type,
        'samples': [],
        'total_annotations': 0,
        'class_names': []
    }

    if format_type == 'yolo':
        # 查找图片和标注
        images_dir = os.path.join(dataset_path, 'images')
        labels_dir = os.path.join(dataset_path, 'labels')

        if not os.path.isdir(images_dir):
            # 尝试其他常见目录名
            for dir_name in ['img', 'pictures', 'data']:
                alt_images_dir = os.path.join(dataset_path, dir_name)
                if os.path.isdir(alt_images_dir):
                    images_dir = alt_images_dir
                    break

        if not os.path.isdir(labels_dir):
            return preview

        # 获取标注文件列表
        label_files = [f for f in os.listdir(labels_dir) if f.endswith('.txt')][:max_samples]

        for label_file in label_files:
            label_path = os.path.join(labels_dir, label_file)
            image_name = os.path.splitext(label_file)[0]

            # 尝试找对应的图片
            image_path = None
            for ext in SUPPORTED_IMAGE_FORMATS:
                potential_path = os.path.join(images_dir, image_name + ext)
                if os.path.exists(potential_path):
                    image_path = potential_path
                    break

            if image_path:
                # 读取图片尺寸
                try:
                    from PIL import Image
                    with Image.open(image_path) as img:
                        width, height = img.size
                except:
                    width, height = 0, 0

                annotations, classes = parse_yolo(label_path, width, height)
                preview['samples'].append({
                    'image': image_name,
                    'image_path': image_path,
                    'annotations': annotations
                })
                preview['total_annotations'] += len(annotations)
                for c in classes:
                    if c not in preview['class_names']:
                        preview['class_names'].append(c)

    elif format_type == 'coco':
        # 查找COCO JSON文件
        json_file = None
        for filename in os.listdir(dataset_path):
            if filename.endswith('.json'):
                json_path = os.path.join(dataset_path, filename)
                try:
                    with open(json_path, 'r') as f:
                        data = json.load(f)
                        if 'annotations' in data or 'images' in data:
                            json_file = json_path
                            break
                except:
                    pass

        if json_file:
            annotations, categories, images = parse_coco(json_file)
            preview['total_annotations'] = len(annotations)
            preview['categories'] = categories

            # 获取前几个样本
            for img_info in images[:max_samples]:
                img_annotations = [a for a in annotations if a['image_id'] == img_info['id']]
                preview['samples'].append({
                    'image': img_info['file_name'],
                    'image_id': img_info['id'],
                    'width': img_info.get('width'),
                    'height': img_info.get('height'),
                    'annotations': img_annotations
                })

    elif format_type == 'voc':
        # 查找VOC XML文件
        xml_dir = None
        for dir_name in ['Annotations', 'VOCAnnotations', 'annotations']:
            potential_dir = os.path.join(dataset_path, dir_name)
            if os.path.isdir(potential_dir):
                xml_dir = potential_dir
                break

        if xml_dir is None:
            # 检查根目录
            xml_files = [f for f in os.listdir(dataset_path) if f.endswith('.xml')]
            if xml_files:
                xml_dir = dataset_path

        if xml_dir:
            xml_files = [f for f in os.listdir(xml_dir) if f.endswith('.xml')][:max_samples]

            for xml_file in xml_files:
                xml_path = os.path.join(xml_dir, xml_file)
                annotations = parse_voc(xml_path)

                preview['samples'].append({
                    'annotation_file': xml_file,
                    'annotations': annotations
                })
                preview['total_annotations'] += len(annotations)

                for ann in annotations:
                    if ann['class_name'] not in preview['class_names']:
                        preview['class_names'].append(ann['class_name'])

    return preview
