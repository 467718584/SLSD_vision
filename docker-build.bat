@echo off
REM Docker 构建和运行脚本 (Windows)

echo === 机器视觉管理平台 Docker 构建脚本 ===

REM 检查Docker是否安装
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: Docker 未安装
    exit /b 1
)

REM 检查docker-compose是否安装
where docker-compose >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 警告: docker-compose 未安装，将使用 docker build
    set USE_DOCKER_COMPOSE=false
) else (
    set USE_DOCKER_COMPOSE=true
)

echo 正在构建Docker镜像...
if "%USE_DOCKER_COMPOSE%"=="true" (
    docker-compose build
) else (
    docker build -t sldsvision/platform .
)

echo 构建完成!

REM 询问是否启动
set /p response=是否启动容器? (y/n):
if /i "%response%"=="y" (
    echo 正在启动容器...
    if "%USE_DOCKER_COMPOSE%"=="true" (
        docker-compose up -d
    ) else (
        docker run -d -p 8501:8501 -v "%cd%\data:/app/data" --name sldsvision-platform sldsvision/platform
    )
    echo 容器已启动!
    echo 访问地址: http://localhost:8501
)

echo 完成!
pause
