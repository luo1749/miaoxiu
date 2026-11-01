#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
照片 -> 3D GLB 推理脚本（基于 Hunyuan3D-2）
用法:
    python scripts/generate_glb.py --input assets/miao-garment-photo.jpg --output output/raw/miao-garment.glb
环境:
    使用 D:\miaoxiu\tools\hy3d-env\Scripts\python.exe
说明:
    当前环境因网络原因安装的是 CPU 版 PyTorch；在本地有 CUDA 版 PyTorch 时，
    该脚本会自动使用 GPU 推理。若显存不足，可加上 --low_vram_mode。
"""

import argparse
import os
import sys
from pathlib import Path

def check_env():
    try:
        import torch
        print(f"[环境] PyTorch {torch.__version__}")
        print(f"[环境] CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"[环境] CUDA device: {torch.cuda.get_device_name(0)}")
            print(f"[环境] CUDA memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    except Exception as e:
        print(f"[警告] 无法检测 PyTorch/CUDA: {e}")

def main():
    parser = argparse.ArgumentParser(description="Hunyuan3D-2 image-to-3D pipeline")
    parser.add_argument("--input", "-i", required=True, help="输入服饰照片路径（建议已抠图或纯色背景）")
    parser.add_argument("--output", "-o", default="output/raw/miao-garment.glb", help="输出 GLB 路径")
    parser.add_argument("--model_path", default="tencent/Hunyuan3D-2", help="HuggingFace 模型仓库")
    parser.add_argument("--low_vram_mode", action="store_true", help="低显存模式")
    parser.add_argument("--skip_texture", action="store_true", help="仅生成白模，跳过纹理生成")
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        print(f"[错误] 输入文件不存在: {input_path}")
        sys.exit(1)

    check_env()

    print(f"[1/4] 加载依赖...")
    from PIL import Image
    from hy3dgen.rembg import BackgroundRemover
    from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
    from hy3dgen.texgen import Hunyuan3DPaintPipeline

    print(f"[2/4] 加载图像并预处理: {input_path}")
    image = Image.open(input_path).convert("RGBA")
    if image.mode == "RGB":
        print("   图像为 RGB，自动进行背景移除...")
        rembg = BackgroundRemover()
        image = rembg(image)

    print(f"[3/4] 生成几何体（shape generation）...")
    pipeline_shapegen = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
        args.model_path,
        low_vram_mode=args.low_vram_mode,
    )
    mesh = pipeline_shapegen(image=image)[0]

    if not args.skip_texture:
        print(f"[4/4] 生成纹理（texture generation）...")
        pipeline_texgen = Hunyuan3DPaintPipeline.from_pretrained(args.model_path)
        mesh = pipeline_texgen(mesh, image=image)
    else:
        print("[4/4] 跳过纹理生成")

    mesh.export(str(output_path))
    print(f"[完成] 输出: {output_path}")
    print(f"[完成] 文件大小: {output_path.stat().st_size / 1024:.1f} KB")

    # 简单统计
    try:
        faces = len(mesh.faces) if hasattr(mesh, "faces") else "N/A"
        vertices = len(mesh.vertices) if hasattr(mesh, "vertices") else "N/A"
        print(f"[统计] 顶点数: {vertices}, 面数: {faces}")
    except Exception as e:
        print(f"[统计] 无法读取网格统计: {e}")

if __name__ == "__main__":
    main()
