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
            tech_method TEXT DEFAULT '目标检测算法',
            description TEXT,
            source TEXT,
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

    # 模型表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            algo_name TEXT,
            tech_method TEXT DEFAULT '目标检测算法',
            category TEXT,
            accuracy REAL DEFAULT 0,
            description TEXT,
            site TEXT,
            dataset TEXT,
            maintain_date TEXT,
            maintainer TEXT,
            preview_count INTEGER DEFAULT 8,
            model_type TEXT DEFAULT 'yolo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 设置表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            algo_types TEXT DEFAULT '["路面积水检测","漂浮物检测","墙面裂缝检测","游泳检测","其他"]',
            tech_methods TEXT DEFAULT '["目标检测算法","实例分割算法"]',
            annotation_types TEXT DEFAULT '["YOLO格式","VOC格式","COCO格式"]',
            sites TEXT DEFAULT '["苏北灌溉总渠","南水北调宝应站","慈溪北排","慈溪周巷","瓯江引水","互联网"]',
            sources TEXT DEFAULT '["互联网","本地采集","合作伙伴","公开数据集"]',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 数据集版本表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dataset_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dataset_name TEXT NOT NULL,
            version TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            file_count INTEGER DEFAULT 0,
            file_hash TEXT,
            parent_version TEXT,
            total INTEGER DEFAULT 0,
            class_info TEXT,
            is_active BOOLEAN DEFAULT 1
        )
    ''')

    # 模型版本表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS model_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_name TEXT NOT NULL,
            version_name TEXT NOT NULL,
            description TEXT,
            dataset_name TEXT,
            dataset_version TEXT,
            accuracy REAL DEFAULT 0,
            map50 REAL DEFAULT 0,
            map50_95 REAL DEFAULT 0,
            total_epochs INTEGER DEFAULT 0,
            file_count INTEGER DEFAULT 0,
            file_hash TEXT,
            parent_version TEXT,
            storage_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            is_active BOOLEAN DEFAULT 1,
            is_default BOOLEAN DEFAULT 0
        )
    ''')
    
    # 创建唯一索引：同一模型下版本号唯一
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_model_version 
        ON model_versions(model_name, version_name)
    ''')
    
    # 创建索引：按模型名查询
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_model_versions_model 
        ON model_versions(model_name)
    ''')

    # 模型参数文件表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS model_params (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version_id INTEGER NOT NULL,
            param_type TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER DEFAULT 0,
            file_hash TEXT,
            description TEXT,
            is_primary BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (version_id) REFERENCES model_versions(id)
        )
    ''')
    
    # 创建索引：按版本ID查询参数
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_model_params_version 
        ON model_params(version_id)
    ''')

    # 原始数据表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS raw_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            algo_type TEXT,
            description TEXT,
            dataset TEXT,
            source TEXT,
            is_annotated BOOLEAN DEFAULT 0,
            maintain_date TEXT,
            maintainer TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 应用现场表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            dataset TEXT,
            model TEXT,
            maintain_date TEXT,
            maintainer TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 初始化默认设置
    cursor.execute('INSERT OR IGNORE INTO settings (id, algo_types, tech_methods, annotation_types, sites, sources) VALUES (1, ?, ?, ?, ?, ?)',
        (json.dumps(["路面积水检测","漂浮物检测","墙面裂缝检测","游泳检测","其他"]),
         json.dumps(["目标检测算法","实例分割算法"]),
         json.dumps(["YOLO格式","VOC格式","COCO格式"]),
         json.dumps(["苏北灌溉总渠","南水北调宝应站","慈溪北排","慈溪周巷","瓯江引水","互联网"]),
         json.dumps(["互联网","本地采集","合作伙伴","公开数据集"])))

    # 操作审计日志表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            username TEXT,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_name TEXT,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            status TEXT DEFAULT 'success',
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 创建索引
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)')

    # 数据库迁移：为已有数据库添加新字段（在所有表创建之后执行）
    migrate_database(conn, cursor)

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
        'class_info': 'ALTER TABLE datasets ADD COLUMN class_info TEXT',
        'tech_method': 'ALTER TABLE datasets ADD COLUMN tech_method TEXT DEFAULT "目标检测算法"',
        'source': 'ALTER TABLE datasets ADD COLUMN source TEXT'
    }

    for col, sql in new_columns.items():
        if col not in columns:
            try:
                cursor.execute(sql)
            except:
                pass  # 忽略可能的错误

    # 迁移models表
    cursor.execute("PRAGMA table_info(models)")
    model_columns = {row[1] for row in cursor.fetchall()}

    model_new_columns = {
        'site': 'ALTER TABLE models ADD COLUMN site TEXT'
    }

    for col, sql in model_new_columns.items():
        if col not in model_columns:
            try:
                cursor.execute(sql)
            except:
                pass  # 忽略可能的错误

    # 迁移settings表
    cursor.execute("PRAGMA table_info(settings)")
    settings_columns = {row[1] for row in cursor.fetchall()}

    if 'sites' not in settings_columns:
        try:
            cursor.execute('ALTER TABLE settings ADD COLUMN sites TEXT')
            cursor.execute("UPDATE settings SET sites = '[\"苏北灌溉总渠\",\"南水北调宝应站\",\"慈溪北排\",\"慈溪周巷\",\"瓯江引水\",\"互联网\"]' WHERE id = 1")
        except Exception as e:
            print(f"[WARN] Migration sites column: {e}")

    if 'sources' not in settings_columns:
        try:
            cursor.execute('ALTER TABLE settings ADD COLUMN sources TEXT')
            cursor.execute("UPDATE settings SET sources = '[\"互联网\",\"本地采集\",\"合作伙伴\",\"公开数据集\"]' WHERE id = 1")
        except Exception as e:
            print(f"[WARN] Migration sources column: {e}")


