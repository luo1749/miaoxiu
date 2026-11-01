# 苗绣民族服饰：拍照 → 3D → 前端 操作手册

> 目标：为“AI+AR 赋能铜仁苗绣蜡染非遗活态传承平台”建立一条可复现的“照片 → AI 生成 3D → 修复绑骨 → 接入前端”管线。
> 本手册基于 [Tencent Hunyuan3D-2](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) 与项目现有 Softwear 前端（`web/src/components/ARTryOnCamera.tsx`）。

---

## 1. 环境与依赖

### 1.1 已确认环境

| 项目 | 当前环境状态 | 备注 |
|------|--------------|------|
| GPU | NVIDIA RTX 5070，12 GB 显存 | 可用，但因网络原因未安装 CUDA 版 PyTorch |
| Python | 3.11.9（`C:\Users\luo\AppData\Local\Programs\Python\Python311\python.exe`） | 推荐 |
| Node.js | v24.16.0 / npm 11.13.0 | 已可用 |
| Blender | 未找到 | 需用户确认安装路径或重新安装 ≥3.6 |
| Hunyuan3D-2 | 已 clone 到 `D:\miaoxiu\tools\Hunyuan3D-2` | 已安装为 editable 包 `hy3dgen` |

### 1.2 创建 Python 环境

```powershell
# 在项目根目录执行
C:\Users\luo\AppData\Local\Programs\Python\Python311\python.exe -m venv D:\miaoxiu\tools\hy3d-env
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe -m pip install --upgrade pip
```

### 1.3 安装 PyTorch（CUDA 版，本地执行时必须）

> 当前容器/环境因网络限制无法从 PyTorch 官网下载 CUDA 版 whl，因此仅安装了 CPU 版 torch。
> 在本地网络正常且有 NVIDIA GPU 时，请务必执行以下命令：

```powershell
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe -m pip uninstall torch torchvision torchaudio -y
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
```

验证：

```powershell
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe -c "import torch; print(torch.__version__); print(torch.cuda.is_available())"
```

应输出 `True` 与 GPU 名称。

### 1.4 安装 Hunyuan3D-2 依赖

```powershell
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe -m pip install -r D:\miaoxiu\tools\Hunyuan3D-2\requirements.txt
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe -m pip install -e D:\miaoxiu\tools\Hunyuan3D-2
```

### 1.5 安装 DRACO 压缩工具

```powershell
npm install -g @gltf-transform/cli
```

---

## 2. 照片 → GLB 推理

### 2.1 入口脚本

`scripts/generate_glb.py` 已按 Hunyuan3D-2 官方 `minimal_demo.py` 编写，入口为：

```python
from hy3dgen.rembg import BackgroundRemover
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
from hy3dgen.texgen import Hunyuan3DPaintPipeline
```

### 2.2 运行命令

准备一张服饰照片（建议分辨率 512×512 以上，背景尽量纯色或已抠图），放到项目目录，例如：

```
D:\miaoxiu\assets\miao-garment-photo.jpg
```

执行：

```powershell
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe D:\miaoxiu\scripts\generate_glb.py `
  --input D:\miaoxiu\assets\miao-garment-photo.jpg `
  --output D:\miaoxiu\output\raw\miao-garment.glb `
  --low_vram_mode
