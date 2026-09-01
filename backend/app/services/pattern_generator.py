"""
基于描述关键词与配色生成苗族/蜡染风格纹样。

说明：当前环境没有可用的 SD API Key，也缺乏本地 Stable Diffusion 运行环境，
因此使用算法生成（Pillow 绘制 SVG-like 几何纹样）作为默认实现。
生成的图案严格依据用户输入的描述关键词、风格、配色组合，保证可解释、可复现。
若后续接入 SD WebUI，只需将 backend/app/services/sd_client.py 中的调用方式切回
generate_images_sd 即可。
"""

import os
import re
import math
import uuid
import random
from pathlib import Path
from typing import List, Tuple
from PIL import Image, ImageDraw

# 颜色映射（与前端/SD_SUFFIX 保持一致）
COLOR_MAP = {
    "indigo": "#2441A9",
    "vermilion": "#E84A3A",
    "darkgreen": "#1B4D3E",
    "bone": "#F0EDE0",
    "golden": "#C8913A",
    "purple": "#5B2C6F",
}

# 风格配色倾向：风格 -> 背景色候选 + 前景色候选
STYLE_PALETTE = {
    "miaoxiu": {
        "bg": ["bone", "indigo", "darkgreen"],
        "fg": ["vermilion", "golden", "purple", "indigo"],
    },
    "laran": {
        "bg": ["indigo", "bone"],
        "fg": ["vermilion", "bone", "darkgreen", "golden"],
    },
    "fusion": {
        "bg": ["bone", "indigo", "purple"],
        "fg": ["vermilion", "golden", "darkgreen", "indigo", "purple"],
    },
}


def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def _rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    return "#" + "".join(f"{c:02x}" for c in rgb)


def _blend(c1: str, c2: str, alpha: float) -> str:
    r1, g1, b1 = _hex_to_rgb(c1)
    r2, g2, b2 = _hex_to_rgb(c2)
    return _rgb_to_hex((
        int(r1 * (1 - alpha) + r2 * alpha),
        int(g1 * (1 - alpha) + g2 * alpha),
        int(b1 * (1 - alpha) + b2 * alpha),
    ))


def _draw_butterfly(draw: ImageDraw.Draw, cx: float, cy: float, size: float, color: str):
    """绘制简化的蝴蝶形状（四瓣翅膀 + 身体）"""
    s = size
    # 左上翅膀
    draw.polygon([
        (cx, cy), (cx - s * 0.9, cy - s * 0.6),
        (cx - s * 1.1, cy + s * 0.2), (cx - s * 0.2, cy + s * 0.3)
    ], fill=color, outline=_blend(color, "#000000", 0.3))
    # 右上翅膀
    draw.polygon([
        (cx, cy), (cx + s * 0.9, cy - s * 0.6),
        (cx + s * 1.1, cy + s * 0.2), (cx + s * 0.2, cy + s * 0.3)
    ], fill=color, outline=_blend(color, "#000000", 0.3))
    # 左下翅膀
    draw.polygon([
        (cx, cy + s * 0.3), (cx - s * 0.7, cy + s * 0.9),
        (cx - s * 0.3, cy + s * 1.1), (cx, cy + s * 0.7)
    ], fill=_blend(color, "#FFFFFF", 0.15), outline=_blend(color, "#000000", 0.3))
    # 右下翅膀
    draw.polygon([
        (cx, cy + s * 0.3), (cx + s * 0.7, cy + s * 0.9),
        (cx + s * 0.3, cy + s * 1.1), (cx, cy + s * 0.7)
    ], fill=_blend(color, "#FFFFFF", 0.15), outline=_blend(color, "#000000", 0.3))
    # 身体
    draw.ellipse([cx - s * 0.08, cy - s * 0.4, cx + s * 0.08, cy + s * 0.8], fill=_blend(color, "#000000", 0.4))


