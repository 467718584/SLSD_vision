"""
API认证装饰器模块
提供JWT验证和角色检查装饰器
"""
from functools import wraps
from flask import request, jsonify, g
from modules.auth import verify_token, get_user_by_id

# 公开端点（不需要认证）
PUBLIC_ENDPOINTS = {
    'GET': [
        '/api/datasets',
        '/api/models',
        '/api/stats',
        '/api/settings',
        '/api/dataset/',
        '/api/model/detail/',
        '/api/metrics/',
    ],
    'POST': [
        '/api/auth/login',
        '/api/auth/register',
    ],
    'PUT': [],
    'DELETE': [],
}


def is_public_endpoint(method, path):
    """检查端点是否公开"""
    if method not in PUBLIC_ENDPOINTS:
        return False
    
    public_patterns = PUBLIC_ENDPOINTS[method]
    for pattern in public_patterns:
        if path.startswith(pattern):
            return True
    return False


def require_auth(f):
    """需要认证的装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 检查是否是公开端点
        if is_public_endpoint(request.method, request.path):
            return f(*args, **kwargs)
        
        # 获取Token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            return jsonify({"success": False, "error": "未授权，请先登录"}), 401
        
        if not auth_header.startswith('Bearer '):
            return jsonify({"success": False, "error": "无效的认证格式"}), 401
        
        token = auth_header[7:]
        payload = verify_token(token)
        if not payload:
            return jsonify({"success": False, "error": "Token无效或已过期"}), 401
        
        # 获取用户信息
        user = get_user_by_id(payload['user_id'])
        if not user:
            return jsonify({"success": False, "error": "用户不存在"}), 401
        
        # 将用户信息存入g对象
        g.current_user = user
        g.user_id = payload['user_id']
        g.user_role = payload.get('role', 'user')
        
        return f(*args, **kwargs)
    return decorated_function


def require_role(*allowed_roles):
    """角色检查装饰器（需配合require_auth使用）"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'user_role'):
                return jsonify({"success": False, "error": "需要登录"}), 401
            
            if g.user_role not in allowed_roles:
                return jsonify({"success": False, "error": "权限不足"}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_admin(f):
    """仅管理员可访问的装饰器"""
    @wraps(f)
    @require_auth
    @require_role('admin')
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function