```

> `--low_vram_mode` 在 12 GB 显存下建议保留。若显存 ≥16 GB 可去掉。

### 2.3 预期输出

```text
[完成] 输出: D:\miaoxiu\output\raw\miao-garment.glb
[完成] 文件大小: 约 5-20 MB
[统计] 顶点数: 约 5-20 万, 面数: 约 10-40 万
```

> 若 HuggingFace 访问受阻，可设置镜像：
> ```powershell
> $env:HF_ENDPOINT = "https://hf-mirror.com"
> ```
> 或预先使用 `huggingface-cli download tencent/Hunyuan3D-2` 下载模型到本地缓存。

---

## 3. Blender 修复与优化

### 3.1 前提

Blender ≥3.6 必须已安装，且 `blender.exe` 在 PATH 中，或调用绝对路径：

```powershell
# 示例
& "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe" -b -P D:\miaoxiu\scripts\blender_optimize.py -- --input ...
```

> 当前环境中未检测到 Blender，请在本地安装并确认路径。

### 3.2 运行命令

```powershell
blender -b -P D:\miaoxiu\scripts\blender_optimize.py -- `
  --input D:\miaoxiu\output\raw\miao-garment.glb `
  --output D:\miaoxiu\output\optimized\miao-garment.fbx `
  --target_faces 20000
```

### 3.3 脚本功能

- 导入 GLB/OBJ
- 合并多网格
- 智能展开 UV（如无 UV）
- 清理游离点、非流形、修复法线
- Decimate 减面到目标面数（默认 2 万面）
- 重置变换，面向 +Y（T-pose 准备）
- 导出含嵌入贴图的 FBX
- 生成 `output/optimized/texture_issues.txt` 纹理待补画清单

### 3.4 预期输出

```text
[导入] 对象: Garment, 面数: 150000, 顶点: 75000
[减面] 当前面数: 150000, 目标面数: 20000, ratio: 0.1333
[完成] 优化后面数: 20000, 顶点: 10000
[完成] FBX 路径: D:\miaoxiu\output\optimized\miao-garment.fbx
```

---

## 4. Mixamo 自动绑骨（人工步骤）

Mixamo 是 Adobe 网页服务，无官方 API，必须人工操作：

1. 打开 https://www.mixamo.com 并登录 Adobe 账号。
2. 点击 **Upload Character**，上传 `D:\miaoxiu\output\optimized\miao-garment.fbx`。
3. 等待自动骨骼识别，确认手指、脊柱、四肢关键点大致正确。
4. 选择任意动画（如 `Idle`）或仅下载带骨骼的 T-pose。
5. 点击 **Download**，格式选择 **FBX (.fbx)**，姿势选择 **T-pose**（如不需要动画，可选 **No Animation**）。
6. 将下载文件重命名为 `miao-garment-rigged.fbx`，放入 `D:\miaoxiu\output\rigged\`。

> 若模型无手臂/手指（如一片式披风），Mixamo 可能识别失败，此时需考虑：
> - 在 Blender 中为模型添加简易四肢结构再上传；
> - 或改用本项目前端内置的程序化衣物网格（ARTryOnCamera 中的 T 恤/衬衫/连衣裙）。

---

## 5. DRACO 压缩 → 最终 GLB

### 5.1 将 Mixamo FBX 转回 GLB（在 Blender 中）

Mixamo 下载的是 FBX，前端需要 GLB。可在 Blender 中导入后导出为 GLB：

```powershell
blender -b -P D:\miaoxiu\scripts\fbx_to_glb.py -- `
  --input D:\miaoxiu\output\rigged\miao-garment-rigged.fbx `
  --output D:\miaoxiu\output\rigged\miao-garment.glb
```

> `scripts/fbx_to_glb.py` 需用户后续补充或手动在 Blender GUI 中导出。

### 5.2 DRACO 压缩

```powershell
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe D:\miaoxiu\scripts\draco_compress.py `
  --input D:\miaoxiu\output\rigged\miao-garment.glb `
  --output D:\miaoxiu\web\public\models\miao-garment.glb
