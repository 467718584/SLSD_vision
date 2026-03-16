# 机器视觉管理平台 Dockerfile
#
# 构建镜像: docker build -t sldsvision/platform .
# 运行容器: docker run -d -p 8501:8501 -v $(pwd)/data:/app/data sldsvision/platform
#

FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/data/datasets /app/data/models

# 暴露端口
EXPOSE 8501

# 启动命令
CMD ["python", "server.py"]
