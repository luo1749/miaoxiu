import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PATTERNS_DATA = [
  {
    id: 'butterfly-mother',
    name: '蝴蝶妈妈',
    category: 'mythology',
    region: '松桃苗绣',
    meaning: '苗族创世神话中的始祖，象征生命起源与繁衍',
    elements: ['蝴蝶', '花卉', '人形'],
    colors: ['靛蓝', '朱砂红', '骨白'],
    prompt: '苗绣风格的蝴蝶妈妈图案，几何对称，红蓝配色，中央蝴蝶展开双翼，周围环绕花卉与人形图案',
    image: 'images/pattern-3.jpg',
  },
  {
    id: 'dragon-pattern',
    name: '龙纹图腾',
    category: 'animal',
    region: '松桃苗绣',
    meaning: '苗族龙纹并非汉族式龙，而是水牛、鱼、蛇的复合体，象征力量与丰收',
    elements: ['龙首', '鱼身', '牛角'],
    colors: ['靛蓝', '墨绿', '朱红'],
    prompt: '苗族龙纹图腾，融合水牛与鱼的形象，几何线条风格，对称构图，红蓝配色',
    image: 'images/pattern-8.jpg',
  },
  {
    id: 'copper-drum',
    name: '铜鼓纹',
    category: 'geometry',
    region: '松桃/台江',
    meaning: '铜鼓是苗族重要的礼器和乐器，铜鼓纹象征权力、财富和祭祀',
    elements: ['同心圆', '太阳芒', '青蛙'],
    colors: ['靛蓝', '金', '骨白'],
    prompt: '铜鼓纹几何图案，同心圆结构，中心太阳芒纹，外围青蛙装饰，蓝白配色',
    image: 'images/pattern-5.jpg',
  },
  {
    id: 'wave-water',
    name: '水波纹',
    category: 'geometry',
    region: '江口蜡染',
    meaning: '象征江河湖海，代表生命的源泉和迁徙的记忆',
    elements: ['波浪线', '漩涡', '水滴'],
    colors: ['靛蓝', '骨白'],
    prompt: '蜡染风格水波纹，流畅的波浪线条与漩涡图案，蓝白配色，手绘质感',
    image: 'images/pattern-6.jpg',
  },
  {
    id: 'floral-embroidery',
    name: '花卉刺绣',
    category: 'plant',
    region: '松桃苗绣',
    meaning: '每种花卉都有特定寓意，如牡丹象征富贵，梅花象征坚韧',
    elements: ['牡丹', '梅花', '藤蔓'],
    colors: ['朱红', '靛蓝', '翠绿'],
    prompt: '苗绣花卉图案，牡丹与梅花交织，几何化处理，红蓝绿配色，对称构图',
    image: 'images/pattern-9.jpg',
  },
  {
    id: 'spiral-vortex',
    name: '螺旋纹',
    category: 'geometry',
    region: '施秉蜡染',
    meaning: '象征时间的循环和生命的轮回，也代表苗族对宇宙的理解',
    elements: ['螺旋线', '同心圆', '方格'],
    colors: ['靛蓝', '骨白', '墨绿'],
    prompt: '蜡染螺旋纹图案，多层同心螺旋结构，几何方格点缀，蓝白绿配色',
    image: 'images/pattern-7.jpg',
  },
];

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'mythology', label: '神话人物纹' },
  { key: 'animal', label: '动物纹' },
  { key: 'plant', label: '植物纹' },
  { key: 'geometry', label: '几何纹' },
];

export default function KnowledgeGraphSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = React.useState('all');

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = section.querySelectorAll('.kg-card');
    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: i * 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const filteredPatterns =
    activeCategory === 'all'
      ? PATTERNS_DATA
      : PATTERNS_DATA.filter((p) => p.category === activeCategory);

  return (
    <section
      id="knowledge-graph"
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#0B0E14',
        padding: '15vh 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <span
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: '#E84A3A', letterSpacing: '0.15em' }}
          >
            KNOWLEDGE GRAPH
          </span>
          <h2
            className="font-bold text-[#F0EDE0] mt-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}
          >
            纹样知识图谱
          </h2>
          <p className="serif-text text-[#F0EDE0] opacity-60 mt-4 max-w-xl mx-auto">
            结构化的苗绣蜡染纹样数据库，为研究者与设计师提供文化解读与 AI 生成参考
          </p>
        </div>

        {/* Category filters */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="px-5 py-2 text-sm rounded-full transition-all duration-300"
              style={{
                backgroundColor: activeCategory === cat.key ? '#2441A9' : 'transparent',
                color: activeCategory === cat.key ? '#F0EDE0' : 'rgba(240, 237, 224, 0.5)',
                border: `1px solid ${activeCategory === cat.key ? '#2441A9' : 'rgba(240, 237, 224, 0.2)'}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Pattern cards grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className="kg-card group rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(240, 237, 224, 0.08)',
              }}
            >
              <div className="relative overflow-hidden" style={{ height: '200px' }}>
                <img
                  src={pattern.image}
                  alt={pattern.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(transparent 40%, rgba(11,14,20,0.9))',
                  }}
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[#F0EDE0] font-bold text-lg">{pattern.name}</h3>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'rgba(36, 65, 169, 0.3)',
                      color: '#F0EDE0',
                    }}
                  >
                    {pattern.region}
                  </span>
                </div>
                <p className="serif-text text-[#F0EDE0] opacity-50 text-sm leading-relaxed mb-3">
                  {pattern.meaning}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {pattern.elements.map((el) => (
                    <span
                      key={el}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'rgba(232, 74, 58, 0.15)',
                        color: '#E84A3A',
                      }}
                    >
                      {el}
                    </span>
                  ))}
                </div>
                <div className="border-t border-white/5 pt-3 mt-3">
                  <span className="text-xs text-[#F0EDE0] opacity-30 uppercase tracking-wider">
                    AI Prompt
                  </span>
                  <p className="serif-text text-[#F0EDE0] opacity-40 text-xs mt-1 italic leading-relaxed">
                    {pattern.prompt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