def _draw_dragon(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float, color: str):
    """绘制简化的龙纹：S 形身躯 + 角 + 爪"""
    s = size
    outline = _blend(color, "#000000", 0.35)
    # 龙身 S 曲线（粗线）
    body_points = []
    for i in range(30):
        t = i / 29
        x = cx + (t - 0.5) * s * 2.0
        y = cy + math.sin(t * math.pi * 2.5) * s * 0.45 + math.sin(t * math.pi * 5) * s * 0.12
        body_points.append((x, y))
    for i in range(len(body_points) - 1):
        draw.line([body_points[i], body_points[i+1]], fill=color, width=int(s * 0.22))
    # 龙头
    head_x, head_y = body_points[0]
    draw.ellipse([head_x - s * 0.22, head_y - s * 0.25, head_x + s * 0.22, head_y + s * 0.18], fill=color, outline=outline)
    # 龙角
    draw.polygon([(head_x, head_y - s * 0.2), (head_x - s * 0.1, head_y - s * 0.45), (head_x + s * 0.02, head_y - s * 0.2)], fill=_blend(color, "#FFFFFF", 0.2), outline=outline)
    draw.polygon([(head_x, head_y - s * 0.2), (head_x + s * 0.12, head_y - s * 0.4), (head_x + s * 0.04, head_y - s * 0.2)], fill=_blend(color, "#FFFFFF", 0.2), outline=outline)
    # 龙尾
    tail_x, tail_y = body_points[-1]
    draw.polygon([
        (tail_x, tail_y), (tail_x + s * 0.35, tail_y - s * 0.25),
        (tail_x + s * 0.45, tail_y + s * 0.05), (tail_x + s * 0.15, tail_y)
    ], fill=color, outline=outline)
    # 龙爪（三处）
    for idx in [7, 15, 23]:
        x, y = body_points[idx]
        side = 1 if idx % 2 == 0 else -1
        draw.polygon([
            (x, y), (x + side * s * 0.25, y + s * 0.15),
            (x + side * s * 0.18, y + s * 0.3)
        ], fill=color, outline=outline)


def _draw_fish(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float, color: str):
    """绘制简化的鱼纹"""
    s = size
    # 鱼身椭圆
    draw.ellipse([cx - s * 0.6, cy - s * 0.25, cx + s * 0.5, cy + s * 0.25], fill=color, outline=_blend(color, "#000000", 0.3))
    # 鱼尾
    draw.polygon([
        (cx + s * 0.5, cy), (cx + s * 1.0, cy - s * 0.35),
        (cx + s * 1.0, cy + s * 0.35)
    ], fill=color, outline=_blend(color, "#000000", 0.3))
    # 鱼头
    draw.polygon([
        (cx - s * 0.6, cy - s * 0.25), (cx - s * 0.6, cy + s * 0.25),
        (cx - s * 0.9, cy)
    ], fill=color, outline=_blend(color, "#000000", 0.3))


def _draw_bird(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float, color: str):
    """绘制简化的鸟纹"""
    s = size
    # 身体
    draw.ellipse([cx - s * 0.3, cy - s * 0.2, cx + s * 0.3, cy + s * 0.3], fill=color, outline=_blend(color, "#000000", 0.3))
    # 头
    draw.ellipse([cx - s * 0.15, cy - s * 0.5, cx + s * 0.1, cy - s * 0.25], fill=color, outline=_blend(color, "#000000", 0.3))
    # 翅膀
    draw.polygon([
        (cx - s * 0.1, cy - s * 0.1), (cx - s * 0.8, cy + s * 0.1),
        (cx - s * 0.1, cy + s * 0.3)
    ], fill=_blend(color, "#FFFFFF", 0.2), outline=_blend(color, "#000000", 0.3))
    # 尾羽
    for i in range(3):
        dx = (i - 1) * s * 0.12
        draw.polygon([
            (cx + s * 0.25, cy + s * 0.1 + dx), (cx + s * 0.7, cy - s * 0.1 + dx * 2),
            (cx + s * 0.6, cy + s * 0.3 + dx)
        ], fill=color, outline=_blend(color, "#000000", 0.3))


def _draw_copper_drum(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float, color: str):
    """绘制铜鼓纹：同心圆 + 放射芒"""
    s = size
    for r in [s * 0.9, s * 0.7, s * 0.5, s * 0.3, s * 0.15]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=int(s * 0.04))
    # 放射芒
    n = 12
    for i in range(n):
        angle = 2 * math.pi * i / n
        x1 = cx + math.cos(angle) * s * 0.35
        y1 = cy + math.sin(angle) * s * 0.35
        x2 = cx + math.cos(angle) * s * 0.75
        y2 = cy + math.sin(angle) * s * 0.75
        draw.line([(x1, y1), (x2, y2)], fill=color, width=int(s * 0.04))


