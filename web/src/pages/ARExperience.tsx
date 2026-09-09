import { useState, useRef, useCallback, useMemo } from 'react';
import ARTryOnCamera from '../components/ARTryOnCamera';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  Glasses, Paintbrush, Shirt, Home, Camera,
  Eraser, Download, Sparkles,
  X, Scan,
} from 'lucide-react';

type Tool = 'brush' | 'eraser';
type ARExperience = 'wax' | 'tryon' | 'home' | 'photo';

const PATTERNS = [
  { id: 'p1', name: '蝴蝶妈妈', image: 'images/pattern-3.jpg', desc: '创世神话·生命起源' },
  { id: 'p2', name: '龙纹图腾', image: 'images/pattern-8.jpg', desc: '力量·丰收之神' },
  { id: 'p3', name: '铜鼓纹', image: 'images/pattern-5.jpg', desc: '权力·祭祀礼器' },
  { id: 'p4', name: '水波纹', image: 'images/pattern-6.jpg', desc: '迁徙·生命源泉' },
  { id: 'p5', name: '花卉纹', image: 'images/pattern-9.jpg', desc: '富贵·生命绵延' },
  { id: 'p6', name: '螺旋纹', image: 'images/pattern-7.jpg', desc: '宇宙·时间循环' },
];

/* ═══════════════════════════════════════════
   3D AR PREVIEW — Three.js Components
   ═══════════════════════════════════════════ */

function AR3DClothing({ patternImage }: { patternImage: string }) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const tex = loader.load(patternImage);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [patternImage]);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.15;
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* T-shirt shape */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 1.6, 0.15]} />
        <meshPhysicalMaterial
          color="#F0EDE0"
          roughness={0.4}
          metalness={0.1}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
        />
      </mesh>
      {/* Pattern overlay on chest */}
      <mesh position={[0, 0.1, 0.08]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* Sleeves */}
      <mesh position={[-0.7, 0.5, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.4, 0.7, 0.12]} />
        <meshPhysicalMaterial color="#F0EDE0" roughness={0.4} metalness={0.1} clearcoat={0.5} />
      </mesh>
      <mesh position={[0.7, 0.5, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.4, 0.7, 0.12]} />
        <meshPhysicalMaterial color="#F0EDE0" roughness={0.4} metalness={0.1} clearcoat={0.5} />
      </mesh>
      {/* Rotating ring */}
      <ARDecorativeRing />
      {/* 3D floating text */}
      <Text
        position={[0, -1.1, 0]}
        fontSize={0.12}
        letterSpacing={0.15}
        color="#F0EDE0"
        anchorX="center"
      >
        AR PREVIEW MODE
      </Text>
    </group>
  );
}

function ARDecorativeRing() {
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.getElapsedTime();
    ringRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    ringRef.current.rotation.z = t * 0.15;
  });

  return (
    <group ref={ringRef}>
      {[0.8, 1.0, 1.2].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.008, 8, 64]} />
          <meshBasicMaterial
            color={i === 1 ? '#E84A3A' : '#2441A9'}
            transparent
            opacity={0.3 - i * 0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

function AR3DHome({ patternImage }: { patternImage: string }) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const tex = loader.load(patternImage);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [patternImage]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.1;
  });

  return (
    <group ref={groupRef}>
      {/* Pillow */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.4, 0.4, 0.9]} />
        <meshPhysicalMaterial
          color="#1E2857"
          roughness={0.6}
          metalness={0.3}
          clearcoat={0.3}
        />
      </mesh>
      {/* Pattern on pillow surface */}
      <mesh position={[0, 0.21, 0]}>
        <planeGeometry args={[1.0, 0.6]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          transparent
          opacity={0.95}
        />
      </mesh>
      {/* Floating decorative elements */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.3, Math.sin(angle) * 0.3 + 0.2, Math.sin(angle) * 0.5]}
          >
            <octahedronGeometry args={[0.04, 0]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#E84A3A' : '#C8913A'} transparent opacity={0.6} />
          </mesh>
        );
      })}
      <ARDecorativeRing />
      <Text position={[0, -0.8, 0]} fontSize={0.1} color="#F0EDE0" anchorX="center" fillOpacity={0.5}>
        HOME DECOR PREVIEW
      </Text>
    </group>
  );
}

