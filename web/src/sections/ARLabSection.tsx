import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';

function FluidCard() {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const x = -state.pointer.y * 0.1;
    const y = state.pointer.x * 0.1;
    groupRef.current.rotation.x += (x - groupRef.current.rotation.x) * 0.1;
    groupRef.current.rotation.y += (y - groupRef.current.rotation.y) * 0.1;
    
    // Subtle color animation
    if (meshRef.current) {
      const mat = meshRef.current.material as any;
      if (mat && mat.opacity !== undefined) {
        mat.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background card - simplified geometry */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial color="#e8e6e0" />
      </mesh>

      {/* Liquid surface - simplified */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial
          color="#2441A9"
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Decorative ring */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.5, 0.52, 4]} />
        <meshBasicMaterial color="#E84A3A" transparent opacity={0.6} />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[0, 0, -Math.PI / 6]}>
        <ringGeometry args={[0.3, 0.31, 6]} />
        <meshBasicMaterial color="#2441A9" transparent opacity={0.4} />
      </mesh>

      {/* Floating dots */}
      {[[0.6, 0.3], [-0.5, 0.4], [0.4, -0.5], [-0.6, -0.3]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.05]}>
          <circleGeometry args={[0.04, 8]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#E84A3A' : '#2441A9'} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export default function ARLabSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="ar-lab"
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#F0EDE0',
        padding: '15vh 0',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60% 40%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 4vw',
          gap: '4vw',
          alignItems: 'center',
          minHeight: '70vh',
        }}
      >
        {/* Left: Text content */}
        <div>
          <span
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: '#E84A3A', letterSpacing: '0.15em' }}
          >
            INNOVATION LAB
          </span>
          <h2
            className="font-bold text-[#0B0E14] mt-4"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', lineHeight: 1.2 }}
          >
            AR 创新实验室
          </h2>
          <p className="serif-text text-[#0B0E14] opacity-70 mt-6" style={{ fontSize: '1rem', lineHeight: 1.8, maxWidth: '500px' }}>
            通过增强现实技术，将数字纹样无缝叠加于物理世界。用户可以在手机屏幕上
            预览蜡染图案在服饰、家居用品上的实际效果，实现"所见即所得"的文创消费体验。
            我们相信，AR 不仅是展示工具，更是连接数字创造与实体经济的桥梁。
          </p>

          <div className="mt-10 flex flex-wrap gap-6">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-[#0B0E14]">12ms</span>
              <span className="text-xs text-[#0B0E14] opacity-50 mt-1">AR 渲染延迟</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-[#0B0E14]">99.4%</span>
              <span className="text-xs text-[#0B0E14] opacity-50 mt-1">跟踪精度</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-[#0B0E14]">Web</span>
              <span className="text-xs text-[#0B0E14] opacity-50 mt-1">零安装体验</span>
            </div>
          </div>
        </div>

        {/* Right: 3D Card */}
        <div
          style={{
            width: '100%',
            height: '400px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 2.5], fov: 50 }}
            style={{ width: '100%', height: '100%', background: '#f5f5f5' }}
            gl={{ alpha: false, antialias: false, powerPreference: 'low-power' }}
            dpr={[1, 1.5]}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <pointLight position={[-3, 2, 4]} intensity={0.8} color="#2441A9" />
            <FluidCard />
          </Canvas>
        </div>
      </div>
    </section>
  );
}