```

### 5.3 验证

```powershell
Get-Item D:\miaoxiu\web\public\models\miao-garment.glb
```

记录文件大小，例如：

```text
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---                2026/9/25 14:00      1234567 miao-garment.glb
```

---

## 6. 前端接入

### 6.1 文件位置

最终模型必须位于：

```
D:\miaoxiu\web\public\models\miao-garment.glb
```

DRACO 解码器已放置于：

```
D:\miaoxiu\web\public\draco\draco_decoder.js
D:\miaoxiu\web\public\draco\draco_decoder.wasm
D:\miaoxiu\web\public\draco\draco_wasm_wrapper.js
```

### 6.2 代码改动

已修改 `web/src/components/ARTryOnCamera.tsx`：

- 引入 `DRACOLoader`
- 新增 `createGLTFLoader()`，注册 DRACO 解码器路径 `/draco/`
- 默认加载模型改为 `/models/miao-garment.glb`
- UI 文案改为苗绣/非遗相关（如“AR 苗绣服饰试穿”“加载苗绣服饰”）

### 6.3 姿态锚点

模型位置已绑定到 MediaPipe 人体关键点：

- 肩膀：11（左肩）、12（右肩）
- 髋/腰：23（左髋）、24（右髋）

代码中通过 `updateClothingPose`（`ARClothingMesh.ts`）根据肩宽、躯干长度实时缩放、旋转与定位衣物。

### 6.4 本地启动

```powershell
cd D:\miaoxiu\web
npm run dev
```

浏览器打开终端输出的本地地址（通常为 `http://localhost:5173`），进入 **AR 沉浸式体验 → AR 苗绣服饰试穿**，点击 **加载苗绣服饰**。

若模型不存在，会提示：

> 苗绣服饰模型尚未就绪，请先生成并放置到 web/public/models/miao-garment.glb

---

## 7. 当前环境阻塞项

| 阻塞项 | 原因 | 解决方案 |
|--------|------|----------|
| CUDA 版 PyTorch 未安装 | PyTorch 官网 whl 下载被网络重置 | 在本地网络正常时按 1.3 重新安装 |
| HuggingFace 模型下载慢/超时 | 国际带宽不稳定 | 使用 `HF_ENDPOINT=https://hf-mirror.com` 或 huggingface-cli 预下载 |
| Blender 未检测到 | 不在 PATH 且注册表无记录 | 用户确认安装路径并加入 PATH，或调用绝对路径 |
| 无真实苗绣服饰照片 | 需实地拍摄 | 用户提供 `assets/miao-garment-photo.jpg` |

---

## 8. 完整验收清单

- [ ] 推理脚本 `scripts/generate_glb.py` 可复现运行，输出带纹理 GLB
- [ ] Blender 优化后 ≤3 万面、UV/贴图保留、FBX 就绪
- [ ] Mixamo 人工绑骨完成，rigged GLB 已生成
- [ ] 最终 GLB 已压缩、体积记录在案、置于 `web/public/models/miao-garment.glb`
- [ ] 前端能加载模型并跟随姿态点，UI 文案已更新
- [ ] 操作手册已归档 `docs/miao-garment-pipeline.md`

---

## 9. 快速命令汇总

```powershell
# 1. 生成 3D
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe D:\miaoxiu\scripts\generate_glb.py --input assets/miao-garment-photo.jpg --output output/raw/miao-garment.glb --low_vram_mode

# 2. Blender 优化
blender -b -P D:\miaoxiu\scripts\blender_optimize.py -- --input output/raw/miao-garment.glb --output output/optimized/miao-garment.fbx --target_faces 20000

# 3. Mixamo 上传下载（人工） -> output/rigged/miao-garment-rigged.fbx

# 4. DRACO 压缩
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe D:\miaoxiu\scripts\draco_compress.py --input output/rigged/miao-garment.glb --output web/public/models/miao-garment.glb

# 5. 启动前端
cd D:\miaoxiu\web && npm run dev
```

---

## 附录 A：纯 trimesh 预处理方案（不依赖 Blender）

如果不需要 Mixamo 绑骨，或希望完全跳过 Blender，可使用 `scripts/trimesh_prepare.py` 对 Hunyuan3D 生成的 `garment_mesh.glb` 直接处理：

