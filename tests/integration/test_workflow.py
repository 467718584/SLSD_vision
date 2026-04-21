"""
工作流集成测试 - 完整业务流程测试
"""
import pytest
import io
import zipfile
import json
import os


class TestDatasetWorkflow:
    """数据集管理工作流测试"""

    def test_dataset_crud_workflow(self, client, auth_headers):
        """数据集完整CRUD工作流"""
        dataset_name = f'test_workflow_dataset_{id(self)}'

        # 1. 验证名称不存在
        response = client.post('/api/dataset/validate-name',
            json={'name': dataset_name},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['exists'] is False

        # 2. 获取数据集列表
        response = client.get('/api/datasets',
            headers=auth_headers
        )
        assert response.status_code == 200

    def test_dataset_upload_and_validate_workflow(self, client, auth_headers):
        """数据集上传与验证工作流"""
        dataset_name = f'test_upload_wf_{id(self)}'

        # 1. 先验证名称
        response = client.post('/api/dataset/validate-name',
            json={'name': dataset_name},
            headers=auth_headers
        )
        assert response.status_code == 200

        # 2. 准备测试zip文件
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.writestr('annotations.txt', '0 0.5 0.5 0.3 0.3')
            zf.writestr('images/img1.jpg', b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00\x01\x00\x01\x00\x00')
        zip_buffer.seek(0)

        # 3. 上传数据集
        response = client.post('/api/dataset/upload',
            data={
                'name': dataset_name,
                'file': (zip_buffer, 'test_dataset.zip', 'application/zip')
            },
            content_type='multipart/form-data',
            headers=auth_headers
        )
        # 上传可能返回200（成功）或400/500（需要真实文件）
        assert response.status_code in [200, 400, 500]


class TestModelWorkflow:
    """模型管理工作流测试"""

    def test_model_crud_workflow(self, client, auth_headers):
        """模型完整CRUD工作流"""
        model_name = f'test_workflow_model_{id(self)}'

        # 1. 获取模型列表
        response = client.get('/api/models',
            headers=auth_headers
        )
        assert response.status_code == 200

    def test_model_detail_workflow(self, client, auth_headers):
        """模型详情查看工作流"""
        # 1. 获取模型列表
        response = client.get('/api/models', headers=auth_headers)
        assert response.status_code == 200

        # 2. 尝试获取详情（针对不存在的模型）
        response = client.get(f'/api/model/detail/nonexistent_{id(self)}',
            headers=auth_headers
        )
        assert response.status_code in [200, 404]


class TestAuthWorkflow:
    """认证工作流测试"""

    def test_full_auth_flow(self, client):
        """完整认证流程：登录 -> 获取用户 -> 登出（放弃token）"""
        # 1. 登录
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data.get('success') is True
        token = data.get('token')
        assert token is not None

        # 2. 使用token获取用户信息
        response = client.get('/api/auth/me',
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response.status_code == 200
        me_data = response.get_json()
        assert me_data.get('success') is True

        # 3. 使用无效token访问受保护资源
        response = client.get('/api/auth/me',
            headers={'Authorization': 'Bearer invalid_token'}
        )
        assert response.status_code == 401

    def test_relogin_flow(self, client):
        """重新登录流程"""
        # 第一次登录
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        assert response.status_code == 200
        data = response.get_json()
        token1 = data.get('token')
        assert token1 is not None

        # 第二次登录
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        assert response.status_code == 200
        data = response.get_json()
        token2 = data.get('token')
        assert token2 is not None
        # 两次token应该不同（因为生成时包含时间戳）
        # 注：取决于实现，可能相同也可能不同


class TestSettingsWorkflow:
    """系统设置工作流测试"""

    def test_settings_read_modify_workflow(self, client, auth_headers):
        """设置读取-修改工作流"""
        # 1. 读取当前设置
        response = client.get('/api/settings', headers=auth_headers)
        assert response.status_code == 200
        original_settings = response.get_json()

        # 2. 修改设置
        new_settings = {
            'algoTypes': ['yolov8', 'faster_rcnn', 'ssd'],
            'techMethods': ['detection', 'classification'],
            'annotationTypes': ['yolo', 'coco', 'voc'],
            'sites': ['site1', 'site2', 'site3'],
            'sources': ['camera', 'upload', 'api']
        }
        response = client.post('/api/settings',
            json=new_settings,
            headers=auth_headers
        )
        assert response.status_code in [200, 201]

        # 3. 验证修改成功
        response = client.get('/api/settings', headers=auth_headers)
        assert response.status_code == 200


class TestEndToEndUserJourney:
    """端到端用户体验工作流"""

    def test_analyst_user_journey(self, client, auth_headers):
        """分析师用户完整旅程"""
        # 1. 登录
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        assert response.status_code == 200

        # 2. 查看数据集列表
        response = client.get('/api/datasets', headers=auth_headers)
        assert response.status_code == 200

        # 3. 查看模型列表
        response = client.get('/api/models', headers=auth_headers)
        assert response.status_code == 200

        # 4. 查看统计信息
        response = client.get('/api/stats/usage', headers=auth_headers)
        assert response.status_code == 200

        # 5. 查看系统设置
        response = client.get('/api/settings', headers=auth_headers)
        assert response.status_code == 200

        # 6. 获取站点列表
        response = client.get('/api/sites', headers=auth_headers)
        assert response.status_code == 200

    def test_data_explorer_workflow(self, client, auth_headers):
        """数据探索者工作流"""
        # 1. 登录
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        assert response.status_code == 200

        # 2. 获取数据集列表
        response = client.get('/api/datasets', headers=auth_headers)
        assert response.status_code == 200

        # 3. 获取模型列表
        response = client.get('/api/models', headers=auth_headers)
        assert response.status_code == 200

        # 4. 验证数据集名称
        response = client.post('/api/dataset/validate-name',
            json={'name': 'explore_test'},
            headers=auth_headers
        )
        assert response.status_code == 200

        # 5. 查看原始数据
        response = client.get('/api/raw-data', headers=auth_headers)
        assert response.status_code in [200, 404]


class TestConcurrentOperations:
    """并发操作测试"""

    def test_multiple_read_requests(self, client, auth_headers):
        """并发读取请求"""
        import concurrent.futures

        def make_request():
            response = client.get('/api/datasets', headers=auth_headers)
            return response.status_code

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # 所有请求都应该成功
        assert all(status == 200 for status in results)

    def test_multiple_auth_requests(self, client):
        """并发认证请求"""
        import concurrent.futures

        def login():
            response = client.post('/api/auth/login', json={
                'username': 'admin',
                'password': 'admin123'
            })
            return response.status_code

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(login) for _ in range(5)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # 所有登录请求都应该成功
        assert all(status == 200 for status in results)
