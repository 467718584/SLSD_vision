"""
测试数据生成脚本
基于 Excel 文件生成示例数据集和模型
"""
import os
import json
import zipfile
import random
from PIL import Image, ImageDraw
from datetime import datetime

# 配置路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(BASE_DIR, 'data', 'datasets')
MODELS_DIR = os.path.join(BASE_DIR, 'data', 'models')


def create_sample_image(width=640, height=480, num_objects=3):
    """创建带有随机对象的示例图片"""
    img = Image.new('RGB', (width, height), color=(random.randint(100, 200), random.randint(100, 200), random.randint(100, 200)))
    draw = ImageDraw.Draw(img)

    bboxes = []
    for _ in range(num_objects):
        x1 = random.randint(0, width - 100)
        y1 = random.randint(0, height - 100)
        w = random.randint(50, 150)
        h = random.randint(50, 150)
        x2 = min(x1 + w, width)
        y2 = min(y1 + h, height)

        color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
        bboxes.append((x1, y1, x2, y2))

    return img, bboxes


def create_yolo_dataset(dataset_name, num_images, classes, description, date_str):
    """创建YOLO格式数据集"""
    dataset_dir = os.path.join(DATASETS_DIR, dataset_name)
    images_dir = os.path.join(dataset_dir, 'images')
    labels_dir = os.path.join(dataset_dir, 'labels')

    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(labels_dir, exist_ok=True)

    print(f"Creating YOLO dataset: {dataset_name}")

    for i in range(min(num_images, 10)):  # 限制最多10张图片
        img, bboxes = create_sample_image(num_objects=random.randint(1, len(classes)))
        img_filename = f"img_{i:04d}.jpg"
        img.save(os.path.join(images_dir, img_filename))

        label_filename = f"img_{i:04d}.txt"
        with open(os.path.join(labels_dir, label_filename), 'w') as f:
            width, height = img.size
            for bbox in bboxes:
                x1, y1, x2, y2 = bbox
                x_center = ((x1 + x2) / 2) / width
                y_center = ((y1 + y2) / 2) / height
                w = (x2 - x1) / width
                h = (y2 - y1) / height
                class_id = random.randint(0, len(classes) - 1)
                f.write(f"{class_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}\n")

    # 元数据
    metadata = {
        'name': dataset_name,
        'description': description,
        'created_at': date_str,
        'classes': classes,
        'image_count': num_images,
        'source': 'Excel data import'
    }
    with open(os.path.join(dataset_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"[OK] Dataset created: {dataset_name}")


def create_model(model_name, model_type, accuracy, description, dataset_name, date_str):
    """创建模型文件"""
    model_dir = os.path.join(MODELS_DIR, model_name)
    os.makedirs(model_dir, exist_ok=True)

    # 创建模拟模型文件
    model_data = b"MODEL_DATA_PLACEHOLDER" * random.randint(500, 2000)
    ext = 'pt' if model_type == 'yolo' else 'onnx' if model_type == 'onnx' else 'pkl'
    model_file = f"weights.{ext}"
    with open(os.path.join(model_dir, model_file), 'wb') as f:
        f.write(model_data)

    # 元数据
    metadata = {
        'name': model_name,
        'model_type': model_type,
        'accuracy': accuracy,
        'description': description,
        'dataset': dataset_name,
        'created_at': date_str,
        'filename': model_file,
        'source': 'Excel data import'
    }
    with open(os.path.join(model_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"[OK] Model created: {model_name}")


def generate_from_excel():
    """基于Excel数据生成测试数据"""

    # Excel中的数据集数据
    datasets_data = [
        {"name": "pools+dry-all+camera_yolo_dataset-292", "classes": ["pools", "dry_road"], "num_images": 292, "desc": "道路水面双标签数据集", "date": "2025-08-25"},
        {"name": "pools+dry-all+camera_yolo_dataset-459", "classes": ["pools", "dry_road", "object"], "num_images": 459, "desc": "道路水面三标签数据集", "date": "2025-08-25"},
        {"name": "pools+background+camera_yolo_dataset-459", "classes": ["pools"], "num_images": 459, "desc": "背景水面数据集", "date": "2025-08-25"},
        {"name": "pools+background+camera_yolo_dataset-1308", "classes": ["pools"], "num_images": 1308, "desc": "背景水面大数据集", "date": "2025-08-25"},
        {"name": "PFW_yolo_dataset-110", "classes": ["PFW"], "num_images": 110, "desc": "浮萍数据集", "date": "2025-08-25"},
        {"name": "PFW-bw_yolo_dataset-220", "classes": ["PFW"], "num_images": 220, "desc": "浮萍黑白增强数据集", "date": "2025-08-25"},
        {"name": "crack-seg_yolo_dataset-4000", "classes": ["crack"], "num_images": 4000, "desc": "裂缝分割数据集", "date": "2025-08-25"},
        {"name": "swimming_yolo-1694", "classes": ["swimming"], "num_images": 1694, "desc": "游泳检测数据集", "date": "2025-09-05"},
        {"name": "water_seg_yolo-1673", "classes": ["water"], "num_images": 1673, "desc": "水面分割数据集", "date": "2025-09-04"},
        {"name": "fishing_yolo-913", "classes": ["fishing"], "num_images": 913, "desc": "捕鱼检测数据集", "date": "2025-09-08"},
        {"name": "fire+smoke_yolo-1672", "classes": ["fire", "smoke"], "num_images": 1672, "desc": "火焰烟雾检测数据集", "date": "2025-09-08"},
        {"name": "water_seg_yolo-2770", "classes": ["water"], "num_images": 2770, "desc": "水面分割大数据集", "date": "2025-09-12"},
        {"name": "PFW_seg_yolo-615", "classes": ["PFW"], "num_images": 615, "desc": "浮萍分割数据集", "date": "2025-09-18"},
        {"name": "fishing-yolo-5243", "classes": ["fishing"], "num_images": 5243, "desc": "捕鱼大数据集", "date": "2025-09-24"},
        {"name": "boat_yolo-19571", "classes": ["boat"], "num_images": 19571, "desc": "船只检测大数据集", "date": "2025-09-26"},
        {"name": "vehicle_yolo-4418", "classes": ["car", "truck", "bus", "motorcycle", "bicycle"], "num_images": 4418, "desc": "车辆检测数据集", "date": "2025-10-13"},
        {"name": "license_yolo-2375", "classes": ["license"], "num_images": 2375, "desc": "车牌检测数据集", "date": "2025-10-27"},
        {"name": "license_CCPD2019_yolo-200000", "classes": ["license"], "num_images": 200000, "desc": "CCPD车牌大数据集", "date": "2025-10-27"},
        {"name": "license_license_yolo-23671", "classes": ["license"], "num_images": 23671, "desc": "车牌识别增强数据集", "date": "2025-11-03"},
        {"name": "rust_rust_yolo-1138", "classes": ["rust"], "num_images": 1138, "desc": "锈蚀检测数据集", "date": "2025-11-03"},
        {"name": "device-oil_oil_yolo-876", "classes": ["oil"], "num_images": 876, "desc": "设备油污检测数据集", "date": "2025-11-05"},
        {"name": "water-trash_trash_yolo-10013", "classes": ["trash", "plastic", "metal", "glass", "paper", "cloth", "fruit", "cigarette"], "num_images": 10013, "desc": "水面垃圾检测大数据集", "date": "2025-11-06"},
        {"name": "helmet_helmet_yolo-5201", "classes": ["helmet"], "num_images": 5201, "desc": "安全帽检测数据集", "date": "2025-11-03"},
    ]

    # Excel中的模型数据
    models_data = [
        {"name": "pools-dry_road-459-best-0837", "type": "yolo", "accuracy": 0.837, "desc": "道路水面双标签目标检测模型", "dataset": "pools+dry-all+camera_yolo_dataset-459", "date": "2025-08-25"},
        {"name": "pools-dry_road-459-best-0859", "type": "yolo", "accuracy": 0.859, "desc": "道路水面双标签目标检测模型v2", "dataset": "pools+dry-all+camera_yolo_dataset-459", "date": "2025-08-25"},
        {"name": "pools-dry_road-object-459-best-0961", "type": "yolo", "accuracy": 0.961, "desc": "道路水面三标签目标检测模型", "dataset": "pools+dry-all+object+camera_yolo_dataset-459", "date": "2025-08-25"},
        {"name": "pools-background-459-best-0826", "type": "yolo", "accuracy": 0.826, "desc": "背景水面目标检测模型", "dataset": "pools+background+camera_yolo_dataset-459", "date": "2025-08-25"},
        {"name": "pools-background-1308-best-0839", "type": "yolo", "accuracy": 0.839, "desc": "背景水面目标检测模型v2", "dataset": "pools+background+camera_yolo_dataset-1308", "date": "2025-08-25"},
        {"name": "PFW-110-best-0995", "type": "yolo", "accuracy": 0.995, "desc": "浮萍目标检测模型", "dataset": "PFW_yolo_dataset-110", "date": "2025-08-25"},
        {"name": "PFW-bw-220-best-0982", "type": "yolo", "accuracy": 0.982, "desc": "浮萍黑白增强目标检测模型", "dataset": "PFW-bw_yolo_dataset-220", "date": "2025-08-25"},
        {"name": "crack-seg-4000-best-0986", "type": "yolo", "accuracy": 0.986, "desc": "裂缝分割模型", "dataset": "crack-seg_yolo_dataset-4000", "date": "2025-08-25"},
        {"name": "swim-1694-best-0941", "type": "yolo", "accuracy": 0.941, "desc": "游泳检测目标模型", "dataset": "swimming_yolo-1694", "date": "2025-09-18"},
        {"name": "water_seg-1673-best-0719", "type": "yolo", "accuracy": 0.719, "desc": "水面分割模型", "dataset": "water_seg_yolo-1673", "date": "2025-09-11"},
        {"name": "fishing-913-best-0911", "type": "yolo", "accuracy": 0.911, "desc": "捕鱼检测目标模型", "dataset": "fishing_yolo-913", "date": "2025-09-18"},
        {"name": "fire+smoke-1672-best-0952", "type": "yolo", "accuracy": 0.952, "desc": "火焰烟雾双标签目标模型", "dataset": "fire+smoke_yolo-1672", "date": "2025-09-15"},
        {"name": "water_seg-2770-best-0895", "type": "yolo", "accuracy": 0.895, "desc": "水面分割模型v2", "dataset": "water_seg_yolo-2770", "date": "2025-09-15"},
        {"name": "PFW_seg-615-best-0914", "type": "yolo", "accuracy": 0.914, "desc": "浮萍分割模型", "dataset": "PFW_seg_yolo-615", "date": "2025-09-19"},
        {"name": "fishing-yolo-5243-best-0972", "type": "yolo", "accuracy": 0.972, "desc": "捕鱼检测大数据集模型", "dataset": "fishing-yolo-5243", "date": "2025-09-24"},
        {"name": "boat-19571-best-0961", "type": "yolo", "accuracy": 0.961, "desc": "船只检测大数据集模型", "dataset": "boat_yolo-19571", "date": "2025-09-26"},
        {"name": "vehicle-4418-best-0967", "type": "yolo", "accuracy": 0.967, "desc": "车辆检测多分类模型", "dataset": "vehicle_yolo-4418", "date": "2025-10-13"},
        {"name": "license-2375-best-0995", "type": "yolo", "accuracy": 0.995, "desc": "车牌检测模型", "dataset": "license_yolo-2375", "date": "2025-10-27"},
        {"name": "license_CCPD2019-200000-best-0995", "type": "yolo", "accuracy": 0.995, "desc": "CCPD车牌检测模型", "dataset": "license_CCPD2019_yolo-200000", "date": "2025-10-27"},
        {"name": "license-23671-best-0995", "type": "yolo", "accuracy": 0.995, "desc": "车牌识别增强模型", "dataset": "license_license_yolo-23671", "date": "2025-11-03"},
        {"name": "rust-1138-best-0412", "type": "yolo", "accuracy": 0.412, "desc": "锈蚀检测模型", "dataset": "rust_rust_yolo-1138", "date": "2025-11-03"},
        {"name": "device-oil-876-best-0158", "type": "yolo", "accuracy": 0.158, "desc": "设备油污检测模型", "dataset": "device-oil_oil_yolo-876", "date": "2025-11-05"},
        {"name": "water-trash-10013-best-0424", "type": "yolo", "accuracy": 0.424, "desc": "水面垃圾多分类模型", "dataset": "water-trash_trash_yolo-10013", "date": "2025-11-06"},
        {"name": "helmet-5201-best-0925", "type": "yolo", "accuracy": 0.925, "desc": "安全帽检测模型", "dataset": "helmet_helmet_yolo-5201", "date": "2025-11-03"},
    ]

    print("=" * 60)
    print("Generating test data from Excel...")
    print("=" * 60)

    # 创建目录
    os.makedirs(DATASETS_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)

    # 创建数据集
    print("\n--- Creating Datasets ---")
    for ds in datasets_data:
        create_yolo_dataset(
            ds["name"],
            ds["num_images"],
            ds["classes"],
            ds["desc"],
            ds["date"]
        )

    # 创建模型
    print("\n--- Creating Models ---")
    for m in models_data:
        create_model(
            m["name"],
            m["type"],
            m["accuracy"],
            m["desc"],
            m["dataset"],
            m["date"]
        )

    print("\n" + "=" * 60)
    print("Test data generation completed!")
    print(f"Datasets: {len(datasets_data)}")
    print(f"Models: {len(models_data)}")
    print("=" * 60)


if __name__ == "__main__":
    generate_from_excel()
