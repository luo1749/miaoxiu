from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置，优先从环境变量读取"""
    PROJECT_NAME: str = "灵壤·铜仁苗绣蜡染非遗数字化平台"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI + AR 驱动的苗绣蜡染非遗数字化平台后端 API"

    # 数据库
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/miaoxiu"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # 安全
    SECRET_KEY: str = "change-me-in-production-please-use-strong-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 天

    # Stable Diffusion
    SD_API_URL: str = "http://localhost:7860"
    SD_ENABLED: bool = False  # 默认关闭，使用模拟生成

    # Kimi / 多模态分析
    KIMI_API_KEY: str = ""
    KIMI_BASE_URL: str = "https://api.moonshot.cn/v1"

    # 文件上传
    UPLOAD_DIR: str = "app/uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    PUBLIC_BASE_URL: str = "http://localhost:8000"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()

