import os
import uuid
import httpx
from pathlib import Path
from urllib.parse import quote
from typing import List
from app.core.config import get_settings

# 备用纹样图片池，外部服务不可用时使用
MOCK_PATTERN_URLS = [
    "images/pattern-1.jpg",
    "images/pattern-3.jpg",
    "images/pattern-5.jpg",
    "images/pattern-6.jpg",
    "images/pattern-8.jpg",
    "images/pattern-9.jpg",
]

STYLE_SUFFIX = {
    "miaoxiu": "intricate needlework, silk thread texture, geometric symmetry, Miao embroidery style",
    "laran": "batik style, indigo blue, wax resist pattern, ice crack texture",
    "fusion": "fusion of Miao embroidery and Batik, mixed media art",
}

COLOR_SUFFIX = {
    "indigo": "indigo blue",
    "vermilion": "vermilion red",
    "darkgreen": "ink green",
    "bone": "bone white",
    "golden": "gold",
    "purple": "purple",
}


def build_prompt(user_prompt: str, style: str, colors: List[str]) -> str:
    style_text = STYLE_SUFFIX.get(style, STYLE_SUFFIX["miaoxiu"])
    color_text = ", ".join([COLOR_SUFFIX.get(c, c) for c in colors])
    return (
        f"masterpiece, best quality, Miao embroidery and batik art, {style_text}, "
        f"{user_prompt}, color palette: {color_text}, highly detailed, traditional ethnic pattern, "
        f"no text, no watermark, no signature"
    )


def build_negative_prompt() -> str:
    return "blurry, low quality, modern style, western pattern, text, watermark, signature"


def _save_generated_image(data: bytes, upload_dir: str) -> str:
    upload_path = Path(upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.png"
    path = upload_path / filename
    path.write_bytes(data)
    return f"/uploads/{filename}"


async def _fetch_pollinations_image(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.content


def _pollinations_txt2img_url(prompt: str, seed: int, width: int = 512, height: int = 512) -> str:
    encoded = quote(prompt)
    return (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width={width}&height={height}&seed={seed}&nologo=true&no_seed_after=true"
    )


def _pollinations_img2img_url(prompt: str, image_url: str, seed: int, width: int = 512, height: int = 512) -> str:
    encoded = quote(prompt)
    encoded_image = quote(image_url, safe="")
    return (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?image={encoded_image}&width={width}&height={height}&seed={seed}&nologo=true&no_seed_after=true"
    )


async def generate_images(
    prompt: str,
    style: str,
    colors: List[str],
    batch_size: int = 1,
    image_url: str | None = None,
) -> List[str]:
    """调用 Pollinations.ai 生成纹样；失败时降级为本地模拟图片"""
    settings = get_settings()
    final_prompt = build_prompt(prompt, style, colors)
    negative = build_negative_prompt()
    full_prompt = f"{final_prompt}, {negative}"

    results: List[str] = []
    base_seed = uuid.uuid4().int % 10_000_000

    for i in range(batch_size):
        seed = base_seed + i
        try:
            if image_url:
                url = _pollinations_img2img_url(full_prompt, image_url, seed)
            else:
                url = _pollinations_txt2img_url(full_prompt, seed)
            data = await _fetch_pollinations_image(url)
            local_url = _save_generated_image(data, settings.UPLOAD_DIR)
            results.append(local_url)
        except Exception as e:
            print(f"[Pollinations] 第 {i+1} 张生成失败: {e}")
            # 单张失败则补一张模拟图，保证返回数量
            results.append(_mock_generate_one(i))

    return results


def _mock_generate_one(index: int) -> str:
    return MOCK_PATTERN_URLS[index % len(MOCK_PATTERN_URLS)]


def _mock_generate(batch_size: int) -> List[str]:
    import random
    selected = random.sample(MOCK_PATTERN_URLS, min(batch_size, len(MOCK_PATTERN_URLS)))
    return selected
