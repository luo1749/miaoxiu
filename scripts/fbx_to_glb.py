#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Blender 批处理：将 Mixamo 下载的 FBX 转换为浏览器可用的 GLB。
用法:
    blender -b -P scripts/fbx_to_glb.py -- --input output/rigged/miao-garment-rigged.fbx --output output/rigged/miao-garment.glb
"""

import argparse
import sys
import os
import bpy


def get_args():
    parser = argparse.ArgumentParser(description="Convert Mixamo FBX to GLB")
    parser.add_argument("--input", "-i", required=True, help="输入 FBX 路径")
    parser.add_argument("--output", "-o", required=True, help="输出 GLB 路径")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def main():
    args = get_args()
    reset_scene()

    print(f"[导入] {args.input}")
    bpy.ops.import_scene.fbx(filepath=args.input)

    # 应用所有变换
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    print(f"[导出] {args.output}")
    bpy.ops.export_scene.gltf(
        filepath=args.output,
        export_format="GLB",
        export_textures=True,
        export_yup=True,
    )
    print("[完成]")


if __name__ == "__main__":
    main()
