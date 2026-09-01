import random
import httpx
from typing import List
from app.core.config import get_settings

# 模拟纹样图片池，SD 不可用时使用
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
    """根据用户输入构建 SD 提示词"""
    style_text = STYLE_SUFFIX.get(style, STYLE_SUFFIX["miaoxiu"])
    color_text = ", ".join([COLOR_SUFFIX.get(c, c) for c in colors])
    return (
        f"masterpiece, best quality, Miao embroidery and batik art, {style_text}, "
        f"{user_prompt}, color palette: {color_text}, highly detailed, traditional ethnic pattern"
    )


def build_negative_prompt() -> str:
    return "blurry, low quality, modern style, western pattern, text, watermark, signature"


async def generate_images(prompt: str, style: str, colors: List[str], batch_size: int = 1) -> List[str]:
    """调用 Stable Diffusion WebUI API 生成纹样；未启用或失败时返回模拟图片"""
    settings = get_settings()
    if not settings.SD_ENABLED:
        return _mock_generate(batch_size)

    try:
        payload = {
            "prompt": build_prompt(prompt, style, colors),
            "negative_prompt": build_negative_prompt(),
            "width": 512,
            "height": 512,
            "batch_size": batch_size,
            "steps": 25,
            "cfg_scale": 7,
            "sampler_name": "DPM++ 2M Karras",
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{settings.SD_API_URL}/sdapi/v1/txt2img", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("images", [])[:batch_size]
    except Exception as e:
        # 降级为模拟生成
        print(f"[SD] 调用失败: {e}，使用模拟图片")
        return _mock_generate(batch_size)


def _mock_generate(batch_size: int) -> List[str]:
    """随机返回本地纹样图片"""
    selected = random.sample(MOCK_PATTERN_URLS, min(batch_size, len(MOCK_PATTERN_URLS)))
    return selected