def add_dataset(data):
    """添加数据集"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR REPLACE INTO datasets
        (name, algo_type, tech_method, description, source, split, total, label_count, labels, maintain_date, maintainer, preview_count, annotation_format, storage_type, annotation_type, split_ratio, has_test, bg_count_train, bg_count_val, bg_count_test, bg_count_total, img_count_train, img_count_val, img_count_test, class_info, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'),
        data.get('algo_type'),
        data.get('tech_method', '目标检测算法'),
        data.get('description'),
        data.get('source'),
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


def get_settings():
    """获取系统设置"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT algo_types, tech_methods, annotation_types, sites, sources FROM settings WHERE id = 1')
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            'algo_types': json.loads(row[0]) if row[0] else ["路面积水检测","漂浮物检测","墙面裂缝检测","游泳检测","其他"],
            'tech_methods': json.loads(row[1]) if row[1] else ["目标检测算法","实例分割算法"],
            'annotation_types': json.loads(row[2]) if row[2] else ["YOLO格式","VOC格式","COCO格式"],
            'sites': json.loads(row[3]) if row[3] else ["苏北灌溉总渠","南水北调宝应站","慈溪北排","慈溪周巷","瓯江引水","互联网"],
            'sources': json.loads(row[4]) if row[4] else ["互联网","本地采集","合作伙伴","公开数据集"]
        }
    return {
        'algo_types': ["路面积水检测","漂浮物检测","墙面裂缝检测","游泳检测","其他"],
        'tech_methods': ["目标检测算法","实例分割算法"],
        'annotation_types': ["YOLO格式","VOC格式","COCO格式"],
        'sites': ["苏北灌溉总渠","南水北调宝应站","慈溪北排","慈溪周巷","瓯江引水","互联网"],
        'sources': ["互联网","本地采集","合作伙伴","公开数据集"]
    }


def update_settings(algo_types=None, tech_methods=None, annotation_types=None, sites=None, sources=None):
    """更新系统设置"""
    conn = get_connection()
    cursor = conn.cursor()

    if algo_types is not None:
        cursor.execute('UPDATE settings SET algo_types = ?, updated_at = ? WHERE id = 1',
            (json.dumps(algo_types, ensure_ascii=False), datetime.now().isoformat()))
    if tech_methods is not None:
        cursor.execute('UPDATE settings SET tech_methods = ?, updated_at = ? WHERE id = 1',
            (json.dumps(tech_methods, ensure_ascii=False), datetime.now().isoformat()))
    if annotation_types is not None:
        cursor.execute('UPDATE settings SET annotation_types = ?, updated_at = ? WHERE id = 1',
            (json.dumps(annotation_types, ensure_ascii=False), datetime.now().isoformat()))
    if sites is not None:
        cursor.execute('UPDATE settings SET sites = ?, updated_at = ? WHERE id = 1',
            (json.dumps(sites, ensure_ascii=False), datetime.now().isoformat()))
    if sources is not None:
        cursor.execute('UPDATE settings SET sources = ?, updated_at = ? WHERE id = 1',
            (json.dumps(sources, ensure_ascii=False), datetime.now().isoformat()))

    conn.commit()
    conn.close()