```powershell
# 安装二次误差减面依赖（已在 hy3d-env 中安装）
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe -m pip install fast-simplification

# 运行 trimesh 预处理
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe D:\miaoxiu\scripts\trimesh_prepare.py `
  --input output/raw/garment_mesh.glb `
  --output output/optimized/garment_webready.glb `
  --target_faces 25000 `
  --target_height 1.7
```

脚本功能：
- 使用 `trimesh.Scene.to_geometry()` 合并 10 个部件为单个 `Trimesh`
- 过滤面数小于 50 的孤立碎片
- 按包围盒高度缩放到 1.7 m（适合人体试衣）
- 使用 `simplify_quadric_decimation` 二次误差减面到目标面数
- 修复法线并导出 GLB

### 实测输出示例

以 `web/public/models/readyplayer.me.glb` 测试：

```text
场景包含 10 个几何体
合并后: 顶点 9596, 面 15817
清理碎片: 移除 44 个小组件，剩余面数 14888
缩放比例: 0.907475 (原始高度 1.873 -> 目标 1.700)
减面: 14888 -> 5000 面 (目标 5000, 比例 0.3358)
导出完成: output/optimized/test_garment_decimated.glb
文件大小: 94.2 KB
```

### 与前端对接

`trimesh_prepare.py` 输出的 GLB 不带骨骼，前端会将其作为普通 Mesh 加载，并通过 `createSkinnedClothingFromGeometry`（`ARClothingMesh.ts`）自动重建 5 个骨骼点（颈、双肩、双髋），跟随 MediaPipe 关键点运动。

因此，使用该脚本时无需 Mixamo，流程可简化为：

```text
照片 -> Hunyuan3D -> output/raw/garment_mesh.glb
  -> trimesh_prepare.py -> output/optimized/garment_webready.glb
  -> draco_compress.py -> web/public/models/miao-garment.glb
  -> npm run dev
```

---

## 附录 B：依赖清单（hy3d-env）

```text
torch torchvision torchaudio  # 本地请换 CUDA 版
-r tools/Hunyuan3D-2/requirements.txt
-e tools/Hunyuan3D-2
fast-simplification
```

若重新创建环境，可执行：

```powershell
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe -m pip install -r D:\miaoxiu\tools\Hunyuan3D-2\requirements.txt
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe -m pip install -e D:\miaoxiu\tools\Hunyuan3D-2
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe -m pip install fast-simplification
```

---

## 附录 C：实际运行验证记录（2026-09-25）

### 1. PyTorch/CUDA 状态更新

重新检测后发现：从清华镜像安装的 torch 实际为 **CUDA 13.0 版本**：

```text
torch version: 2.14.0+cu130
cuda available: True
CUDA device: NVIDIA GeForce RTX 5070 Ti Laptop GPU
CUDA memory: 11.9 GB
```

因此 GPU 推理可用，无需再手动安装 CUDA 版 PyTorch。

### 2. Hunyuan3D-2 shape generation 验证

使用仓库自带 `assets/demo.png` 运行 shape-only 推理：

```powershell
$env:HF_ENDPOINT = 'https://hf-mirror.com'
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe D:\miaoxiu\scripts\generate_glb.py `
  --input D:\miaoxiu\tools\Hunyuan3D-2\assets\demo.png `
  --output D:\miaoxiu\output\raw\demo_shape_only.glb `
  --low_vram_mode --skip_texture
