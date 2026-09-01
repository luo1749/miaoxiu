from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from app.models import UserRole, PatternCategory, OrderStatus


# ================== 通用 ==================
class MessageResponse(BaseModel):
    message: str


# ================== 认证 ==================
class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserRegister(UserBase):
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None
    role: UserRole = UserRole.user


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    avatar: str
    bio: str
    ai_quota_daily: int
    ai_quota_used: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None


# ================== AI 生成 ==================
class AIGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)
    style: str = "miaoxiu"  # miaoxiu / laran / fusion
    colors: List[str] = Field(default_factory=lambda: ["indigo", "vermilion"])
    batch_size: int = Field(1, ge=1, le=4)
    mode: str = "text"  # text / image
    image_base64: str | None = None  # 图生图：上传的图片 base64


class CulturalElement(BaseModel):
    name: str
    meaning: str


class GeneratedImageOut(BaseModel):
    id: UUID
    prompt: str
    style: str
    colors: List[str]
    image_url: str
    elements: List[str]
    meaning: str
    likes: int
    is_public: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ================== 纹样知识库 ==================
class PatternCreate(BaseModel):
    name: str
    category: PatternCategory
    description: str = ""
    meaning: str = ""
    occasion: str = ""
    image_url: str = ""
    lineart_url: str = ""
    ai_prompt: str = ""
    tags: List[str] = Field(default_factory=list)


class PatternUpdate(PatternCreate):
    is_featured: Optional[bool] = None


class PatternOut(BaseModel):
    id: UUID
    name: str
    category: PatternCategory
    description: str
    meaning: str
    occasion: str
    image_url: str
    lineart_url: str
    ai_prompt: str
    tags: List[str]
    views: int
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ================== 论坛 ==================
class ForumPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    images: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class ForumPostOut(BaseModel):
    id: UUID
    title: str
    content: str
    images: List[str]
    tags: List[str]
    likes: int
    comments_count: int
    is_pinned: bool
    is_featured: bool
    status: str
    created_at: datetime
    author: Optional[UserOut] = None

    class Config:
        from_attributes = True


class ForumCommentCreate(BaseModel):
    content: str = Field(..., min_length=1)


class ForumCommentOut(BaseModel):
    id: UUID
    content: str
    created_at: datetime
    author: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ================== 课程 ==================
class CourseCreate(BaseModel):
    title: str
    subtitle: str = ""
    description: str = ""
    cover_url: str = ""
    video_url: str = ""
    duration: int = 0
    difficulty: str = "beginner"
    instructor: str = ""


class CourseOut(BaseModel):
    id: UUID
    title: str
    subtitle: str
    description: str
    cover_url: str
    video_url: str
    duration: int
    difficulty: str
    instructor: str
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CourseProgressUpdate(BaseModel):
    progress: float = Field(..., ge=0, le=100)


class CourseProgressOut(BaseModel):
    id: UUID
    progress: float
    is_completed: bool
    updated_at: datetime
    course: CourseOut

    class Config:
        from_attributes = True


# ================== 商品 / 订单 ==================
class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float = Field(..., gt=0)
    original_price: Optional[float] = None
    image_url: str = ""
    category: str = ""
    stock: int = 0


class ProductOut(BaseModel):
    id: UUID
    name: str
    description: str
    price: float
    original_price: Optional[float]
    image_url: str
    category: str
    stock: int
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(1, ge=1)


class CartItemOut(BaseModel):
    id: UUID
    quantity: int
    product: ProductOut

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: List[CartItemCreate]


class OrderOut(BaseModel):
    id: UUID
    total_amount: float
    status: OrderStatus
    items: List[dict]
    created_at: datetime

    class Config:
        from_attributes = True


# ================== 统计 ==================
class DashboardStats(BaseModel):
    total_users: int
    total_patterns: int
    total_generated: int
    total_posts: int
    total_orders: int
    total_courses: int
    total_products: int
    today_generated: int
    pending_posts: int

