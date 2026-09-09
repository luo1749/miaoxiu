import io
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image

from app.core.config import get_settings
from app.deps import get_current_user
from app import models

router = APIRouter(prefix="/uploads", tags=["文件上传"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
):
    '''通用图片上传，返回可访问 URL'''
    if not file.content_type or file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="仅支持 jpg/png/webp 图片")

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="图片大小超过 5MB")

    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="无效的图片文件")

    ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    filename = f"{uuid.uuid4().hex}{ext_map[file.content_type]}"

    settings = get_settings()
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    (upload_path / filename).write_bytes(contents)

    return {"url": f"/uploads/{filename}"}
