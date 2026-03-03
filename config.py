import os

# 项目根目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 数据存储目录
DATA_DIR = os.path.join(BASE_DIR, 'data')
DATASETS_DIR = os.path.join(DATA_DIR, 'datasets')
MODELS_DIR = os.path.join(DATA_DIR, 'models')

# 确保目录存在
os.makedirs(DATASETS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# 支持的标注格式
SUPPORTED_ANNOTATION_FORMATS = ['yolo', 'coco', 'voc']

# 支持的图片格式
SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.bmp', '.gif']

# Streamlit 配置
STREAMLIT_CONFIG = {
    'page_title': '数据集与模型管理平台',
    'page_icon': '📊',
    'layout': 'wide'
}