def add_model(data):
    """添加模型"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR REPLACE INTO models
        (name, algo_name, tech_method, category, accuracy, description, site, dataset, maintain_date, maintainer, preview_count, model_type, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'),
        data.get('algo_name'),
        data.get('tech_method', '目标检测算法'),
        data.get('category'),
        data.get('accuracy', 0),
        data.get('description'),
        data.get('site'),
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


def update_dataset(name, data):
    """更新数据集信息
    
    Args:
        name: 数据集名称
        data: 字典，包含要更新的字段如 algo_type, tech_method, source 等
    
    Returns:
        bool: 更新是否成功
    """
    conn = get_connection()
    cursor = conn.cursor()

    # 构建更新语句
    updates = []
    params = []
    
    # algo_type 字段
    if 'algoType' in data and data['algoType'] is not None:
        updates.append("algo_type = ?")
        params.append(data['algoType'])
    elif 'algo_type' in data and data['algo_type'] is not None:
        updates.append("algo_type = ?")
        params.append(data['algo_type'])
    
    # tech_method 字段
    if 'techMethod' in data and data['techMethod'] is not None:
        updates.append("tech_method = ?")
        params.append(data['techMethod'])
    elif 'tech_method' in data and data['tech_method'] is not None:
        updates.append("tech_method = ?")
        params.append(data['tech_method'])
    
    # source 字段
    if 'source' in data and data['source'] is not None:
        updates.append("source = ?")
        params.append(data['source'])
    
    # class_info 字段
    if 'class_info' in data and data['class_info'] is not None:
        updates.append("class_info = ?")
        params.append(data['class_info'])
    
    if not updates:
        conn.close()
        return False

    params.append(name)
    sql = f"UPDATE datasets SET {', '.join(updates)} WHERE name = ?"
    
    cursor.execute(sql, params)
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    
    return affected > 0


def update_model_by_name(name, data):
    """更新模型信息"""
    conn = get_connection()
    cursor = conn.cursor()

    # 构建更新语句
    set_clause = []
    values = []
    for key, value in data.items():
        set_clause.append(f"{key} = ?")
        values.append(value)

    if not set_clause:
        conn.close()
        return False

    values.append(name)
    sql = f"UPDATE models SET {', '.join(set_clause)}, updated_at = CURRENT_TIMESTAMP WHERE name = ?"

    cursor.execute(sql, values)
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


# ==================== 模型版本管理 ====================

def add_model_version(data):
    """创建模型版本"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO model_versions 
        (model_name, version_name, description, dataset_name, dataset_version,
         accuracy, map50, map50_95, total_epochs, storage_path, created_by, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('model_name'),
        data.get('version_name'),
        data.get('description'),
        data.get('dataset_name'),
        data.get('dataset_version'),
        data.get('accuracy', 0),
        data.get('map50', 0),
        data.get('map50_95', 0),
        data.get('total_epochs', 0),
        data.get('storage_path'),
        data.get('created_by'),
        data.get('is_default', 0)
    ))
    conn.commit()
    version_id = cursor.lastrowid
    conn.close()
    return version_id


