from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_access_token
from app import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    """获取当前登录用户，未登录返回 401"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_exception
    payload = decode_access_token(token)
    if payload is None or payload.get("sub") is None:
        raise credentials_exception
    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def get_optional_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User | None:
    """可选登录校验，未登录返回 None（游客模式）"""
    if token is None:
        return None
    payload = decode_access_token(token)
    if payload is None or payload.get("sub") is None:
        return None
    user = db.query(models.User).filter(models.User.id == payload.get("sub")).first()
    if user is None or not user.is_active:
        return None
    return user


def require_admin(user: models.User = Depends(get_current_user)) -> models.User:
    """要求管理员权限"""
    if user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
        )
    return user

