#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Blender 批处理脚本：优化 GLB/OBJ -> 减面 -> 清理 -> 导出 FBX（T-pose，适合 Mixamo）
用法:
    blender -b -P scripts/blender_optimize.py -- --input output/raw/miao-garment.glb --output output/optimized/miao-garment.fbx
"""

import argparse
import sys
import os

# Blender 运行时会自动导入 bpy，直接写脚本即可
import bpy
import bmesh


def get_args():
    parser = argparse.ArgumentParser(description="Blender garment optimization for Mixamo rigging")
    parser.add_argument("--input", "-i", required=True, help="输入 GLB/OBJ 路径")
    parser.add_argument("--output", "-o", default="output/optimized/miao-garment.fbx", help="输出 FBX 路径")
    parser.add_argument("--target_faces", type=int, default=20000, help="目标面数（默认 20000）")
    parser.add_argument("--report", "-r", default="output/optimized/texture_issues.txt", help="纹理问题报告")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for material in bpy.data.materials:
        bpy.data.materials.remove(material)


def import_mesh(path: str):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".glb" or ext == ".gltf":
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".obj":
        bpy.ops.import_scene.obj(filepath=path)
    else:
        raise ValueError(f"不支持的格式: {ext}")

    imported = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
    if not imported:
        raise RuntimeError("未导入任何网格对象")

    # 合并多个网格
    bpy.context.view_layer.objects.active = imported[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = "Garment"
    return obj


def ensure_uv(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    # 若不存在 UV 则展开
    if not obj.data.uv_layers:
        bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")


def clean_and_repair(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles()
    bpy.ops.mesh.delete_loose()
    bpy.ops.mesh.dissolve_degenerate()
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def decimate(obj, target_faces: int):
    bpy.context.view_layer.objects.active = obj
    current = len(obj.data.polygons)
    ratio = min(1.0, target_faces / max(1, current))
    print(f"[减面] 当前面数: {current}, 目标面数: {target_faces}, ratio: {ratio:.4f}")

    mod = obj.modifiers.new(name="Decimate", type="DECIMATE")
    mod.ratio = ratio
    mod.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier="Decimate")


def set_t_pose(obj):
    """服装模型通常没有骨架；这里仅重置变换并面向前方，便于 Mixamo 识别。"""
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # 若需要可在此处旋转模型使正面朝向 +Y


def export_fbx(obj, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.fbx(
        filepath=path,
        use_selection=True,
        global_scale=1.0,
        apply_unit_scale=True,
        apply_scale_options="FBX_SCALE_UNITS",
        axis_forward="-Z",
        axis_up="Y",
        path_mode="COPY",
        embed_textures=True,
        bake_space_transform=True,
    )
    print(f"[导出] FBX 已保存: {path}")


def inspect_textures(obj, report_path: str):
    """检查肩、袖口等刺绣区域纹理分辨率，输出待补画清单。"""
    issues = []
    # 获取材质与贴图
    for slot in obj.material_slots:
        mat = slot.material
        if not mat or not mat.use_nodes:
            continue
        for node in mat.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image:
                img = node.image
                w, h = img.size
                if min(w, h) < 1024:
                    issues.append(f"材质 '{mat.name}' 贴图 '{img.name}' 分辨率较低 ({w}x{h})")

    # 记录建议补画区域（基于 UV 占用的启发式）
    issues.append("建议人工检查区域：")
    issues.append("  - 肩部刺绣（left shoulder / right shoulder UV 岛）")
    issues.append("  - 袖口刺绣（sleeve cuff UV 岛）")
    issues.append("  - 领口纹样（neckline UV 岛）")
    issues.append("  - 门襟/盘扣区域（front placket UV 岛）")

    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(issues))
    print(f"[报告] 纹理问题清单: {report_path}")


def main():
    args = get_args()
    print(f"[输入] {args.input}")
    print(f"[输出] {args.output}")

    reset_scene()
    obj = import_mesh(args.input)
    print(f"[导入] 对象: {obj.name}, 面数: {len(obj.data.polygons)}, 顶点: {len(obj.data.vertices)}")

    ensure_uv(obj)
    clean_and_repair(obj)
    decimate(obj, args.target_faces)
    set_t_pose(obj)
    inspect_textures(obj, args.report)
    export_fbx(obj, args.output)

    print(f"[完成] 优化后面数: {len(obj.data.polygons)}, 顶点: {len(obj.data.vertices)}")
    print(f"[完成] FBX 路径: {args.output}")


if __name__ == "__main__":
    main()
