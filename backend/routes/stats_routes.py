"""
统计API路由 - 使用统计报表
"""
from flask import Blueprint, request, jsonify
from modules.database import get_usage_stats

# 创建蓝图
stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')


@stats_bp.route('/usage')
def usage_stats():
    """
    获取使用统计报表
    ---
    tags:
      - stats
    parameters:
      - in: query
        name: period
        type: string
        enum: [day, week, month]
        default: day
        description: 统计周期
      - in: query
        name: days
        type: integer
        default: 30
        description: 统计天数范围
    responses:
      200:
        description: 使用统计报表
        schema:
          type: object
          properties:
            period:
              type: string
              description: 统计周期
            days:
              type: integer
              description: 统计天数
            summary:
              type: object
              properties:
                total_datasets:
                  type: integer
                  description: 数据集上传总数
                total_models:
                  type: integer
                  description: 模型上传总数
                total_raw_data:
                  type: integer
                  description: 原始数据上传总数
                active_users:
                  type: integer
                  description: 活跃用户数
            daily:
              type: object
              description: 每日统计数据
    """
    try:
        period = request.args.get('period', 'day')
        days = request.args.get('days', 30, type=int)

        if period not in ('day', 'week', 'month'):
            period = 'day'

        if days < 1:
            days = 1
        elif days > 365:
            days = 365

        stats = get_usage_stats(period=period, days=days)
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
