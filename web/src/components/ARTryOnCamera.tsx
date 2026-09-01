import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

interface ARTryOnCameraProps {
  patternImage: string;
  category: 'clothing' | 'home' | 'model';
  onClose: () => void;
}

export default function ARTryOnCamera({ patternImage, category, onClose }: ARTryOnCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const overlayRef = useRef<THREE.Mesh | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detected, setDetected] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // 关闭资源
  const cleanup = () => {
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
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // 1. 初始化 MediaPipe（本地文件，避免 CDN 被墙）
        const vision = await FilesetResolver.forVisionTasks('/wasm');
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (!mounted) return;
        landmarkerRef.current = landmarker;

        // 2. 获取摄像头
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

        // 等待视频元数据加载，确保 videoWidth/videoHeight 有效
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

        // 3. 初始化 Three.js
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
          preserveDrawingBuffer: false,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        // 灯光
        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(0, 0, 5);
        scene.add(dir);

        // 加载纹样贴图
        const textureLoader = new THREE.TextureLoader();
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(
            patternImage,
            (tex) => resolve(tex),
            undefined,
            () => reject(new Error('纹样图片加载失败'))
          );
        });
        if (!mounted) return;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        // 根据场景创建不同覆盖物
        let geometry: THREE.BufferGeometry;
        if (category === 'home') {
          geometry = new THREE.PlaneGeometry(1, 0.6);
        } else if (category === 'model') {
          geometry = new THREE.PlaneGeometry(0.9, 1.2);
        } else {
          geometry = new THREE.PlaneGeometry(1, 1.2);
        }

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.92,
          side: THREE.DoubleSide,
        });
        const overlay = new THREE.Mesh(geometry, material);
        overlay.visible = false;
        scene.add(overlay);
        overlayRef.current = overlay;

        setLoading(false);
        startDetection();
      } catch (e: any) {
        const msg = e?.message || String(e);
        if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
          setError('摄像头权限被拒绝，请在浏览器地址栏允许摄像头访问后刷新。');
        } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
          setError('未检测到摄像头，请连接摄像头后重试。');
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
        const overlay = overlayRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const scene = sceneRef.current;

        if (!video || !landmarker || !overlay || !camera || !renderer || !scene) {
          rafRef.current = requestAnimationFrame(detect);
          return;
        }

        if (video.readyState >= 2 && video.videoWidth > 0) {
          try {
            const result = landmarker.detectForVideo(video, performance.now());
            if (result.landmarks && result.landmarks.length > 0) {
              const lm = result.landmarks[0];
              const leftShoulder = lm[11];
              const rightShoulder = lm[12];
              const leftHip = lm[23];
              const rightHip = lm[24];

              if (leftShoulder && rightShoulder && leftHip && rightHip) {
                const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
                const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
                const hipCenterY = (leftHip.y + rightHip.y) / 2;

                const aspect = video.videoHeight / video.videoWidth;
                const x = (shoulderCenterX - 0.5) * 10;
                const y = -(shoulderCenterY - 0.5) * 10 * aspect;

                const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) * 10;
                const torsoHeight = Math.abs(shoulderCenterY - hipCenterY) * 10 * aspect;

                if (category === 'home') {
                  // 抱枕：位于胸前，稍小
                  const scaleX = Math.max(0.6, shoulderWidth * 1.1);
                  const scaleY = scaleX * 0.6;
                  overlay.position.set(x, y - scaleY * 0.2, 0);
                  overlay.scale.set(scaleX, scaleY, 1);
                } else if (category === 'model') {
                  // 虚拟合影：纹样立牌，位于身体一侧
                  const scaleX = Math.max(0.5, shoulderWidth * 0.8);
                  const scaleY = scaleX * 1.33;
                  overlay.position.set(x + shoulderWidth * 0.7, y, 0);
                  overlay.scale.set(scaleX, scaleY, 1);
                } else {
                  // 服饰试穿：T恤覆盖躯干
                  const scaleX = Math.max(0.8, shoulderWidth * 1.45);
                  const scaleY = Math.max(1.0, torsoHeight * 2.4);
                  overlay.position.set(x, y - scaleY * 0.08, 0);
                  overlay.scale.set(scaleX, scaleY, 1);
                }

                const shoulderSlope = Math.atan2(
                  rightShoulder.y - leftShoulder.y,
                  rightShoulder.x - leftShoulder.x
                );
                overlay.rotation.z = -shoulderSlope;
                overlay.visible = true;

                if (!detected) setDetected(true);
              }
            } else {
              overlay.visible = false;
              if (detected) setDetected(false);
            }
          } catch {
            // 忽略单帧检测异常
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
  }, [patternImage, category]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0B0E14' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(240,237,224,0.1)' }}>
        <h2 className="text-[#F0EDE0] font-bold text-sm">
          {category === 'home' ? 'AR 家居试用' : category === 'model' ? '虚拟合影' : 'AR 虚拟试穿'}
        </h2>
        <button
          onClick={() => { cleanup(); onClose(); }}
          className="text-[#F0EDE0] opacity-60 hover:opacity-100 px-2 py-1 rounded transition"
        >
          关闭
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#F0EDE0] opacity-80 z-20">
            <div className="mb-3 w-8 h-8 border-2 border-[#F0EDE0] border-t-transparent rounded-full animate-spin" />
            正在启动摄像头与 AI 姿态识别...
            <span className="text-xs mt-2 opacity-60">首次加载模型可能需要 5-10 秒</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-20">
            <p className="mb-4" style={{ color: '#E84A3A' }}>{error}</p>
            <button
              onClick={() => { cleanup(); onClose(); }}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}
            >
              返回
            </button>
          </div>
        )}

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

        {cameraReady && !detected && !error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs z-10" style={{ backgroundColor: 'rgba(11,14,20,0.7)', color: '#F0EDE0' }}>
            请调整姿势，让人体进入画面
          </div>
        )}
        {detected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs z-10" style={{ backgroundColor: 'rgba(36,65,169,0.85)', color: '#F0EDE0' }}>
            已识别到人体，移动身体即可调整纹样位置
          </div>
        )}
      </div>
    </div>
  );
}