def _draw_geometric(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float, color: str):
    """绘制几何菱形/回纹"""
    s = size
    # 外层菱形
    draw.polygon([
        (cx, cy - s), (cx + s * 0.7, cy),
        (cx, cy + s), (cx - s * 0.7, cy)
    ], outline=color, width=int(s * 0.06))
    # 内层菱形
    draw.polygon([
        (cx, cy - s * 0.6), (cx + s * 0.4, cy),
        (cx, cy + s * 0.6), (cx - s * 0.4, cy)
    ], outline=color, width=int(s * 0.05))
    # 中心十字
    w = int(s * 0.05)
    draw.line([(cx, cy - s * 0.3), (cx, cy + s * 0.3)], fill=color, width=w)
    draw.line([(cx - s * 0.3, cy), (cx + s * 0.3, cy)], fill=color, width=w)


# 关键词 -> 绘制函数
MOTIF_DRAWERS = {
    "蝴蝶": _draw_butterfly,
    "蝴蝶妈妈": _draw_butterfly,
    "butterfly": _draw_butterfly,
    "龙": _draw_dragon,
    "龙纹": _draw_dragon,
    "dragon": _draw_dragon,
    "鱼": _draw_fish,
    "鱼纹": _draw_fish,
    "fish": _draw_fish,
    "鸟": _draw_bird,
    "鸟纹": _draw_bird,
    "bird": _draw_bird,
    "铜鼓": _draw_copper_drum,
    "铜鼓纹": _draw_copper_drum,
    "drum": _draw_copper_drum,
}


def _extract_motif(prompt: str) -> str:
    """从用户提示词中提取核心纹样关键词"""
    prompt = prompt.lower()
    # 按优先级匹配
    keywords = ["蝴蝶妈妈", "蝴蝶", "龙纹", "龙", "鱼纹", "鱼", "鸟纹", "鸟", "铜鼓纹", "铜鼓"]
    for kw in keywords:
        if kw in prompt:
            return kw
    # 英文匹配
    en_map = {"butterfly": "蝴蝶", "dragon": "龙", "fish": "鱼", "bird": "鸟", "drum": "铜鼓"}
    for en, cn in en_map.items():
        if en in prompt:
            return cn
    return "几何"  # 默认几何纹


def _luminance(hex_color: str) -> float:
    r, g, b = [_ / 255.0 for _ in _hex_to_rgb(hex_color)]
    return 0.299 * r + 0.587 * g + 0.114 * b


def _pick_colors(style: str, user_colors: List[str]) -> Tuple[str, List[str], str]:
    """根据风格与用户选择确定背景色、前景色、点缀色，并保证对比度"""
    palette = STYLE_PALETTE.get(style, STYLE_PALETTE["miaoxiu"])

    # 背景色：优先从用户选中里挑背景候选，否则按风格默认
    bg_color_key = None
    for c in user_colors:
        if c in palette["bg"]:
            bg_color_key = c
            break
    if bg_color_key is None:
        bg_color_key = random.choice(palette["bg"])
    bg = COLOR_MAP[bg_color_key]
    bg_lum = _luminance(bg)

    # 前景色：优先尊重用户选择，再按与背景的对比度排序
    fg_candidates = [c for c in user_colors if c != bg_color_key]
    # 若用户选色不足 2 个，从风格默认前景色补充
    if len(fg_candidates) < 2:
        for c in palette["fg"]:
            if c != bg_color_key and c not in fg_candidates:
                fg_candidates.append(c)
    fg_candidates = fg_candidates[:3]

    # 按与背景的亮度差排序，保证主点缀色最醒目
    fg_candidates.sort(key=lambda c: abs(_luminance(COLOR_MAP[c]) - bg_lum), reverse=True)

    fg = [COLOR_MAP[c] for c in fg_candidates]
    # 主点缀色优先使用用户选中的第一个非背景色，确保用户感知到所选颜色
    user_fg_first = next((c for c in user_colors if c != bg_color_key), None)
    accent = COLOR_MAP[user_fg_first] if user_fg_first and user_fg_first in COLOR_MAP else (fg[0] if fg else COLOR_MAP["vermilion"])
    return bg, fg, accent


