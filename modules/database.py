"""
SQLite 数据库模块 - 用于数据集和模型的数据存储
"""
import sqlite3
import os
import json
from datetime import datetime
from config import BASE_DIR

DB_PATH = os.path.join(BASE_DIR, 'data', 'vision_platform.db')


def get_connection():
    """获取数据库连接"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """初始化数据库表"""
    conn = get_connection()
    cursor = conn.cursor()

    # 数据集表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS datasets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            algo_type TEXT,
            description TEXT,
            split TEXT,
            total INTEGER DEFAULT 0,
            label_count INTEGER DEFAULT 0,
            labels TEXT,
            maintain_date TEXT,
            maintainer TEXT,
            preview_count INTEGER DEFAULT 8,
            annotation_format TEXT DEFAULT 'yolo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 模型表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            algo_name TEXT,
            category TEXT,
            accuracy REAL DEFAULT 0,
            description TEXT,
            dataset TEXT,
            maintain_date TEXT,
            maintainer TEXT,
            preview_count INTEGER DEFAULT 8,
            model_type TEXT DEFAULT 'yolo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()


def add_dataset(data):
    """添加数据集"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR REPLACE INTO datasets
        (name, algo_type, description, split, total, label_count, labels, maintain_date, maintainer, preview_count, annotation_format, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'),
        data.get('algo_type'),
        data.get('description'),
        data.get('split'),
        data.get('total', 0),
        data.get('label_count', 0),
        json.dumps(data.get('labels', {}), ensure_ascii=False),
        data.get('maintain_date'),
        data.get('maintainer'),
        data.get('preview_count', 8),
        data.get('annotation_format', 'yolo'),
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()


def add_model(data):
    """添加模型"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR REPLACE INTO models
        (name, algo_name, category, accuracy, description, dataset, maintain_date, maintainer, preview_count, model_type, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'),
        data.get('algo_name'),
        data.get('category'),
        data.get('accuracy', 0),
        data.get('description'),
        data.get('dataset'),
        data.get('maintain_date'),
        data.get('maintainer'),
        data.get('preview_count', 8),
        data.get('model_type', 'yolo'),
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()


def get_all_datasets():
    """获取所有数据集"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM datasets ORDER BY id')
    rows = cursor.fetchall()
    conn.close()

    datasets = []
    for row in rows:
        ds = dict(row)
        ds['labels'] = json.loads(ds['labels']) if ds['labels'] else {}
        datasets.append(ds)

    return datasets


def get_all_models():
    """获取所有模型"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM models ORDER BY id')
    rows = cursor.fetchall()
    conn.close()

    models = []
    for row in rows:
        models.append(dict(row))

    return models


def get_dataset_by_name(name):
    """根据名称获取数据集"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM datasets WHERE name = ?', (name,))
    row = cursor.fetchone()
    conn.close()

    if row:
        ds = dict(row)
        ds['labels'] = json.loads(ds['labels']) if ds['labels'] else {}
        return ds
    return None


def get_model_by_name(name):
    """根据名称获取模型"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM models WHERE name = ?', (name,))
    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def delete_dataset_by_name(name):
    """删除数据集"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM datasets WHERE name = ?', (name,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()

    return affected > 0


def delete_model_by_name(name):
    """删除模型"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM models WHERE name = ?', (name,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()

    return affected > 0


def search_datasets(query, algo_type=None):
    """搜索数据集"""
    conn = get_connection()
    cursor = conn.cursor()

    sql = 'SELECT * FROM datasets WHERE name LIKE ?'
    params = [f'%{query}%']

    if algo_type and algo_type != '全部':
        sql += ' AND algo_type = ?'
        params.append(algo_type)

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    datasets = []
    for row in rows:
        ds = dict(row)
        ds['labels'] = json.loads(ds['labels']) if ds['labels'] else {}
        datasets.append(ds)

    return datasets


def search_models(query, algo_name=None):
    """搜索模型"""
    conn = get_connection()
    cursor = conn.cursor()

    sql = 'SELECT * FROM models WHERE name LIKE ?'
    params = [f'%{query}%']

    if algo_name and algo_name != '全部':
        sql += ' AND algo_name = ?'
        params.append(algo_name)

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_dataset_stats():
    """获取数据集统计信息"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) as count, SUM(total) as total_images FROM datasets')
    row = cursor.fetchone()
    conn.close()

    return {
        'count': row[0] or 0,
        'total_images': row[1] or 0
    }


def get_model_stats():
    """获取模型统计信息"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) as count FROM models')
    row = cursor.fetchone()
    conn.close()

    return {'count': row[0] or 0}


def get_algo_types():
    """获取所有算法类型"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT DISTINCT algo_type FROM datasets WHERE algo_type IS NOT NULL')
    rows = cursor.fetchall()
    conn.close()

    return ['全部'] + [row[0] for row in rows]


def get_algo_names():
    """获取所有算法名称"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT DISTINCT algo_name FROM models WHERE algo_name IS NOT NULL')
    rows = cursor.fetchall()
    conn.close()

    return ['全部'] + [row[0] for row in rows]


def clear_all_data():
    """清空所有数据"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM datasets')
    cursor.execute('DELETE FROM models')
    conn.commit()
    conn.close()


if __name__ == '__main__':
    init_database()
    print(f"Database initialized at: {DB_PATH}")
