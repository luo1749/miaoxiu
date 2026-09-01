from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.deps import require_admin

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("", response_model=List[schemas.UserOut])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员获取用户列表"""
    return db.query(models.User).offset(skip).limit(limit).all()


@router.put("/{user_id}/role")
def update_user_role(
    user_id: UUID,
    role: models.UserRole,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员修改用户角色或封禁"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.role = role
    db.commit()
    return {"message": "角色更新成功", "role": role}


@router.put("/{user_id}/status")
def update_user_status(
    user_id: UUID,
    is_active: bool,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员启用 / 禁用用户"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.is_active = is_active
    db.commit()
    return {"message": "状态更新成功", "is_active": is_active}