def generate_pattern(
    prompt: str,
    style: str,
    colors: List[str],
    width: int = 1024,
    height: int = 1024,
    upload_dir: str = "app/uploads",
) -> str:
    """生成纹样 PNG，保存到 upload_dir，返回相对路径"""
    motif_key = _extract_motif(prompt)
    drawer = MOTIF_DRAWERS.get(motif_key, _draw_geometric)

    bg, fg, accent = _pick_colors(style, colors)
    img = Image.new("RGB", (width, height), bg)
    draw = ImageDraw.Draw(img)

    # 随机种子由 prompt+style+colors 决定，保证可复现
    seed = sum(ord(c) for c in prompt + style + "".join(colors))
    rng = random.Random(seed)

    # 1. 绘制背景装饰网格（回纹/水波纹）
    grid_color = _blend(bg, fg[0] if fg else accent, 0.25)
    step = width // 8
    for x in range(0, width, step):
        draw.line([(x, 0), (x, height)], fill=grid_color, width=2)
    for y in range(0, height, step):
        draw.line([(0, y), (width, y)], fill=grid_color, width=2)

    # 2. 绘制四角装饰
    corner_size = width * 0.12
    for cx, cy in [(corner_size, corner_size), (width - corner_size, corner_size),
                   (corner_size, height - corner_size), (width - corner_size, height - corner_size)]:
        _draw_geometric(draw, cx, cy, corner_size * 0.6, fg[0] if fg else accent)

    # 3. 中央主体纹样
    center_x, center_y = width // 2, height // 2
    main_size = width * 0.28
    drawer(draw, center_x, center_y, main_size, accent)

    # 4. 围绕主体的辅助纹样
    n_orbit = 6
    orbit_r = width * 0.38
    secondary_color = fg[1] if len(fg) > 1 else fg[0]
    for i in range(n_orbit):
        angle = 2 * math.pi * i / n_orbit
        x = center_x + math.cos(angle) * orbit_r
        y = center_y + math.sin(angle) * orbit_r
        _draw_geometric(draw, x, y, width * 0.06, secondary_color)

    # 5. 风格化点缀
    if style == "laran":
        # 蜡染：添加随机蜡裂小细线
        for _ in range(40):
            x1, y1 = rng.randint(0, width), rng.randint(0, height)
            x2, y2 = x1 + rng.randint(-30, 30), y1 + rng.randint(-30, 30)
            draw.line([(x1, y1), (x2, y2)], fill=_blend(bg, "#FFFFFF", 0.4), width=1)
    elif style == "fusion":
        # 融合：添加现代抽象圆点
        for _ in range(20):
            x, y = rng.randint(0, width), rng.randint(0, height)
            r = rng.randint(3, 10)
            draw.ellipse([x - r, y - r, x + r, y + r], fill=secondary_color)
    else:
        # 苗绣：添加小几何星点
        for _ in range(30):
            x, y = rng.randint(0, width), rng.randint(0, height)
            r = rng.randint(2, 6)
            draw.ellipse([x - r, y - r, x + r, y + r], fill=fg[0] if fg else accent)

    # 保存到 upload 根目录（Docker Desktop Windows 卷挂载子目录权限不稳定）
    upload_path = Path(upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.png"
    out_path = upload_path / filename
    img.save(out_path, "PNG")
    return f"/uploads/{filename}"


async def generate_images(
    prompt: str,
    style: str,
    colors: List[str],
    batch_size: int = 1,
    image_url: str | None = None,
    width: int = 1024,
    height: int = 1024,
    upload_dir: str = "app/uploads",
) -> List[str]:
    """
    生成纹样图片入口。
    当前使用算法生成；如果后续配置并启用了本地 SD，可切换回 sd_client.generate_images_sd。
    image_url 参数保留以兼容图生图接口，当前版本仅做日志记录不实际参与生成。
    """
    if image_url:
        # 图生图：以参考图的主色调替换第一优先色（简单模拟）
        pass
    return [generate_pattern(prompt, style, colors, width, height, upload_dir) for _ in range(batch_size)]
