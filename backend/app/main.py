import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from app.core.config import get_settings
from app.database import engine
from app import models
from app.routers import (
    auth, ai, patterns, forum, courses, products, orders, users, admin
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时创建数据库表"""
    # 自动建表（生产环境建议使用 Alembic）
    models.Base.metadata.create_all(bind=engine)
    # 初始化种子数据
    from app.seed import seed_data
    seed_data(engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
)

# 配置跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件（上传图片与前端资源）
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# 注册路由
app.include_router(auth.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(patterns.router, prefix="/api/v1")
app.include_router(forum.router, prefix="/api/v1")
app.include_router(courses.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/health")
def health_check():
    """健康检查接口"""
    return {"status": "ok", "version": settings.VERSION}



@app.get("/doc")
def redirect_doc():
    """兼容 /doc 拼写，重定向到 /docs"""
    return RedirectResponse(url="/docs")
