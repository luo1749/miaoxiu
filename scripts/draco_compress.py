#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对已绑骨模型（GLB/GLTF）进行 DRACO 压缩，输出最终浏览器可用 GLB。
用法:
    python scripts/draco_compress.py --input output/rigged/miao-garment.glb --output web/public/models/miao-garment.glb
依赖:
    npm install -g @gltf-transform/cli
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


def find_gltf_transform():
    """在 PATH 或 npm 全局目录中查找 gltf-transform 可执行文件。"""
    exe = shutil.which("gltf-transform")
    if exe:
        return exe
    npm_globals = [
        os.path.expandvars(r"%APPDATA%\npm\gltf-transform.cmd"),
        os.path.expandvars(r"%LOCALAPPDATA%\npm\gltf-transform.cmd"),
    ]
    for candidate in npm_globals:
        if os.path.exists(candidate):
            return candidate
    return "gltf-transform"


def run_command(cmd):
    print(f"[执行] {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore")
    if result.returncode != 0:
        print("[错误] STDOUT:", result.stdout)
        print("[错误] STDERR:", result.stderr)
        sys.exit(result.returncode)
    print(result.stdout)


def main():
    parser = argparse.ArgumentParser(description="DRACO compress rigged GLB for web")
    parser.add_argument("--input", "-i", required=True, help="已绑骨 GLB/GLTF 路径")
    parser.add_argument("--output", "-o", default="web/public/models/miao-garment.glb", help="输出 GLB 路径")
    parser.add_argument("--simplify_ratio", type=float, default=0.0, help="简化比例 0-1（默认 0 不简化）")
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        print(f"[错误] 输入文件不存在: {input_path}")
        sys.exit(1)

    gltf_exe = find_gltf_transform()

    cmd = [
        gltf_exe,
        "optimize",
        str(input_path),
        str(output_path),
        "--compress",
        "draco",
        "--texture-size",
        "2048",
        "--texture-compress",
        "webp",
        "--simplify-ratio",
        str(args.simplify_ratio),
    ]
    run_command(cmd)

    size_kb = output_path.stat().st_size / 1024
    print(f"[完成] 输出: {output_path}")
    print(f"[完成] 文件大小: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
