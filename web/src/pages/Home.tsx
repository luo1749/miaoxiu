import HeroSection from '../sections/HeroSection';
import HomeContent from '../sections/HomeContent';
import VideoSection from '../sections/VideoSection';
import PatternGridSection from '../sections/PatternGridSection';
import ARLabSection from '../sections/ARLabSection';
import ARArchiveSection from '../sections/ARArchiveSection';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <HomeContent />
      <VideoSection />
      <PatternGridSection />
      <ARLabSection />
      <ARArchiveSection />
    </div>
  );
}
