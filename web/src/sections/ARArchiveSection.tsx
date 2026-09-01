import { useRef, useEffect, useState } from 'react';

const AR_IMAGES = [
  'images/ar-makeup-1.jpg',
  'images/ar-makeup-2.jpg',
  'images/ar-makeup-3.jpg',
  'images/ar-makeup-4.jpg',
  'images/ar-makeup-5.jpg',
  'images/ar-makeup-6.jpg',
  'images/ar-makeup-7.jpg',
  'images/ar-makeup-8.jpg',
  'images/ar-makeup-9.jpg',
  'images/ar-makeup-10.jpg',
  'images/ar-makeup-11.jpg',
  'images/ar-makeup-12.jpg',
];

const RADIUS = 650;

export default function ARArchiveSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onWheel(e: WheelEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setRotation((prev) => prev + e.deltaY * 0.05);
      }
    }

    function onMouseMove(e: MouseEvent) {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  useEffect(() => {
    let raf: number;
    function animate() {
      if (trackRef.current) {
        const mouseX = mouseRef.current.x;
        const mouseY = mouseRef.current.y;
        const rotY = rotation + mouseX * 15;
        const rotX = mouseY * 15;
        trackRef.current.style.transform = `translateZ(-600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      }
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [rotation]);

  const COUNT = AR_IMAGES.length;

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '150vh',
        backgroundColor: '#0B0E14',
        overflow: 'hidden',
      }}
    >
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(images/arctic-mirage.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          zIndex: 0,
        }}
      />

      {/* Hand image */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          width: '50vw',
          maxWidth: '600px',
        }}
      >
        <img
          src="images/hand-stardust.jpg"
          alt="Hand with stardust"
          style={{
            width: '100%',
            height: 'auto',
            opacity: 0.8,
          }}
        />
      </div>

      {/* 3D Ring Carousel */}
      <div
        className="ring-container"
        ref={containerRef}
        style={{
          perspective: '1000px',
          position: 'relative',
          overflow: 'hidden',
          height: '100vh',
          width: '100%',
          zIndex: 3,
        }}
      >
        <div
          ref={trackRef}
          className="ring-track"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transform: 'translateZ(-600px) rotateY(0deg)',
          }}
        >
          {AR_IMAGES.map((src, i) => {
            const angle = i * (360 / COUNT);
            return (
              <div
                key={i}
                className="ring-item"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '220px',
                  height: '320px',
                  marginTop: '-160px',
                  marginLeft: '-110px',
                  transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <img
                  src={src}
                  alt={`AR makeup ${i + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
                {/* Glass overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(1px)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Section title */}
        <div
          style={{
            position: 'absolute',
            top: '8vh',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <span
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: '#E84A3A', letterSpacing: '0.15em' }}
          >
            AR MAKEUP SIMULATION
          </span>
          <h2
            className="font-bold text-[#F0EDE0] mt-2"
            style={{
              fontSize: 'clamp(1.8rem, 3vw, 3rem)',
              textShadow: '0 4px 24px rgba(0,0,0,0.8)',
            }}
          >
            肌肤印记
          </h2>
          <p
            className="serif-text text-[#F0EDE0] opacity-60 mt-3"
            style={{
              fontSize: '0.9rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            苗族未来主义美妆模拟 · 滚动页面旋转预览
          </p>
        </div>
      </div>
    </section>
  );
}
