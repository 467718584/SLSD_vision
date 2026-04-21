"""
pytest共享 fixtures - Flask测试客户端
"""
import os
import sys
import pytest
import tempfile
import shutil
from flask import Flask, Blueprint, jsonify, request, session

# 确保项目根目录在 sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# 设置测试环境变量
os.environ['TESTING'] = '1'
os.environ['SECRET_KEY'] = 'test-secret-key-for-testing-only'


# ==================== Auth Blueprint (从server.py提取) ====================
auth_bp = Blueprint('test_auth', __name__)

@auth_bp.route('/api/auth/login', methods=['POST'])
def test_api_login():
    """用户登录"""
    from modules.auth import authenticate_user, generate_token
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

@auth_bp.route('/api/auth/register', methods=['POST'])
def test_api_register():
    """用户注册"""
    from modules.auth import create_user, generate_token
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

@auth_bp.route('/api/auth/me')
def test_api_me():
    """获取当前用户信息"""
    from modules.auth import verify_token, get_user_by_id
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

@auth_bp.route('/api/auth/users')
def test_api_users():
    """获取所有用户列表"""
    from modules.auth import get_all_users
    users = get_all_users()
    return jsonify({"success": True, "users": users})

@auth_bp.route('/api/auth/csrf')
def test_api_csrf():
    """获取CSRF Token"""
    return jsonify({'csrf_token': session.get('csrf_token', '')})


# ==================== Server Routes Blueprint (从server.py提取) ====================
server_bp = Blueprint('test_server', __name__)
DATASETS_DIR = os.path.join(PROJECT_ROOT, 'data', 'datasets')
MODELS_DIR = os.path.join(PROJECT_ROOT, 'data', 'models')

@server_bp.route('/api/datasets')
def test_api_datasets():
    """获取所有数据集列表"""
    from modules.database import get_all_datasets, search_datasets
    query = request.args.get('q', '')
    algo_type = request.args.get('type', '')

    if query or (algo_type and algo_type != '全部'):
        datasets = search_datasets(query, algo_type if algo_type != '全部' else None)
    else:
        datasets = get_all_datasets()

    def check_dataset_files(name):
        dataset_path = os.path.join(DATASETS_DIR, name)
        has_folder = os.path.exists(dataset_path) and os.path.isdir(dataset_path)
        has_zip = os.path.exists(os.path.join(dataset_path, f"{name}.zip"))
        return {"hasFolder": has_folder, "hasZip": has_zip}

    datasets_data = []
    for ds in datasets:
        labels = ds.get('labels', {})
        labels_processed = {}
        for k, v in labels.items():
            labels_processed[k] = v if isinstance(v, int) else "-"

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

@server_bp.route('/api/models')
def test_api_models():
    """获取所有模型列表"""
    from modules.database import get_all_models
    models = get_all_models()

    models_data = []
    for model in models:
        model_path = os.path.join(MODELS_DIR, model.get('name', ''))
        has_folder = os.path.exists(model_path) and os.path.isdir(model_path)

        models_data.append({
            "id": model.get('id', 0),
            "algoType": model.get('algo_type', ''),
            "name": model.get('name', ''),
            "version": model.get('version', ''),
            "total": model.get('total', 0),
            "accuracy": model.get('accuracy', 0),
            "precision": model.get('precision', 0),
            "recall": model.get('recall', 0),
            "map": model.get('map', 0),
            "mAP_50": model.get('mAP_50', 0),
            "mAP_75": model.get('mAP_75', 0),
            "trainDate": model.get('train_date', ''),
            "trainTime": model.get('train_time', ''),
            "datasetName": model.get('dataset_name', ''),
            "description": model.get('description', '').replace('\n', ' ').replace('\r', ' '),
            "hasFolder": has_folder,
            "source": model.get('source', ''),
            "status": model.get('status', 'ready')
        })

    return jsonify(models_data)


@pytest.fixture(scope='session')
def app():
    """创建Flask测试应用（session级别，只创建一次）"""
    from flask import Flask
    from backend.routes import register_blueprints
    from modules.database import init_database
    from modules.csrf import init_csrf

    # 创建临时数据库
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    os.environ['DATABASE_PATH'] = db_path

    # 创建测试Flask应用
    test_app = Flask(__name__)
    test_app.config['TESTING'] = True
    test_app.config['SECRET_KEY'] = 'test-secret-key'
    test_app.config['SESSION_COOKIE_HTTPONLY'] = True
    test_app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    test_app.config['WTF_CSRF_ENABLED'] = False  # 禁用CSRF用于测试

    # 注册auth蓝图
    test_app.register_blueprint(auth_bp)

    # 注册server routes蓝图
    test_app.register_blueprint(server_bp)

    # 注册其他蓝图
    register_blueprints(test_app)

    # 初始化数据库
    init_database()

    # 初始化CSRF
    init_csrf(test_app)

    yield test_app

    # 清理
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture(scope='function')
def client(app):
    """为每个测试创建新的测试客户端"""
    return app.test_client()


@pytest.fixture(scope='function')
def auth_token(client):
    """获取认证token（admin用户）"""
    # 确保admin用户存在
    from modules.auth import init_users_table
    init_users_table()

    # 登录获取token
    response = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    data = response.get_json()
    if data and data.get('token'):
        return data.get('token')
    # 如果没有token，尝试从success response获取
    if data and data.get('success'):
        return data.get('token')
    return None


@pytest.fixture(scope='function')
def auth_headers(auth_token):
    """获取认证请求头"""
    if auth_token:
        return {'Authorization': f'Bearer {auth_token}'}
    return {}


@pytest.fixture(scope='session')
def temp_data_dir():
    """创建临时数据目录"""
    temp_dir = tempfile.mkdtemp()
    datasets_dir = os.path.join(temp_dir, 'datasets')
    models_dir = os.path.join(temp_dir, 'models')
    os.makedirs(datasets_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    yield temp_dir

    # 清理
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(scope='function')
def sample_dataset_zip(temp_data_dir):
    """创建示例数据集zip文件"""
    import zipfile
    from io import BytesIO

    # 创建内存zip文件
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # 添加一个标注文件
        zf.writestr('annotations/yolo_labels.txt', '0 0.5 0.5 0.3 0.3\n1 0.3 0.7 0.2 0.2')
        # 添加一个图片文件（占位符）
        zf.writestr('images/placeholder.jpg', b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01')

    buffer.seek(0)
    return buffer
