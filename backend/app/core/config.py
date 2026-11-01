from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置，优先从环境变量读取"""
    PROJECT_NAME: str = "AI+AR赋能铜仁苗绣蜡染非遗活态传承平台"
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

    # ComfyUI
    COMFYUI_URL: str = "http://localhost:8188"
    COMFYUI_ENABLED: bool = True
    COMFYUI_CHECKPOINT: str = "sd_xl_base_1.0.safetensors"
    COMFYUI_LORA: str = "miaoxiu-v1.safetensors"
    COMFYUI_LORA_STRENGTH: float = 0.8
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

    # 登录
    ACCESS_TOKEN_REMEMBER_DAYS: int = 30
    FRONTEND_URL: str = "http://localhost"

    # GitHub OAuth
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/oauth/github/callback"

    # WeChat OAuth（微信开放平台网站应用）
    WECHAT_APP_ID: str = ""
    WECHAT_APP_SECRET: str = ""
    WECHAT_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/oauth/wechat/callback"

    # QQ OAuth
    QQ_APP_ID: str = ""
    QQ_APP_KEY: str = ""
    QQ_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/oauth/qq/callback"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()

