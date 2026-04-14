"""
Flask服务器 - 直接加载参考HTML并注入数据库数据
"""
import os
import uuid
import json
import logging
import time
from datetime import datetime
from functools import wraps
from flask import Flask, render_template_string, jsonify, request, send_from_directory, g
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from flasgger import Swagger
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

# ==================== 日志配置 ====================
LOG_DIR = os.path.join(os.path.dirname(__file__), 'logs')
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, 'app.log'), encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('SLSD_Vision')

# 请求日志中间件
@app.before_request
def before_request():
    g.start_time = time.time()
    logger.info(f"→ {request.method} {request.path}")

@app.after_request
def after_request(response):
    if hasattr(g, 'start_time'):
        elapsed = time.time() - g.start_time
        log_msg = f"← {request.method} {request.path} - {response.status_code} ({elapsed*1000:.1f}ms)"
        
        # 更新性能指标
        performance_metrics['total_requests'] += 1
        if response.status_code >= 400:
            performance_metrics['error_count'] += 1
        if elapsed > 1.0:
            performance_metrics['slow_requests'] += 1
            logger.warning(f"SLOW REQUEST: {log_msg}")
        else:
            logger.info(log_msg)
        
        # 更新端点统计
        endpoint = f"{request.method} {request.path}"
        if endpoint not in performance_metrics['endpoint_stats']:
            performance_metrics['endpoint_stats'][endpoint] = {
                'count': 0, 'total_time': 0, 'avg_time': 0, 'max_time': 0
            }
        stats = performance_metrics['endpoint_stats'][endpoint]
        stats['count'] += 1
        stats['total_time'] += elapsed
        stats['avg_time'] = stats['total_time'] / stats['count']
        stats['max_time'] = max(stats['max_time'], elapsed)
    return response

app = Flask(__name__)
app.config['START_TIME'] = time.time()

# Swagger配置
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs/"
}

swagger_template = {
    "info": {
        "title": "SLSD Vision Platform API",
        "description": "机器视觉管理平台 RESTful API",
        "version": "1.7.0",
        "contact": {
            "name": "开发团队",
            "email": "dev@slsd.vision"
        }
    },
    "basePath": "/",
    "schemes": ["http", "https"],
    "tags": [
        {"name": "datasets", "description": "数据集管理"},
        {"name": "models", "description": "模型管理"},
        {"name": "settings", "description": "系统设置"},
        {"name": "stats", "description": "统计信息"}
    ]
}

Swagger(app, config=swagger_config, template=swagger_template)
try:
    from backend.routes import register_blueprints
    register_blueprints(app)
    print("[INFO] Blueprint路由已注册")
except ImportError as e:
    print(f"[WARN] Blueprint导入失败，将使用 monolithic 路由: {e}")

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

# 初始化用户认证表
from modules.auth import init_users_table
from modules.auth_decorators import require_auth, require_admin, require_role
from modules.upload_validator import validate_file_upload, validate_file_extension, validate_file_size, sanitize_filename, ALLOWED_DATASET_EXTENSIONS, MAX_FILE_SIZE
init_users_table()


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
            "source": ds.get('source', ''),
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
            "description": m.get('description', ''),
            "techMethod": m.get('tech_method', '目标检测算法'),
            "site": m.get('site', ''),
            "modelType": m.get('model_type', 'yolo'),
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
    """
    获取系统设置
    ---
    tags:
      - settings
    responses:
      200:
        description: 系统设置
        schema:
          type: object
          properties:
            algo_types:
              type: array
              items:
                type: string
              description: 算法类型列表
            tech_methods:
              type: array
              items:
                type: string
              description: 技术方法列表
            sites:
              type: array
              items:
                type: string
              description: 应用现场列表
    """
    from modules.database import get_settings
    settings = get_settings()
    return jsonify(settings)


