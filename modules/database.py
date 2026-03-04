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
            storage_type TEXT DEFAULT 'folder',
            annotation_type TEXT DEFAULT 'yolo',
            split_ratio TEXT,
            has_test BOOLEAN DEFAULT 0,
            bg_count_train INTEGER DEFAULT 0,
            bg_count_val INTEGER DEFAULT 0,
            bg_count_test INTEGER DEFAULT 0,
            bg_count_total INTEGER DEFAULT 0,
            img_count_train INTEGER DEFAULT 0,
            img_count_val INTEGER DEFAULT 0,
            img_count_test INTEGER DEFAULT 0,
            class_info TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 数据库迁移：为已有数据库添加新字段
    migrate_database(conn, cursor)

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


def migrate_database(conn, cursor):
    """数据库迁移：为已有数据库添加新字段"""
    # 获取当前表结构
    cursor.execute("PRAGMA table_info(datasets)")
    columns = {row[1] for row in cursor.fetchall()}

    # 需要添加的新字段
    new_columns = {
        'storage_type': 'ALTER TABLE datasets ADD COLUMN storage_type TEXT DEFAULT "folder"',
        'annotation_type': 'ALTER TABLE datasets ADD COLUMN annotation_type TEXT DEFAULT "yolo"',
        'split_ratio': 'ALTER TABLE datasets ADD COLUMN split_ratio TEXT',
        'has_test': 'ALTER TABLE datasets ADD COLUMN has_test BOOLEAN DEFAULT 0',
        'bg_count_train': 'ALTER TABLE datasets ADD COLUMN bg_count_train INTEGER DEFAULT 0',
        'bg_count_val': 'ALTER TABLE datasets ADD COLUMN bg_count_val INTEGER DEFAULT 0',
        'bg_count_test': 'ALTER TABLE datasets ADD COLUMN bg_count_test INTEGER DEFAULT 0',
        'bg_count_total': 'ALTER TABLE datasets ADD COLUMN bg_count_total INTEGER DEFAULT 0',
        'img_count_train': 'ALTER TABLE datasets ADD COLUMN img_count_train INTEGER DEFAULT 0',
        'img_count_val': 'ALTER TABLE datasets ADD COLUMN img_count_val INTEGER DEFAULT 0',
        'img_count_test': 'ALTER TABLE datasets ADD COLUMN img_count_test INTEGER DEFAULT 0',
        'class_info': 'ALTER TABLE datasets ADD COLUMN class_info TEXT'
    }

    for col, sql in new_columns.items():
        if col not in columns:
            try:
                cursor.execute(sql)
            except:
                pass  # 忽略可能的错误


def add_dataset(data):
    """添加数据集"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR REPLACE INTO datasets
        (name, algo_type, description, split, total, label_count, labels, maintain_date, maintainer, preview_count, annotation_format, storage_type, annotation_type, split_ratio, has_test, bg_count_train, bg_count_val, bg_count_test, bg_count_total, img_count_train, img_count_val, img_count_test, class_info, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        data.get('storage_type', 'folder'),
        data.get('annotation_type', 'yolo'),
        data.get('split_ratio'),
        1 if data.get('has_test') else 0,
        data.get('bg_count_train', 0),
        data.get('bg_count_val', 0),
        data.get('bg_count_test', 0),
        data.get('bg_count_total', 0),
        data.get('img_count_train', 0),
        data.get('img_count_val', 0),
        data.get('img_count_test', 0),
        json.dumps(data.get('class_info', {}), ensure_ascii=False),
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
        # 添加错误处理，防止损坏的JSON数据导致解析失败
        try:
            if ds.get('labels'):
                ds['labels'] = json.loads(ds['labels'])
            else:
                ds['labels'] = {}
        except (json.JSONDecodeError, TypeError, AttributeError) as e:
            print(f"[WARN] Failed to parse labels JSON: {e}")
            ds['labels'] = {}
        try:
            if ds.get('class_info'):
                ds['class_info'] = json.loads(ds['class_info'])
            else:
                ds['class_info'] = {}
        except (json.JSONDecodeError, TypeError, AttributeError) as e:
            print(f"[WARN] Failed to parse class_info JSON: {e}")
            ds['class_info'] = {}
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

        # 逐个字段处理，添加详细的错误处理
        # 处理labels字段
        labels_val = ds.get('labels')
        if labels_val:
            try:
                ds['labels'] = json.loads(labels_val)
            except Exception as e:
                print(f"[ERROR] labels parse error for {name}: {type(e).__name__}: {e}, value={repr(labels_val[:100])}")
                ds['labels'] = {}
        else:
            ds['labels'] = {}

        # 处理class_info字段
        class_info_val = ds.get('class_info')
        if class_info_val:
            try:
                ds['class_info'] = json.loads(class_info_val)
            except Exception as e:
                print(f"[ERROR] class_info parse error for {name}: {type(e).__name__}: {e}, value={repr(class_info_val[:100])}")
                ds['class_info'] = {}
        else:
            ds['class_info'] = {}

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
        ds['class_info'] = json.loads(ds['class_info']) if ds['class_info'] else {}
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
