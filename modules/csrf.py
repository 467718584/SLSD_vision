"""
CSRF保护模块
提供CSRF Token生成和验证功能
"""
import secrets
import hashlib
import hmac
import time
from flask import request, session, jsonify, g

# CSRF配置
CSRF_TOKEN_LENGTH = 32
CSRF_TOKEN_EXPIRY = 3600  # 1小时
CSRF_HEADER_NAME = 'X-CSRF-Token'
CSRF_FORM_FIELD = 'csrf_token'

# 密钥（应该从配置读取）
SECRET_KEY = b'slsd-vision-csrf-secret-key-change-in-production'


def generate_csrf_token():
    """生成CSRF Token"""
    token = secrets.token_hex(CSRF_TOKEN_LENGTH)
    timestamp = int(time.time())
    token_with_ts = f"{token}_{timestamp}"
    
    # 生成签名
    signature = hmac.new(
        SECRET_KEY,
        token_with_ts.encode(),
        hashlib.sha256
    ).hexdigest()
    
    full_token = f"{token_with_ts}_{signature}"
    return full_token


def validate_csrf_token(token):
    """
    验证CSRF Token
    返回 (is_valid, error_message)
    """
    if not token:
        return False, "CSRF Token缺失"
    
    parts = token.split('_')
    if len(parts) != 3:
        return False, "无效的CSRF Token格式"
    
    token_value, timestamp_str, signature = parts
    
    try:
        timestamp = int(timestamp_str)
    except ValueError:
        return False, "无效的时间戳"
    
    # 检查是否过期
    current_time = int(time.time())
    if current_time - timestamp > CSRF_TOKEN_EXPIRY:
        return False, "CSRF Token已过期"
    
    # 验证签名
    token_with_ts = f"{token_value}_{timestamp_str}"
    expected_signature = hmac.new(
        SECRET_KEY,
        token_with_ts.encode(),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        return False, "无效的CSRF Token签名"
    
    return True, None


def get_csrf_token_from_request():
    """从请求中获取CSRF Token"""
    # 优先从header获取
    token = request.headers.get(CSRF_HEADER_NAME)
    if token:
        return token
    
    # 然后从form获取
    token = request.form.get(CSRF_FORM_FIELD)
    if token:
        return token
    
    # 最后从JSON body获取
    if request.is_json and request.json:
        token = request.json.get(CSRF_FORM_FIELD)
        if token:
            return token
    
    return None


def csrf_protect(f):
    """CSRF保护装饰器（用于需要CSRF验证的端点）"""
    def decorated_function(*args, **kwargs):
        # 只对写操作进行CSRF验证
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            # 跳过登录注册等公开端点的CSRF验证
            if request.path in ['/api/auth/login', '/api/auth/register']:
                return f(*args, **kwargs)
            
            token = get_csrf_token_from_request()
            is_valid, error = validate_csrf_token(token)
            
            if not is_valid:
                return jsonify({
                    "success": False,
                    "error": f"CSRF验证失败: {error}",
                    "code": "CSRF_ERROR"
                }), 403
            
            # 验证通过，存储token用于后续日志
            g.csrf_token = token
        
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function


def init_csrf(app):
    """初始化CSRF保护"""
    @app.before_request
    def ensure_csrf_token():
        """确保session中有CSRF token"""
        if 'csrf_token' not in session:
            session['csrf_token'] = generate_csrf_token()
    
    @app.after_request
    def add_csrf_header(response):
        """在响应中添加CSRF token"""
        if 'csrf_token' in session:
            response.headers[CSRF_HEADER_NAME] = session['csrf_token']
        return response
