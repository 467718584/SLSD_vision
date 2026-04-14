"""
用户认证模块
"""
import hashlib
import secrets
from datetime import datetime, timedelta
import jwt
from database import get_connection

# JWT配置
JWT_SECRET = secrets.token_hex(32)
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def hash_password(password):
    """密码哈希"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    """验证密码"""
    return hash_password(password) == password_hash

def generate_token(user_id, username, role='user'):
    """生成JWT token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token):
    """验证JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def init_users_table():
    """初始化用户表"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    
    # 创建默认管理员账户（如果不存在）
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        password_hash = hash_password('admin123')
        cursor.execute(
            "INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)",
            ('admin', password_hash, 'admin@slsd.vision', 'admin')
        )
        conn.commit()
    
    conn.close()

def create_user(username, password, email=None, role='user'):
    """创建新用户"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 检查用户名是否存在
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    if cursor.fetchone():
        conn.close()
        return None, "用户名已存在"
    
    password_hash = hash_password(password)
    cursor.execute(
        "INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)",
        (username, password_hash, email, role)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    
    return user_id, None

def authenticate_user(username, password):
    """验证用户登录"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, username, password_hash, email, role FROM users WHERE username = ?",
        (username,)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return None, "用户不存在"
    
    if not verify_password(password, user[2]):
        return None, "密码错误"
    
    return {
        'id': user[0],
        'username': user[1],
        'email': user[3],
        'role': user[4]
    }, None

def get_user_by_id(user_id):
    """根据ID获取用户"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
        (user_id,)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return None
    
    return {
        'id': user[0],
        'username': user[1],
        'email': user[2],
        'role': user[3],
        'created_at': user[4]
    }

def get_all_users():
    """获取所有用户"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, username, email, role, created_at FROM users ORDER BY id")
    users = cursor.fetchall()
    conn.close()
    
    return [
        {
            'id': u[0],
            'username': u[1],
            'email': u[2],
            'role': u[3],
            'created_at': u[4]
        }
        for u in users
    ]
