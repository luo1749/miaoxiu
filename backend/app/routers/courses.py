from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.deps import get_optional_user, get_current_user, require_admin

router = APIRouter(prefix="/courses", tags=["研学课程"])


@router.get("", response_model=List[schemas.CourseOut])
def list_courses(
    featured: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取研学课程列表"""
    query = db.query(models.Course)
    if featured is not None:
        query = query.filter(models.Course.is_featured == featured)
    return query.order_by(models.Course.created_at.desc()).offset(skip).limit(limit).all()



@router.get("/{course_id}", response_model=schemas.CourseOut)
def get_course(course_id: UUID, db: Session = Depends(get_db)):
    """获取课程详情"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    return course


@router.post("", response_model=schemas.CourseOut)
def create_course(
    payload: schemas.CourseCreate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员创建课程"""
    course = models.Course(**payload.dict())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}/progress", response_model=schemas.CourseProgressOut)
def update_progress(
    course_id: UUID,
    payload: schemas.CourseProgressUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新课程学习进度"""
    progress = (
        db.query(models.CourseProgress)
        .filter(models.CourseProgress.user_id == user.id, models.CourseProgress.course_id == course_id)
        .first()
    )
    if not progress:
        progress = models.CourseProgress(user_id=user.id, course_id=course_id)
        db.add(progress)
    progress.progress = payload.progress
    progress.is_completed = payload.progress >= 100
    db.commit()
    db.refresh(progress)
    return progress


