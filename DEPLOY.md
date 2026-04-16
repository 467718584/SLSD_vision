# 部署指南

## ☁️ 云服务器信息

| 项目 | 值 |
|------|-----|
| IP | 1.13.247.173 |
| 用户名 | ubuntu |
| 密码 | Zzy2047840648 |

## 🚀 快速部署命令

### 1. 本地构建
```bash
cd /home/zzy/.openclaw/workspace/workspace-image-platform/SLSD_vision/frontend
npm run build
```

### 2. 上传到云服务器
```bash
# 上传静态资源
scp -r ./dist/assets/* ubuntu@1.13.247.173:/var/www/html/slsd-vision/assets/

# 上传index.html
scp ./dist/index.html ubuntu@1.13.247.173:/var/www/html/slsd-vision/

# 或者一键部署
./deploy.sh
```

### 3. 重载Nginx
```bash
sshpass -p 'Zzy2047840648' ssh ubuntu@1.13.247.173 "sudo nginx -t && sudo systemctl reload nginx"
```

## 📁 目录结构

```
云服务器:
  /var/www/html/slsd-vision/     # 前端静态文件
    ├── index.html
    └── assets/
          ├── index-XXXXX.js     # 主bundle
          ├── react-vendor-XXX.js
          └── index-XXX.css

本地:
  /home/zzy/.openclaw/workspace/workspace-image-platform/SLSD_vision/
    ├── frontend/                 # 前端源码
    │   ├── src/
    │   └── dist/               # 构建产物
    └── server.py               # 后端Flask服务
```

## 🌐 访问地址

| 服务 | 地址 |
|------|------|
| 前端 (外部代理) | http://1.13.247.173/slsd-vision/ |
| API (外部代理) | http://1.13.247.173/slsd-vision/api/ |
| 前端 (本地) | http://192.168.72.131:8501/slsd-vision/ |
| API (本地) | http://192.168.72.131:8501/api/ |

## 🔧 故障排查

### 清除浏览器缓存
- Ctrl+Shift+R (强制刷新)
- 或使用隐身模式

### Nginx相关
```bash
# 检查nginx状态
sshpass -p 'Zzy2047840648' ssh ubuntu@1.13.247.173 "sudo systemctl status nginx"

# 查看nginx错误日志
sshpass -p 'Zzy2047840648' ssh ubuntu@1.13.247.173 "sudo tail -20 /var/log/nginx/error.log"
```

### 后端服务
```bash
# 查看后端日志
tail -f /home/zzy/.openclaw/workspace/workspace-image-platform/SLSD_vision/logs/server_test.log
```
