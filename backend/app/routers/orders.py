from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/orders", tags=["订单"])


@router.get("", response_model=List[schemas.OrderOut])
def list_orders(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取我的订单"""
    return db.query(models.Order).filter(models.Order.user_id == user.id).order_by(models.Order.created_at.desc()).all()


@router.post("", response_model=schemas.OrderOut)
def create_order(
    payload: schemas.OrderCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """创建订单（模拟支付）"""
    items = []
    total = 0.0
    for cart_item in payload.items:
        product = db.query(models.Product).filter(models.Product.id == cart_item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"商品不存在: {cart_item.product_id}")
        if product.stock < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"商品库存不足: {product.name}")
        product.stock -= cart_item.quantity
        items.append({
            "product_id": str(product.id),
            "name": product.name,
            "price": product.price,
            "quantity": cart_item.quantity,
        })
        total += product.price * cart_item.quantity

    order = models.Order(
        user_id=user.id,
        total_amount=total,
        status=models.OrderStatus.pending,
        items=items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/pay", response_model=schemas.OrderOut)
def pay_order(
    order_id: UUID,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """模拟支付订单"""
    order = db.query(models.Order).filter(models.Order.id == order_id, models.Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status != models.OrderStatus.pending:
        raise HTTPException(status_code=400, detail="订单状态不支持支付")
    order.status = models.OrderStatus.paid
    db.commit()
    db.refresh(order)
    return order

