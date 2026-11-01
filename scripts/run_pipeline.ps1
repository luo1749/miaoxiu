# 苗绣服饰 3D 资产生成管线 PowerShell 启动示例
# 用法: .\scripts\run_pipeline.ps1 -InputImage "assets\miao-garment-photo.png"
param(
    [Parameter(Mandatory=$true)]
    [string]$InputImage,

    [string]$OutputGlb = "web\public\models\miao-garment.glb",
    [string]$PythonExe = "D:\miaoxiu\vton_test_env\Scripts\python.exe",
    [int]$TargetFaces = 25000,
    [switch]$LowVram
)

$env:HF_ENDPOINT = "https://hf-mirror.com"

$cmd = @(
    $PythonExe,
    "scripts\garment_pipeline.py",
    "--input_image", $InputImage,
    "--output_glb", $OutputGlb,
    "--target_faces", $TargetFaces
)

if ($LowVram) {
    $cmd += "--low_vram"
}

& $cmd[0] $cmd[1..($cmd.Length-1)]
