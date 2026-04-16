"""
系统设置API路由
"""
from flask import Blueprint, request, jsonify

# 创建蓝图
settings_bp = Blueprint('settings', __name__, url_prefix='/api')


def get_settings():
    from modules.database import get_settings as _get
    return _get()


def update_settings(algo_types, tech_methods, annotation_types, sites, sources):
    from modules.database import update_settings as _update
    return _update(algo_types, tech_methods, annotation_types, sites, sources)


@settings_bp.route('/settings')
def get_settings_api():
    """获取系统设置"""
    try:
        settings = get_settings()
        return jsonify(settings)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@settings_bp.route('/settings', methods=['POST'])
def update_settings_api():
    """更新系统设置"""
    try:
        data = request.json or {}
        algo_types = data.get('algoTypes')
        tech_methods = data.get('techMethods')
        annotation_types = data.get('annotationTypes')
        sites = data.get('sites')
        sources = data.get('sources')

        if algo_types is None and tech_methods is None and annotation_types is None and sites is None and sources is None:
            return jsonify({"success": False, "error": "没有要更新的内容"}), 400

        update_settings(algo_types, tech_methods, annotation_types, sites, sources)
        return jsonify({"success": True, "message": "设置已更新"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
