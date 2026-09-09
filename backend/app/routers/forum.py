from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.deps import get_optional_user, get_current_user, require_admin

router = APIRouter(prefix="/forum", tags=["社区论坛"])


@router.get("/posts", response_model=List[schemas.ForumPostOut])
def list_posts(
    status: Optional[str] = "approved",
    tag: Optional[str] = None,
    search: Optional[str] = None,
    user_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取帖子列表，游客只能看已审核"""
    query = db.query(models.ForumPost)
    if status:
        query = query.filter(models.ForumPost.status == status)
    if user_id:
        query = query.filter(models.ForumPost.user_id == user_id)
    if tag:
        query = query.filter(models.ForumPost.tags.contains([tag]))
    if search:
        query = query.filter(
            models.ForumPost.title.ilike(f"%{search}%") |
            models.ForumPost.content.ilike(f"%{search}%")
        )
    return (
        query.order_by(models.ForumPost.is_pinned.desc(), models.ForumPost.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/posts/{post_id}", response_model=schemas.ForumPostOut)
def get_post(post_id: UUID, db: Session = Depends(get_db)):
    """获取帖子详情"""
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")
    return post


@router.post("/posts", response_model=schemas.ForumPostOut)
def create_post(
    payload: schemas.ForumPostCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """登录用户发帖，新帖待审核"""
    post = models.ForumPost(
        user_id=user.id,
        title=payload.title,
        content=payload.content,
        images=payload.images,
        tags=payload.tags,
        status="pending",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.post("/posts/{post_id}/like")
def like_post(
    post_id: UUID,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """点赞帖子"""
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")
    post.likes += 1
    db.commit()
    return {"likes": post.likes}


@router.get("/posts/{post_id}/comments", response_model=List[schemas.ForumCommentOut])
def list_comments(post_id: UUID, db: Session = Depends(get_db)):
    """获取帖子评论"""
    return (
        db.query(models.ForumComment)
        .filter(models.ForumComment.post_id == post_id)
        .order_by(models.ForumComment.created_at.asc())
        .all()
    )


@router.post("/posts/{post_id}/comments", response_model=schemas.ForumCommentOut)
def create_comment(
    post_id: UUID,
    payload: schemas.ForumCommentCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """登录用户评论"""
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")
    comment = models.ForumComment(
        post_id=post_id,
        user_id=user.id,
        content=payload.content,
    )
    db.add(comment)
    post.comments_count += 1
    db.commit()
    db.refresh(comment)
    return comment


@router.put("/posts/{post_id}/audit")
def audit_post(
    post_id: UUID,
    status: str,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员审核帖子"""
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")
    if status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="状态错误")
    post.status = status
    db.commit()
    return {"message": "审核完成", "status": status}