def get_model_versions(model_name):
    """获取模型的所有版本"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM model_versions 
        WHERE model_name = ? AND is_active = 1
        ORDER BY created_at DESC
    ''', (model_name,))
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_model_version_by_name(model_name, version_name):
    """根据模型名和版本名获取版本详情"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM model_versions 
        WHERE model_name = ? AND version_name = ? AND is_active = 1
    ''', (model_name, version_name))
    
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_model_version_by_id(version_id):
    """根据ID获取版本详情"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM model_versions WHERE id = ?', (version_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_model_version(model_name, version_name, data):
    """更新模型版本信息"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 构建更新字段
    updates = []
    params = []
    
    for field in ['description', 'dataset_name', 'dataset_version', 'accuracy', 
                  'map50', 'map50_95', 'total_epochs']:
        if field in data:
            updates.append(f'{field} = ?')
            params.append(data[field])
    
    if updates:
        params.extend([model_name, version_name])
        cursor.execute(
            f"UPDATE model_versions SET {', '.join(updates)} "
            f"WHERE model_name = ? AND version_name = ? AND is_active = 1",
            params
        )
        conn.commit()
    
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def delete_model_version(model_name, version_name):
    """软删除模型版本"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE model_versions SET is_active = 0
        WHERE model_name = ? AND version_name = ?
    ''', (model_name, version_name))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def set_default_model_version(model_name, version_name):
    """设置默认版本"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 先取消该模型的所有默认标记
    cursor.execute('UPDATE model_versions SET is_default = 0 WHERE model_name = ?', (model_name,))
    
    # 设置新的默认版本
    cursor.execute('''
        UPDATE model_versions SET is_default = 1
        WHERE model_name = ? AND version_name = ? AND is_active = 1
    ''', (model_name, version_name))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def get_default_model_version(model_name):
    """获取模型的默认版本"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM model_versions 
        WHERE model_name = ? AND is_default = 1 AND is_active = 1
    ''', (model_name,))
    
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


# ==================== 模型参数文件管理 ====================

def add_model_param(data):
    """添加模型参数文件"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO model_params 
        (version_id, param_type, file_name, file_path, file_size, file_hash, description, is_primary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('version_id'),
        data.get('param_type'),
        data.get('file_name'),
        data.get('file_path'),
        data.get('file_size', 0),
        data.get('file_hash'),
        data.get('description'),
        data.get('is_primary', 0)
    ))
    conn.commit()
    param_id = cursor.lastrowid
    conn.close()
    return param_id


def get_model_params(version_id):
    """获取版本的所有参数文件"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM model_params WHERE version_id = ? ORDER BY created_at DESC', (version_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_model_param_by_id(param_id):
    """根据ID获取参数文件"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM model_params WHERE id = ?', (param_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_model_param(param_id):
    """删除参数文件"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM model_params WHERE id = ?', (param_id,))
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

    cursor.execute('SELECT COUNT(*) as count, SUM(total) as total_images, SUM(img_count_train) as total_train, SUM(img_count_val) as total_val, SUM(img_count_test) as total_test FROM datasets')
    row = cursor.fetchone()
    conn.close()

    return {
        'count': row[0] or 0,
        'total_images': row[1] or 0,
        'total_train': row[2] or 0,
        'total_val': row[3] or 0,
        'total_test': row[4] or 0
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


# ========== 原始数据管理 ==========
def add_raw_data(data):
    """添加原始数据"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR REPLACE INTO raw_data
        (name, algo_type, description, dataset, source, is_annotated, maintain_date, maintainer, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'),
        data.get('algo_type'),
        data.get('description'),
        data.get('dataset'),
        data.get('source'),
        1 if data.get('is_annotated') else 0,
        data.get('maintain_date'),
        data.get('maintainer'),
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()


def get_all_raw_data():
    """获取所有原始数据"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM raw_data ORDER BY id')
    rows = cursor.fetchall()
    conn.close()

    raw_data_list = []
    for row in rows:
        raw_data_list.append(dict(row))

    return raw_data_list


def delete_raw_data_by_name(name):
    """删除原始数据"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM raw_data WHERE name = ?', (name,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()

    return affected > 0


def update_raw_data(name, data):
    """更新原始数据信息"""
    conn = get_connection()
    cursor = conn.cursor()

    # 构建更新语句
    set_clause = []
    values = []
    for key, value in data.items():
        if key not in ('id', 'name', 'created_at'):
            set_clause.append(f"{key} = ?")
            values.append(value)

    if not set_clause:
        conn.close()
        return False

    values.append(name)
    sql = f"UPDATE raw_data SET {', '.join(set_clause)}, updated_at = CURRENT_TIMESTAMP WHERE name = ?"

    cursor.execute(sql, values)
    conn.commit()
    affected = cursor.rowcount
    conn.close()

    return affected > 0


# ========== 应用现场管理 ==========
def add_site(data):
    """添加应用现场"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR REPLACE INTO sites
        (name, description, dataset, model, maintain_date, maintainer, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'),
        data.get('description'),
        data.get('dataset'),
        data.get('model'),
        data.get('maintain_date'),
        data.get('maintainer'),
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()


def get_all_sites():
    """获取所有应用现场"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM sites ORDER BY id')
    rows = cursor.fetchall()
    conn.close()

    sites_list = []
    for row in rows:
        sites_list.append(dict(row))

    return sites_list


def delete_site_by_name(name):
    """删除应用现场"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM sites WHERE name = ?', (name,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()

    return affected > 0


def update_site(name, data):
    """更新应用现场信息"""
    conn = get_connection()
    cursor = conn.cursor()

    # 构建更新语句
    set_clause = []
    values = []
    for key, value in data.items():
        if key not in ('id', 'name', 'created_at'):
            set_clause.append(f"{key} = ?")
            values.append(value)

    if not set_clause:
        conn.close()
        return False

    values.append(name)
    sql = f"UPDATE sites SET {', '.join(set_clause)}, updated_at = CURRENT_TIMESTAMP WHERE name = ?"

    cursor.execute(sql, values)
    conn.commit()
    affected = cursor.rowcount
    conn.close()

    return affected > 0


# ==================== 数据集版本管理 ====================

def create_dataset_version(dataset_name, version, description=None, created_by=None, 
                           file_count=0, file_hash=None, parent_version=None,
                           total=0, class_info=None):
    """创建数据集版本"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO dataset_versions 
        (dataset_name, version, description, created_by, file_count, file_hash, parent_version, total, class_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (dataset_name, version, description, created_by, file_count, file_hash, parent_version, total, 
          json.dumps(class_info) if class_info else None))
    
    conn.commit()
    version_id = cursor.lastrowid
    conn.close()
    return version_id


def get_dataset_versions(dataset_name):
    """获取数据集的所有版本"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM dataset_versions 
        WHERE dataset_name = ? AND is_active = 1
        ORDER BY created_at DESC
    ''', (dataset_name,))
    
    rows = cursor.fetchall()
    conn.close()
    
    versions = []
    for row in rows:
        v = dict(row)
        if v.get('class_info'):
            v['class_info'] = json.loads(v['class_info'])
        versions.append(v)
    
    return versions