```

结果：

```text
[完成] 输出: D:\miaoxiu\output\raw\demo_shape_only.glb
[完成] 文件大小: 12229.4 KB
[统计] 顶点数: 347836, 面数: 695676
```

耗时约 100 秒，GPU 推理正常。

### 3. 纹理生成阻塞项

启用纹理生成时失败：

```text
ModuleNotFoundError: No module named 'custom_rasterizer'
```

原因：Hunyuan3D-2 的纹理管线需要编译两个 CUDA/C++ 扩展：

```bash
cd hy3dgen/texgen/custom_rasterizer
python3 setup.py install
cd ../../..
cd hy3dgen/texgen/differentiable_renderer
python3 setup.py install
```

当前 Windows 环境缺少 `cl.exe`（Visual C++ 编译器）和 `nvcc`（CUDA 编译器），无法编译。解决方案：

- 安装 **Visual Studio 2022 Build Tools**（含 C++ 桌面开发工作负载）
- 安装 **CUDA Toolkit**（与驱动匹配，建议 12.x 或 13.x）
- 重新运行上述两个 `setup.py install`
- 或使用 Linux 环境（WSL2 / Ubuntu）进行纹理生成

### 4. trimesh 优化验证

对 shape-only GLB 运行 `trimesh_prepare.py`：

```powershell
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe D:\miaoxiu\scripts\trimesh_prepare.py `
  --input D:\miaoxiu\output\raw\demo_shape_only.glb `
  --output D:\miaoxiu\output\optimized\demo_webready.glb `
  --target_faces 25000
```

输出：

```text
合并后: 顶点 347836, 面 695676
清理碎片: 移除 7 个小组件，剩余面数 695600
缩放比例: 0.852619 (原始高度 1.994 -> 目标 1.700)
减面: 695600 -> 25000 面 (目标 25000, 比例 0.0359)
导出完成: D:\miaoxiu\output\optimized\demo_webready.glb
文件大小: 440.2 KB
```

### 5. DRACO 压缩验证

```powershell
D:\miaoxiu\tools\hy3d-env\Scripts\python.exe D:\miaoxiu\scripts\draco_compress.py `
  --input D:\miaoxiu\output\optimized\demo_webready.glb `
  --output D:\miaoxiu\web\public\models\miao-garment.glb
```

输出：

```text
demo_webready.glb (450.73 KB) -> miao-garment.glb (43.54 KB)
```

最终模型仅 **42.5 KB**，已放置到 `web/public/models/miao-garment.glb`。

### 6. 前端验证

```powershell
cd D:\miaoxiu\web
npm run dev
```

服务启动：

```text
VITE v7.3.0  ready in 410 ms
Local:   http://localhost:3000/
```

构建也通过：

```powershell
npm run build   # ✓ built in 4.24s
```

浏览器打开 `http://localhost:3000/`，进入 **AR 沉浸式体验 → AR 苗绣服饰试穿**，点击 **加载苗绣服饰** 即可加载最终 GLB。由于当前示例模型来自 Hunyuan3D demo 图（非真实服装），仅用于验证管线可用。

---

## 附录 D：当前完整阻塞项汇总

| 阻塞项 | 状态 | 解决方案 |
|--------|------|----------|
| CUDA PyTorch | ✅ 已解决 | 清华镜像已安装 cu130 版 |
| Hunyuan3D shape generation | ✅ 已验证 | GPU 正常推理 |
| Hunyuan3D texture generation | ❌ 阻塞 | 需安装 VS Build Tools + CUDA Toolkit 编译 custom_rasterizer |
| Blender | ❓ 待确认 | 用户已下载 MSI，需完成安装 |
| 真实苗绣服饰照片 | ❌ 待提供 | 用户提供 `assets/miao-garment-photo.jpg` |

---

## 附录 E：推荐后续流程

若无法解决纹理编译问题，可采用以下折中方案：

1. 用 Hunyuan3D 生成 shape-only GLB（已验证）
2. 用 `trimesh_prepare.py` 优化到 25000 面（已验证）
3. 用 `draco_compress.py` 压缩（已验证）
4. 在前端用现有“纹样图片”作为材质贴图覆盖到服装网格上（`ARTryOnCamera` 已支持 patternImage 贴图）

这样即可在 WebAR 中看到“带苗绣纹样的 3D 服装”，纹理由前端纹样图提供，而非 Hunyuan3D 的 PBR 纹理。
