"""
统一API错误处理中间件
"""
from flask import jsonify
from functools import wraps
import logging

logger = logging.getLogger(__name__)


class ApiError(Exception):
    """统一API错误类"""
    def __init__(self, message, status_code=400, error_code=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or status_code


def handle_api_error(error):
    """处理ApiError"""
    response = jsonify({
        'success': False,
        'error': error.message,
        'error_code': error.error_code
    })
    response.status_code = error.status_code
    return response


def handle_generic_error(error):
    """处理通用错误"""
    logger.error(f"Unhandled error: {str(error)}", exc_info=True)
    response = jsonify({
        'success': False,
        'error': '服务器内部错误',
        'error_code': 500
    })
    response.status_code = 500
    return response


def api_handler(f):
    """API错误处理装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ApiError as e:
            return handle_api_error(e)
        except Exception as e:
            logger.error(f"API Error in {f.__name__}: {str(e)}")
            return handle_generic_error(e)
    return decorated_function


def require_params(*required_params):
    """参数验证装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request
            data = request.get_json() or request.form.to_dict() or {}
            missing = [p for p in required_params if not data.get(p)]
            if missing:
                return jsonify({
                    'success': False,
                    'error': f'缺少必要参数: {", ".join(missing)}',
                    'error_code': 400
                }), 400
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def validate_dataset_name(name):
    """验证数据集名称"""
    if not name or not name.strip():
        raise ApiError('数据集名称不能为空', 400)
    if len(name) > 255:
        raise ApiError('数据集名称过长', 400)
    # 检查非法字符
    illegal_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
    for char in illegal_chars:
        if char in name:
            raise ApiError(f'数据集名称包含非法字符: {char}', 400)
    return True


def validate_model_name(name):
    """验证模型名称"""
    if not name or not name.strip():
        raise ApiError('模型名称不能为空', 400)
    if len(name) > 255:
        raise ApiError('模型名称过长', 400)
    return True