def get_dataset_version_by_id(version_id):
    """根据ID获取版本详情"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM dataset_versions WHERE id = ?', (version_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        v = dict(row)
        if v.get('class_info'):
            v['class_info'] = json.loads(v['class_info'])
        return v
    return None


def get_latest_version(dataset_name):
    """获取数据集的最新版本"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM dataset_versions 
        WHERE dataset_name = ? AND is_active = 1
        ORDER BY created_at DESC LIMIT 1
    ''', (dataset_name,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        v = dict(row)
        if v.get('class_info'):
            v['class_info'] = json.loads(v['class_info'])
        return v
    return None


def compare_versions(version_id1, version_id2):
    """对比两个版本的差异"""
    v1 = get_dataset_version_by_id(version_id1)
    v2 = get_dataset_version_by_id(version_id2)
    
    if not v1 or not v2:
        return None
    
    return {
        "version1": v1,
        "version2": v2,
        "changes": {
            "file_count_diff": (v2.get('file_count') or 0) - (v1.get('file_count') or 0),
            "total_diff": (v2.get('total') or 0) - (v1.get('total') or 0),
        }
    }


def delete_dataset_version(version_id):
    """软删除版本 (设置is_active=0)"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('UPDATE dataset_versions SET is_active = 0 WHERE id = ?', (version_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


# ==================== 审计日志函数 ====================

def add_audit_log(user_id, username, action, resource_type=None, resource_name=None, 
                   details=None, ip_address=None, user_agent=None, status='success', 
                   error_message=None):
    """添加审计日志"""
    conn = get_connection()
    cursor = conn.cursor()
    
    details_json = json.dumps(details) if details else None
    
    cursor.execute('''
        INSERT INTO audit_logs 
        (user_id, username, action, resource_type, resource_name, details, 
         ip_address, user_agent, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, username, action, resource_type, resource_name, details_json,
          ip_address, user_agent, status, error_message))
    
    conn.commit()
    conn.close()


