import redis
from .config import get_settings

_settings = get_settings()

# Redis 客户端，连接失败时返回 None，避免影响核心功能
try:
    redis_client = redis.from_url(_settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
except Exception:
    redis_client = None


def get_redis():
    """获取 Redis 客户端，未配置或连接失败则返回 None"""
    return redis_client
