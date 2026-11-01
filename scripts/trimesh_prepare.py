#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
基于 trimesh 的 3D 服装模型预处理脚本（无需 Blender）
用途：将 AI 生成的服装 GLB 合并、清理、缩放、减面，输出可直接用于 WebAR 试衣的 GLB。
运行环境：D:\miaoxiu\tools\hy3d-env\Scripts\python.exe

用法示例:
    python scripts/trimesh_prepare.py --input output/raw/garment_mesh.glb --output output/optimized/garment_webready.glb --target_faces 25000
"""

import argparse
import sys
import traceback
from pathlib import Path

import numpy as np
import trimesh


def log(msg: str):
    print(f"[trimesh_prepare] {msg}")


def load_and_merge(input_path: Path) -> trimesh.Trimesh:
    """加载 GLB 并将 scene 内所有几何体合并为单个 mesh。"""
    log(f"加载模型: {input_path}")
    scene = trimesh.load(str(input_path), force="scene")
    if not isinstance(scene, trimesh.Scene):
        raise ValueError("输入文件未能解析为 trimesh.Scene，请检查是否为 GLB/GLTF 格式")

    log(f"  场景包含 {len(scene.geometry)} 个几何体")
    mesh = scene.to_geometry()
    if not isinstance(mesh, trimesh.Trimesh):
        raise ValueError("scene.to_geometry() 未能返回 Trimesh")

    log(f"  合并后: 顶点 {len(mesh.vertices)}, 面 {len(mesh.faces)}")
    return mesh


def remove_tiny_fragments(mesh: trimesh.Trimesh, min_face_count: int = 50) -> trimesh.Trimesh:
    """可选：过滤掉面数少于阈值的孤立碎片。"""
    if len(mesh.faces) == 0:
        return mesh

    # 使用 connected_components 找到连通区域
    components = mesh.split(only_watertight=False)
    if len(components) <= 1:
        log("  未发现孤立碎片")
        return mesh

    kept = [c for c in components if len(c.faces) >= min_face_count]
    removed = len(components) - len(kept)
    if removed == 0:
        log("  无需清理碎片")
        return mesh

    mesh = trimesh.util.concatenate(kept)
    log(f"  清理碎片: 移除 {removed} 个小组件，剩余面数 {len(mesh.faces)}")
    return mesh


def normalize_scale(mesh: trimesh.Trimesh, target_height: float = 1.7) -> tuple[trimesh.Trimesh, float]:
    """按包围盒高度缩放模型到适合人体试衣的尺寸，返回缩放后的 mesh 与缩放比例。"""
    bbox = mesh.bounding_box.extents
    height = float(bbox[1])  # 假设 Y 轴为身高方向
    if height <= 0:
        raise ValueError("模型高度为 0，无法缩放")

    scale = target_height / height
    mesh.apply_scale(scale)
    log(f"  缩放比例: {scale:.6f} (原始高度 {height:.3f} -> 目标 {target_height:.3f})")
    return mesh, scale


def decimate(mesh: trimesh.Trimesh, target_faces: int) -> trimesh.Trimesh:
    """使用二次误差度量进行网格减面。"""
    current_faces = len(mesh.faces)
    if current_faces <= target_faces:
        log(f"  当前面数 {current_faces} 已小于目标 {target_faces}，跳过减面")
        return mesh

    ratio = target_faces / current_faces
    # trimesh 的 simplify_quadric_decimation 接收 face_count 或 ratio
    simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
    log(f"  减面: {current_faces} -> {len(simplified.faces)} 面 (目标 {target_faces}, 比例 {ratio:.4f})")
    return simplified


def export_glb(mesh: trimesh.Trimesh, output_path: Path):
    """导出为 GLB 格式。"""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(str(output_path))
    log(f"导出完成: {output_path}")
    log(f"  文件大小: {output_path.stat().st_size / 1024:.1f} KB")


def print_bbox(mesh: trimesh.Trimesh, label: str):
    """打印包围盒信息。"""
    bounds = mesh.bounds
    extents = mesh.bounding_box.extents
    log(f"{label} 包围盒:")
    log(f"  min: [{bounds[0][0]:.4f}, {bounds[0][1]:.4f}, {bounds[0][2]:.4f}]")
    log(f"  max: [{bounds[1][0]:.4f}, {bounds[1][1]:.4f}, {bounds[1][2]:.4f}]")
    log(f"  extents: [{extents[0]:.4f}, {extents[1]:.4f}, {extents[2]:.4f}]")


def main():
    parser = argparse.ArgumentParser(description="Prepare garment GLB for WebAR using trimesh")
    parser.add_argument("--input", "-i", required=True, help="输入 GLB 路径")
    parser.add_argument("--output", "-o", default="output/optimized/garment_webready.glb", help="输出 GLB 路径")
    parser.add_argument("--target_faces", type=int, default=25000, help="目标三角面数量（默认 25000）")
    parser.add_argument("--target_height", type=float, default=1.7, help="缩放后目标高度，单位米（默认 1.7）")
    parser.add_argument("--min_fragment_faces", type=int, default=50, help="过滤碎片面数阈值（默认 50）")
    parser.add_argument("--skip_fragment_filter", action="store_true", help="跳过碎面过滤")
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()

    if not input_path.exists():
        log(f"错误：输入文件不存在: {input_path}")
        sys.exit(1)

    try:
        # 1. 加载并合并
        mesh = load_and_merge(input_path)
        print_bbox(mesh, "原始")

        # 2. 清理碎面
        if not args.skip_fragment_filter:
            mesh = remove_tiny_fragments(mesh, args.min_fragment_faces)

        # 3. 缩放
        mesh, scale = normalize_scale(mesh, args.target_height)
        print_bbox(mesh, "缩放后")

        # 4. 减面
        mesh = decimate(mesh, args.target_faces)
        print_bbox(mesh, "减面后")

        # 5. 确保法线正确
        mesh.fix_normals()

        # 6. 导出
        export_glb(mesh, output_path)

        log("全部处理完成")
    except Exception as e:
        log(f"处理失败: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
