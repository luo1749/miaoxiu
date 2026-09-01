from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.deps import require_admin

router = APIRouter(prefix="/admin", tags=["后台管理"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
def dashboard(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """后台数据看板"""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return schemas.DashboardStats(
        total_users=db.query(models.User).count(),
        total_patterns=db.query(models.Pattern).count(),
        total_generated=db.query(models.GeneratedImage).count(),
        total_posts=db.query(models.ForumPost).count(),
        total_orders=db.query(models.Order).count(),
        total_courses=db.query(models.Course).count(),
        total_products=db.query(models.Product).count(),
        today_generated=(
            db.query(models.GeneratedImage)
            .filter(models.GeneratedImage.created_at >= today)
            .count()
        ),
        pending_posts=(
            db.query(models.ForumPost)
            .filter(models.ForumPost.status == "pending")
            .count()
        ),
    )


@router.get("/ai-stats")
def ai_stats(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """AI 生成统计"""
    total = db.query(models.GeneratedImage).count()
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = db.query(models.GeneratedImage).filter(models.GeneratedImage.created_at >= today).count()
    by_style = (
        db.query(models.GeneratedImage.style, func.count(models.GeneratedImage.id))
        .group_by(models.GeneratedImage.style)
        .all()
    )
    return {
        "total": total,
        "today": today_count,
        "by_style": [{"style": s, "count": c} for s, c in by_style],
    }


@router.post("/logs")
def log_action(
    request: Request,
    action: str,
    target: str = "",
    detail: dict = None,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """记录管理员操作日志"""
    log = models.AdminLog(
        admin_id=admin.id,
        action=action,
        target=target,
        detail=detail or {},
    )
    db.add(log)
    db.commit()
    return {"message": "日志已记录"}


@router.get("/logs")
def list_logs(
    skip: int = 0,
    limit: int = 50,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """获取管理员操作日志"""
    return (
        db.query(models.AdminLog)
        .order_by(models.AdminLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

