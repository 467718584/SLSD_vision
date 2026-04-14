"""
文件上传安全校验模块
"""
import os
import magic

# 允许的文件扩展名
ALLOWED_DATASET_EXTENSIONS = {'.zip', '.tar', '.gz', '.tar.gz'}
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
ALLOWED_LABEL_EXTENSIONS = {'.txt', '.csv', '.json', '.xml'}
ALLOWED_MODEL_EXTENSIONS = {'.pt', '.pth', '.onnx', '.h5', '.pb', '.pkl', '.joblib'}
ALLOWED_EXTENSIONS = ALLOWED_DATASET_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS | ALLOWED_LABEL_EXTENSIONS | ALLOWED_MODEL_EXTENSIONS

# 文件大小限制 (字节)
MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_MODEL_SIZE = 10 * 1024 * 1024 * 1024  # 10GB

# MIME类型检查
ALLOWED_MIME_TYPES = {
    'application/zip',
    'application/x-zip-compressed',
    'application/gzip',
    'application/x-gzip',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/json',
    'application/octet-stream'
}


def get_file_extension(filename):
    """获取文件扩展名（小写）"""
    if not filename:
        return ''
    return os.path.splitext(filename)[1].lower()


def validate_file_extension(filename, allowed_extensions=None):
    """验证文件扩展名"""
    ext = get_file_extension(filename)
    if not ext:
        return False, f"文件 '{filename}' 缺少扩展名"
    
    allowed = allowed_extensions or ALLOWED_EXTENSIONS
    if ext not in allowed:
        return False, f"不支持的文件类型: {ext}，允许的类型: {', '.join(sorted(allowed))}"
    
    return True, None


def validate_file_size(size, max_size=None):
    """验证文件大小"""
    if size > max_size:
        max_mb = max_size / (1024 * 1024)
        size_mb = size / (1024 * 1024)
        return False, f"文件大小 ({size_mb:.1f}MB) 超过限制 ({max_mb:.0f}MB)"
    return True, None


def validate_mime_type(file_stream):
    """通过文件内容检测MIME类型"""
    try:
        # 保存当前位置
        pos = file_stream.tell()
        
        # 读取文件头
        header = file_stream.read(2048)
        
        # 恢复位置
        file_stream.seek(pos)
        
        # 使用python-magic库检测
        mime = magic.from_buffer(header, mime=True)
        return mime
    except Exception as e:
        # 如果magic检测失败，返回octet-stream
        return 'application/octet-stream'


def validate_file_upload(filename, file_stream, file_size, file_type='dataset'):
    """
    综合验证上传文件
    
    Args:
        filename: 文件名
        file_stream: 文件流对象
        file_size: 文件大小
        file_type: 文件类型 ('dataset', 'image', 'model', 'chart')
    
    Returns:
        (is_valid, error_message)
    """
    # 1. 扩展名检查
    if file_type == 'dataset':
        allowed_exts = ALLOWED_DATASET_EXTENSIONS
        max_size = MAX_FILE_SIZE
    elif file_type == 'image':
        allowed_exts = ALLOWED_IMAGE_EXTENSIONS
        max_size = MAX_IMAGE_SIZE
    elif file_type == 'model':
        allowed_exts = ALLOWED_MODEL_EXTENSIONS
        max_size = MAX_MODEL_SIZE
    elif file_type == 'chart':
        allowed_exts = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'}
        max_size = MAX_IMAGE_SIZE
    else:
        allowed_exts = ALLOWED_EXTENSIONS
        max_size = MAX_FILE_SIZE
    
    valid, error = validate_file_extension(filename, allowed_exts)
    if not valid:
        return False, error
    
    # 2. 大小检查
    valid, error = validate_file_size(file_size, max_size)
    if not valid:
        return False, error
    
    # 3. MIME类型检查（可选，更严格的安全检查）
    detected_mime = validate_mime_type(file_stream)
    # 这里可以添加更严格的MIME检查
    
    return True, None


def sanitize_filename(filename):
    """清理文件名，防止路径遍历攻击"""
    # 移除路径分隔符
    filename = filename.replace('/', '_').replace('\\', '_')
    # 移除其他危险字符
    filename = filename.replace('..', '_')
    # 限制长度
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:250] + ext
    return filename