function AR3DModel({ patternImage }: { patternImage: string }) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const tex = loader.load(patternImage);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [patternImage]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.3;
  });

  return (
    <group ref={groupRef}>
      {/* Simplified human figure */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshPhysicalMaterial color="#F0EDE0" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Body */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.3, 0.25, 0.8, 16]} />
        <meshPhysicalMaterial color="#2441A9" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Pattern on chest */}
      <mesh position={[0, -0.1, 0.26]}>
        <planeGeometry args={[0.35, 0.35]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.45, -0.1, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.06, 0.05, 0.5, 8]} />
        <meshPhysicalMaterial color="#F0EDE0" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0.45, -0.1, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.06, 0.05, 0.5, 8]} />
        <meshPhysicalMaterial color="#F0EDE0" roughness={0.3} metalness={0.2} />
      </mesh>
      <ARDecorativeRing />
      <Text position={[0, -0.9, 0]} fontSize={0.1} color="#F0EDE0" anchorX="center" fillOpacity={0.5}>
        VIRTUAL MODEL
      </Text>
    </group>
  );
}

/* ═══════════════════════════════════════════
   WAX CANVAS COMPONENT
   ═══════════════════════════════════════════ */

function WaxCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('brush');
  const [isDrawing, setIsDrawing] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [brushSize, setBrushSize] = useState(4);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(255,255,255,0.95)' : 'rgba(30, 40, 87, 0.85)';
    ctx.lineWidth = tool === 'eraser' ? 24 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [tool, brushSize]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }, [isDrawing]);

  const endDraw = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMigrated(false);
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = '蜡染作品_' + Date.now() + '.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div
          className="relative rounded-xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: migrated ? '#F5F0E8' : 'rgba(245, 240, 232, 0.95)',
            border: '2px solid rgba(30, 40, 87, 0.15)',
            aspectRatio: '4/3',
            backgroundImage: migrated
              ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(30,40,87,0.03) 2px, rgba(30,40,87,0.03) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(30,40,87,0.03) 2px, rgba(30,40,87,0.03) 4px)'
              : 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            width={1200}
            height={900}
            className="w-full h-full cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {migrated && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 30%, rgba(30,40,87,0.08) 70%, rgba(30,40,87,0.15) 100%)',
                mixBlendMode: 'multiply',
              }}
            />
          )}
          <div className="absolute top-4 left-4">
            <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(11,14,20,0.7)', backdropFilter: 'blur(8px)', color: '#F0EDE0' }}>
              {migrated ? 'AI 风格迁移已应用' : '虚拟蜡染画布'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-72 space-y-4">
        <div>
          <label className="text-xs text-[#F0EDE0] opacity-50 mb-2 block">蜡染工具</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'brush' as Tool, icon: Paintbrush, label: '蜡刀绘制', color: '#1E2857' },
              { key: 'eraser' as Tool, icon: Eraser, label: '擦除修正', color: '#E84A3A' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTool(t.key)}
                className="p-3 rounded-lg text-center transition-all"
                style={{
                  backgroundColor: tool === t.key ? t.color + '25' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${tool === t.key ? t.color + '60' : 'rgba(240,237,224,0.06)'}`,
                }}
              >
                <t.icon size={18} className="mx-auto mb-1" style={{ color: tool === t.key ? t.color : 'rgba(240,237,224,0.4)' }} />
                <span className="text-xs" style={{ color: tool === t.key ? '#F0EDE0' : 'rgba(240,237,224,0.4)' }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-[#F0EDE0] opacity-50 mb-2 block">笔触粗细: {brushSize}px</label>
          <input
            type="range"
            min={1}
            max={20}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full accent-[#2441A9]"
          />
        </div>

        <button
          onClick={() => setMigrated(true)}
          className="w-full py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          style={{
            background: migrated
              ? 'linear-gradient(135deg, #1E2857, #2441A9)'
              : 'linear-gradient(135deg, #2441A9, #1E2857)',
            color: '#F0EDE0',
            boxShadow: '0 4px 20px rgba(36,65,169,0.3)',
          }}
        >
          <Sparkles size={16} />
          {migrated ? '风格迁移已应用 ✓' : 'AI 蜡染风格迁移'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={saveCanvas}
            className="py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-all hover:bg-white/10"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#F0EDE0', border: '1px solid rgba(240,237,224,0.1)' }}
          >
            <Download size={14} />
            保存作品
          </button>
          <button
            onClick={clearCanvas}
            className="py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-all hover:bg-white/10"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#F0EDE0', border: '1px solid rgba(240,237,224,0.1)' }}
          >
            <X size={14} />
            清空画布
          </button>
        </div>

        <div className="pt-4 border-t border-white/5">
          <h4 className="text-xs text-[#F0EDE0] opacity-60 mb-2 font-medium">蜡染工艺指引</h4>
          <ol className="space-y-1.5">
            {['用蜡刀蘸取蜂蜡在画布上绘制图案', '绘制完成后点击下方"AI风格迁移"', '系统将自动转换为蜡染风格效果', '可保存或分享您的作品'].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-[#F0EDE0] opacity-40">
                <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px text-[9px]" style={{ backgroundColor: 'rgba(36,65,169,0.3)', color: '#2441A9' }}>
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   AR TRY-ON WITH 3D PREVIEW
   ═══════════════════════════════════════════ */

interface ARTryOnProps {
  category: 'tryon' | 'home' | 'photo';
}

function ARTryOn({ category: initialCategory }: ARTryOnProps) {
  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);
  const category: 'clothing' | 'home' | 'model' = initialCategory === 'tryon' ? 'clothing' : initialCategory === 'home' ? 'home' : 'model';
  const [showAR, setShowAR] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowAR(true);
    } catch {
      setShowAR(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setShowAR(false);
  };

  const scene3D = useMemo(() => {
    switch (category) {
      case 'clothing': return <AR3DClothing patternImage={selectedPattern.image} />;
      case 'home': return <AR3DHome patternImage={selectedPattern.image} />;
      case 'model': return <AR3DModel patternImage={selectedPattern.image} />;
    }
  }, [category, selectedPattern]);

  return (
    <div className="space-y-6">
      {!showAR ? (
        <>
          {/* Pattern Selection with ICH descriptions */}
          <div>
            <label className="text-xs text-[#F0EDE0] opacity-50 mb-3 block font-medium">选择传统纹样</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {PATTERNS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPattern(p)}
                  className="relative rounded-xl overflow-hidden transition-all group"
                  style={{
                    border: `2px solid ${selectedPattern.id === p.id ? '#E84A3A' : 'transparent'}`,
                    boxShadow: selectedPattern.id === p.id ? '0 4px 20px rgba(232,74,58,0.2)' : 'none',
                  }}
                >
                  <img src={p.image} alt={p.name} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2" style={{ background: 'linear-gradient(transparent 30%, rgba(11,14,20,0.9))' }}>
                    <span className="text-[10px] text-[#F0EDE0] font-medium">{p.name}</span>
                    <span className="text-[9px] text-[#F0EDE0] opacity-50">{p.desc}</span>
                  </div>
                  {selectedPattern.id === p.id && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E84A3A' }}>
                      <Sparkles size={10} className="text-[#F0EDE0]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Preview */}
          <div>
            <label className="text-xs text-[#F0EDE0] opacity-50 mb-3 block font-medium">
              {category === 'clothing' ? '服饰试穿预览' : category === 'home' ? '家居试用预览' : '虚拟合影预览'}
            </label>
            <div
              className="rounded-xl overflow-hidden relative"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(36,65,169,0.08) 0%, transparent 70%)',
                border: '1px solid rgba(240,237,224,0.06)',
                minHeight: '320px',
              }}
            >
              <div className="absolute top-3 left-3 z-10">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(36,65,169,0.3)', color: '#2441A9' }}>
                  3D 实时预览
                </span>
              </div>
              <Canvas
                camera={{ position: [0, 0, 2.8], fov: 50 }}
                style={{ width: '100%', height: '320px' }}
                gl={{ alpha: true, antialias: true }}
              >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1.2} />
                <pointLight position={[-3, 2, 4]} intensity={0.6} color="#2441A9" />
                <pointLight position={[3, -2, 3]} intensity={0.3} color="#E84A3A" />
                  {scene3D}
              </Canvas>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <span className="text-[10px] text-[#F0EDE0] opacity-30">Three.js 渲染 · 鼠标交互旋转</span>
              </div>
            </div>
          </div>

          {/* Start AR */}
          <div
            className="rounded-xl p-6 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(36,65,169,0.1), rgba(232,74,58,0.05))',
              border: '1px solid rgba(36,65,169,0.15)',
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <img src={selectedPattern.image} alt="" className="w-12 h-12 rounded-lg object-cover" style={{ border: '2px solid rgba(232,74,58,0.3)' }} />
              <div className="text-left">
                <p className="text-[#F0EDE0] text-sm font-medium">「{selectedPattern.name}」</p>
                <p className="text-[#F0EDE0] opacity-40 text-xs">{category === 'clothing' ? '服饰试穿' : category === 'home' ? '家居试用' : '虚拟合影'}</p>
              </div>
            </div>
            <button
              onClick={startCamera}
              className="px-8 py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 mx-auto transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #E84A3A, #C23A2A)',
                color: '#F0EDE0',
                boxShadow: '0 4px 20px rgba(232,74,58,0.3)',
              }}
            >
              <Scan size={16} />
              启动 AR 体验
            </button>
            <p className="serif-text text-[#F0EDE0] opacity-20 text-xs mt-3">
              需要摄像头权限 · 数据仅在本地处理
            </p>
          </div>
        </>
      ) : (
        <ARTryOnCamera patternImage={selectedPattern.image} category={category} onClose={stopCamera} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function ARExperience() {
  const [tab, setTab] = useState<ARExperience>('wax');

  const TABS = [
    { key: 'wax' as ARExperience, icon: Paintbrush, label: '虚拟蜡染工坊', desc: '模拟蜡刀绘制 · AI风格迁移' },
    { key: 'tryon' as ARExperience, icon: Shirt, label: 'AR虚拟试穿', desc: '3D预览 · 实时叠加' },
    { key: 'home' as ARExperience, icon: Home, label: 'AR家居试用', desc: '家居场景 · 沉浸体验' },
    { key: 'photo' as ARExperience, icon: Camera, label: '虚拟合影', desc: '3D模特 · 纹样更换' },
  ];

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Glasses size={24} style={{ color: '#E84A3A' }} />
            <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#E84A3A' }}>
              AR IMMERSIVE EXPERIENCE
            </span>
          </div>
          <h1 className="font-bold text-[#F0EDE0]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            AR 沉浸式体验
          </h1>
          <p className="serif-text text-[#F0EDE0] opacity-50 mt-2 max-w-2xl">
            通过增强现实与 Three.js 3D 渲染技术，让您身临其境体验蜡染绘制过程，
            或将传统纹样虚拟试穿到服饰与家居用品上
          </p>
        </div>

        {/* Feature highlight bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Scan, label: 'WebAR 零安装', value: '即开即用' },
            { icon: Sparkles, label: 'Three.js 3D', value: '实时渲染' },
            { icon: Camera, label: '摄像头融合', value: '虚实叠加' },
            { icon: Paintbrush, label: '蜡染模拟', value: 'AI风格迁移' },
          ].map((f) => (
            <div
              key={f.label}
              className="p-3 rounded-lg flex items-center gap-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.04)' }}
            >
              <f.icon size={18} style={{ color: '#2441A9', opacity: 0.7 }} />
              <div>
                <div className="text-[10px] text-[#F0EDE0] opacity-40">{f.label}</div>
                <div className="text-xs text-[#F0EDE0] font-medium">{f.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                backgroundColor: tab === t.key ? 'rgba(36,65,169,0.12)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${tab === t.key ? '#2441A960' : 'rgba(240,237,224,0.06)'}`,
                boxShadow: tab === t.key ? '0 4px 20px rgba(36,65,169,0.1)' : 'none',
              }}
            >
              <t.icon size={20} className="mb-2" style={{ color: tab === t.key ? '#2441A9' : 'rgba(240,237,224,0.3)' }} />
              <span className="text-sm font-medium block" style={{ color: tab === t.key ? '#F0EDE0' : 'rgba(240,237,224,0.6)' }}>{t.label}</span>
              <span className="text-[10px] text-[#F0EDE0] opacity-30">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'wax' && <WaxCanvas />}
        {(tab === 'tryon' || tab === 'home' || tab === 'photo') && <ARTryOn category={tab} />}
      </div>
    </div>
  );
}




