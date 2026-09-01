import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function VideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    const text = textRef.current;
    if (!container || !video || !text) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 60%',
        end: 'bottom 30%',
        scrub: true,
        onLeave: () => {
          gsap.to(text, { opacity: 0, duration: 0.5, ease: 'power2.out' });
        },
        onEnterBack: () => {
          gsap.to(text, { opacity: 1, duration: 0.5, ease: 'power2.out' });
        },
      },
    });

    tl.to(video, {
      scale: 1.8,
      transformOrigin: 'center center',
      duration: 1,
      ease: 'none',
    }, 0);

    tl.to(video, {
      yPercent: 25,
      duration: 1,
      ease: 'none',
    }, 0);

    tl.to(text, {
      xPercent: -40,
      duration: 1,
      ease: 'none',
    }, 0);

    tl.to(container, {
      yPercent: 35,
      duration: 1,
      ease: 'none',
    }, 0);

    tl.to(video, {
      filter: 'brightness(0.2)',
      duration: 1,
      ease: 'none',
    }, 0);

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      data-video-container
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '70vh',
        overflow: 'hidden',
        marginTop: '-10vh',
      }}
    >
      <video
        ref={videoRef}
        className="video"
        src="videos/time-fold.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <div
        ref={textRef}
        className="center-marker"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <h1
          className="serif-text text-[#F0EDE0]"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            lineHeight: 2.2,
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          1,247 组非遗纹样数字化 / 99.2% 结构保真度 / 0.3ms 实时渲染
        </h1>
      </div>
    </section>
  );
}