@app.route('/api/settings', methods=['POST'])
@require_admin
def update_settings():
    """
    更新系统设置
    ---
    tags:
      - settings
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            algo_types:
              type: array
              items:
                type: string
            tech_methods:
              type: array
              items:
                type: string
            sites:
              type: array
              items:
                type: string
    responses:
      200:
        description: 更新成功
    """
    from modules.database import update_settings

    data = request.json or {}

    algo_types = data.get('algoTypes')
    tech_methods = data.get('techMethods')
    annotation_types = data.get('annotationTypes')
    sites = data.get('sites')

    if algo_types is None and tech_methods is None and annotation_types is None and sites is None:
        return jsonify({"success": False, "error": "没有要更新的内容"}), 400

    try:
        update_settings(algo_types, tech_methods, annotation_types, sites)
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
    """
    获取所有数据集列表
    ---
    tags:
      - datasets
    parameters:
      - name: q
        in: query
        type: string
        required: false
        description: 搜索关键词
      - name: type
        in: query
        type: string
        required: false
        description: 算法类型过滤
    responses:
      200:
        description: 数据集列表
        schema:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
                description: 数据集名称
              algoType:
                type: string
                description: 算法类型
              total:
                type: integer
                description: 样本总数
    """
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
            "source": ds.get('source', ''),
            "hasFolder": file_status["hasFolder"],
            "hasZip": file_status["hasZip"]
        })

    return jsonify(datasets_data)


@app.route('/api/models')
def api_models():
    """
    获取所有模型列表
    ---
    tags:
      - models
    parameters:
      - name: q
        in: query
        type: string
        required: false
        description: 搜索关键词
      - name: name
        in: query
        type: string
        required: false
        description: 算法名称过滤
    responses:
      200:
        description: 模型列表
        schema:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
                description: 模型名称
              algoName:
                type: string
                description: 算法名称
              accuracy:
                type: number
                description: 模型精度(%)
              category:
                type: string
                description: 模型类别
    """
    query = request.args.get('q', '')
    algo_name = request.args.get('name', '')

    if query or (algo_name and algo_name != '全部'):
        models = search_models(query, algo_name if algo_name != '全部' else None)
    else:
        models = get_all_models()

    # 转换模型数据为驼峰命名
    models_data = []
    for m in models:
        models_data.append({
            "id": m.get('id', 0),
            "algoName": m.get('algo_name', ''),
            "name": m.get('name', ''),
            "category": m.get('category', ''),
            "accuracy": m.get('accuracy', 0),
            "description": m.get('description', ''),
            "techMethod": m.get('tech_method', '目标检测算法'),
            "site": m.get('site', ''),
            "modelType": m.get('model_type', 'yolo'),
            "dataset": m.get('dataset', ''),
            "maintainDate": m.get('maintain_date', ''),
            "maintainer": m.get('maintainer', ''),
            "previewCount": m.get('preview_count', 8)
        })

    return jsonify(models_data)


@app.route('/api/models/compare')
def api_models_compare():
    """
    模型性能对比
    ---
    tags:
      - models
    parameters:
      - name: models
        in: query
        type: string
        required: true
        description: 模型名称列表，用逗号分隔
    responses:
      200:
        description: 模型对比数据
    """
    models_param = request.args.get('models', '')
    if not models_param:
        return jsonify({"success": False, "error": "请指定要对比的模型"}), 400
    
    model_names = [m.strip() for m in models_param.split(',') if m.strip()]
    if len(model_names) < 2:
        return jsonify({"success": False, "error": "至少需要选择2个模型进行对比"}), 400
    if len(model_names) > 5:
        return jsonify({"success": False, "error": "最多支持5个模型同时对比"}), 400
    
    compare_data = []
    for name in model_names:
        model = get_model_by_name(name)
        if not model:
            continue
        
        # 获取模型图表
        model_dir = os.path.join(MODELS_DIR, name)
        charts = {}
        chart_files = ['map50_curve.png', 'map50_95_curve.png', 'PR_curve.png', 
                      'confusion_matrix.png', 'F1_curve.png', 'precision_curve.png',
                      'recall_curve.png', 'train_box_loss_curve.png', 'val_box_loss_curve.png']
        for cf in chart_files:
            chart_path = os.path.join(model_dir, cf)
            if os.path.exists(chart_path):
                chart_key = cf.replace('.png', '').replace('_curve', '_curve').replace('map50_95', 'map50_95')
                charts[chart_key] = f'/data/models/{name}/{cf}'
        
        compare_data.append({
            "name": model.get('name', ''),
            "algoName": model.get('algo_name', ''),
            "category": model.get('category', ''),
            "accuracy": model.get('accuracy', 0),
            "techMethod": model.get('tech_method', ''),
            "site": model.get('site', ''),
            "dataset": model.get('dataset', ''),
            "maintainer": model.get('maintainer', ''),
            "maintainDate": model.get('maintain_date', ''),
            "charts": charts
        })
    
    return jsonify({
        "success": True,
        "models": compare_data
    })


