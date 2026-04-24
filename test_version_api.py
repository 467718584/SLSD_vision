#!/usr/bin/env python3
"""测试模型版本API"""
import sys
sys.path.insert(0, '/home/ubuntu/SLSD_vision')

from modules.database import get_all_models, get_model_versions

print("=== Testing get_all_models ===")
models = get_all_models()
print(f"Found {len(models)} models")
for m in models:
    print(f"  Model: {m.get('name')}")
    print(f"    version_count: {m.get('version_count')}")
    print(f"    latest_version: {m.get('latest_version')}")

print("\n=== Testing get_model_versions ===")
versions = get_model_versions('yolo_v8')
print(f"Found {len(versions)} versions for yolo_v8")
for v in versions:
    print(f"  {v.get('version_name')}: accuracy={v.get('accuracy')}")
