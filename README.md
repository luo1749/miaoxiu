# 铜仁苗绣蜡染非遗数字化平台（miaoxiu）

> 面向"青年红色筑梦之旅"的本科创新训练项目
> 以铜仁松桃苗绣、江口蜡染为核心，构建"AI 设计 + AR 体验 + 知识图谱 + 研学电商 + 社区论坛"五位一体的非遗数字化平台。

## 项目结构

```
miaoxiu/
├── web/                 # 前端：React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
├── backend/             # 后端：Python FastAPI + SQLAlchemy + PostgreSQL + Redis
├── docker-compose.yml   # 一键部署配置
├── .env                 # Docker Compose 环境变量
├── backend/.env         # 后端本地开发环境变量
└── docs/                # 原始需求文档
```

## 技术栈

- 前端：React 18、TypeScript、Vite、Tailwind CSS、shadcn/ui、Three.js、Recharts、GSAP
- 后端：Python FastAPI、SQLAlchemy 2.0、Pydantic、PostgreSQL、Redis、JWT
- AI：Stable Diffusion WebUI API（可选）、Kimi Vision API（可选）、本地关键词文化解析降级
- 部署：Docker Compose、Nginx

## 本地启动（Windows，PostgreSQL + Redis）

本机已安装并启动 PostgreSQL 17（密码 `522401`）与 Redis，后端默认连接本地服务。

1. 启动后端

```bash
cd D:\miaoxiu\backend
.\venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

后端首次启动会自动在 `miaoxiu` 数据库中建表并灌入种子数据。

2. 启动前端开发服务器

```bash
cd D:\miaoxiu\web
npm run dev
```

3. 访问

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs


## 构建说明

- 开发环境直接运行 
pm run dev 即可，无需构建。
- 当前 Windows 环境对 Node 进程写入构建产物存在系统级限制，
pm run build 可能失败。
- 生产构建推荐使用 Docker Compose（需先启动 Docker Desktop）。
## Docker Compose 启动

1. 确保 Docker Desktop 已启动。
2. 在项目根目录执行：

```bash
docker compose up -d --build
```

访问：
- 前端：http://localhost
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## 演示账号

| 角色   | 邮箱                  | 密码   |
| ------ | --------------------- | ------ |
| 管理员 | admin@miaoxiu.cn      | 123456 |
| 用户   | user@miaoxiu.cn       | 123456 |

> 演示账号邮箱已统一为 `@miaoxiu.cn`，旧 `@gene-e.com` 演示账号仍可作为前端本地降级使用。

## 核心功能模块

1. 首页沉浸导览
2. AI 纹样生成器（已接入后端 `/api/v1/ai/generate`，失败自动降级为本地模拟；游客每日 3 次，登录用户每日 20 次）
3. 纹样知识库（支持详情页 `/knowledge-graph/:id`）
4. AR 体验
5. 研学课程（支持详情页 `/study-tour/:id` 与进度保存）
6. 文创商城（`/shop`）、购物车（`/cart`）、我的订单（`/orders`）
7. 社区论坛
8. 后台管理

## 许可证

MIT License


