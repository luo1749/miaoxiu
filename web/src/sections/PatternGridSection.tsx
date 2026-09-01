import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PATTERNS = [
  { src: 'images/pattern-1.jpg', code: 'PTN-8842-A' },
  { src: 'images/pattern-2.jpg', code: 'PTN-8842-B' },
  { src: 'images/pattern-3.jpg', code: 'PTN-8842-C' },
  { src: 'images/pattern-4.jpg', code: 'PTN-8842-D' },
  { src: 'images/pattern-5.jpg', code: 'PTN-8842-E' },
  { src: 'images/pattern-6.jpg', code: 'PTN-8842-F' },
  { src: 'images/pattern-7.jpg', code: 'PTN-8842-G' },
  { src: 'images/pattern-8.jpg', code: 'PTN-8842-H' },
  { src: 'images/pattern-9.jpg', code: 'PTN-8842-I' },
];

function PatternCard({ src, code }: { src: string; code: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative overflow-hidden cursor-pointer"
      style={{ marginBottom: '24px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={src}
        alt={code}
        className="w-full transition-all duration-500"
        style={{
          filter: hovered ? 'grayscale(100%)' : 'grayscale(0%)',
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 p-3 transition-all duration-300"
        style={{
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(10px)',
        }}
      >
        <span className="text-[#F0EDE0] text-xs font-mono tracking-wider">{code}</span>
      </div>
    </div>
  );
}

export default function PatternGridSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const centerColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const leftCol = leftColRef.current;
    const centerCol = centerColRef.current;
    const rightCol = rightColRef.current;
    if (!section || !leftCol || !centerCol || !rightCol) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
    });

    tl.to(leftCol, { y: '-150vh', ease: 'none' }, 0);
    tl.to(centerCol, { y: '-120vh', ease: 'none' }, 0);
    tl.to(rightCol, { y: '-50vh', ease: 'none' }, 0);

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      id="pattern-engine"
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '200vh',
        backgroundColor: '#F0EDE0',
        paddingTop: '15vh',
        paddingBottom: '15vh',
        overflow: 'hidden',
      }}
    >
      <div className="text-center mb-16 px-8">
        <h2
          className="font-bold text-[#0B0E14]"
          style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}
        >
          无尽纹样
        </h2>
        <p className="serif-text text-[#0B0E14] opacity-60 mt-4 max-w-xl mx-auto" style={{ fontSize: '1rem' }}>
          AI 生成的海量苗族蜡染图案，每一帧都是算法与传统工艺的深度对话
        </p>
      </div>

      <div
        className="scene"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '24px',
          padding: '0 4vw',
          position: 'relative',
        }}
      >
        <div ref={leftColRef} className="column-left">
          <PatternCard src={PATTERNS[0].src} code={PATTERNS[0].code} />
          <PatternCard src={PATTERNS[3].src} code={PATTERNS[3].code} />
          <PatternCard src={PATTERNS[6].src} code={PATTERNS[6].code} />
        </div>
        <div ref={centerColRef} className="column-center" style={{ marginTop: '15vh' }}>
          <PatternCard src={PATTERNS[1].src} code={PATTERNS[1].code} />
          <PatternCard src={PATTERNS[4].src} code={PATTERNS[4].code} />
          <PatternCard src={PATTERNS[7].src} code={PATTERNS[7].code} />
        </div>
        <div ref={rightColRef} className="column-right" style={{ marginTop: '8vh' }}>
          <PatternCard src={PATTERNS[2].src} code={PATTERNS[2].code} />
          <PatternCard src={PATTERNS[5].src} code={PATTERNS[5].code} />
          <PatternCard src={PATTERNS[8].src} code={PATTERNS[8].code} />
        </div>
      </div>
    </section>
  );
}
