#!/bin/bash

# Docker 构建和运行脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 机器视觉管理平台 Docker 构建脚本 ===${NC}"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}警告: docker-compose 未安装，将使用 docker build${NC}"
    USE_DOCKER_COMPOSE=false
else
    USE_DOCKER_COMPOSE=true
fi

# 构建镜像
echo -e "${YELLOW}正在构建Docker镜像...${NC}"
if [ "$USE_DOCKER_COMPOSE" = true ]; then
    docker-compose build
else
    docker build -t sldsvision/platform .
fi

echo -e "${GREEN}构建完成!${NC}"

# 询问是否启动
echo -e "${YELLOW}是否启动容器? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}正在启动容器...${NC}"
    if [ "$USE_DOCKER_COMPOSE" = true ]; then
        docker-compose up -d
    else
        docker run -d -p 8501:8501 -v "$(pwd)/data:/app/data" --name sldsvision-platform sldsvision/platform
    fi
    echo -e "${GREEN}容器已启动!${NC}"
    echo -e "访问地址: http://localhost:8501"
fi

echo -e "${GREEN}完成!${NC}"
