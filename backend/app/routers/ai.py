from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.database import get_db
from app import models, schemas
from app.deps import get_optional_user
import base64
import uuid
from pathlib import Path
from app.services.sd_client import generate_images
from app.services.analyzer import analyze_prompt
from app.core.redis import get_redis
from app.core.config import get_settings

router = APIRouter(prefix="/ai", tags=["AI 纹样生成"])

GUEST_DAILY_LIMIT = 3


def _today_str() -> str:
    """按北京时间返回当日日期字符串"""
    return datetime.now(ZoneInfo("Asia/Shanghai")).strftime("%Y-%m-%d")


def _seconds_until_midnight() -> int:
    """距离北京时间次日零点的秒数"""
    now = datetime.now(ZoneInfo("Asia/Shanghai"))
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return int((midnight - now).total_seconds())


def _user_quota_key(user_id) -> str:
    """登录用户 AI 额度 Redis 键（按日）"""
    return f"user:{user_id}:ai_count:{_today_str()}"


def _guest_quota_key(ip: str) -> str:
    """游客 AI 生成额度 Redis 键（按日）"""
    return f"guest:{ip}:ai_count:{_today_str()}"


def _check_quota(user: models.User | None, ip: str) -> None:
    """检查用户/游客今日 AI 生成额度"""
    r = get_redis()
    if user is not None:
        used = int(r.get(_user_quota_key(user.id)) or 0) if r else user.ai_quota_used
        if used >= user.ai_quota_daily:
            raise HTTPException(status_code=429, detail="今日 AI 生成额度已用完，请明日再来")
        return

    # 游客基于 IP 按日限流
    if r is None:
        return
    count = r.get(_guest_quota_key(ip))
    if count and int(count) >= GUEST_DAILY_LIMIT:
        raise HTTPException(status_code=429, detail="游客每日 AI 生成额度已用完，登录后可享受更多次数")


def _consume_quota(user: models.User | None, db: Session, ip: str) -> None:
    """消耗一次额度（按日重置）"""
    r = get_redis()
    if user is not None:
        key = _user_quota_key(user.id)
        if r:
            count = r.incr(key)
            r.expire(key, _seconds_until_midnight())
        else:
            count = user.ai_quota_used + 1
        user.ai_quota_used = int(count)
        db.commit()
        return

    if r is None:
        return
    key = _guest_quota_key(ip)
    pipe = r.pipeline()
    pipe.incr(key)
    pipe.expire(key, _seconds_until_midnight())
    pipe.execute()


@router.post("/generate", response_model=List[schemas.GeneratedImageOut])
async def generate(
    payload: schemas.AIGenerateRequest,
    request: Request,
    user: models.User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """文生图 / 图生图：生成苗绣蜡染纹样"""
    # 优先从 X-Forwarded-For 获取真实 IP（反向代理场景），否则取直接连接 IP
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = forwarded.split(",")[0].strip() if forwarded else request.client.host

    _check_quota(user, client_ip)
    settings = get_settings()

    # 处理上传图片（图生图）
    image_url: str | None = None
    if payload.mode == "image" and payload.image_base64:
        try:
            header, b64data = payload.image_base64.split(",", 1)
            image_bytes = base64.b64decode(b64data)
            upload_path = Path(settings.UPLOAD_DIR)
            upload_path.mkdir(parents=True, exist_ok=True)
            temp_name = f"{uuid.uuid4().hex}.png"
            temp_path = upload_path / temp_name
            temp_path.write_bytes(image_bytes)
            image_url = f"/uploads/{temp_name}"
        except Exception as e:
            print(f"[AI] 上传图片处理失败: {e}")

    # 调用 Pollinations.ai 或降级为模拟图片
    image_urls = await generate_images(
        prompt=payload.prompt,
        style=payload.style,
        colors=payload.colors,
        batch_size=payload.batch_size,
        image_url=image_url,
    )

    # 将相对路径补全为可外部访问的绝对 URL
    public_base = settings.PUBLIC_BASE_URL or f"http://{request.headers.get('host', 'localhost:8000')}"
    image_urls = [
        f"{public_base}{url}" if url.startswith('/') else url
        for url in image_urls
    ]

    # 文化解析
    analysis = analyze_prompt(payload.prompt)

    results = []
    for url in image_urls:
        gen = models.GeneratedImage(
            user_id=user.id if user else None,
            prompt=payload.prompt,
            style=payload.style,
            colors=payload.colors,
            image_url=url,
            elements=analysis["elements"],
            meaning=analysis["meaning"],
        )
        db.add(gen)
        db.commit()
        db.refresh(gen)
        results.append(gen)

    _consume_quota(user, db, client_ip)
    return results


@router.get("/history", response_model=List[schemas.GeneratedImageOut])
def history(
    limit: int = 20,
    user: models.User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """获取当前登录用户的生成历史（游客无历史）"""
    if user is None:
        return []
    return (
        db.query(models.GeneratedImage)
        .filter(models.GeneratedImage.user_id == user.id)
        .order_by(models.GeneratedImage.created_at.desc())
        .limit(limit)
        .all()
    )


@router.post("/{image_id}/like")
def like_image(
    image_id: str,
    user: models.User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """点赞 / 取消点赞生成图片（简化实现）"""
    img = db.query(models.GeneratedImage).filter(models.GeneratedImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="图片不存在")
    img.likes += 1
    db.commit()
    return {"likes": img.likes}
