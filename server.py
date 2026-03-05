"""
Flask服务器 - 直接加载参考HTML并注入数据库数据
"""
import os
import uuid
import json
from datetime import datetime
from flask import Flask, render_template_string, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from modules.database import (
    init_database, get_all_datasets, get_all_models,
    get_dataset_by_name, get_model_by_name,
    search_datasets, search_models,
    get_dataset_stats, get_model_stats,
    get_algo_types, get_algo_names,
    add_dataset, add_model, delete_dataset_by_name, delete_model_by_name,
    get_connection
)
from modules.dataset_manager import get_dataset_images
from modules.storage import format_size
from modules.model_manager import get_model_files
from config import DATASETS_DIR, MODELS_DIR

app = Flask(__name__)

# 配置上传文件大小限制为5GB
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024 * 1024

# 文件上传数量限制
MAX_FILES_PER_UPLOAD = 1000


@app.errorhandler(RequestEntityTooLarge)
def handle_large_file(error):
    """处理文件过大错误"""
    return jsonify({"success": False, "error": "文件过大，超过服务器限制（5GB）"}), 413

# 初始化数据库
init_database()


def dict_to_js(obj, indent=0):
    """将Python对象转换为JavaScript对象字面量格式"""
    # 注意：bool 必须在 int 之前检查，因为 bool 是 int 的子类
    if isinstance(obj, bool):
        return "true" if obj else "false"
    elif isinstance(obj, dict):
        if not obj:
            return "{}"
        items = []
        for k, v in obj.items():
            # 键必须总是用引号包裹，以避免解析错误
            key_str = str(k)
            # 转义键中的特殊字符
            key_escaped = key_str.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
            items.append(f'"{key_escaped}": {dict_to_js(v, indent + 1)}')
        return "{" + ", ".join(items) + "}"
    elif isinstance(obj, list):
        if not obj:
            return "[]"
        items = [dict_to_js(item, indent + 1) for item in obj]
        return "[" + ", ".join(items) + "]"
    elif isinstance(obj, str):
        # 转义特殊字符
        escaped = obj.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
        return f'"{escaped}"'
    elif isinstance(obj, (int, float)):
        return str(obj)
    elif obj is None:
        return "null"
    else:
        return f'"{obj}"'


def load_reference_html():
    """加载HTML模板"""
    import os
    # 使用带上传功能的预览版模板
    html_path = os.path.join(os.path.dirname(__file__), '参考资料', 'vision-platform-preview.html')
    if os.path.exists(html_path):
        with open(html_path, 'r', encoding='utf-8') as f:
            return f.read()
    return None


