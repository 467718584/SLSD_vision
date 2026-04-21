#!/usr/bin/env python3
"""
批量为已有数据集生成图表
用法: python scripts/generate_charts.py [--dataset <name>]
"""

import sys
import os

# 将 SLSD_vision 目录加入路径
script_dir = os.path.dirname(os.path.abspath(__file__))
slsd_dir = os.path.dirname(script_dir)
sys.path.insert(0, slsd_dir)

from modules.dataset_manager import generate_dataset_charts, list_datasets
from config import DATASETS_DIR


def generate_all_charts():
    """为所有已有数据集生成图表"""
    datasets = list_datasets()
    
    if not datasets:
        print("未找到任何数据集")
        return
    
    print(f"共找到 {len(datasets)} 个数据集")
    
    success = 0
    failed = 0
    
    for ds in datasets:
        name = ds.get('name')
        if not name:
            continue
        
        dataset_path = os.path.join(DATASETS_DIR, name)
        metadata_path = os.path.join(dataset_path, 'metadata.json')
        
        class_info = None
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    class_info = metadata.get('class_info')
            except Exception as e:
                print(f"  读取 {name} 的 metadata.json 失败: {e}")
        
        charts_dir = os.path.join(dataset_path, 'charts')
        detail_png = os.path.join(charts_dir, 'detail.png')
        dist_png = os.path.join(charts_dir, 'distribution.png')
        
        if os.path.exists(detail_png) and os.path.exists(dist_png):
            print(f"[跳过] {name} 图表已存在")
            continue
        
        print(f"[生成中] {name} ...", end=' ')
        try:
            result = generate_dataset_charts(name, class_info)
            if result:
                print("✓")
                success += 1
            else:
                print("✗ (失败)")
                failed += 1
        except Exception as e:
            print(f"✗ (异常: {e})")
            failed += 1
    
    print(f"\n完成: 成功 {success}, 失败 {failed}")


def generate_single_chart(dataset_name: str):
    """为指定数据集生成图表"""
    dataset_path = os.path.join(DATASETS_DIR, dataset_name)
    
    if not os.path.exists(dataset_path):
        print(f"数据集 {dataset_name} 不存在")
        return
    
    metadata_path = os.path.join(dataset_path, 'metadata.json')
    class_info = None
    
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
                class_info = metadata.get('class_info')
                print(f"读取到 class_info: {class_info}")
        except Exception as e:
            print(f"读取 metadata.json 失败: {e}")
    
    print(f"正在为数据集 {dataset_name} 生成图表 ...")
    try:
        result = generate_dataset_charts(dataset_name, class_info)
        if result:
            print(f"✓ 图表生成成功: {dataset_path}/charts/")
        else:
            print("✗ 图表生成失败")
    except Exception as e:
        print(f"✗ 异常: {e}")


if __name__ == '__main__':
    import json
    
    if len(sys.argv) >= 3 and sys.argv[1] == '--dataset':
        generate_single_chart(sys.argv[2])
    else:
        generate_all_charts()
