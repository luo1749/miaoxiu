from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.deps import get_optional_user, require_admin

router = APIRouter(prefix="/patterns", tags=["纹样知识库"])


@router.get("", response_model=List[schemas.PatternOut])
def list_patterns(
    category: Optional[models.PatternCategory] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取纹样列表，支持分类、搜索、推荐筛选"""
    query = db.query(models.Pattern)
    if category:
        query = query.filter(models.Pattern.category == category)
    if featured is not None:
        query = query.filter(models.Pattern.is_featured == featured)
    if search:
        query = query.filter(
            models.Pattern.name.ilike(f"%{search}%") |
            models.Pattern.description.ilike(f"%{search}%") |
            models.Pattern.meaning.ilike(f"%{search}%")
        )
    return query.order_by(models.Pattern.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{pattern_id}", response_model=schemas.PatternOut)
def get_pattern(pattern_id: UUID, db: Session = Depends(get_db)):
    """获取纹样详情"""
    pattern = db.query(models.Pattern).filter(models.Pattern.id == pattern_id).first()
    if not pattern:
        raise HTTPException(status_code=404, detail="纹样不存在")
    pattern.views += 1
    db.commit()
    return pattern


@router.post("", response_model=schemas.PatternOut)
def create_pattern(
    payload: schemas.PatternCreate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员创建纹样"""
    pattern = models.Pattern(**payload.dict())
    db.add(pattern)
    db.commit()
    db.refresh(pattern)
    return pattern


@router.put("/{pattern_id}", response_model=schemas.PatternOut)
def update_pattern(
    pattern_id: UUID,
    payload: schemas.PatternUpdate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员更新纹样"""
    pattern = db.query(models.Pattern).filter(models.Pattern.id == pattern_id).first()
    if not pattern:
        raise HTTPException(status_code=404, detail="纹样不存在")
    data = payload.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(pattern, key, value)
    db.commit()
    db.refresh(pattern)
    return pattern


@router.delete("/{pattern_id}")
def delete_pattern(
    pattern_id: UUID,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员删除纹样"""
    pattern = db.query(models.Pattern).filter(models.Pattern.id == pattern_id).first()
    if not pattern:
        raise HTTPException(status_code=404, detail="纹样不存在")
    db.delete(pattern)
    db.commit()
    return {"message": "删除成功"}

