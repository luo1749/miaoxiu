import { useI18n } from "../i18n";
import FluidShader from '../components/FluidShader';

export default function HeroSection() {
  const { t } = useI18n();
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <FluidShader />

      {/* Text overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: '8vw',
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.3) 0%, transparent 60%)',
        }}
      >
        <div style={{ maxWidth: '40vw', pointerEvents: 'auto' }}>
          <h1
            className="text-[#F0EDE0] font-bold leading-tight"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 5rem)',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 40px rgba(0,0,0,0.5)',
            }}
          >
            {t("hero.title1")}
            <br />
            {t("hero.title2")}
          </h1>
          <p
            className="serif-text mt-6 text-[#F0EDE0] opacity-70"
            style={{
              fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
              lineHeight: 1.8,
              maxWidth: '380px',
            }}
          >
            {t("hero.desc")}
            
          </p>
        </div>
      </div>

      {/* CTA at bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: '5vh',
          left: '8vw',
          zIndex: 10,
        }}
      >
        <a
          href="#pattern-engine"
          className="cta-link text-[#F0EDE0] text-sm opacity-80 hover:opacity-100 flex items-center gap-2"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
        >
          {t("hero.cta")} <span className="text-lg">&gt;</span>
        </a>
      </div>
    </section>
  );
}
