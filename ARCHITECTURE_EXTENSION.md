# SLSD Vision Platform 扩展性架构设计

> 版本: v1.0  
> 日期: 2026-04-22  
> 状态: 设计中

---

## 1. 总体架构

### 1.1 平台定位

```
┌─────────────────────────────────────────────────────────────┐
│                    SLSD Vision Platform                      │
│                      (主平台 / 门户)                          │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│   低代码    │  视觉大模型  │   数据标注   │    机器视觉      │
│   平台      │    平台      │    平台      │   (当前主业)     │
│ (规划中)   │  (规划中)    │  (规划中)    │    (现有)        │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

### 1.2 架构分层

```
┌────────────────────────────────────────────────────────────┐
│                     Frontend (微前端层)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 主平台    │  │ 低代码   │  │ 大模型   │  │ 数据标注 │  │
│  │ Shell    │  │ 子应用   │  │ 子应用   │  │ 子应用   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├────────────────────────────────────────────────────────────┤
│                     API Gateway (统一入口)                   │
│        路由转发 / 鉴权 / 限流 / 监控 / 日志                   │
├────────────────────────────────────────────────────────────┤
│                     Backend Services (服务层)               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ 主平台  │ │ 低代码 │ │ 大模型 │ │ 数据标注│ │ 公共   │  │
│  │ 服务   │ │ 服务   │ │ 服务   │ │ 服务   │ │ 服务   │  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │
├────────────────────────────────────────────────────────────┤
│                     Data Layer (数据层)                     │
│     共享数据库        │        隔离数据库                   │
│   (用户/权限/配置)    │    (各子平台独立数据)                │
└────────────────────────────────────────────────────────────┘
```

### 1.3 微前端架构

| 技术方案 | 适用场景 | 推荐指数 |
|---------|---------|---------|
| qiankun | Vue技术栈，成熟稳定 | ⭐⭐⭐⭐⭐ |
| single-spa | 多框架共存 | ⭐⭐⭐ |
| iframe | 简单隔离场景 | ⭐⭐ |

**推荐: qiankun**
- 基于乾坤，支持 Vue/React/Vue3
- 沙箱隔离，样式隔离
- 预加载子应用

---

## 2. 菜单系统

### 2.1 动态菜单模型

```typescript
interface MenuItem {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  component?: string;        // 子应用组件
  platform: 'main' | 'lowcode' | 'vision' | 'annotation';
  icon?: string;
  order: number;
  visible: boolean;
  permission?: string[];
  meta?: {
    title: string;
    icon?: string;
    keepAlive?: boolean;
  };
}
```

### 2.2 权限控制

```
角色: 超级管理员 | 平台管理员 | 普通用户 | 访客

权限矩阵:
┌─────────────┬─────────┬─────────┬─────────┬──────────┐
│   功能      │ 超级管理│ 平台管理│ 普通用户│   访客   │
├─────────────┼─────────┼─────────┼─────────┼──────────┤
│ 主平台管理  │   ✓    │   ✓    │   R    │    -    │
│ 低代码平台  │   ✓    │   ✓    │   ✓    │    -    │
│ 视觉大模型  │   ✓    │   ✓    │   ✓    │    -    │
│ 数据标注    │   ✓    │   ✓    │   ✓    │    R    │
│ 用户管理    │   ✓    │   ✓    │   -    │    -    │
│ 系统配置    │   ✓    │   -    │   -    │    -    │
└─────────────┴─────────┴─────────┴─────────┴──────────┘
✓ = 完全控制, R = 只读, - = 无权限
```

### 2.3 菜单加载流程

```
用户登录
    ↓
获取用户角色 + 权限列表
    ↓
后端返回可访问菜单树
    ↓
主平台 Shell 动态渲染菜单
    ↓
