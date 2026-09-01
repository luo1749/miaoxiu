import os
import uuid
import httpx
from pathlib import Path
from urllib.parse import quote
from typing import List
from app.core.config import get_settings
from app.services import pattern_generator
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
    "miaoxiu": "traditional Miao embroidery from Tongren Guizhou, intricate geometric needlework, symmetrical folk pattern, embroidered textile, silk thread texture, ethnic minority craft, decorative motif",
    "laran": "traditional Guizhou batik, indigo blue dye, wax resist pattern, ice crack texture, folk blue calico, ethnic minority craft, symmetrical decorative pattern",
    "fusion": "fusion of Miao embroidery and Guizhou batik, contemporary ethnic pattern, geometric folk art, decorative textile design, mixed media craft style",
}

COLOR_SUFFIX = {
    "indigo": "deep indigo blue (#2441A9)",
    "vermilion": "vermilion red (#E84A3A)",
    "darkgreen": "ink green (#1B4D3E)",
    "bone": "bone white (#F0EDE0)",
    "golden": "gold (#C8913A)",
    "purple": "purple (#5B2C6F)",
}


def build_prompt(user_prompt: str, style: str, colors: List[str]) -> str:
    style_text = STYLE_SUFFIX.get(style, STYLE_SUFFIX["miaoxiu"])
    color_text = ", ".join([COLOR_SUFFIX.get(c, c) for c in colors])
    return (
        f"flat 2d vector ethnic pattern, {style_text}, theme: {user_prompt}, "
        f"color palette: {color_text}, symmetrical geometric composition, "
        f"decorative textile design, folk art motif, solid flat colors, no gradients, "
        f"square format, no circular frame, no border, no realistic shading, "
        f"crisp clean edges, repeating ornamental elements, centered balanced layout, "
        f"no human, no face, no hands, no body, no figure, no portrait, "
        f"no text, no watermark, no signature, no letters"
    )


def build_negative_prompt() -> str:
    return (
        "blurry, low quality, modern style, western pattern, text, watermark, signature, "
        "photorealistic, 3d render, human, face, hands, body, landscape, building, "
        "photograph, noise, grain, asymmetric, distorted"
    )


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
    negative = quote(build_negative_prompt())
    return (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width={width}&height={height}&seed={seed}&nologo=true&no_seed_after=true"
        f"&model=turbo&negative_prompt={negative}"
    )


def _pollinations_img2img_url(prompt: str, image_url: str, seed: int, width: int = 512, height: int = 512) -> str:
    encoded = quote(prompt)
    encoded_image = quote(image_url, safe="")
    negative = quote(build_negative_prompt())
    return (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?image={encoded_image}&width={width}&height={height}&seed={seed}&nologo=true&no_seed_after=true"
        f"&model=turbo&negative_prompt={negative}"
    )


async def generate_images(
    prompt: str,
    style: str,
    colors: List[str],
    batch_size: int = 1,
    image_url: str | None = None,
    width: int = 1024,
    height: int = 1024,
) -> List[str]:
    """
    生成纹样图片。
    默认使用 pattern_generator 算法生成（描述与配色严格匹配、可复现）。
    如果环境变量启用本地 SD（SD_ENABLED=true），则优先调用 Stable Diffusion WebUI。
    """
    settings = get_settings()

    # 1. 优先使用本地 Stable Diffusion（若用户已部署）
    if settings.SD_ENABLED:
        return await _generate_with_sd(
            prompt, style, colors, batch_size, image_url, width, height, settings.UPLOAD_DIR
        )

    # 2. 默认：算法生成，确保与描述、配色一致
    return await pattern_generator.generate_images(
        prompt=prompt,
        style=style,
        colors=colors,
        batch_size=batch_size,
        image_url=image_url,
        width=width,
        height=height,
        upload_dir=settings.UPLOAD_DIR,
    )


async def _generate_with_sd(
    prompt: str,
    style: str,
    colors: List[str],
    batch_size: int,
    image_url: str | None,
    width: int,
    height: int,
    upload_dir: str,
) -> List[str]:
    """调用本地 Stable Diffusion WebUI API；失败时回退到算法生成"""
    final_prompt = build_prompt(prompt, style, colors)
    negative = build_negative_prompt()
    full_prompt = f"{final_prompt}, {negative}"

    results: List[str] = []
    base_seed = uuid.uuid4().int % 10_000_000

    for i in range(batch_size):
        seed = base_seed + i
        try:
            if image_url:
                url = _pollinations_img2img_url(full_prompt, image_url, seed, width, height)
            else:
                url = _pollinations_txt2img_url(full_prompt, seed, width, height)
            data = await _fetch_pollinations_image(url)
            local_url = _save_generated_image(data, upload_dir)
            results.append(local_url)
        except Exception as e:
            print(f"[SD] 第 {i+1} 张生成失败: {e}，回退到算法生成")
            local_url = pattern_generator.generate_pattern(
                prompt, style, colors, width, height, upload_dir
            )
            results.append(local_url)

    return results


def _mock_generate_one(index: int) -> str:
    return MOCK_PATTERN_URLS[index % len(MOCK_PATTERN_URLS)]


def _mock_generate(batch_size: int) -> List[str]:
    import random
    selected = random.sample(MOCK_PATTERN_URLS, min(batch_size, len(MOCK_PATTERN_URLS)))
    return selected