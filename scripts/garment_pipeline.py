#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
端到端苗绣服饰 3D 资产生成管线

阶段 1：Hunyuan3D-2 shape-only 生成服装白模 GLB（跳过纹理，规避 custom_rasterizer）
阶段 2：trimesh 后处理（UV 展开、照片烘焙、减面、DRACO 压缩）
阶段 3：输出可直接用于 WebAR 前端加载的最终 GLB

用法示例（PowerShell）：
    $env:HF_ENDPOINT = "https://hf-mirror.com"
    D:\miaoxiu\vton_test_env\Scripts\python.exe scripts\garment_pipeline.py `
        --input_image assets\miao-garment-photo.png `
        --output_glb web\public\models\miao-garment.glb

依赖清单：
    pip install torch torchvision torchaudio --index-url https://pypi.tuna.tsinghua.edu.cn/simple
    pip install -r tools\Hunyuan3D-2\requirements.txt
    pip install -e tools\Hunyuan3D-2
    pip install fast-simplification
"""

import argparse
import os
import subprocess
import sys
import traceback
from pathlib import Path


def log(msg: str):
    print(f"[garment_pipeline] {msg}")


def run_cmd(cmd: list[str], env: dict | None = None):
    """运行子命令，失败则退出。"""
    log(f"执行: {' '.join(cmd)}")
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    result = subprocess.run(cmd, env=merged_env, text=True, encoding="utf-8", errors="ignore")
    if result.returncode != 0:
        raise RuntimeError(f"命令失败: {' '.join(cmd)}")
    return result


def stage1_shape_generation(
    python_exe: Path,
    input_image: Path,
    raw_glb: Path,
    low_vram: bool = True,
) -> Path:
    """阶段 1：Hunyuan3D-2 shape-only。"""
    log("===== 阶段 1: Hunyuan3D-2 shape-only 生成白模 =====")
    script = Path(__file__).parent / "generate_glb.py"
    cmd = [
        str(python_exe),
        str(script),
        "--input", str(input_image),
        "--output", str(raw_glb),
        "--skip_texture",
    ]
    if low_vram:
        cmd.append("--low_vram_mode")

    env = {"HF_ENDPOINT": "https://hf-mirror.com"}
    run_cmd(cmd, env)
    return raw_glb


def stage2_optimize_and_bake(
    python_exe: Path,
    raw_glb: Path,
    input_image: Path,
    optimized_glb: Path,
    target_faces: int = 25000,
) -> Path:
    """阶段 2a：trimesh 减面 + UV 展开 + 照片烘焙。"""
    log("===== 阶段 2: 优化网格并烘焙照片纹理 =====")

    # 2.1 合并、清理、缩放、减面
    temp_optimized = raw_glb.parent / "temp_optimized.glb"
    prep_script = Path(__file__).parent / "trimesh_prepare.py"
    run_cmd([
        str(python_exe),
        str(prep_script),
        "--input", str(raw_glb),
        "--output", str(temp_optimized),
        "--target_faces", str(target_faces),
        "--target_height", "1.7",
    ])

    # 2.2 烘焙 2D 照片到 UV 纹理
    baker_script = Path(__file__).parent / "texture_baker.py"
    run_cmd([
        str(python_exe),
        str(baker_script),
        "--input_glb", str(temp_optimized),
        "--input_image", str(input_image),
        "--output", str(optimized_glb),
        "--texture_size", "2048",
        "--projection", "auto",
    ])

    if temp_optimized.exists():
        temp_optimized.unlink()

    return optimized_glb


def stage3_draco_compress(
    python_exe: Path,
    optimized_glb: Path,
    final_glb: Path,
) -> Path:
    """阶段 3：DRACO 压缩。"""
    log("===== 阶段 3: DRACO 压缩 =====")
    draco_script = Path(__file__).parent / "draco_compress.py"
    run_cmd([
        str(python_exe),
        str(draco_script),
        "--input", str(optimized_glb),
        "--output", str(final_glb),
    ])
    return final_glb


def main():
    parser = argparse.ArgumentParser(description="End-to-end Miao garment GLB pipeline")
    parser.add_argument("--input_image", "-i", required=True, help="输入服饰照片路径（支持 PNG/JPG，RGBA 更佳）")
    parser.add_argument("--output_glb", "-o", default="web/public/models/miao-garment.glb", help="最终输出 GLB 路径")
    parser.add_argument("--python_exe", default=r"D:\miaoxiu\vton_test_env\Scripts\python.exe", help="Python 解释器路径")
    parser.add_argument("--target_faces", type=int, default=25000, help="减面目标面数（默认 25000）")
    parser.add_argument("--low_vram", action="store_true", help="Hunyuan3D 低显存模式")
    parser.add_argument("--skip_shape_gen", action="store_true", help="跳过阶段 1，直接使用后处理已存在的白模")
    parser.add_argument("--raw_glb", default="output/raw/pipeline_raw.glb", help="阶段 1 白模输出路径")
    parser.add_argument("--optimized_glb", default="output/optimized/pipeline_baked.glb", help="阶段 2 烘焙后 GLB 路径")
    args = parser.parse_args()

    python_exe = Path(args.python_exe).resolve()
    input_image = Path(args.input_image).resolve()
    output_glb = Path(args.output_glb).resolve()
    raw_glb = Path(args.raw_glb).resolve()
    optimized_glb = Path(args.optimized_glb).resolve()

    if not python_exe.exists():
        log(f"错误: Python 解释器不存在: {python_exe}")
        sys.exit(1)
    if not input_image.exists():
        log(f"错误: 输入图片不存在: {input_image}")
        sys.exit(1)

    try:
        if not args.skip_shape_gen:
            stage1_shape_generation(python_exe, input_image, raw_glb, args.low_vram)
        else:
            if not raw_glb.exists():
                log(f"错误: 指定 --skip_shape_gen 但白模不存在: {raw_glb}")
                sys.exit(1)
            log("跳过阶段 1，使用已有白模")

        stage2_optimize_and_bake(python_exe, raw_glb, input_image, optimized_glb, args.target_faces)
        stage3_draco_compress(python_exe, optimized_glb, output_glb)

        log(f"===== 管线完成 =====")
        log(f"最终模型: {output_glb}")
        log(f"文件大小: {output_glb.stat().st_size / 1024:.1f} KB")
    except Exception as e:
        log(f"管线失败: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
