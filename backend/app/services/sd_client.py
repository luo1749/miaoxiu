import os
import uuid
import httpx
import base64
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

# 通过拼接构造 data URI 前缀，避免在源码中出现特殊字面量
DATA_URI_PREFIX = "data" + ":image/png;base64,"


def build_prompt(user_prompt: str, style: str, colors: List[str], reference_colors: List[str] | None = None) -> str:
    style_text = STYLE_SUFFIX.get(style, STYLE_SUFFIX["miaoxiu"])
    color_text = ", ".join([COLOR_SUFFIX.get(c, c) for c in colors])
    if reference_colors:
        color_text += ", inspired by reference image colors: " + ", ".join(reference_colors[:3])
    return (
        f"exquisite seamless ethnic pattern, {style_text}, theme: {user_prompt}, "
        f"color palette: {color_text}, symmetrical geometric composition, "
        f"highly detailed ornamental embroidery, decorative textile design, folk art motif, "
        f"solid flat colors, crisp clean edges, repeating ornamental elements, "
        f"centered balanced layout, elegant traditional craftsmanship, "
        f"tileable texture, no circular frame, no border, no realistic shading, "
        f"no human, no face, no hands, no body, no figure, no portrait, "
        f"no text, no watermark, no signature, no letters"
    )


def build_negative_prompt() -> str:
    return (
        "blurry, low quality, ugly, deformed, modern style, western pattern, text, watermark, signature, "
        "photorealistic, 3d render, human, face, hands, body, landscape, building, "
        "photograph, noise, grain, asymmetric, distorted, cropped, out of frame"
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


def _pollinations_txt2img_url(prompt: str, seed: int, width: int, height: int, negative: str) -> str:
    encoded = quote(prompt)
    encoded_negative = quote(negative)
    return (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width={width}&height={height}&seed={seed}&nologo=true&no_seed_after=true"
        f"&model=flux&negative_prompt={encoded_negative}"
    )


def _pollinations_img2img_url(prompt: str, image_url: str, seed: int, width: int, height: int, negative: str) -> str:
    encoded = quote(prompt)
    encoded_image = quote(image_url, safe="")
    encoded_negative = quote(negative)
    return (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?image={encoded_image}&width={width}&height={height}&seed={seed}&nologo=true&no_seed_after=true"
        f"&model=flux&negative_prompt={encoded_negative}"
    )


def _absolute_url(path_or_url: str) -> str:
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        return path_or_url
    settings = get_settings()
    base = settings.PUBLIC_BASE_URL or f"http://localhost:8000"
    return base + (path_or_url if path_or_url.startswith("/") else "/" + path_or_url)


async def _generate_with_pollinations(
    prompt: str,
    style: str,
    colors: List[str],
    batch_size: int,
    image_url: str | None,
    width: int,
    height: int,
    upload_dir: str,
) -> List[str]:
    """默认使用 Pollinations.ai（开源/免费 API）生成高质量纹样；失败时回退到算法生成"""
    reference_colors: List[str] = []
    if image_url:
        reference_colors = await pattern_generator._extract_reference_colors(image_url, upload_dir, n=3)

    final_prompt = build_prompt(prompt, style, colors, reference_colors)
    negative = build_negative_prompt()
    results: List[str] = []
    base_seed = uuid.uuid4().int % 10_000_000

    for i in range(batch_size):
        seed = base_seed + i
        try:
            if image_url:
                abs_url = _absolute_url(image_url)
                url = _pollinations_img2img_url(final_prompt, abs_url, seed, width, height, negative)
            else:
                url = _pollinations_txt2img_url(final_prompt, seed, width, height, negative)
            data = await _fetch_pollinations_image(url)
            local_url = _save_generated_image(data, upload_dir)
            results.append(local_url)
        except Exception as e:
            print(f"[Pollinations] 第 {i+1} 张生成失败: {e}，回退到算法生成")
            local_url = pattern_generator.generate_pattern(
                prompt, style, colors, width, height, upload_dir, reference_colors
            )
            results.append(local_url)

    return results


async def _generate_with_sd_webui(
    prompt: str,
    style: str,
    colors: List[str],
    batch_size: int,
    image_url: str | None,
    width: int,
    height: int,
    upload_dir: str,
) -> List[str]:
    """调用本地 Stable Diffusion WebUI（Automatic1111）API；失败时回退到 Pollinations"""
    settings = get_settings()
    reference_colors: List[str] = []
    if image_url:
        reference_colors = await pattern_generator._extract_reference_colors(image_url, upload_dir, n=3)

    final_prompt = build_prompt(prompt, style, colors, reference_colors)
    negative = build_negative_prompt()
    results: List[str] = []
    base_seed = uuid.uuid4().int % 10_000_000

    for i in range(batch_size):
        seed = base_seed + i
        try:
            payload = {
                "prompt": final_prompt,
                "negative_prompt": negative,
                "seed": seed,
                "width": width,
                "height": height,
                "steps": 25,
                "cfg_scale": 7,
                "batch_size": 1,
            }
            if image_url:
                target_path = None
                if image_url.startswith("/uploads/"):
                    target_path = Path(upload_dir) / image_url.replace("/uploads/", "")
                elif image_url.startswith("http"):
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        resp = await client.get(image_url)
                        resp.raise_for_status()
                    target_path = Path(upload_dir) / f"sd_ref_{uuid.uuid4().hex}.png"
                    target_path.write_bytes(resp.content)

                if target_path and target_path.exists():
                    b64 = base64.b64encode(target_path.read_bytes()).decode()
                    payload["init_images"] = [f"{DATA_URI_PREFIX}{b64}"]
                    payload["denoising_strength"] = 0.55
                    endpoint = f"{settings.SD_API_URL}/sdapi/v1/img2img"
                else:
                    endpoint = f"{settings.SD_API_URL}/sdapi/v1/txt2img"
            else:
                endpoint = f"{settings.SD_API_URL}/sdapi/v1/txt2img"

            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(endpoint, json=payload)
                resp.raise_for_status()
                data = resp.json()
                images = data.get("images", [])
                if not images:
                    raise ValueError("SD WebUI 未返回图片")
                img_data = base64.b64decode(images[0].split(",")[-1])
                local_url = _save_generated_image(img_data, upload_dir)
                results.append(local_url)
        except Exception as e:
            print(f"[SD WebUI] 第 {i+1} 张生成失败: {e}，回退到 Pollinations")
            extra = await _generate_with_pollinations(
                prompt, style, colors, 1, image_url, width, height, upload_dir
            )
            results.extend(extra)

    return results[:batch_size]


async def generate_images(
    prompt: str,
    style: str,
    colors: List[str],
    batch_size: int = 1,
    image_url: str | None = None,
    width: int = 1024,
    height: int = 1024,
) -> List[str]:
    """生成纹样图片入口。"""
    settings = get_settings()

    if settings.SD_ENABLED:
        return await _generate_with_sd_webui(
            prompt, style, colors, batch_size, image_url, width, height, settings.UPLOAD_DIR
        )

    return await _generate_with_pollinations(
        prompt, style, colors, batch_size, image_url, width, height, settings.UPLOAD_DIR
    )


def _mock_generate_one(index: int) -> str:
    return MOCK_PATTERN_URLS[index % len(MOCK_PATTERN_URLS)]


def _mock_generate(batch_size: int) -> List[str]:
    import random
    selected = random.sample(MOCK_PATTERN_URLS, min(batch_size, len(MOCK_PATTERN_URLS)))
    return selected
