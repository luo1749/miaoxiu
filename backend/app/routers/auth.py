from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.core.security import verify_password, get_password_hash, create_access_token
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/register", response_model=schemas.Token)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    """用户注册"""
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    user = models.User(
        email=payload.email,
        name=payload.name,
        phone=payload.phone,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    """获取当前登录用户信息"""
    return user


@router.put("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserProfileUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新当前用户信息"""
    if payload.name is not None:
        user.name = payload.name
    if payload.avatar is not None:
        user.avatar = payload.avatar
    if payload.bio is not None:
        user.bio = payload.bio
    db.commit()
    db.refresh(user)
    return user

