"""
辅助API路由 - 原始数据和应用现场
"""
from flask import Blueprint, request, jsonify

# 创建蓝图
aux_bp = Blueprint('aux', __name__, url_prefix='/api')


def get_all_raw_data():
    from modules.database import get_all_raw_data as _get
    return _get()


def add_raw_data(data):
    from modules.database import add_raw_data as _add
    return _add(data)


def delete_raw_data(name):
    from modules.database import delete_raw_data as _del
    return _del(name)


def get_all_sites():
    from modules.database import get_all_sites as _get
    return _get()


def add_site(data):
    from modules.database import add_site as _add
    return _add(data)


def delete_site(name):
    from modules.database import delete_site as _del
    return _del(name)


@aux_bp.route('/raw-data', methods=['GET'])
def get_raw_data():
    """获取原始数据列表"""
    try:
        data = get_all_raw_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@aux_bp.route('/raw-data', methods=['POST'])
def create_raw_data():
    """创建原始数据"""
    try:
        data = request.json
        result = add_raw_data(data)
        return jsonify({"success": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@aux_bp.route('/raw-data/<name>', methods=['DELETE'])
def remove_raw_data(name):
    """删除原始数据"""
    try:
        result = delete_raw_data(name)
        return jsonify({"success": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@aux_bp.route('/sites', methods=['GET'])
def get_sites():
    """获取应用现场列表"""
    try:
        data = get_all_sites()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@aux_bp.route('/sites', methods=['POST'])
def create_site():
    """创建应用现场"""
    try:
        data = request.json
        result = add_site(data)
        return jsonify({"success": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@aux_bp.route('/sites/<name>', methods=['DELETE'])
def remove_site(name):
    """删除应用现场"""
    try:
        result = delete_site(name)
        return jsonify({"success": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
