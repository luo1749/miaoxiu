import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

interface ARTryOnCameraProps {
  patternImage: string;
  onClose: () => void;
}

export default function ARTryOnCamera({ patternImage, onClose }: ARTryOnCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shirtRef = useRef<THREE.Mesh | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // 1. 初始化 MediaPipe Pose Landmarker
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (!mounted) return;
        landmarkerRef.current = landmarker;

        // 2. 获取摄像头
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 1280, height: 720 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // 3. 初始化 Three.js 场景
        if (canvasRef.current && videoRef.current) {
          const width = videoRef.current.videoWidth || 1280;
          const height = videoRef.current.videoHeight || 720;
          canvasRef.current.width = width;
          canvasRef.current.height = height;

          const scene = new THREE.Scene();
          sceneRef.current = scene;

          const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
          camera.position.set(0, 0, 5);
          cameraRef.current = camera;

          const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
          });
          renderer.setSize(width, height);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          rendererRef.current = renderer;

          // 加载纹样贴图
          const textureLoader = new THREE.TextureLoader();
          const texture = textureLoader.load(patternImage);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;

          // T恤几何体（简化版）
          const geometry = new THREE.PlaneGeometry(1, 1.2);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
          });
          const shirt = new THREE.Mesh(geometry, material);
          shirt.visible = false;
          scene.add(shirt);
          shirtRef.current = shirt;

          // 灯光
          const ambient = new THREE.AmbientLight(0xffffff, 0.8);
          scene.add(ambient);
        }

        setLoading(false);
        startDetection();
      } catch (e: any) {
        setError(e.message || '初始化失败，请确认已授权摄像头');
        setLoading(false);
      }
    }

    function startDetection() {
      const detect = () => {
        const video = videoRef.current;
        const landmarker = landmarkerRef.current;
        const shirt = shirtRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const scene = sceneRef.current;

        if (video && landmarker && shirt && camera && renderer && scene && video.readyState >= 2) {
          const result = landmarker.detectForVideo(video, performance.now());
          if (result.landmarks && result.landmarks.length > 0) {
            const lm = result.landmarks[0];
            const leftShoulder = lm[11];
            const rightShoulder = lm[12];
            const leftHip = lm[23];
            const rightHip = lm[24];

            if (leftShoulder && rightShoulder && leftHip && rightHip) {
              // 计算肩膀中点、髋部中点
              const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
              const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
              const hipCenterY = (leftHip.y + rightHip.y) / 2;

              // 将 MediaPipe 归一化坐标（左上角为原点）映射到 Three.js 坐标系
              // Three.js: 中心为原点，x 右正，y 上正
              const x = (shoulderCenterX - 0.5) * 10; // 放大到场景坐标
              const y = -(shoulderCenterY - 0.5) * 10 * (video.videoHeight / video.videoWidth);

              // 根据肩宽和躯干长度缩放
              const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) * 10;
              const torsoHeight = Math.abs(shoulderCenterY - hipCenterY) * 10 * (video.videoHeight / video.videoWidth) * 2.2;
              const scaleX = Math.max(0.8, shoulderWidth * 1.4);
              const scaleY = Math.max(1.0, torsoHeight);

              shirt.position.set(x, y - scaleY * 0.1, 0);
              shirt.scale.set(scaleX, scaleY, 1);
              shirt.visible = true;

              // 根据肩膀倾斜旋转
              const shoulderSlope = Math.atan2(
                rightShoulder.y - leftShoulder.y,
                rightShoulder.x - leftShoulder.x
              );
              shirt.rotation.z = -shoulderSlope;

              if (!detected) setDetected(true);
            }
          } else {
            shirt.visible = false;
            if (detected) setDetected(false);
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
      landmarkerRef.current?.close();
      rendererRef.current?.dispose();
    };
  }, [patternImage]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0B0E14' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(240,237,224,0.1)' }}>
        <h2 className="text-[#F0EDE0] font-bold text-sm">AR 虚拟试穿</h2>
        <button onClick={onClose} className="text-[#F0EDE0] opacity-60 hover:opacity-100">
          关闭
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-[#F0EDE0] opacity-60">
            正在启动摄像头与 AI 姿态识别...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6" style={{ color: '#E84A3A' }}>
            {error}
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

        {detected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs" style={{ backgroundColor: 'rgba(36,65,169,0.8)', color: '#F0EDE0' }}>
            已识别到人体，移动身体即可调整纹样位置
          </div>
        )}
      </div>
    </div>
  );
}

