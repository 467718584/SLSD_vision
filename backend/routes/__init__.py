"""
Flask Blueprint路由注册
"""
from .dataset_routes import dataset_bp
from .model_routes import model_bp
from .settings_routes import settings_bp
from .aux_routes import aux_bp
from .stats_routes import stats_bp

def register_blueprints(app):
    """注册所有Blueprint到Flask应用"""
    app.register_blueprint(dataset_bp)
    app.register_blueprint(model_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(aux_bp)
    app.register_blueprint(stats_bp)

__all__ = ['register_blueprints', 'dataset_bp', 'model_bp', 'settings_bp', 'aux_bp', 'stats_bp']