根据 platform 字段决定跳转子应用
```

---

## 3. API网关

### 3.1 网关职责

| 功能 | 说明 |
|-----|-----|
| 路由转发 | 根据 path 转发到对应子服务 |
| 统一鉴权 | JWT Token 验证 |
| 限流熔断 | 保护后端服务 |
| 日志监控 | 请求追踪 |
| CORS | 跨域处理 |

### 3.2 路由设计

```
API 结构:
/api/v1/main/*        → 主平台服务
/api/v1/vision/*      → 机器视觉服务
/api/v1/lowcode/*     → 低代码平台服务
/api/v1/vlm/*         → 视觉大模型服务
/api/v1/annotation/*  → 数据标注服务
/api/v1/common/*      → 公共服务（用户/权限）
```

### 3.3 服务间通信

```
┌─────────────┐      gRPC       ┌─────────────┐
│  主平台服务  │ ←────────────→ │  子平台服务  │
└─────────────┘                 └─────────────┘
       ↑                              ↑
       │         HTTP/REST            │
       └──────────────────────────────┘
              (通过API Gateway)
```

**通信协议选择:**
- 同步调用: HTTP/REST (通过网关)
- 异步消息: RabbitMQ / Kafka
- 服务间调用: gRPC (内网)

---

## 4. 数据隔离

### 4.1 数据分类

| 数据类型 | 存储策略 | 示例 |
|---------|---------|-----|
| 用户数据 | **共享** | 用户信息、角色、权限 |
| 配置数据 | **共享** | 系统配置、字典表 |
| 业务数据 | **隔离** | 视觉任务、标注数据 |
| 文件数据 | **隔离** | 各平台独立存储 |
| 日志数据 | **隔离** | 各平台独立日志库 |

### 4.2 数据库设计

```
共享数据库 (main_db)
├── sys_user           # 用户表
├── sys_role           # 角色表
├── sys_permission     # 权限表
├── sys_dict           # 字典表
└── sys_config         # 配置表

机器视觉数据库 (vision_db)
├── vision_project     # 项目表
├── vision_model       # 模型表
└── vision_task        # 任务表

低代码数据库 (lowcode_db)
├── lc_project         # 项目表
├── lc_component       # 组件表
└── lc_page            # 页面表

大模型数据库 (vlm_db)
├── vlm_project        # 项目表
├── vlm_model          # 模型配置表
└── vlm_experiment     # 实验记录表

标注数据库 (annotation_db)
├── an_project         # 项目表
├── an_task            # 标注任务表
└── an_result          # 标注结果表
```

### 4.3 租户隔离策略

```sql
-- 方案: 租户ID字段隔离 (多租户场景)
ALTER TABLE vision_project ADD COLUMN tenant_id VARCHAR(64);

-- 查询时自动注入租户条件
CREATE FUNCTION set_tenant_id() RETURNS void AS $$
BEGIN
  -- 通过应用层/JWT注入
END;
$$ LANGUAGE plpgsql;
```

---

## 5. 部署架构

### 5.1 容器化架构

```yaml
# docker-compose.yml 结构
services:
  # 网关层
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf

  # 主平台
  main-shell:
    image: sisdc/vision-main:${VERSION}
    depends_on:
      - nginx

  # 子应用 (按需扩展)
  vision-app:
    image: sisdc/vision-app:${VERSION}

  lowcode-app:
    image: sisdc/vision-lowcode:${VERSION}
    deploy:
      replicas: 0  # 按需启动

  vlm-app:
    image: sisdc/vision-vlm:${VERSION}
    deploy:
      replicas: 0

  annotation-app:
    image: sisdc/vision-annotation:${VERSION}
    deploy:
      replicas: 0

  # 后端服务
  main-service:
    image: sisdc/vision-service:${VERSION}

  vision-service:
    image: sisdc/vision-backend:${VERSION}
```

### 5.2 Nginx 配置

```nginx
# nginx.conf
upstream main_shell {
    server main-shell:3000;
}

upstream vision_service {
    server vision-service:8080;
}

upstream lowcode_service {
    server lowcode-service:8080;
}

server {
    listen 80;
    server_name vision.platform.com;

    # 主平台静态资源
    location / {
        proxy_pass http://main_shell;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 主平台 API
    location /api/v1/main {
        rewrite ^/api/v1/main/(.*)$ /$1 break;
        proxy_pass http://main_service:8080;
    }

    # 视觉服务 API
    location /api/v1/vision {
        rewrite ^/api/v1/vision/(.*)$ /$1 break;
        proxy_pass http://vision_service:8080;
    }

    # 视觉子应用
    location /vision-app/ {
        proxy_pass http://vision-app:3000/vision-app/;
        proxy_set_header Host $host;
    }

    # 低代码子应用
    location /lowcode-app/ {
        proxy_pass http://lowcode-app:3000/lowcode-app/;
        # 仅管理员可访问
        # auth_request /auth/check-role;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.3 部署拓扑

```
                    ┌──────────────┐
                    │   CDN/WAF    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Nginx     │
                    │  (SLB/网关)   │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐
│  主平台Shell   │  │  视觉子应用   │  │ 低代码子应用  │
│   (常驻)      │  │   (常驻)     │  │   (按需)      │
└───────────────┘  └───────────────┘  └───────────────┘
```

### 5.4 Kubernetes 部署 (可选)

```yaml
# k8s deployment 示例
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vision-main-shell
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vision-main-shell
  template:
    spec:
      containers:
        - name: main-shell
          image: sisdc/vision-main:latest
          ports:
            - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: vision-main-service
spec:
  selector:
    app: vision-main-shell
  ports:
    - port: 80
      targetPort: 3000
```

---

## 6. 安全设计

### 6.1 认证流程

```
用户登录 → 主平台鉴权 → 颁发Token → 访问子应用 → 验证Token → 调用API
```

### 6.2 Token 设计

| Token类型 | 有效期 | 用途 |
|----------|-------|-----|
| Access Token | 30min | API访问 |
| Refresh Token | 7days | 刷新Access Token |
| Platform Token | 24h | 子应用访问 |

### 6.3 子应用隔离

- 沙箱运行 (qiankun sandbox)
- 样式隔离 (CSS Modules / shadow DOM)
- 通信受控 (基于postMessage)

---

## 7. 扩展路线图

```
Phase 1 (当前): 机器视觉平台
    └── 基础架构搭建完成

Phase 2 (Q3): 低代码平台
    └── 新增 lowcode-app 子应用
    └── 新增 lowcode_db 数据库
    └── 菜单注册低代码模块

Phase 3 (Q4): 视觉大模型平台
    └── 新增 vlm-app 子应用
    └── 新增 vlm_db 数据库
    └── GPU 集群支持

Phase 4 (次年Q1): 数据标注平台
    └── 新增 annotation-app 子应用
    └── 新增 annotation_db 数据库
    └── 多人协作标注
```

---

## 8. 技术选型汇总

| 层级 | 技术 | 说明 |
|-----|-----|-----|
| 前端框架 | Vue3 + Vite | 主技术栈 |
| 微前端 | qiankun | 沙箱隔离 |
| 后端框架 | Spring Boot / NestJS | 待定 |
| API网关 | Nginx / Kong | Nginx足够 |
| 数据库 | PostgreSQL | 共享+隔离库 |
| 缓存 | Redis | Session/Token |
| 消息队列 | RabbitMQ | 服务异步通信 |
| 容器编排 | Docker Compose / K8S | K8S用于生产 |
| CI/CD | GitLab CI / Jenkins | 自动部署 |

---

*文档生成时间: 2026-04-22*
*维护者: 架构组*
