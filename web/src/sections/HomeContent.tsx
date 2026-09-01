import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useI18n } from "../i18n";
import {
  Sparkles, Glasses, ShoppingBag, GraduationCap,
  TrendingUp, Layers, Cpu, Eye,
  ChevronLeft, ChevronRight, ArrowRight,
  HandHeart,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Animated counter
function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const end = value;
          const duration = 2000;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function HomeContent() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Culture stories data (使用 t() 获取翻译)
  const cultureStories = [
    {
      title: '松桃苗绣 · 指尖上的史诗',
      desc: '松桃苗绣是苗族刺绣的重要流派，以精细的平绣、辫绣、打籽绣闻名。每一针一线都承载着苗族先民对自然、祖先和生命的敬畏与热爱。',
      image: 'images/pattern-1.jpg',
      tag: t('cs.story1.tag'),
    },
    {
      title: '蝴蝶妈妈 · 创世神话',
      desc: '在苗族古歌中，蝴蝶妈妈"妹榜妹略"从枫树心中诞生，生下十二个蛋，孵出人类万物。蝴蝶纹是苗族服饰中最神圣的纹样，象征生命起源。',
      image: 'images/pattern-3.jpg',
      tag: t('cs.story2.tag'),
    },
    {
      title: '蜡染工艺 · 冰纹之美',
      desc: '蜡染是苗族古老的防染技艺。蜡刀蘸蜂蜡在布上绘制图案，浸入靛蓝染缸后产生独特的"冰裂纹"，每一件作品都是不可复制的艺术孤品。',
      image: 'images/pattern-6.jpg',
      tag: t('cs.story3.tag'),
    },
    {
      title: '龙纹图腾 · 水牛与鱼的化身',
      desc: '苗族龙纹不同于汉族的龙，它是水牛、鱼、蛇的复合体，代表着丰收与力量。在苗族织锦中，龙纹常与鱼纹、鸟纹交织，形成独特的图腾语言。',
      image: 'images/pattern-8.jpg',
      tag: t('cs.story4.tag'),
    },
    {
      title: '铜鼓纹 · 权力与祭祀',
      desc: '铜鼓是苗族最重要的礼器，铜鼓纹以同心圆结构为中心，向外辐射太阳芒、青蛙等图案，象征着权力、财富和对太阳的崇拜。',
      image: 'images/pattern-5.jpg',
      tag: t('cs.story5.tag'),
    },
  ];

  // Dashboard stats (使用 t() 获取翻译)
  const stats = [
    { label: t('db.patterns'), value: 1247, suffix: '', icon: Layers, color: '#2441A9' },
    { label: t('db.model'), value: 3, suffix: '.2', icon: Cpu, color: '#E84A3A' },
    { label: t('db.ar'), value: 5682, suffix: '', icon: Eye, color: '#2441A9' },
    { label: t('db.artisans'), value: 86, suffix: '人', icon: HandHeart, color: '#E84A3A' },
    { label: t('db.courses'), value: 12, suffix: '门', icon: GraduationCap, color: '#2441A9' },
    { label: t('db.products'), value: 156, suffix: '款', icon: ShoppingBag, color: '#E84A3A' },
  ];

  // Quick entry cards (使用 t() 获取翻译)
  const quickEntries = [
    {
      title: t('qe.ai.title'),
      desc: t('qe.ai.desc'),
      icon: Sparkles,
      path: '/ai-generator',
      color: '#2441A9',
      bg: 'rgba(36, 65, 169, 0.15)',
    },
    {
      title: t('qe.ar.title'),
      desc: t('qe.ar.desc'),
      icon: Glasses,
      path: '/ar-experience',
      color: '#E84A3A',
      bg: 'rgba(232, 74, 58, 0.15)',
    },
    {
      title: t('qe.study.title'),
      desc: t('qe.study.desc'),
      icon: GraduationCap,
      path: '/study-tour',
      color: '#2441A9',
      bg: 'rgba(36, 65, 169, 0.15)',
    },
    {
      title: t('qe.shop.title'),
      desc: t('qe.shop.desc'),
      icon: ShoppingBag,
      path: '/study-tour',
      color: '#E84A3A',
      bg: 'rgba(232, 74, 58, 0.15)',
    },
  ];

  useEffect(() => {
    const cards = sectionRef.current?.querySelectorAll('.stat-card');
    cards?.forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.6, delay: i * 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none reverse' },
      });
    });
    const entries = sectionRef.current?.querySelectorAll('.entry-card');
    entries?.forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 60 }, {
        opacity: 1, y: 0, duration: 0.8, delay: i * 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none reverse' },
      });
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % cultureStories.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [cultureStories.length]);

  const prevSlide = () => setCurrentSlide((p) => (p - 1 + cultureStories.length) % cultureStories.length);
  const nextSlide = () => setCurrentSlide((p) => (p + 1) % cultureStories.length);

  return (
    <div ref={sectionRef}>
      {/* Quick Entry Navigation */}
      <section style={{ backgroundColor: '#0B0E14', padding: '8vh 0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickEntries.map((entry) => (
              <Link
                key={entry.path + entry.title}
                to={entry.path}
                className="entry-card group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: entry.bg,
                  border: '1px solid rgba(240, 237, 224, 0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: entry.color + '20' }}
                  >
                    <entry.icon size={20} style={{ color: entry.color }} />
                  </div>
                  <h3 className="text-[#F0EDE0] font-bold text-sm">{entry.title}</h3>
                </div>
                <p className="serif-text text-[#F0EDE0] opacity-50 text-xs leading-relaxed">{entry.desc}</p>
                <ArrowRight size={16} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ color: entry.color }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Culture Story Carousel */}
      <section style={{ backgroundColor: '#0B0E14', padding: '0 0 10vh' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#E84A3A' }}>
              {t("cs.label")}
            </span>
          </div>
          <h2 className="font-bold text-[#F0EDE0] mb-8" style={{ fontSize: 'clamp(1.8rem, 3vw, 3rem)' }}>
            {t("cs.title")}
          </h2>

          {/* Carousel */}
          <div className="relative overflow-hidden rounded-2xl" style={{ height: 'clamp(400px, 50vh, 600px)' }}>
            <div
              className="flex transition-transform duration-700 ease-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {cultureStories.map((story, i) => (
                <div key={i} className="w-full shrink-0 relative" style={{ height: '100%' }}>
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(transparent 20%, rgba(11,14,20,0.95))' }}
                  />
                  <div className="absolute bottom-0 left-0 p-8 max-w-2xl">
                    <span
                      className="text-xs px-3 py-1 rounded-full mb-3 inline-block"
                      style={{ backgroundColor: 'rgba(232,74,58,0.3)', color: '#F0EDE0' }}
                    >
                      {story.tag}
                    </span>
                    <h3 className="text-[#F0EDE0] font-bold text-2xl mb-3">{story.title}</h3>
                    <p className="serif-text text-[#F0EDE0] opacity-70 text-sm leading-relaxed">{story.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <button
              onClick={prevSlide}
              aria-label="上一个"
              title="上一个"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: 'rgba(11,14,20,0.6)', backdropFilter: 'blur(8px)' }}
            >
              <ChevronLeft size={20} className="text-[#F0EDE0]" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="下一个"
              title="下一个"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: 'rgba(11,14,20,0.6)', backdropFilter: 'blur(8px)' }}
            >
              <ChevronRight size={20} className="text-[#F0EDE0]" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 right-8 flex gap-2">
              {cultureStories.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`切换到 ${s.title}`}
                  title={s.title}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === currentSlide ? '24px' : '8px',
                    backgroundColor: i === currentSlide ? '#E84A3A' : 'rgba(240,237,224,0.3)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Stats */}
      <section style={{ backgroundColor: '#0B0E14', padding: '0 0 12vh' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={18} style={{ color: '#E84A3A' }} />
            <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#E84A3A' }}>
              {t("db.label")}
            </span>
          </div>
          <h2 className="font-bold text-[#F0EDE0] mb-10" style={{ fontSize: 'clamp(1.8rem, 3vw, 3rem)' }}>
            {t("db.title")}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="stat-card text-center p-5 rounded-xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(240, 237, 224, 0.06)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: stat.color + '15' }}
                >
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
                <div className="text-[#F0EDE0] font-bold text-2xl mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="serif-text text-[#F0EDE0] opacity-40 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}