@app.route('/')
def index():
    """主页 - 加载参考HTML并注入数据"""
    html_content = load_reference_html()
    if not html_content:
        return "<h1>参考HTML文件未找到</h1>", 404

    # 获取所有数据
    datasets = get_all_datasets()
    models = get_all_models()

    # 检查数据集是否有上传的文件
    def check_dataset_files(name):
        """检查数据集是否有上传的文件"""
        dataset_path = os.path.join(DATASETS_DIR, name)
        has_folder = os.path.exists(dataset_path) and os.path.isdir(dataset_path)
        # 检查是否有ZIP文件
        has_zip = os.path.exists(os.path.join(dataset_path, f"{name}.zip"))
        return {
            "hasFolder": has_folder,
            "hasZip": has_zip
        }

    # 准备数据集数据
    datasets_data = []
    for ds in datasets:
        labels = ds.get('labels', {})
        # 处理标签数据
        labels_processed = {}
        for k, v in labels.items():
            labels_processed[k] = v if isinstance(v, int) else "-"

        # 检查文件状态
        file_status = check_dataset_files(ds.get('name', ''))

        # 处理class_info
        class_info = ds.get('class_info', {})
        class_info_processed = {}
        for k, v in class_info.items():
            if isinstance(v, dict):
                # 新格式: {"name": "crack", "count": 100}
                class_info_processed[k] = {"name": v.get("name", f"类{k}"), "count": v.get("count", 0)}
            elif isinstance(v, int):
                # 旧格式: 100
                class_info_processed[k] = {"name": f"类{k}", "count": v}
            else:
                class_info_processed[k] = {"name": "-", "count": 0}

        datasets_data.append({
            "id": ds.get('id', 0),
            "algoType": ds.get('algo_type', ''),
            "techMethod": ds.get('tech_method', '目标检测算法'),
            "name": ds.get('name', ''),
            "split": ds.get('split', '8:2'),
            "total": ds.get('total', 0),
            "labelCount": ds.get('label_count', 0),
            "labels": labels_processed,
            "desc": ds.get('description', '').replace('\n', ' ').replace('\r', ' '),
            "maintainDate": ds.get('maintain_date', ''),
            "maintainer": ds.get('maintainer', ''),
            "previewCount": ds.get('preview_count', 8),
            # 新增字段
            "storageType": ds.get('storage_type', 'folder'),
            "annotationType": ds.get('annotation_type', 'yolo'),
            "splitRatio": ds.get('split_ratio', '8.0:2.0:0.0'),
            "hasTest": bool(ds.get('has_test', 0)),
            "bgCountTrain": ds.get('bg_count_train', 0),
            "bgCountVal": ds.get('bg_count_val', 0),
            "bgCountTest": ds.get('bg_count_test', 0),
            "bgCountTotal": ds.get('bg_count_total', 0),
            "imgCountTrain": ds.get('img_count_train', 0),
            "imgCountVal": ds.get('img_count_val', 0),
            "imgCountTest": ds.get('img_count_test', 0),
            "classInfo": class_info_processed,
            # 使用 JavaScript 布尔值格式
            "hasFolder": file_status["hasFolder"],
            "hasZip": file_status["hasZip"]
        })

    # 准备模型数据
    models_data = []
    for m in models:
        models_data.append({
            "id": m.get('id', 0),
            "algoName": m.get('algo_name', ''),
            "name": m.get('name', ''),
            "category": m.get('category', ''),
            "accuracy": m.get('accuracy', 0),
            "desc": m.get('description', ''),
            "dataset": m.get('dataset', ''),
            "maintainDate": m.get('maintain_date', ''),
            "maintainer": m.get('maintainer', ''),
            "previewCount": m.get('preview_count', 8)
        })

    # 将Python数据转换为JavaScript格式并注入
    js_datasets = dict_to_js(datasets_data)
    js_models = dict_to_js(models_data)

    # 替换DATASETS数组
    import re
    # 先尝试匹配增强版格式 DATASETS=[xxx];
    if 'DATASETS_PLACEHOLDER' in html_content:
        html_content = html_content.replace('DATASETS_PLACEHOLDER', js_datasets)
    else:
        # 原版格式 const DATASETS=[...];
        html_content = re.sub(
            r'const DATASETS=\[.*?\];',
            f'const DATASETS={js_datasets};',
            html_content,
            flags=re.DOTALL
        )

    # 替换MODELS数组
    if 'MODELS_PLACEHOLDER' in html_content:
        html_content = html_content.replace('MODELS_PLACEHOLDER', js_models)
    else:
        html_content = re.sub(
            r'const MODELS=\[.*?\];',
            f'const MODELS={js_models};',
            html_content,
            flags=re.DOTALL
        )

    # 添加 "其他" 到 ALGO_COLORS 如果不存在
    # 注意：需要检查ALGO_COLORS中是否有"其他"，而不是检查整个HTML（因为数据中可能有"其他"）
    algo_colors_match = re.search(r'const ALGO_COLORS=({[^}]+})', html_content)
    if algo_colors_match:
        algo_colors_str = algo_colors_match.group(1)
        if '"其他"' not in algo_colors_str:
            html_content = html_content.replace(
                '"游泳检测":{bg:"#FDE9E9"',
                '"其他":{bg:C.gray6,border:C.border,text:C.gray2},"游泳检测":{bg:"#FDE9E9"'
            )

    # 添加默认 MODEL_CAT_COLORS 如果不存在
    model_cat_match = re.search(r'const MODEL_CAT_COLORS=({[^}]+})', html_content)
    if model_cat_match:
        model_cat_str = model_cat_match.group(1)
        if '"YOLO"' not in model_cat_str:
            html_content = html_content.replace(
                'const MODEL_CAT_COLORS={',
                'const MODEL_CAT_COLORS={"其他":{bg:C.gray6,border:C.border,text:C.gray2},"YOLO":{bg:C.primaryBg,border:C.primaryBd,text:C.primary},'
            )

    return html_content


# ==================== 设置API ====================

@app.route('/api/settings')
def get_settings():
    """获取系统设置"""
    from modules.database import get_settings
    settings = get_settings()
    return jsonify(settings)


