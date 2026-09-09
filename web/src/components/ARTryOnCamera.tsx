import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createSkinnedGarment, createSkinnedClothingFromGeometry, updateClothingPose, applyScreenSpaceMask, type GarmentType } from './ARClothingMesh';
async function createPoseLandmarker(vision: any, delegate: 'GPU' | 'CPU') {
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/models/pose_landmarker_lite.task',
      delegate,
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  });
}
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`加载失败: ${src}`));
    document.body.appendChild(script);
  });
}


function _drawRegionShape(
  ctx: CanvasRenderingContext2D,
  category: 'clothing' | 'home' | 'model',
  lm: any[],
  width: number,
  height: number
) {
  const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
  if (!ls || !rs || !lh || !rh) return;

  const px = (n: number) => n * width;
  const py = (n: number) => n * height;

  if (category === 'clothing') {
    // 覆盖整个上半身（含袖子），作为 selfie segmentation 未加载时的回退蒙版
    const minX = Math.min(ls.x, lh.x) - 0.3;
    const maxX = Math.max(rs.x, rh.x) + 0.3;
    const topY = Math.min(ls.y, rs.y) - 0.12;
    const bottomY = Math.max(lh.y, rh.y) + 0.15;
    ctx.moveTo(px(minX), py(topY));
    ctx.lineTo(px(maxX), py(topY));
    ctx.lineTo(px(maxX), py(bottomY));
    ctx.lineTo(px(minX), py(bottomY));
    ctx.closePath();
  } else if (category === 'home') {
    const cx = (ls.x + rs.x) / 2;
    const cy = (ls.y + rs.y) / 2;
    const w = Math.abs(rs.x - ls.x) * 1.1;
    const h = w * 0.55;
    ctx.roundRect(px(cx - w / 2), py(cy - h * 0.1), px(w), py(h), [px(w * 0.15)]);
  } else {
    // model: diagonal sash from right shoulder to left hip
    const w = Math.abs(rs.x - lh.x) * 0.18;
    ctx.moveTo(px(rs.x + w), py(rs.y - w));
    ctx.lineTo(px(rs.x - w), py(rs.y + w));
    ctx.lineTo(px(lh.x - w), py(lh.y + w));
    ctx.lineTo(px(lh.x + w), py(lh.y - w));
    ctx.closePath();
  }
}

