from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.deps import get_optional_user, get_current_user, require_admin

router = APIRouter(prefix="/products", tags=["文创商城"])


@router.get("", response_model=List[schemas.ProductOut])
def list_products(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取商品列表"""
    query = db.query(models.Product)
    if category:
        query = query.filter(models.Product.category == category)
    if featured is not None:
        query = query.filter(models.Product.is_featured == featured)
    if search:
        query = query.filter(
            models.Product.name.ilike(f"%{search}%") |
            models.Product.description.ilike(f"%{search}%")
        )
    return query.order_by(models.Product.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    """获取商品详情"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    return product


@router.post("", response_model=schemas.ProductOut)
def create_product(
    payload: schemas.ProductCreate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员创建商品"""
    product = models.Product(**payload.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: UUID,
    payload: schemas.ProductCreate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员更新商品"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    for key, value in payload.dict().items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: UUID,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """管理员删除商品"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    db.delete(product)
    db.commit()
    return {"message": "删除成功"}


# 购物车
@router.get("/cart/items", response_model=List[schemas.CartItemOut])
def list_cart(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取购物车"""
    return db.query(models.CartItem).filter(models.CartItem.user_id == user.id).all()


@router.post("/cart/items", response_model=schemas.CartItemOut)
def add_to_cart(
    payload: schemas.CartItemCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """添加商品到购物车"""
    existing = (
        db.query(models.CartItem)
        .filter(models.CartItem.user_id == user.id, models.CartItem.product_id == payload.product_id)
        .first()
    )
    if existing:
        existing.quantity += payload.quantity
        db.commit()
        db.refresh(existing)
        return existing
    item = models.CartItem(user_id=user.id, product_id=payload.product_id, quantity=payload.quantity)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/cart/items/{item_id}")
def remove_from_cart(
    item_id: UUID,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除购物车商品"""
    item = db.query(models.CartItem).filter(models.CartItem.id == item_id, models.CartItem.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="购物车商品不存在")
    db.delete(item)
    db.commit()
    return {"message": "删除成功"}

