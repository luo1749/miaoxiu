#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Texture Baker：将 2D 服饰照片投影烘焙到 3D 白模，生成带 UV + 贴图的 GLB。

核心流程：
1. 加载 trimesh 网格（Hunyuan3D shape-only 输出）
2. 使用 xatlas 自动展开 UV
3. 正交投影视图，把输入照片采样到 UV 纹理图
4. 导出带纹理的 GLB

依赖：
    pip install trimesh xatlas pillow numpy
"""

import argparse
import os
import sys
import traceback
from pathlib import Path

import numpy as np
import trimesh
import xatlas
from PIL import Image


def log(msg: str):
    print(f"[texture_baker] {msg}")


def load_mesh(path: Path) -> trimesh.Trimesh:
    """加载 GLB/OBJ，合并场景为单个 mesh。"""
    log(f"加载模型: {path}")
    scene = trimesh.load(str(path), force="scene")
    if isinstance(scene, trimesh.Trimesh):
        mesh = scene
    else:
        mesh = scene.to_geometry()

    if not isinstance(mesh, trimesh.Trimesh):
        raise ValueError("无法从输入文件得到 Trimesh")

    log(f"  顶点: {len(mesh.vertices)}, 面: {len(mesh.faces)}")
    return mesh


def unwrap_uv(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    """使用 xatlas 自动展开 UV。"""
    log("使用 xatlas 自动展开 UV...")
    vmapping, indices, uvs = xatlas.parametrize(mesh.vertices, mesh.faces)

    new_vertices = mesh.vertices[vmapping]
    new_faces = indices

    # 保留原 mesh 的可视属性并重建
    new_mesh = trimesh.Trimesh(
        vertices=new_vertices,
        faces=new_faces,
        process=False,
    )
    new_mesh.visual = trimesh.visual.TextureVisuals(
        uv=uvs,
        material=None,
    )
    log(f"  UV 展开完成: 新顶点 {len(new_vertices)}, 新面 {len(new_faces)}, UV 点 {len(uvs)}")
    return new_mesh


def build_ortho_camera_matrix(mesh: trimesh.Trimesh, direction: str = "auto") -> tuple[np.ndarray, np.ndarray]:
    """
    构建正交投影相机。
    返回 (screen_coords Nx2, mask_front N) 。
    screen_coords 范围 [-1, 1]，后续映射到图像像素。
    """
    verts = mesh.vertices.copy()
    faces = mesh.faces

    # 计算面法线，判断正面朝向
    mesh_normals = mesh.face_normals

    # 自动选择 garment 正面方向：取包围盒最大投影面
    if direction == "auto":
        # 分别统计面向 +Z 与 -Z 的面的数量
        nz_pos = np.sum(mesh_normals[:, 2] > 0)
        nz_neg = np.sum(mesh_normals[:, 2] < 0)
        # 面向 -Z 的面更多时，相机从 +Z 看向 -Z（照片拍的是正面）
        direction = "-z" if nz_neg >= nz_pos else "+z"
        log(f"  自动选择投影方向: {direction}")

    if direction == "-z":
        view_axis = np.array([0.0, 0.0, -1.0])
        # 保持 Y 向上，X 向右；Z 指向屏幕内
        screen_x = verts[:, 0]
        screen_y = verts[:, 1]
        front_mask_faces = mesh_normals[:, 2] < -0.05
    elif direction == "+z":
        view_axis = np.array([0.0, 0.0, 1.0])
        screen_x = -verts[:, 0]  # 镜像，使照片左右与模型一致
        screen_y = verts[:, 1]
        front_mask_faces = mesh_normals[:, 2] > 0.05
    else:
        raise ValueError(f"不支持的投影方向: {direction}")

    # 按包围盒归一化到 [-1, 1]
    x_min, x_max = screen_x.min(), screen_x.max()
    y_min, y_max = screen_y.min(), screen_y.max()
    x_center = (x_min + x_max) / 2
    y_center = (y_min + y_max) / 2
    x_range = max(x_max - x_min, 1e-6)
    y_range = max(y_max - y_min, 1e-6)

    scale = 2.0 / max(x_range, y_range)
    screen_coords = np.column_stack([
        (screen_x - x_center) * scale,
        (screen_y - y_center) * scale,
    ])

    # 面级别 front mask 广播到顶点：只要顶点所在任一正面面即算正面
    front_vertex_ids = np.unique(faces[front_mask_faces].flatten())
    vertex_front_mask = np.zeros(len(verts), dtype=bool)
    vertex_front_mask[front_vertex_ids] = True

    return screen_coords, vertex_front_mask


def rasterize_uv_texture(
    mesh: trimesh.Trimesh,
    screen_coords: np.ndarray,
    vertex_front_mask: np.ndarray,
    image: Image.Image,
    texture_size: int = 2048,
    bg_color: tuple = (230, 230, 220, 255),
) -> Image.Image:
    """
    将 UV 空间栅格化，并根据 screen_coords 从输入图片采样颜色。
    仅对 front-facing 面进行贴图，背面使用 bg_color。
    """
    log(f"生成 {texture_size}x{texture_size} 纹理贴图...")
    uvs = mesh.visual.uv
    faces = mesh.faces
    img_w, img_h = image.size
    img_arr = np.array(image.convert("RGBA"))

    # 创建空白纹理
    tex = np.full((texture_size, texture_size, 4), bg_color, dtype=np.uint8)
    mask = np.zeros((texture_size, texture_size), dtype=bool)

    # 将 UV [0,1] 映射到像素坐标
    uv_px = uvs * (texture_size - 1)

    for face_idx, tri in enumerate(faces):
        uv_tri = uv_px[tri]
        screen_tri = screen_coords[tri]

        # 只要该面任一点属于正面，就尝试投影
        if not np.any(vertex_front_mask[tri]):
            continue

        # UV 三角形包围盒
        u_min, u_max = int(np.floor(uv_tri[:, 0].min())), int(np.ceil(uv_tri[:, 0].max()))
        v_min, v_max = int(np.floor(uv_tri[:, 1].min())), int(np.ceil(uv_tri[:, 1].max()))
        u_min, v_min = max(u_min, 0), max(v_min, 0)
        u_max, v_max = min(u_max, texture_size - 1), min(v_max, texture_size - 1)

        if u_min >= u_max or v_min >= v_max:
            continue

        # 栅格化该 UV 三角形
        for py in range(v_min, v_max + 1):
            for px in range(u_min, u_max + 1):
                if mask[py, px]:
                    continue

                p = np.array([px + 0.5, py + 0.5])
                # 计算重心坐标
                v0 = uv_tri[1] - uv_tri[0]
                v1 = uv_tri[2] - uv_tri[0]
                v2 = p - uv_tri[0]

                d00 = np.dot(v0, v0)
                d01 = np.dot(v0, v1)
                d11 = np.dot(v1, v1)
                d20 = np.dot(v2, v0)
                d21 = np.dot(v2, v1)
                denom = d00 * d11 - d01 * d01
                if abs(denom) < 1e-10:
                    continue

                v = (d11 * d20 - d01 * d21) / denom
                w = (d00 * d21 - d01 * d20) / denom
                u = 1.0 - v - w

                if u >= -1e-5 and v >= -1e-5 and w >= -1e-5:
                    # 插值屏幕坐标 -> 映射到图像像素
                    s = u * screen_tri[0] + v * screen_tri[1] + w * screen_tri[2]
                    # screen_coords 范围 [-1, 1]，映射到 [0, 1]
                    sx = (s[0] + 1.0) / 2.0
                    sy = (s[1] + 1.0) / 2.0
                    ix = int(np.clip(sx * (img_w - 1), 0, img_w - 1))
                    iy = int(np.clip((1.0 - sy) * (img_h - 1), 0, img_h - 1))

                    color = img_arr[iy, ix]
                    # 若输入图为 RGBA 且 alpha 较低，使用背景色
                    if color.shape[0] == 4 and color[3] < 20:
                        color = np.array(bg_color, dtype=np.uint8)

                    tex[py, px] = color
                    mask[py, px] = True

    log(f"  已覆盖纹理像素: {int(mask.sum())} / {texture_size * texture_size}")
    return Image.fromarray(tex)


def export_textured_glb(mesh: trimesh.Trimesh, texture: Image.Image, output_path: Path):
    """导出带纹理的 GLB。"""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    material = trimesh.visual.material.PBRMaterial(
        baseColorTexture=texture,
        metallicFactor=0.0,
        roughnessFactor=0.8,
    )
    mesh.visual.material = material
    mesh.visual = trimesh.visual.TextureVisuals(
        uv=mesh.visual.uv,
        material=material,
    )

    mesh.export(str(output_path))
    log(f"导出完成: {output_path} ({output_path.stat().st_size / 1024:.1f} KB)")


def bake_texture(
    input_glb: Path,
    input_image: Path,
    output_glb: Path,
    texture_size: int = 2048,
    projection: str = "auto",
) -> Path:
    """主入口：白模 + 照片 -> 带纹理 GLB。"""
    if not input_glb.exists():
        raise FileNotFoundError(f"输入模型不存在: {input_glb}")
    if not input_image.exists():
        raise FileNotFoundError(f"输入图片不存在: {input_image}")

    mesh = load_mesh(input_glb)
    mesh = unwrap_uv(mesh)
    screen_coords, vertex_front_mask = build_ortho_camera_matrix(mesh, projection)

    image = Image.open(str(input_image))
    log(f"输入图片尺寸: {image.size}, 模式: {image.mode}")

    texture = rasterize_uv_texture(
        mesh, screen_coords, vertex_front_mask, image, texture_size
    )

    export_textured_glb(mesh, texture, output_glb)
    return output_glb


def main():
    parser = argparse.ArgumentParser(description="Bake garment photo onto Hunyuan3D shape-only GLB")
    parser.add_argument("--input_glb", "-m", required=True, help="输入白模 GLB 路径")
    parser.add_argument("--input_image", "-i", required=True, help="输入服饰照片路径")
    parser.add_argument("--output", "-o", required=True, help="输出带纹理 GLB 路径")
    parser.add_argument("--texture_size", type=int, default=2048, help="纹理尺寸（默认 2048）")
    parser.add_argument("--projection", default="auto", choices=["auto", "+z", "-z"], help="投影方向")
    args = parser.parse_args()

    try:
        bake_texture(
            Path(args.input_glb).resolve(),
            Path(args.input_image).resolve(),
            Path(args.output).resolve(),
            args.texture_size,
            args.projection,
        )
        log("纹理烘焙完成")
    except Exception as e:
        log(f"失败: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