def get_audit_logs(limit=100, offset=0, user_id=None, action=None, resource_type=None,
                   start_date=None, end_date=None):
    """获取审计日志列表"""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM audit_logs WHERE 1=1'
    params = []
    
    if user_id:
        query += ' AND user_id = ?'
        params.append(user_id)
    
    if action:
        query += ' AND action = ?'
        params.append(action)
    
    if resource_type:
        query += ' AND resource_type = ?'
        params.append(resource_type)
    
    if start_date:
        query += ' AND created_at >= ?'
        params.append(start_date)
    
    if end_date:
        query += ' AND created_at <= ?'
        params.append(end_date)
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_audit_stats(days=7):
    """获取审计统计数据"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 获取每日操作统计
    cursor.execute('''
        SELECT DATE(created_at) as date, action, COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= DATE('now', '-' || ? || ' days')
        GROUP BY DATE(created_at), action
        ORDER BY date DESC
    ''', (days,))
    
    daily_stats = [dict(row) for row in cursor.fetchall()]
    
    # 获取用户操作统计
    cursor.execute('''
        SELECT username, COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= DATE('now', '-' || ? || ' days')
        GROUP BY username
        ORDER BY count DESC
        LIMIT 10
    ''', (days,))
    
    user_stats = [dict(row) for row in cursor.fetchall()]
    
    # 获取资源操作统计
    cursor.execute('''
        SELECT resource_type, action, COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= DATE('now', '-' || ? || ' days')
        GROUP BY resource_type, action
        ORDER BY count DESC
    ''', (days,))
    
    resource_stats = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        'daily_stats': daily_stats,
        'user_stats': user_stats,
        'resource_stats': resource_stats
    }


def get_usage_stats(period='day', days=30):
    """获取使用统计信息
    
    Args:
        period: 统计周期 - 'day'(按日), 'week'(按周), 'month'(按月)
        days: 统计天数范围
    
    Returns:
        包含数据集上传数、模型上传数、原始数据上传数、活跃用户数的统计
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # 根据周期确定日期范围
    if period == 'day':
        date_format = '%Y-%m-%d'
        date_trunc = "DATE(created_at)"
    elif period == 'week':
        date_format = '%Y-%u'
        date_trunc = "strftime('%Y-W%W', created_at)"
    else:  # month
        date_format = '%Y-%m'
        date_trunc = "strftime('%Y-%m', created_at)"
    
    # 数据集上传统计
    cursor.execute(f'''
        SELECT {date_trunc} as date_period, COUNT(*) as count
        FROM datasets
        WHERE created_at >= DATE('now', '-' || ? || ' days')
        GROUP BY date_period
        ORDER BY date_period
    ''', (days,))
    dataset_stats = [dict(row) for row in cursor.fetchall()]
    
    # 模型上传统计
    cursor.execute(f'''
        SELECT {date_trunc} as date_period, COUNT(*) as count
        FROM models
        WHERE created_at >= DATE('now', '-' || ? || ' days')
        GROUP BY date_period
        ORDER BY date_period
    ''', (days,))
    model_stats = [dict(row) for row in cursor.fetchall()]
    
    # 原始数据上传统计
    cursor.execute(f'''
        SELECT {date_trunc} as date_period, COUNT(*) as count
        FROM raw_data
        WHERE created_at >= DATE('now', '-' || ? || ' days')
        GROUP BY date_period
        ORDER BY date_period
    ''', (days,))
    raw_data_stats = [dict(row) for row in cursor.fetchall()]
    
    # 活跃用户统计（基于审计日志）
    cursor.execute('''
        SELECT COUNT(DISTINCT username) as count
        FROM audit_logs
        WHERE created_at >= DATE('now', '-' || ? || ' days')
    ''', (days,))
    row = cursor.fetchone()
    active_users = row[0] if row else 0
    
    # 每日用户活跃详情（用于前端图表）
    cursor.execute(f'''
        SELECT {date_trunc} as date_period, COUNT(DISTINCT username) as count
        FROM audit_logs
        WHERE created_at >= DATE('now', '-' || ? || ' days')
        GROUP BY date_period
        ORDER BY date_period
    ''', (days,))
    user_activity_stats = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    # 汇总数据
    total_datasets = sum(s['count'] for s in dataset_stats)
    total_models = sum(s['count'] for s in model_stats)
    total_raw_data = sum(s['count'] for s in raw_data_stats)
    
    return {
        'period': period,
        'days': days,
        'summary': {
            'total_datasets': total_datasets,
            'total_models': total_models,
            'total_raw_data': total_raw_data,
            'active_users': active_users
        },
        'daily': {
            'datasets': dataset_stats,
            'models': model_stats,
            'raw_data': raw_data_stats,
            'users': user_activity_stats
        }
    }


if __name__ == '__main__':
    init_database()
    print(f"Database initialized at: {DB_PATH}")
