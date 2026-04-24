#!/usr/bin/env python3
"""模拟Flask API调用"""
import sys
sys.path.insert(0, '/home/ubuntu/SLSD_vision')

# 模拟Flask应用的环境
from modules.database import get_all_models
from flask import Flask, jsonify
import json

app = Flask(__name__)

@app.route('/api/models')
def api_models():
    models = get_all_models()
    return jsonify(models)

if __name__ == '__main__':
    with app.test_client() as client:
        response = client.get('/api/models')
        data = json.loads(response.data)
        m = data[0] if data else {}
        print("version_count:", m.get('version_count'))
        print("keys:", [k for k in m.keys() if 'version' in k.lower()])