@app.route('/api/stats')
def api_stats():
    """
    获取平台统计信息
    ---
    tags:
      - stats
    responses:
      200:
        description: 统计信息
        schema:
          type: object
          properties:
            datasets:
              type: object
              properties:
                count:
                  type: integer
                  description: 数据集数量
                totalImages:
                  type: integer
                  description: 样本总数
            models:
              type: object
              properties:
                count:
                  type: integer
                  description: 模型数量
                avgAccuracy:
                  type: number
                  description: 平均精度
    """
    ds_stats = get_dataset_stats()
    m_stats = get_model_stats()
    return jsonify({
        "datasets": ds_stats,
        "models": m_stats
    })


# ==================== 性能监控端点 ====================
performance_metrics = {
    "total_requests": 0,
    "error_count": 0,
    "slow_requests": 0,
    "endpoint_stats": {}
}

@app.route('/api/metrics/performance')
def api_performance_metrics():
    """
    获取性能监控指标
    ---
    tags:
      - stats
    responses:
      200:
        description: 性能指标
        schema:
          type: object
          properties:
            total_requests:
              type: integer
              description: 总请求数
            error_count:
              type: integer
              description: 错误请求数
            slow_requests:
              type: integer
              description: 慢请求数(>1秒)
            uptime_seconds:
              type: number
              description: 运行时间(秒)
            endpoint_stats:
              type: object
              description: 各端点统计
    """
    return jsonify({
        **performance_metrics,
        "uptime_seconds": time.time() - app.config.get('START_TIME', time.time())
    })


# ==================== 用户认证API ====================
from modules.auth import (
    create_user, authenticate_user, generate_token, verify_token, get_user_by_id, get_all_users
)

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    """
    用户注册
    ---
    tags:
      - auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              description: 用户名
            password:
              type: string
              description: 密码
            email:
              type: string
              description: 邮箱
    responses:
      200:
        description: 注册结果
    """
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    email = data.get('email', '')
    
    if not username or not password:
        return jsonify({"success": False, "error": "用户名和密码不能为空"}), 400
    
    if len(password) < 6:
        return jsonify({"success": False, "error": "密码长度至少6位"}), 400
    
    user_id, err = create_user(username, password, email)
    if err:
        return jsonify({"success": False, "error": err}), 400
    
    token = generate_token(user_id, username)
    return jsonify({
        "success": True,
        "token": token,
        "user": {"id": user_id, "username": username}
    })


@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """
    用户登录
    ---
    tags:
      - auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              description: 用户名
            password:
              type: string
              description: 密码
    responses:
      200:
        description: 登录结果
    """
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    user, err = authenticate_user(username, password)
    if err:
        return jsonify({"success": False, "error": err}), 401
    
    token = generate_token(user['id'], user['username'], user['role'])
    return jsonify({
        "success": True,
        "token": token,
        "user": user
    })