function drawRegionMask(
  ctx: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement | null,
  category: 'clothing' | 'home' | 'model',
  lm: any[],
  width: number,
  height: number,
  applyMask: boolean = true
) {
  const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
  if (!ls || !rs || !lh || !rh) return;

  ctx.clearRect(0, 0, width, height);
  if (applyMask && maskCanvas) {
    // 有真实人体分割时直接用完整身体轮廓，不再与多边形取交集，保证袖子/裙摆不被裁掉
    ctx.drawImage(maskCanvas, 0, 0);
    return;
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  _drawRegionShape(ctx, category, lm, width, height);
  ctx.fill();
}

interface ARTryOnCameraProps {
  patternImage: string;
  category: 'clothing' | 'home' | 'model';
  onClose: () => void;
}

export default function ARTryOnCamera({ patternImage, category, onClose }: ARTryOnCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const staticImageRef = useRef<HTMLImageElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const clothingRef = useRef<THREE.SkinnedMesh | null>(null);
  const clothingBonesRef = useRef<THREE.Bone[]>([]);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const gltfInputRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<any>(null);
  const maskReadyRef = useRef(false);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const maskTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const regionMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const regionMaskCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const regionTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detected, setDetected] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [useStaticImage, setUseStaticImage] = useState(false);
  const [staticImageUrl, setStaticImageUrl] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState<GarmentType>('tshirt');
  const clothingTextureRef = useRef<THREE.Texture | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    try {
      landmarkerRef.current?.close();
    } catch {}
    landmarkerRef.current = null;
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.forceContextLoss();
      rendererRef.current = null;
    }
  }, []);

  // 静态图片模式：绘制原图 + 纹样叠加
  const drawStaticOverlay = useCallback(() => {
    const canvas = staticCanvasRef.current;
    const img = staticImageRef.current;
    const landmarker = landmarkerRef.current;
    if (!canvas || !img || !landmarker) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    try {
      const result = landmarker.detect(img);
      if (result.landmarks && result.landmarks.length > 0) {
        const lm = result.landmarks[0];
        const leftShoulder = lm[11];
        const rightShoulder = lm[12];
        const leftHip = lm[23];
        const rightHip = lm[24];

        if (leftShoulder && rightShoulder && leftHip && rightHip) {
          const sx = leftShoulder.x * canvas.width;
          const sy = leftShoulder.y * canvas.height;
          const hx = rightShoulder.x * canvas.width;
          const hy = rightShoulder.y * canvas.height;
          const shoulderWidth = Math.hypot(hx - sx, hy - sy);
          const centerX = (sx + hx) / 2;
          const centerY = (sy + hy) / 2;
          const hipY = ((leftHip.y + rightHip.y) / 2) * canvas.height;
          const torsoHeight = Math.abs(hipY - centerY);

          const pattern = new Image();
          pattern.src = patternImage;
          pattern.onload = () => {
            let w: number, h: number, px: number, py: number;
            const angle = Math.atan2(hy - sy, hx - sx);

            if (category === 'home') {
              w = shoulderWidth * 1.2;
              h = w * 0.6;
              px = centerX;
              py = centerY + torsoHeight * 0.15;
            } else if (category === 'model') {
              w = shoulderWidth * 0.9;
              h = w * 1.33;
              px = centerX + shoulderWidth * 0.8;
              py = centerY;
            } else {
              w = shoulderWidth * 1.55;
              h = torsoHeight * 2.4;
              px = centerX;
              py = centerY + h * 0.08;
            }

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle);
            ctx.globalAlpha = 0.92;
            ctx.drawImage(pattern, -w / 2, -h / 2, w, h);
            ctx.restore();
            setDetected(true);
          };
        }
      } else {
        setDetected(false);
      }
    } catch {
      // ignore
    }
  }, [patternImage, category]);

  // 初始化 MediaPipe + 摄像头
  useEffect(() => {
    if (useStaticImage || staticImageUrl) return;

    let mounted = true;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks('/wasm');
        let landmarker;
        try {
          landmarker = await createPoseLandmarker(vision, 'GPU');
        } catch {
          landmarker = await createPoseLandmarker(vision, 'CPU');
        }
        if (!mounted) return;
        landmarkerRef.current = landmarker;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        if (!videoRef.current) {
          setError('视频元素未挂载，请刷新页面重试');
          setLoading(false);
          return;
        }
        videoRef.current.srcObject = stream;

        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          if (video.readyState >= 2) {
            resolve();
            return;
          }
          const onLoaded = () => {
            video.removeEventListener('loadedmetadata', onLoaded);
            resolve();
          };
          const onError = () => {
            video.removeEventListener('error', onError);
            reject(new Error('视频流加载失败'));
          };
          video.addEventListener('loadedmetadata', onLoaded);
          video.addEventListener('error', onError);
        });

        await videoRef.current.play();
        if (!mounted) return;
        setCameraReady(true);

        const video = videoRef.current;
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;

        if (canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        camera.position.set(0, 0, 5);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current || undefined,
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(0, 0, 5);
        scene.add(dir);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin('anonymous');
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(patternImage, resolve, undefined, () => reject(new Error('纹样图片加载失败')));
        });
        if (!mounted) return;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        clothingTextureRef.current = texture;
        const clothing = createSkinnedGarment(category, garmentType, texture);
        clothing.renderOrder = 100;
        scene.add(clothing);
        clothingRef.current = clothing;
        clothingBonesRef.current = clothing.skeleton.bones;

        // 人体分割蒙版：让纹样只出现在身体轮廓内
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          maskCtx.fillStyle = '#000000';
          maskCtx.fillRect(0, 0, width, height);
        }
        maskCanvasRef.current = maskCanvas;
        maskCtxRef.current = maskCtx;
        const maskTexture = new THREE.CanvasTexture(maskCanvas);
        maskTexture.wrapS = THREE.ClampToEdgeWrapping;
        maskTexture.wrapT = THREE.ClampToEdgeWrapping;
        maskTexture.minFilter = THREE.LinearFilter;
        maskTexture.magFilter = THREE.LinearFilter;
        maskTextureRef.current = maskTexture;

        const regionMaskCanvas = document.createElement('canvas');
        regionMaskCanvas.width = width;
        regionMaskCanvas.height = height;
        const regionMaskCtx = regionMaskCanvas.getContext('2d');
        if (regionMaskCtx) {
          regionMaskCtx.fillStyle = '#000000';
          regionMaskCtx.fillRect(0, 0, width, height);
        }
        regionMaskCanvasRef.current = regionMaskCanvas;
        regionMaskCtxRef.current = regionMaskCtx;
        const regionTexture = new THREE.CanvasTexture(regionMaskCanvas);
        regionTexture.wrapS = THREE.ClampToEdgeWrapping;
        regionTexture.wrapT = THREE.ClampToEdgeWrapping;
        regionTexture.minFilter = THREE.LinearFilter;
        regionTexture.magFilter = THREE.LinearFilter;
        regionTextureRef.current = regionTexture;

        applyScreenSpaceMask(clothing, regionTexture, new THREE.Vector2(width, height));

        try {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465748/selfie_segmentation.js');
          const SelfieSegmentation = (window as any).SelfieSegmentation;
          const selfie = new SelfieSegmentation({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465748/${file}`,
          });
          selfie.setOptions({ modelSelection: 1 });
          selfie.onResults((results: any) => {
            const ctx = maskCtxRef.current;
            const tex = maskTextureRef.current;
            if (ctx && tex && results.segmentationMask) {
              ctx.drawImage(results.segmentationMask, 0, 0, width, height);
              tex.needsUpdate = true;
              maskReadyRef.current = true;
            }
          });
          selfieRef.current = selfie;
        } catch (segErr) {
          console.warn('[AR] 人体分割加载失败，将不使用身体蒙版', segErr);
        }

        setLoading(false);
        if (category === 'clothing') {
          setTimeout(() => loadExampleShirt(), 600);
        }
        startDetection();
      } catch (e: any) {
        const msg = e?.message || String(e);
        if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
          setError('摄像头权限被拒绝。');
        } else if (msg.includes('NotFoundError') || msg.includes('Requested device not found') || msg.includes('DevicesNotFoundError')) {
          setError('未检测到摄像头。');
        } else if (msg.includes('wasm') || msg.includes('model') || msg.includes('landmarker')) {
          setError('AR 模型加载失败，请检查网络或刷新页面重试。');
        } else {
          setError(`初始化失败：${msg}`);
        }
        setLoading(false);
      }
    }

    function startDetection() {
      const detect = () => {
        const video = videoRef.current;
        const landmarker = landmarkerRef.current;
        const clothing = clothingRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const scene = sceneRef.current;

        if (!video || !landmarker || !clothing || !camera || !renderer || !scene) {
          rafRef.current = requestAnimationFrame(detect);
          return;
        }

        if (video.readyState >= 2 && video.videoWidth > 0) {
          try {
            if (selfieRef.current) {
              selfieRef.current.send({ image: video }).catch(() => {});
            }
          } catch {
            // ignore
          }
          try {
            const result = landmarker.detectForVideo(video, performance.now());
            if (result.landmarks && result.landmarks.length > 0) {
              const lm = result.landmarks[0];
              const leftShoulder = lm[11];
              const rightShoulder = lm[12];
              const leftHip = lm[23];
              const rightHip = lm[24];

              if (leftShoulder && rightShoulder && leftHip && rightHip) {
                const aspect = video.videoHeight / video.videoWidth;
                updateClothingPose(clothing, clothingBonesRef.current, result.landmarks[0], aspect);

                // 按 category 绘制更精细的人体区域蒙版
                if (regionMaskCtxRef.current) {
                  const hasMask = maskReadyRef.current;
                  drawRegionMask(regionMaskCtxRef.current, maskCanvasRef.current, category, result.landmarks[0], video.videoWidth, video.videoHeight, hasMask);
                  if (regionTextureRef.current) regionTextureRef.current.needsUpdate = true;
                }

                // 仅使用身体分割蒙版控制衣物可见范围，不裁剪 UV
                clothing.visible = true;
                if (!detected) setDetected(true);
              }
            } else {
              clothing.visible = false;
              if (detected) setDetected(false);
            }
          } catch {
            // ignore
          }
          renderer.render(scene, camera);
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);
    }

    init();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [patternImage, category, useStaticImage, staticImageUrl, cleanup]);

  // 静态图片上传后加载 MediaPipe 并绘制
  useEffect(() => {
    if (!staticImageUrl) return;

    let mounted = true;
    setLoading(true);

    async function initStatic() {
      try {
        const vision = await FilesetResolver.forVisionTasks('/wasm');
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          numPoses: 1,
        });
        if (!mounted) return;
        landmarkerRef.current = landmarker;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = staticImageUrl!;
        img.onload = () => {
          if (!mounted) return;
          staticImageRef.current = img;
          setLoading(false);
          drawStaticOverlay();
        };
      } catch (e: any) {
        setError(`静态图片模式初始化失败：${e.message || e}`);
        setLoading(false);
      }
    }

    initStatic();

    return () => {
      mounted = false;
      try {
        landmarkerRef.current?.close();
      } catch {}
      landmarkerRef.current = null;
    };
  }, [staticImageUrl, drawStaticOverlay]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setStaticImageUrl(url);
    setUseStaticImage(true);
    setError('');
  };

  // 切换服装款式时重新生成蒙皮网格
  useEffect(() => {
    if (useStaticImage || !clothingTextureRef.current || !sceneRef.current || !clothingRef.current) return;
    const scene = sceneRef.current;
    const oldClothing = clothingRef.current;
    const newClothing = createSkinnedGarment(category, garmentType, clothingTextureRef.current);
    newClothing.renderOrder = 100;

    if (regionTextureRef.current && rendererRef.current) {
      const size = rendererRef.current.getSize(new THREE.Vector2());
      applyScreenSpaceMask(newClothing, regionTextureRef.current, size);
    }

    scene.remove(oldClothing);
    scene.add(newClothing);
    clothingRef.current = newClothing;
    clothingBonesRef.current = newClothing.skeleton.bones;
  }, [garmentType, category, useStaticImage]);

  const title = category === 'home' ? 'AR 家居试用' : category === 'model' ? '虚拟合影' : 'AR 虚拟试穿';

  function replaceClothingFromSource(sourceMesh: THREE.SkinnedMesh | THREE.Mesh) {
    const scene = sceneRef.current;
    const currentClothing = clothingRef.current;
    if (!scene || !currentClothing) return;

    sourceMesh.updateMatrixWorld();
    const geometry = sourceMesh.geometry.clone();

    const tex = (currentClothing.material as THREE.MeshStandardMaterial).map;
    const newClothing = createSkinnedClothingFromGeometry(geometry, sourceMesh.matrixWorld, tex!);

    if (regionTextureRef.current && rendererRef.current) {
      const size = rendererRef.current.getSize(new THREE.Vector2());
      applyScreenSpaceMask(newClothing, regionTextureRef.current, size);
    }
    newClothing.renderOrder = 100;

    scene.remove(currentClothing);
    scene.add(newClothing);
    clothingRef.current = newClothing;
    clothingBonesRef.current = newClothing.skeleton.bones;
  }

  const handleGlbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const loader = new GLTFLoader();
      loader.parse(reader.result as ArrayBuffer, '', (gltf) => {
        let sourceMesh: THREE.SkinnedMesh | THREE.Mesh | null = null;
        gltf.scene.traverse((obj: any) => {
          if (!sourceMesh && (obj.isSkinnedMesh || obj.isMesh)) sourceMesh = obj as THREE.SkinnedMesh | THREE.Mesh;
        });
        if (!sourceMesh) {
          alert('该 .glb 文件未包含可用网格');
          return;
        }
        replaceClothingFromSource(sourceMesh);
      }, (err) => {
        alert('加载 .glb 失败：' + (err?.message || '未知错误'));
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const loadExampleShirt = async () => {
    try {
      const resp = await fetch('/models/readyplayer.me.glb');
      const buffer = await resp.arrayBuffer();
      const loader = new GLTFLoader();
      loader.parse(buffer, '', (gltf) => {
        let sourceMesh: THREE.SkinnedMesh | THREE.Mesh | null = null;
        gltf.scene.traverse((obj: any) => {
          if (obj.isSkinnedMesh && obj.name === 'Wolf3D_Outfit_Top') sourceMesh = obj as THREE.SkinnedMesh;
        });
        if (!sourceMesh) {
          alert('示例模型中未找到上衣网格');
          return;
        }
        replaceClothingFromSource(sourceMesh);
      }, (err) => {
        alert('加载示例模型失败：' + (err?.message || '未知错误'));
      });
    } catch (e: any) {
      alert('获取示例模型失败：' + e.message);
    }
  };

  const captureScreenshot = () => {
    const video = videoRef.current;
    const overlayCanvas = rendererRef.current?.domElement;
    if (!video || !overlayCanvas) return;
    const width = video.videoWidth || overlayCanvas.width;
    const height = video.videoHeight || overlayCanvas.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // 绘制视频（镜像以匹配视觉）
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 叠加 Three.js 渲染层
    ctx.drawImage(overlayCanvas, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `miaoxiu-ar-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0B0E14' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(240,237,224,0.1)' }}>
        <h2 className="text-[#F0EDE0] font-bold text-sm">{title}</h2>
        <div className="flex items-center gap-2">
          {!useStaticImage && cameraReady && (
            <button
              onClick={captureScreenshot}
              className="text-xs px-3 py-1.5 rounded font-medium transition"
              style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}
            >
              拍照
            </button>
          )}
          {!useStaticImage && category === 'clothing' && (
            <button
              onClick={loadExampleShirt}
              className="text-xs px-3 py-1.5 rounded font-medium transition"
              style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}
            >
              加载示例T恤
            </button>
          )}
          {!useStaticImage && category === 'clothing' && (
            <div className="flex items-center gap-1">
              {(['tshirt', 'shirt', 'dress'] as GarmentType[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGarmentType(g)}
                  className="text-[10px] px-2 py-1 rounded transition"
                  style={{
                    backgroundColor: garmentType === g ? 'rgba(36,65,169,0.4)' : 'rgba(255,255,255,0.08)',
                    color: '#F0EDE0',
                    border: '1px solid rgba(240,237,224,0.1)',
                  }}
                >
                  {g === 'tshirt' ? 'T恤' : g === 'shirt' ? '衬衫' : '连衣裙'}
                </button>
              ))}
            </div>
          )}
          {!useStaticImage && (
            <>
              <input
                type="file"
                accept=".glb,.gltf"
                ref={gltfInputRef}
                onChange={handleGlbUpload}
                className="hidden"
              />
              <button
                onClick={() => gltfInputRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded font-medium transition"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#F0EDE0' }}
              >
                上传3D模型
              </button>
            </>
          )}
          <button
            onClick={() => { cleanup(); onClose(); }}
            className="text-[#F0EDE0] opacity-60 hover:opacity-100 px-2 py-1 rounded transition"
          >
            关闭
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#F0EDE0] opacity-80 z-20">
            <div className="mb-3 w-8 h-8 border-2 border-[#F0EDE0] border-t-transparent rounded-full animate-spin" />
            正在启动摄像头与 AI 姿态识别...
            <span className="text-xs mt-2 opacity-60">首次加载模型可能需要 5-10 秒</span>
          </div>
        )}

        {error && !useStaticImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-20">
            <p className="mb-2" style={{ color: '#E84A3A' }}>{error}</p>
            <p className="text-[#F0EDE0] opacity-50 text-xs mb-4 max-w-md">
              没有摄像头时，您可以上传一张包含上半身的照片，系统会自动识别并叠加纹样。
            </p>
            <label
              className="px-4 py-2 rounded text-sm font-medium cursor-pointer transition hover:opacity-80"
              style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}
            >
              上传照片体验 AR
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
            <button
              onClick={() => { cleanup(); onClose(); }}
              className="mt-3 text-xs text-[#F0EDE0] opacity-50 hover:opacity-80"
            >
              返回
            </button>
          </div>
        )}

        {!useStaticImage && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </>
        )}

        {useStaticImage && staticImageUrl && (
          <div className="absolute inset-0 flex items-center justify-center p-4 overflow-auto">
            <canvas
              ref={staticCanvasRef}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ border: '1px solid rgba(240,237,224,0.1)' }}
            />
          </div>
        )}

        {cameraReady && !detected && !error && !useStaticImage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs z-10" style={{ backgroundColor: 'rgba(11,14,20,0.7)', color: '#F0EDE0' }}>
            请调整姿势，让人体进入画面
          </div>
        )}
        {detected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs z-10" style={{ backgroundColor: 'rgba(36,65,169,0.85)', color: '#F0EDE0' }}>
            已识别到人体，移动身体即可调整纹样位置
          </div>
        )}

        {useStaticImage && (
          <div className="absolute top-4 right-4 z-10">
            <label
              className="px-3 py-2 rounded text-xs font-medium cursor-pointer transition hover:opacity-80"
              style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}
            >
              重新上传
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