@app.route('/api/settings', methods=['POST'])
def update_settings():
    """更新系统设置"""
    from modules.database import update_settings

    data = request.json or {}

    algo_types = data.get('algoTypes')
    tech_methods = data.get('techMethods')
    annotation_types = data.get('annotationTypes')

    if algo_types is None and tech_methods is None and annotation_types is None:
        return jsonify({"success": False, "error": "没有要更新的内容"}), 400

    try:
        update_settings(algo_types, tech_methods, annotation_types)
        return jsonify({"success": True, "message": "设置已更新"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/dataset/validate-name', methods=['POST'])
def validate_dataset_name():
    """检查数据集名称是否已存在"""
    data = request.json
    name = data.get('name', '').strip()

    if not name:
        return jsonify({"exists": False, "storage_type": None})

    existing = get_dataset_by_name(name)
    if existing:
        return jsonify({
            "exists": True,
            "storage_type": existing.get('storage_type', 'folder')
        })
    return jsonify({"exists": False, "storage_type": None})


@app.route('/api/datasets')
def api_datasets():
    """数据集API"""
    query = request.args.get('q', '')
    algo_type = request.args.get('type', '')

    if query or (algo_type and algo_type != '全部'):
        datasets = search_datasets(query, algo_type if algo_type != '全部' else None)
    else:
        datasets = get_all_datasets()

    # 处理数据集数据，转换class_info格式
    def check_dataset_files(name):
        dataset_path = os.path.join(DATASETS_DIR, name)
        has_folder = os.path.exists(dataset_path) and os.path.isdir(dataset_path)
        has_zip = os.path.exists(os.path.join(dataset_path, f"{name}.zip"))
        return {"hasFolder": has_folder, "hasZip": has_zip}

    datasets_data = []
    for ds in datasets:
        # 处理labels
        labels = ds.get('labels', {})
        labels_processed = {}
        for k, v in labels.items():
            labels_processed[k] = v if isinstance(v, int) else "-"

        # 处理class_info
        class_info = ds.get('class_info', {})
        class_info_processed = {}
        for k, v in class_info.items():
            if isinstance(v, dict):
                class_info_processed[k] = {"name": v.get("name", f"类{k}"), "count": v.get("count", 0)}
            elif isinstance(v, int):
                class_info_processed[k] = {"name": f"类{k}", "count": v}
            else:
                class_info_processed[k] = {"name": "-", "count": 0}

        file_status = check_dataset_files(ds.get('name', ''))

        datasets_data.append({
            "id": ds.get('id', 0),
            "algoType": ds.get('algo_type', ''),
            "techMethod": ds.get('tech_method', '目标检测算法'),
            "name": ds.get('name', ''),
            "split": ds.get('split', '8:2'),
            "total": ds.get('total', 0),
            "labelCount": ds.get('label_count', 0),
            "labels": labels_processed,
            "desc": ds.get('description', '').replace('\n', ' ').replace('\r', ' '),
            "maintainDate": ds.get('maintain_date', ''),
            "maintainer": ds.get('maintainer', ''),
            "previewCount": ds.get('preview_count', 8),
            "storageType": ds.get('storage_type', 'folder'),
            "annotationType": ds.get('annotation_type', 'yolo'),
            "splitRatio": ds.get('split_ratio', '8.0:2.0:0.0'),
            "hasTest": bool(ds.get('has_test', 0)),
            "bgCountTrain": ds.get('bg_count_train', 0),
            "bgCountVal": ds.get('bg_count_val', 0),
            "bgCountTest": ds.get('bg_count_test', 0),
            "bgCountTotal": ds.get('bg_count_total', 0),
            "imgCountTrain": ds.get('img_count_train', 0),
            "imgCountVal": ds.get('img_count_val', 0),
            "imgCountTest": ds.get('img_count_test', 0),
            "classInfo": class_info_processed,
            "hasFolder": file_status["hasFolder"],
            "hasZip": file_status["hasZip"]
        })

    return jsonify(datasets_data)


@app.route('/api/models')
def api_models():
    """模型API"""
    query = request.args.get('q', '')
    algo_name = request.args.get('name', '')

    if query or (algo_name and algo_name != '全部'):
        models = search_models(query, algo_name if algo_name != '全部' else None)
    else:
        models = get_all_models()

    return jsonify(models)


@app.route('/api/stats')
def api_stats():
    """统计API"""
    ds_stats = get_dataset_stats()
    m_stats = get_model_stats()
    return jsonify({
        "datasets": ds_stats,
        "models": m_stats
    })


# ==================== YOLO格式校验函数 ====================

def count_yolo_classes(dataset_dir):
    """统计YOLO数据集中的类别信息"""
    class_counts = {}
    labels_dir = os.path.join(dataset_dir, 'labels')

    if not os.path.exists(labels_dir):
        return {}

    # 首先检查是否有标准的train/val/test子目录
    has_subdirs = any(os.path.isdir(os.path.join(labels_dir, subset)) for subset in ['train', 'val', 'test'])

    if has_subdirs:
        # 标准YOLO结构：有train/val/test子目录
        for subset in ['train', 'val', 'test']:
            lbl_subset = os.path.join(labels_dir, subset)
            if os.path.exists(lbl_subset) and os.path.isdir(lbl_subset):
                for f in os.listdir(lbl_subset):
                    if f.endswith('.txt'):
                        try:
                            with open(os.path.join(lbl_subset, f), 'r', encoding='utf-8', errors='ignore') as lf:
                                for line in lf:
                                    line = line.strip()
                                    if line:
                                        parts = line.split()
                                        if len(parts) >= 5:
                                            cls_id = parts[0]
                                            class_counts[cls_id] = class_counts.get(cls_id, 0) + 1
                        except:
                            pass
    else:
        # 非标准结构：直接在labels目录下有txt文件
        for f in os.listdir(labels_dir):
            if f.endswith('.txt'):
                try:
                    with open(os.path.join(labels_dir, f), 'r', encoding='utf-8', errors='ignore') as lf:
                        for line in lf:
                            line = line.strip()
                            if line:
                                parts = line.split()
                                if len(parts) >= 5:
                                    cls_id = parts[0]
                                    class_counts[cls_id] = class_counts.get(cls_id, 0) + 1
                except:
                    pass

    # 构建类别信息，按类别ID排序
    class_info = {}
    for cls_id in sorted(class_counts.keys(), key=lambda x: int(x) if x.isdigit() else 0):
        class_info[cls_id] = class_counts[cls_id]

    return class_info


def validate_yolo_format(dataset_dir, annotation_type='yolo'):
    """
    YOLO格式校验 (4步)
    返回: (success, message, validation_data)
    """
    from config import SUPPORTED_IMAGE_FORMATS

    validation_data = {
        'step1_structure': False,
        'step2_image_counts': {},
        'step3_bg_counts': {},
        'step4_classes': {}
    }

    # 第一步：文件夹结构检测
    images_dir = os.path.join(dataset_dir, 'images')
    labels_dir = os.path.join(dataset_dir, 'labels')

    if not os.path.exists(images_dir) or not os.path.isdir(images_dir):
        return False, "缺少 images 文件夹", validation_data
    if not os.path.exists(labels_dir) or not os.path.isdir(labels_dir):
        return False, "缺少 labels 文件夹", validation_data

    # 检查子文件夹
    required_subsets = ['train', 'val']
    optional_subsets = ['test']
    has_test = False

    for subset in required_subsets:
        img_subset = os.path.join(images_dir, subset)
        lbl_subset = os.path.join(labels_dir, subset)
        if not os.path.exists(img_subset) or not os.path.isdir(img_subset):
            return False, f"缺少 images/{subset} 文件夹", validation_data
        if not os.path.exists(lbl_subset) or not os.path.isdir(lbl_subset):
            return False, f"缺少 labels/{subset} 文件夹", validation_data

    for subset in optional_subsets:
        img_subset = os.path.join(images_dir, subset)
        lbl_subset = os.path.join(labels_dir, subset)
        if os.path.exists(img_subset) and os.path.isdir(img_subset):
            if os.path.exists(lbl_subset) and os.path.isdir(lbl_subset):
                has_test = True

    validation_data['step1_structure'] = True
    validation_data['has_test'] = has_test

    # 第二步：统计图片数量
    img_count_train = 0
    img_count_val = 0
    img_count_test = 0

    for subset, count_ref in [('train', lambda: img_count_train), ('val', lambda: img_count_val), ('test', lambda: img_count_test)]:
        img_subset = os.path.join(images_dir, subset)
        if os.path.exists(img_subset):
            for f in os.listdir(img_subset):
                if any(f.lower().endswith(ext) for ext in SUPPORTED_IMAGE_FORMATS):
                    if subset == 'train':
                        img_count_train += 1
                    elif subset == 'val':
                        img_count_val += 1
                    else:
                        img_count_test += 1

    validation_data['step2_image_counts'] = {
        'train': img_count_train,
        'val': img_count_val,
        'test': img_count_test
    }

    # 计算划分比例
    total = img_count_train + img_count_val + img_count_test
    if total > 0:
        train_ratio = (img_count_train / total) * 10
        val_ratio = (img_count_val / total) * 10
        test_ratio = (img_count_test / total) * 10
        split_ratio = f"{train_ratio:.1f}:{val_ratio:.1f}:{test_ratio:.1f}"
    else:
        split_ratio = "0.0:0.0:0.0"

    validation_data['split_ratio'] = split_ratio

    # 第三步：计算背景图片数量
    bg_count_train = 0
    bg_count_val = 0
    bg_count_test = 0
    total_labels = 0

    for subset, bg_ref in [('train', lambda: bg_count_train), ('val', lambda: bg_count_val), ('test', lambda: bg_count_test)]:
        lbl_subset = os.path.join(labels_dir, subset)
        if os.path.exists(lbl_subset):
            label_files = [f for f in os.listdir(lbl_subset) if f.endswith('.txt')]
            img_subset = os.path.join(images_dir, subset)
            img_count = 0
            if os.path.exists(img_subset):
                img_count = len([f for f in os.listdir(img_subset) if any(f.lower().endswith(ext) for ext in SUPPORTED_IMAGE_FORMATS)])

            label_count = len(label_files)
            total_labels += label_count

            bg = img_count - label_count
            if bg < 0:
                bg = 0

            if subset == 'train':
                bg_count_train = bg
            elif subset == 'val':
                bg_count_val = bg
            else:
                bg_count_test = bg

    validation_data['step3_bg_counts'] = {
        'train': bg_count_train,
        'val': bg_count_val,
        'test': bg_count_test,
        'total': bg_count_train + bg_count_val + bg_count_test
    }

    # 第四步：统计类别数量
    class_counts = {}
    for subset in ['train', 'val', 'test']:
        lbl_subset = os.path.join(labels_dir, subset)
        if os.path.exists(lbl_subset):
            for f in os.listdir(lbl_subset):
                if f.endswith('.txt'):
                    try:
                        with open(os.path.join(lbl_subset, f), 'r', encoding='utf-8', errors='ignore') as lf:
                            for line in lf:
                                line = line.strip()
                                if line:
                                    parts = line.split()
                                    if len(parts) >= 5:
                                        cls_id = parts[0]
                                        class_counts[cls_id] = class_counts.get(cls_id, 0) + 1
                    except:
                        pass

    # 构建类别信息
    class_info = {}
    for cls_id in sorted(class_counts.keys(), key=lambda x: int(x) if x.isdigit() else 0):
        class_info[cls_id] = class_counts[cls_id]

    validation_data['step4_classes'] = class_info
    validation_data['class_info'] = class_info
    validation_data['label_count'] = total_labels

    return True, "校验通过", validation_data


# ==================== 数据集上传API ====================

@app.route('/api/dataset/upload', methods=['POST'])
def upload_dataset():
    """上传数据集"""
    upload_mode = request.form.get('uploadMode', 'zip')
    dataset_name = request.form.get('name', '').strip()
    algo_type = request.form.get('algoType', '其他')
    tech_method = request.form.get('techMethod', '目标检测算法')
    description = request.form.get('description', '')
    maintainer = request.form.get('maintainer', '管理员')
    annotation_type = request.form.get('annotationType', 'yolo')

    try:
        dataset_dir = os.path.join(DATASETS_DIR, dataset_name)
        os.makedirs(dataset_dir, exist_ok=True)

        if upload_mode == 'folder':
            # 文件夹上传
            files = request.files.getlist('files')
            if not files or len(files) == 0:
                return jsonify({"success": False, "error": "没有上传文件"}), 400

            # 检查文件数量
            if len(files) > MAX_FILES_PER_UPLOAD:
                return jsonify({
                    "success": False,
                    "error": f"文件数量超过限制（最多{MAX_FILES_PER_UPLOAD}个文件）。建议使用ZIP压缩包方式上传，或将数据集分成多个部分上传。"
                }), 400

            if not dataset_name:
                dataset_name = f"dataset_{datetime.now().strftime('%Y%m%d%H%M%S')}"

            import shutil
            for f in files:
                if f.filename:
                    relative_path = f.filename
                    if hasattr(f, 'webkitRelativePath') and f.webkitRelativePath:
                        relative_path = f.webkitRelativePath
                    parts = relative_path.split('/')
                    if len(parts) > 1:
                        relative_path = '/'.join(parts[1:])
                    if relative_path:
                        target_path = os.path.join(dataset_dir, relative_path)
                        os.makedirs(os.path.dirname(target_path), exist_ok=True)
                        f.save(target_path)
        else:
            # ZIP上传
            if 'file' not in request.files:
                return jsonify({"success": False, "error": "没有上传文件"}), 400

            file = request.files['file']
            if not dataset_name:
                dataset_name = secure_filename(file.filename).replace('.zip', '')
                if not dataset_name:
                    dataset_name = f"dataset_{datetime.now().strftime('%Y%m%d%H%M%S')}"

            if file.filename == '':
                return jsonify({"success": False, "error": "没有选择文件"}), 400

            filename = secure_filename(file.filename)
            if filename.endswith('.zip'):
                import zipfile
                zip_path = os.path.join(dataset_dir, filename)
                file.save(zip_path)

                extract_dir = os.path.join(dataset_dir, 'temp_extract')
                os.makedirs(extract_dir, exist_ok=True)

                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)

                import shutil
                for item in os.listdir(extract_dir):
                    src = os.path.join(extract_dir, item)
                    dst = os.path.join(dataset_dir, item)
                    if os.path.exists(dst):
                        if os.path.isdir(dst):
                            shutil.rmtree(dst)
                        else:
                            os.remove(dst)
                    shutil.move(src, dst)

                # 保留ZIP文件用于下载，只删除解压目录
                shutil.rmtree(extract_dir)
            else:
                file.save(os.path.join(dataset_dir, filename))

        # 判断存储类型
        storage_type = 'folder' if upload_mode == 'folder' else 'zip'

        # 获取是否跳过YOLO校验
        skip_validation = request.form.get('skipValidation', 'false').lower() == 'true'

        # 如果是YOLO格式，进行4步校验
        validation_result = None
        if annotation_type == 'yolo' and not skip_validation:
            success, msg, validation_result = validate_yolo_format(dataset_dir, annotation_type)
            if not success:
                # 删除已创建的目录
                import shutil
                if os.path.exists(dataset_dir):
                    shutil.rmtree(dataset_dir)
                return jsonify({"success": False, "error": f"YOLO格式校验失败: {msg}"}), 400

        # 统计图片数量（排除vis目录）
        from config import SUPPORTED_IMAGE_FORMATS
        image_count = 0
        labels = {}
        for root, dirs, files in os.walk(dataset_dir):
            # 跳过vis目录
            if 'vis' in dirs:
                dirs.remove('vis')
            for f in files:
                if any(f.lower().endswith(ext) for ext in SUPPORTED_IMAGE_FORMATS):
                    image_count += 1
                # 统计标注文件
                if f.endswith('.txt'):
                    label_name = f.replace('.txt', '')
                    with open(os.path.join(root, f), 'r', encoding='utf-8', errors='ignore') as lf:
                        lines = len(lf.readlines())
                        labels[label_name] = lines

        # 统计类别信息（即使跳过YOLO校验也需要统计）
        class_info = {}
        if annotation_type == 'yolo':
            class_info = count_yolo_classes(dataset_dir)

        # 准备校验数据
        split_ratio = "8.0:2.0:0.0"
        has_test = False
        bg_count_train = 0
        bg_count_val = 0
        bg_count_test = 0
        bg_count_total = 0
        img_count_train = 0
        img_count_val = 0
        img_count_test = 0

        # 如果有validation_result，覆盖从统计函数得到的结果
        if validation_result:
            split_ratio = validation_result.get('split_ratio', "8.0:2.0:0.0")
            has_test = validation_result.get('has_test', False)
            bg_counts = validation_result.get('step3_bg_counts', {})
            bg_count_train = bg_counts.get('train', 0)
            bg_count_val = bg_counts.get('val', 0)
            bg_count_test = bg_counts.get('test', 0)
            bg_count_total = bg_counts.get('total', 0)
            img_counts = validation_result.get('step2_image_counts', {})
            img_count_train = img_counts.get('train', 0)
            img_count_val = img_counts.get('val', 0)
            img_count_test = img_counts.get('test', 0)
            class_info = validation_result.get('class_info', {})

        # 保存元数据
        metadata = {
            "name": dataset_name,
            "algo_type": algo_type,
            "tech_method": tech_method,
            "description": description,
            "split": split_ratio,
            "total": image_count,
            "label_count": len(labels),
            "labels": labels,
            "maintain_date": datetime.now().strftime('%Y/%m/%d'),
            "maintainer": maintainer,
            "preview_count": 8,
            "storage_type": storage_type,
            "annotation_type": annotation_type,
            "split_ratio": split_ratio,
            "has_test": has_test,
            "bg_count_train": bg_count_train,
            "bg_count_val": bg_count_val,
            "bg_count_test": bg_count_test,
            "bg_count_total": bg_count_total,
            "img_count_train": img_count_train,
            "img_count_val": img_count_val,
            "img_count_test": img_count_test,
            "class_info": class_info
        }

        with open(os.path.join(dataset_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        # 保存到数据库
        add_dataset({
            'name': dataset_name,
            'algo_type': algo_type,
            'tech_method': tech_method,
            'description': description,
            'split': split_ratio,
            'total': image_count,
            'label_count': len(labels),
            'labels': labels,
            'maintain_date': datetime.now().strftime('%Y/%m/%d'),
            'maintainer': maintainer,
            'storage_type': storage_type,
            'annotation_type': annotation_type,
            'split_ratio': split_ratio,
            'has_test': has_test,
            'bg_count_train': bg_count_train,
            'bg_count_val': bg_count_val,
            'bg_count_test': bg_count_test,
            'bg_count_total': bg_count_total,
            'img_count_train': img_count_train,
            'img_count_val': img_count_val,
            'img_count_test': img_count_test,
            'class_info': class_info
        })

        # 生成可视化图片
        from modules.dataset_manager import visualize_dataset
        try:
            # 提取类别名称
            class_names = {}
            for k, v in class_info.items():
                if isinstance(v, dict):
                    class_names[k] = v.get('name', f'class_{k}')
                else:
                    class_names[k] = f'class_{k}'
            visualize_dataset(dataset_name, class_names)
            # 生成详情图和分布图
            from modules.dataset_manager import generate_dataset_charts
            try:
                generate_dataset_charts(dataset_name, class_info)
            except Exception as chart_err:
                print(f"生成图表时出错: {chart_err}")
        except Exception as e:
            print(f"生成可视化图片时出错: {e}")

        return jsonify({
            "success": True,
            "message": "数据集上传成功",
            "dataset": metadata,
            "validation": validation_result
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/dataset/<name>/images')
def dataset_images(name):
    """获取数据集图片"""
    images = get_dataset_images(name, max_images=50)
    # 转换为相对路径供前端访问
    base_dir = os.path.dirname(os.path.dirname(__file__))
    relative_paths = []
    for img in images:
        rel_path = os.path.relpath(img, base_dir)
        # 替换反斜杠为正斜杠
        relative_paths.append(rel_path.replace('\\', '/'))

    return jsonify({
        "name": name,
        "images": relative_paths,
        "count": len(relative_paths)
    })


@app.route('/api/dataset/<name>/split-images')
def dataset_split_images(name):
    """获取数据集按split分类的图片（训练集、验证集、测试集）"""
    from modules.dataset_manager import get_dataset_split_images

    split_images = get_dataset_split_images(name, max_per_split=8)

    # 转换为相对路径供前端访问
    base_dir = os.path.dirname(os.path.dirname(__file__))
    result = {}

    for split, images in split_images.items():
        relative_paths = []
        for img in images:
            rel_path = os.path.relpath(img, base_dir)
            relative_paths.append(rel_path.replace('\\', '/'))
        result[split] = relative_paths

    return jsonify({
        "name": name,
        "train": result.get('train', []),
        "val": result.get('val', []),
        "test": result.get('test', [])
    })


@app.route('/api/dataset/<name>/charts')
def dataset_charts(name):
    """获取数据集的详情图和分布图"""
    dataset_dir = os.path.join(DATASETS_DIR, name)

    if not os.path.exists(dataset_dir):
        return jsonify({"detail": None, "distribution": None})

    charts_dir = os.path.join(dataset_dir, 'charts')
    base_dir = os.path.dirname(os.path.dirname(__file__))

    detail_path = os.path.join(charts_dir, 'detail.png')
    dist_path = os.path.join(charts_dir, 'distribution.png')

    result = {
        "detail": None,
        "distribution": None
    }

    if os.path.exists(detail_path):
        rel_path = os.path.relpath(detail_path, base_dir)
        result["detail"] = rel_path.replace('\\', '/')

    if os.path.exists(dist_path):
        rel_path = os.path.relpath(dist_path, base_dir)
        result["distribution"] = rel_path.replace('\\', '/')

    return jsonify(result)


@app.route('/api/dataset/<name>/chart-upload', methods=['POST'])
def upload_dataset_chart(name):
    """上传/更新数据集的图表文件"""
    dataset_dir = os.path.join(DATASETS_DIR, name)

    if not os.path.exists(dataset_dir):
        return jsonify({"success": False, "error": "数据集不存在"}), 404

    chart_type = request.form.get('type', 'detail')
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "没有文件"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "文件名为空"}), 400

    # 创建charts目录
    charts_dir = os.path.join(dataset_dir, 'charts')
    os.makedirs(charts_dir, exist_ok=True)

    # 保存文件
    filename = 'detail.png' if chart_type == 'detail' else 'distribution.png'
    file_path = os.path.join(charts_dir, filename)
    file.save(file_path)

    return jsonify({"success": True, "path": file_path})


@app.route('/api/dataset/<name>', methods=['DELETE'])
def delete_dataset(name):
    """删除数据集"""
    try:
        # 删除文件
        dataset_dir = os.path.join(DATASETS_DIR, name)
        if os.path.exists(dataset_dir):
            import shutil
            shutil.rmtree(dataset_dir)

        # 删除数据库记录
        delete_dataset_by_name(name)

        return jsonify({"success": True, "message": "数据集已删除"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/dataset/<name>', methods=['PUT'])
def update_dataset(name):
    """更新数据集信息"""
    try:
        data = request.json or {}
        algo_type = data.get('algoType')
        tech_method = data.get('techMethod')

        conn = get_connection()
        cursor = conn.cursor()

        updates = []
        params = []

        if algo_type is not None:
            updates.append("algo_type = ?")
            params.append(algo_type)
        if tech_method is not None:
            updates.append("tech_method = ?")
            params.append(tech_method)

        if not updates:
            return jsonify({"success": False, "error": "没有要更新的内容"}), 400

        params.append(name)
        cursor.execute(f"UPDATE datasets SET {', '.join(updates)} WHERE name = ?", params)
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "数据集已更新"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/dataset/<name>/download')
def download_dataset(name):
    """下载数据集压缩包"""
    try:
        dataset_dir = os.path.join(DATASETS_DIR, name)
        if not os.path.exists(dataset_dir):
            return jsonify({"success": False, "error": "数据集不存在"}), 404

        # 查找ZIP文件
        zip_files = [f for f in os.listdir(dataset_dir) if f.endswith('.zip')]

        if not zip_files:
            return jsonify({"success": False, "error": "没有可下载的压缩包"}), 404

        # 返回第一个找到的ZIP文件信息
        zip_file = zip_files[0]
        zip_path = os.path.join(dataset_dir, zip_file)
        file_size = os.path.getsize(zip_path)

        return jsonify({
            "success": True,
            "filename": zip_file,
            "size": file_size,
            "size_formatted": format_size(file_size),
            "download_url": f"/data/datasets/{name}/{zip_file}"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/dataset/<name>/class-info', methods=['POST'])
def update_class_info(name):
    """更新数据集的类别信息"""
    try:
        data = request.json
        new_class_names = data.get('classInfo', {})

        # 获取现有数据集
        ds = get_dataset_by_name(name)
        if not ds:
            return jsonify({"success": False, "error": "数据集不存在"}), 404

        # 获取现有的class_info（包含数量）
        existing_class_info = ds.get('class_info', {})

        # 检查是否需要重新计算类别数量
        # 如果现有class_info为空或只有数字（旧格式），需要重新计算
        needs_recalc = False
        if not existing_class_info:
            needs_recalc = True
        else:
            # 检查是否所有值都是数字（旧格式）
            try:
                needs_recalc = all(isinstance(v, int) for v in existing_class_info.values())
            except:
                needs_recalc = True

        # 如果需要重新计算，从labels目录获取
        if needs_recalc:
            dataset_dir = os.path.join(DATASETS_DIR, name)
            try:
                existing_class_info = count_yolo_classes(dataset_dir)
            except:
                existing_class_info = {}
            # 转换为新格式
            existing_class_info = {k: v for k, v in existing_class_info.items()}

        # 合并新名称与现有数量
        # 格式: {"0": {"name": "crack", "count": 100}, "1": {"name": "person", "count": 50}}
        merged_class_info = {}
        for k, v in existing_class_info.items():
            # 现有格式可能是 {"0": 100, "1": 50} 或 {"0": {"name": "x", "count": 100}}
            if isinstance(v, dict):
                count = v.get('count', 0)
            else:
                count = v if isinstance(v, int) else 0

            # 获取新名称，如果没有则使用默认名称
            new_name = new_class_names.get(k, f"类{k}")
            merged_class_info[k] = {"name": new_name, "count": count}

        # 同步更新metadata.json中的labels字段
        labels_list = [merged_class_info[k]["name"] for k in sorted(merged_class_info.keys())]

        # 更新数据库
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE datasets SET class_info = ? WHERE name = ?",
            (json.dumps(merged_class_info, ensure_ascii=False), name)
        )
        conn.commit()
        conn.close()

        # 同时更新元数据文件
        dataset_dir = os.path.join(DATASETS_DIR, name)
        metadata_file = os.path.join(dataset_dir, 'metadata.json')
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, 'r', encoding='utf-8', errors='ignore') as f:
                    metadata = json.load(f)
            except:
                metadata = {}
            metadata['class_info'] = merged_class_info
            metadata['labels'] = labels_list
            try:
                with open(metadata_file, 'w', encoding='utf-8', errors='ignore') as f:
                    json.dump(metadata, f, ensure_ascii=False, indent=2)
            except:
                pass

        return jsonify({"success": True, "message": "类别信息已更新"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==================== 模型上传API ====================

@app.route('/api/model/upload', methods=['POST'])
def upload_model():
    """上传模型"""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "没有上传文件"}), 400

    file = request.files['file']
    model_name = request.form.get('name', '').strip()
    algo_name = request.form.get('algoName', '其他')
    category = request.form.get('category', 'YOLO')
    accuracy = float(request.form.get('accuracy', 0))
    description = request.form.get('description', '')
    dataset = request.form.get('dataset', '')
    maintainer = request.form.get('maintainer', '管理员')

    if not model_name:
        model_name = secure_filename(file.filename)
        if not model_name:
            model_name = f"model_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    if file.filename == '':
        return jsonify({"success": False, "error": "没有选择文件"}), 400

    try:
        # 保存上传的文件
        model_dir = os.path.join(MODELS_DIR, model_name)
        os.makedirs(model_dir, exist_ok=True)

        filename = secure_filename(file.filename)
        file.save(os.path.join(model_dir, filename))

        # 保存元数据
        metadata = {
            "name": model_name,
            "algo_name": algo_name,
            "category": category,
            "accuracy": accuracy,
            "description": description,
            "dataset": dataset,
            "maintain_date": datetime.now().strftime('%Y/%m/%d'),
            "maintainer": maintainer,
            "filename": filename
        }

        with open(os.path.join(model_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        # 保存到数据库
        add_model({
            'name': model_name,
            'algo_name': algo_name,
            'category': category,
            'accuracy': accuracy,
            'description': description,
            'dataset': dataset,
            'maintain_date': datetime.now().strftime('%Y/%m/%d'),
            'maintainer': maintainer
        })

        return jsonify({
            "success": True,
            "message": "模型上传成功",
            "model": metadata
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/model/<name>', methods=['DELETE'])
def delete_model(name):
    """删除模型"""
    try:
        # 删除文件
        model_dir = os.path.join(MODELS_DIR, name)
        if os.path.exists(model_dir):
            import shutil
            shutil.rmtree(model_dir)

        # 删除数据库记录
        delete_model_by_name(name)

        return jsonify({"success": True, "message": "模型已删除"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==================== 文件访问API ====================

@app.route('/data/<path:filename>')
def serve_data_file(filename):
    """提供数据文件访问"""
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'data'), filename)


if __name__ == '__main__':
    print("=" * 50)
    print("启动机器视觉管理平台...")
    print("访问地址: http://localhost:8501")
    print("=" * 50)
    # 禁用自动重载，避免上传文件时触发重启
    app.run(host='0.0.0.0', port=8501, debug=True, use_reloader=False)