@app.route('/api/auth/me')
def api_me():
    """
    获取当前用户信息
    ---
    tags:
      - auth
    parameters:
      - in: header
        name: Authorization
        type: string
        required: true
        description: Bearer token
    responses:
      200:
        description: 用户信息
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({"success": False, "error": "未授权"}), 401
    
    token = auth_header[7:]
    payload = verify_token(token)
    if not payload:
        return jsonify({"success": False, "error": "Token无效或已过期"}), 401
    
    user = get_user_by_id(payload['user_id'])
    if not user:
        return jsonify({"success": False, "error": "用户不存在"}), 404
    
    return jsonify({
        "success": True,
        "user": user
    })


@app.route('/api/auth/users')
def api_users():
    """
    获取所有用户列表 (仅管理员)
    ---
    tags:
      - auth
    responses:
      200:
        description: 用户列表
    """
    users = get_all_users()
    return jsonify({"success": True, "users": users})


# ==================== 受保护的端点 ====================

@app.route('/api/dataset/<name>', methods=['DELETE'])
@require_auth
def delete_dataset(name):

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
@require_auth
def upload_dataset():
    """上传数据集"""
    upload_mode = request.form.get('uploadMode', 'zip')
    dataset_name = request.form.get('name', '').strip()
    algo_type = request.form.get('algoType', '其他')
    tech_method = request.form.get('techMethod', '目标检测算法')
    description = request.form.get('description', '')
    source = request.form.get('source', '')
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
                    # 清理文件名
                    safe_filename = sanitize_filename(f.filename)
                    
                    # 验证文件扩展名
                    valid, error = validate_file_extension(safe_filename, ALLOWED_DATASET_EXTENSIONS)
                    if not valid:
                        return jsonify({"success": False, "error": f"文件 '{safe_filename}' {error}"}), 400
                    
                    # 验证文件大小
                    f.seek(0, 2)  # Seek to end
                    file_size = f.tell()
                    f.seek(0)  # Reset to start
                    valid, error = validate_file_size(file_size, MAX_FILE_SIZE)
                    if not valid:
                        return jsonify({"success": False, "error": f"文件 '{safe_filename}' {error}"}), 400
                    
                    relative_path = f.filename
                    if hasattr(f, 'webkitRelativePath') and f.webkitRelativePath:
                        relative_path = f.webkitRelativePath
                    parts = relative_path.split('/')
                    if len(parts) > 1:
                        relative_path = '/'.join(parts[1:])
                    if relative_path:
                        target_path = os.path.join(dataset_dir, sanitize_filename(relative_path))
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

            # 验证文件扩展名
            valid, error = validate_file_extension(file.filename, {'.zip'})
            if not valid:
                return jsonify({"success": False, "error": error}), 400
            
            # 验证文件大小
            file.seek(0, 2)
            file_size = file.tell()
            file.seek(0)
            valid, error = validate_file_size(file_size, MAX_FILE_SIZE)
            if not valid:
                return jsonify({"success": False, "error": error}), 400
            
            filename = sanitize_filename(secure_filename(file.filename))
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
            "source": source,
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
            'source': source,
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
@require_auth
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

    # 验证文件扩展名
    from modules.upload_validator import ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE
    valid, error = validate_file_extension(file.filename, ALLOWED_IMAGE_EXTENSIONS)
    if not valid:
        return jsonify({"success": False, "error": error}), 400
    
    # 验证文件大小
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    valid, error = validate_file_size(file_size, MAX_IMAGE_SIZE)
    if not valid:
        return jsonify({"success": False, "error": error}), 400
    
    # 创建charts目录
    charts_dir = os.path.join(dataset_dir, 'charts')
    os.makedirs(charts_dir, exist_ok=True)

    # 保存文件
    filename = 'detail.png' if chart_type == 'detail' else 'distribution.png'
    file_path = os.path.join(charts_dir, filename)
    file.save(file_path)

    return jsonify({"success": True, "path": file_path})


# ==================== 数据集版本管理API ====================
from modules.database import (
    create_dataset_version, get_dataset_versions, get_dataset_version_by_id,
    get_latest_version, compare_versions, delete_dataset_version
)

@app.route('/api/dataset/<name>/versions')
def api_dataset_versions(name):
    """
    获取数据集的所有版本
    ---
    tags:
      - datasets
    parameters:
      - name: name
        in: path
        type: string
        required: true
        description: 数据集名称
    responses:
      200:
        description: 版本列表
    """
    versions = get_dataset_versions(name)
    return jsonify({
        "success": True,
        "versions": versions,
        "latest_version": get_latest_version(name)
    })

@app.route('/api/dataset/<name>/versions', methods=['POST'])
def api_create_version(name):
    """
    创建数据集新版本
    ---
    tags:
      - datasets
    parameters:
      - name: name
        in: path
        type: string
        required: true
        description: 数据集名称
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            version:
              type: string
              description: 版本号 (如 v1.0)
            description:
              type: string
              description: 版本描述
    responses:
      200:
        description: 创建结果
    """
    data = request.json
    version = data.get('version', '')
    description = data.get('description', '')
    
    if not version:
        return jsonify({"success": False, "error": "版本号不能为空"}), 400
    
    # 获取当前最新版本作为父版本
    latest = get_latest_version(name)
    parent_version = latest['version'] if latest else None
    
    version_id = create_dataset_version(
        dataset_name=name,
        version=version,
        description=description,
        created_by=data.get('created_by'),
        file_count=data.get('file_count', 0),
        file_hash=data.get('file_hash'),
        parent_version=parent_version,
        total=data.get('total', 0),
        class_info=data.get('class_info')
    )
    
    return jsonify({
        "success": True,
        "version_id": version_id,
        "message": f"版本 {version} 创建成功"
    })

@app.route('/api/dataset/versions/<int:version_id>')
def api_version_detail(version_id):
    """
    获取版本详情
    ---
    tags:
      - datasets
    parameters:
      - name: version_id
        in: path
        type: integer
        required: true
        description: 版本ID
    responses:
      200:
        description: 版本详情
    """
    version = get_dataset_version_by_id(version_id)
    if not version:
        return jsonify({"success": False, "error": "版本不存在"}), 404
    
    return jsonify({"success": True, "version": version})

@app.route('/api/dataset/versions/compare')
def api_compare_versions():
    """
    对比两个版本的差异
    ---
    tags:
      - datasets
    parameters:
      - name: v1
        in: query
        type: integer
        required: true
        description: 版本1 ID
      - name: v2
        in: query
        type: integer
        required: true
        description: 版本2 ID
    responses:
      200:
        description: 版本对比结果
    """
    v1_id = request.args.get('v1', type=int)
    v2_id = request.args.get('v2', type=int)
    
    if not v1_id or not v2_id:
        return jsonify({"success": False, "error": "需要提供两个版本ID"}), 400
    
    result = compare_versions(v1_id, v2_id)
    if not result:
        return jsonify({"success": False, "error": "版本不存在"}), 404
    
    return jsonify({"success": True, "comparison": result})

@app.route('/api/dataset/versions/<int:version_id>', methods=['DELETE'])
@require_auth
def api_delete_version(version_id):
    """
    删除版本 (软删除)
    ---
    tags:
      - datasets
    parameters:
      - name: version_id
        in: path
        type: integer
        required: true
        description: 版本ID
    responses:
      200:
        description: 删除结果
    """
    success = delete_dataset_version(version_id)
    return jsonify({
        "success": success,
        "message": "版本已删除" if success else "删除失败"
    })


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
@require_auth
def update_dataset(name):
    """更新数据集信息"""
    try:
        data = request.json or {}
        algo_type = data.get('algoType')
        tech_method = data.get('techMethod')
        source = data.get('source')

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
        if source is not None:
            updates.append("source = ?")
            params.append(source)

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
@require_auth
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
                # 获取相对路径并清理
                filename = sanitize_filename(uploaded_file.filename.replace('\\', '/'))
                
                # 验证文件扩展名
                from modules.upload_validator import ALLOWED_MODEL_EXTENSIONS, MAX_MODEL_SIZE
                valid, error = validate_file_extension(filename, ALLOWED_MODEL_EXTENSIONS)
                if not valid:
                    return jsonify({"success": False, "error": f"文件 '{filename}' {error}"}), 400
                
                # 验证文件大小
                uploaded_file.seek(0, 2)
                file_size = uploaded_file.tell()
                uploaded_file.seek(0)
                valid, error = validate_file_size(file_size, MAX_MODEL_SIZE)
                if not valid:
                    return jsonify({"success": False, "error": f"文件 '{filename}' {error}"}), 400
                parts = filename.split('/')

                if len(parts) >= 2 and parts[0] == 'weights':
                    # weights目录下的文件
                    target_path = os.path.join(weights_dir, parts[-1])
                    uploaded_file.save(target_path)
                    saved_files[parts[-1]] = f"weights/{parts[-1]}"
                elif 'results.csv' in filename.lower():
                    # results.csv文件
                    target_path = os.path.join(model_dir, 'results.csv')
                    uploaded_file.save(target_path)
                    saved_files['results_csv'] = 'results.csv'
                    # 解析results.csv
                    try:
                        uploaded_file.seek(0)
                        content = uploaded_file.read().decode('utf-8', errors='ignore')
                        import csv
                        reader = csv.reader(content.splitlines())
                        rows = list(reader)
                        if len(rows) > 1:
                            # 查找mAP50列（通常是第8列，索引7）
                            header = rows[0] if rows else []
                            map50_idx = None
                            map50_95_idx = None
                            for i, h in enumerate(header):
                                if 'mAP50' in h and '95' not in h:
                                    map50_idx = i
                                elif 'mAP50-95' in h or 'mAP50-95(B)' in h:
                                    map50_95_idx = i

                            # 找到最高的mAP50值
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
                            # 更新精度为最高mAP50值
                            if max_map50 > 0:
                                accuracy = round(max_map50 * 100, 2)
                    except Exception as e:
                        pass
                elif 'curve' in filename.lower() or 'f1' in filename.lower() or 'p_curve' in filename.lower() or 'r_curve' in filename.lower() or 'pr_curve' in filename.lower():
                    # 曲线图文件
                    target_path = os.path.join(curves_dir, parts[-1])
                    uploaded_file.save(target_path)
                    saved_files[f'curve_{parts[-1]}'] = f"curves/{parts[-1]}"
                elif 'confusion' in filename.lower():
                    # 混淆矩阵
                    target_path = os.path.join(curves_dir, parts[-1])
                    uploaded_file.save(target_path)
                    saved_files[f'confusion_{parts[-1]}'] = f"curves/{parts[-1]}"
                elif 'train_batch' in filename.lower():
                    # 训练批次图片
                    target_path = os.path.join(batches_dir, parts[-1])
                    uploaded_file.save(target_path)
                    saved_files[f'train_{parts[-1]}'] = f"batches/{parts[-1]}"
                elif 'val_batch' in filename.lower():
                    # 验证批次图片
                    target_path = os.path.join(batches_dir, parts[-1])
                    uploaded_file.save(target_path)
                    saved_files[f'val_{parts[-1]}'] = f"batches/{parts[-1]}"
                elif 'labels.jpg' in filename.lower():
                    # 标签分布图
                    target_path = os.path.join(curves_dir, 'labels.jpg')
                    uploaded_file.save(target_path)
                    saved_files['labels'] = 'curves/labels.jpg'
                elif 'results.png' in filename.lower():
                    # 结果总图
                    target_path = os.path.join(curves_dir, 'results.png')
                    uploaded_file.save(target_path)
                    saved_files['results_png'] = 'curves/results.png'
                else:
                    # 其他文件放到根目录
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


@app.route('/api/model/detail/<name>')
def model_detail_v2(name):
    """获取模型详细信息 - 使用路径参数"""
    try:
        model_dir = os.path.join(MODELS_DIR, name)

        if not os.path.exists(model_dir):
            return jsonify({"success": False, "error": "模型不存在"}), 404

        # 读取元数据
        metadata_path = os.path.join(model_dir, 'metadata.json')
        metadata = {}
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)

        # 获取图表文件路径
        curves_dir = os.path.join(model_dir, 'curves')
        weights_dir = os.path.join(model_dir, 'weights')
        batches_dir = os.path.join(model_dir, 'batches')

        base_dir = os.path.dirname(os.path.dirname(__file__))

        def get_rel_path(path):
            if os.path.exists(path):
                rel = os.path.relpath(path, base_dir)
                return rel.replace('\\', '/')
            return None

        charts = {
            'labels': get_rel_path(os.path.join(curves_dir, 'labels.jpg')),
            'results': get_rel_path(os.path.join(curves_dir, 'results.png')),
            'confusion': get_rel_path(os.path.join(curves_dir, 'confusion_matrix.png')),
            'confusion_normalized': get_rel_path(os.path.join(curves_dir, 'confusion_matrix_normalized.png')),
            'box_f1': get_rel_path(os.path.join(curves_dir, 'BoxF1_curve.png')),
            'box_p': get_rel_path(os.path.join(curves_dir, 'BoxP_curve.png')),
            'box_r': get_rel_path(os.path.join(curves_dir, 'BoxR_curve.png')),
            'box_pr': get_rel_path(os.path.join(curves_dir, 'BoxPR_curve.png')),
        }

        # 生成CSV曲线图
        csv_charts = generate_model_csv_charts(model_dir, curves_dir)

        weights = {
            'best': get_rel_path(os.path.join(weights_dir, 'best.pt')),
            'last': get_rel_path(os.path.join(weights_dir, 'last.pt')),
        }

        # 获取训练/验证批次图片（只获取val开头的）
        batch_images = []
        if os.path.exists(batches_dir):
            for f in sorted(os.listdir(batches_dir)):
                if f.lower().startswith('val'):
                    path = os.path.join(batches_dir, f)
                    rel = get_rel_path(path)
                    if rel:
                        batch_images.append(rel)

        return jsonify({
            "success": True,
            "metadata": metadata,
            "charts": charts,
            "csv_charts": csv_charts,
            "weights": weights,
            "batch_images": batch_images
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/model/<name>', methods=['PUT'])
@require_auth
def update_model(name):
    """更新模型信息"""
    from modules.database import update_model_by_name
    import shutil

    data = request.json or {}

    try:
        # 获取当前模型信息
        models = get_all_models()
        model = next((m for m in models if m['name'] == name), None)

        if not model:
            return jsonify({"success": False, "error": "模型不存在"}), 404

        # 更新字段
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

        if update_data:
            update_model_by_name(name, update_data)

        return jsonify({"success": True, "message": "模型已更新"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/model/<name>', methods=['DELETE'])
@require_auth
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


# ========== 原始数据管理 API ==========
@app.route('/api/raw-data', methods=['GET'])
def get_raw_data_list():
    """获取原始数据列表"""
    try:
        from modules.database import get_all_raw_data
        raw_data = get_all_raw_data()
        return jsonify({"success": True, "data": raw_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/raw-data', methods=['POST'])
def add_raw_data():
    """添加原始数据"""
    try:
        from modules.database import add_raw_data
        data = request.get_json()
        add_raw_data(data)
        return jsonify({"success": True, "message": "原始数据已添加"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/raw-data/<name>', methods=['DELETE'])
def delete_raw_data(name):
    """删除原始数据"""
    try:
        from modules.database import delete_raw_data_by_name
        deleted = delete_raw_data_by_name(name)
        if deleted:
            return jsonify({"success": True, "message": "原始数据已删除"})
        return jsonify({"success": False, "error": "原始数据不存在"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ========== 应用现场管理 API ==========
@app.route('/api/sites', methods=['GET'])
def get_sites_list():
    """获取应用现场列表"""
    try:
        from modules.database import get_all_sites
        sites = get_all_sites()
        return jsonify({"success": True, "data": sites})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/sites', methods=['POST'])
def add_site():
    """添加应用现场"""
    try:
        from modules.database import add_site
        data = request.get_json()
        add_site(data)
        return jsonify({"success": True, "message": "应用现场已添加"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/sites/<name>', methods=['DELETE'])
def delete_site(name):
    """删除应用现场"""
    try:
        from modules.database import delete_site_by_name
        deleted = delete_site_by_name(name)
        if deleted:
            return jsonify({"success": True, "message": "应用现场已删除"})
        return jsonify({"success": False, "error": "应用现场不存在"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def generate_model_csv_charts(model_dir, curves_dir):
    """从results.csv生成mAP50、mAP50-95、val/box_loss、train/box_loss曲线图"""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'Arial Unicode MS', 'DejaVu Sans']
    matplotlib.rcParams['axes.unicode_minus'] = False
    import csv

    csv_path = os.path.join(model_dir, 'results.csv')
    if not os.path.exists(csv_path):
        return [None, None, None, None]

    # 检查缓存 - 如果所有图表都已存在，直接返回缓存路径
    base_dir = os.path.dirname(os.path.dirname(__file__))
    cached_charts = [
        os.path.join(curves_dir, 'map50_curve.png'),
        os.path.join(curves_dir, 'map50_95_curve.png'),
        os.path.join(curves_dir, 'train_box_loss_curve.png'),
        os.path.join(curves_dir, 'val_box_loss_curve.png'),
    ]
    if all(os.path.exists(p) for p in cached_charts):
        return [os.path.relpath(p, base_dir).replace('\\', '/') for p in cached_charts]

    # 图表不存在，需要生成
    try:
        # 读取CSV
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)

        if len(rows) < 2:
            return [None, None, None, None]

        headers = [h.strip().lower() for h in rows[0]]

        # 找到需要的列
        map50_idx = None
        map50_95_idx = None
        val_box_idx = None
        train_box_idx = None

        for i, h in enumerate(headers):
            if 'map50' in h and '95' not in h:
                map50_idx = i
            elif 'map50-95' in h or ('map50' in h and '95' in h):
                map50_95_idx = i
            elif 'val/box_loss' in h:
                val_box_idx = i
            elif 'train/box_loss' in h:
                train_box_idx = i

        if map50_idx is None:
            return [None, None, None, None]

        epochs = []
        map50_values = []
        map50_95_values = []
        val_box_values = []
        train_box_values = []

        for row in rows[1:]:
            if len(row) > map50_idx:
                try:
                    epochs.append(len(epochs) + 1)
                    map50_values.append(float(row[map50_idx]))
                    if map50_95_idx is not None and len(row) > map50_95_idx:
                        map50_95_values.append(float(row[map50_95_idx]))
                    else:
                        map50_95_values.append(0)
                    if val_box_idx is not None and len(row) > val_box_idx:
                        val_box_values.append(float(row[val_box_idx]))
                    else:
                        val_box_values.append(0)
                    if train_box_idx is not None and len(row) > train_box_idx:
                        train_box_values.append(float(row[train_box_idx]))
                    else:
                        train_box_values.append(0)
                except:
                    pass

        if not epochs:
            return [None, None, None, None]

        # 确保输出目录存在
        os.makedirs(curves_dir, exist_ok=True)

        base_dir = os.path.dirname(os.path.dirname(__file__))
        chart_paths = []

        # 绘制mAP50曲线
        plt.figure(figsize=(6, 4))
        plt.plot(epochs, map50_values, 'g-', linewidth=2, label='mAP50')
        plt.xlabel('Epoch')
        plt.ylabel('mAP50')
        plt.title('mAP50 (IoU=0.5)')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        map50_path = os.path.join(curves_dir, 'map50_curve.png')
        plt.savefig(map50_path, dpi=80)
        plt.close()
        chart_paths.append(os.path.relpath(map50_path, base_dir).replace('\\', '/'))

        # 绘制mAP50-95曲线
        plt.figure(figsize=(6, 4))
        plt.plot(epochs, map50_95_values, 'b-', linewidth=2, label='mAP50-95')
        plt.xlabel('Epoch')
        plt.ylabel('mAP50-95')
        plt.title('mAP50-95 (IoU=0.5:0.95)')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        map50_95_path = os.path.join(curves_dir, 'map50_95_curve.png')
        plt.savefig(map50_95_path, dpi=80)
        plt.close()
        chart_paths.append(os.path.relpath(map50_95_path, base_dir).replace('\\', '/'))

        # 绘制train/box_loss曲线 (放在前面)
        plt.figure(figsize=(6, 4))
        plt.plot(epochs, train_box_values, 'orange', linewidth=2, label='train_box_loss')
        plt.xlabel('Epoch')
        plt.ylabel('Box Loss')
        plt.title('训练集边框损失 (train/box_loss)')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        train_box_path = os.path.join(curves_dir, 'train_box_loss_curve.png')
        plt.savefig(train_box_path, dpi=80)
        plt.close()
        chart_paths.append(os.path.relpath(train_box_path, base_dir).replace('\\', '/'))

        # 绘制val/box_loss曲线
        plt.figure(figsize=(6, 4))
        plt.plot(epochs, val_box_values, 'r-', linewidth=2, label='val_box_loss')
        plt.xlabel('Epoch')
        plt.ylabel('Box Loss')
        plt.title('验证集边框损失 (val/box_loss)')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        val_box_path = os.path.join(curves_dir, 'val_box_loss_curve.png')
        plt.savefig(val_box_path, dpi=80)
        plt.close()
        chart_paths.append(os.path.relpath(val_box_path, base_dir).replace('\\', '/'))

        return chart_paths

    except Exception as e:
        print(f"Error generating CSV charts: {e}")
        return [None, None, None, None]


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
