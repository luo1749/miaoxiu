import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base
import enum

Base = declarative_base()


def now_utc():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    guest = "guest"
    user = "user"
    admin = "admin"


class User(Base):
    """用户表"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.user, nullable=False)
    avatar = Column(String(255), default="images/pattern-5.jpg")
    bio = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    ai_quota_daily = Column(Integer, default=20)
    ai_quota_used = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    generated_images = relationship("GeneratedImage", back_populates="user", lazy="dynamic")
    posts = relationship("ForumPost", back_populates="user", lazy="dynamic")
    orders = relationship("Order", back_populates="user", lazy="dynamic")


class GeneratedImage(Base):
    """AI 生成纹样记录"""
    __tablename__ = "generated_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    prompt = Column(Text, nullable=False)
    style = Column(String(50), default="miaoxiu")
    colors = Column(JSON, default=list)
    image_url = Column(String(500), nullable=False)
    elements = Column(JSON, default=list)
    meaning = Column(Text, default="")
    likes = Column(Integer, default=0)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="generated_images")


class PatternCategory(str, enum.Enum):
    plant = "plant"
    animal = "animal"
    geometry = "geometry"
    mythology = "mythology"


class Pattern(Base):
    """传统纹样知识库"""
    __tablename__ = "patterns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    category = Column(SQLEnum(PatternCategory), nullable=False)
    description = Column(Text, default="")
    meaning = Column(Text, default="")
    occasion = Column(Text, default="")
    image_url = Column(String(500), default="")
    lineart_url = Column(String(500), default="")
    ai_prompt = Column(Text, default="")
    tags = Column(JSON, default=list)
    views = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class ForumPost(Base):
    """社区论坛帖子"""
    __tablename__ = "forum_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    images = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    likes = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    status = Column(String(20), default="approved")  # pending / approved / rejected
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="posts")


class ForumComment(Base):
    """论坛评论"""
    __tablename__ = "forum_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("forum_posts.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class Course(Base):
    """研学课程"""
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    subtitle = Column(String(500), default="")
    description = Column(Text, default="")
    cover_url = Column(String(500), default="")
    video_url = Column(String(500), default="")
    duration = Column(Integer, default=0)  # 分钟
    difficulty = Column(String(20), default="beginner")
    instructor = Column(String(100), default="")
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class CourseProgress(Base):
    """课程学习进度"""
    __tablename__ = "course_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    progress = Column(Float, default=0.0)  # 0-100
    is_completed = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class Product(Base):
    """文创商品"""
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text, default="")
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    image_url = Column(String(500), default="")
    category = Column(String(50), default="")
    stock = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class CartItem(Base):
    """购物车"""
    __tablename__ = "cart_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class OrderStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    shipped = "shipped"
    completed = "completed"
    cancelled = "cancelled"


class Order(Base):
    """订单"""
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.pending)
    items = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="orders")


class AdminLog(Base):
    """管理员操作审计日志"""
    __tablename__ = "admin_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    target = Column(String(200), default="")
    detail = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=now_utc)

