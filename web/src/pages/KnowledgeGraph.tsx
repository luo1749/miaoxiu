import { useI18n } from "../i18n";
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useState, useRef, useEffect, useMemo } from 'react';
import { api } from '../api';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BookOpen, Search, Download, X,
  MapPin, Calendar, Palette, Ruler, Info,
  Network, ChevronRight, Sparkles, FileText,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'plant', label: '植物纹' },
  { key: 'animal', label: '动物纹' },
  { key: 'geometry', label: '几何纹' },
  { key: 'mythology', label: '神话人物纹' },
];

interface Pattern {
  id: string;
  name: string;
  category: string;
  region: string;
  year: string;
  craft: string;
  size: string;
  colors: string[];
  meaning: string;
  story: string;
  occasion: string;
  prompt: string;
  image: string;
  lineart: string;
}


function backendPatternToPattern(p: any): Pattern {
  return {
    id: String(p.id),
    name: p.name,
    category: p.category,
    region: p.tags && p.tags.length > 0 ? p.tags[0] : '铜仁苗绣',
    year: '传统',
    craft: '苗绣/蜡染',
    size: '45×60cm',
    colors: p.tags && p.tags.length > 0 ? p.tags : ['靛蓝', '朱红', '骨白'],
    meaning: p.meaning || p.description || '',
    story: p.description || p.meaning || '',
    occasion: p.occasion || '节日、盛装、祭祀',
    prompt: p.ai_prompt || '',
    image: p.image_url || 'images/pattern-3.jpg',
    lineart: p.lineart_url || p.image_url || 'images/pattern-3.jpg',
  };
}
const PATTERNS: Pattern[] = [
  {
    id: 'kg-001',
    name: '蝴蝶妈妈',
    category: 'mythology',
    region: '松桃苗绣',
    year: '清代',
    craft: '平绣',
    size: '45×60cm',
    colors: ['靛蓝', '朱红', '骨白'],
    meaning: '创世始祖，生命起源',
    story: '苗族古歌记载，枫树心孕育出蝴蝶妈妈「妹榜妹略」，她生下十二个蛋，最终孵化出人类和万物。蝴蝶纹是苗族服饰中最神圣的纹样，常见于女性的上衣、背扇和头帕上。',
    occasion: '婚礼盛装、节日庆典、祭祀活动',
    prompt: '苗绣风格的蝴蝶妈妈图案，几何对称构图，红蓝配色，中央蝴蝶展开双翼，周围环绕花卉与人形图案，精细刺绣质感',
    image: 'images/pattern-3.jpg',
    lineart: 'images/pattern-3.jpg',
  },
  {
    id: 'kg-002',
    name: '龙纹图腾',
    category: 'animal',
    region: '松桃苗绣',
    year: '民国',
    craft: '辫绣',
    size: '38×52cm',
    colors: ['靛蓝', '墨绿', '朱红'],
    meaning: '力量、丰收、水族之神',
    story: '苗族龙纹不同于汉族的龙形象，它是水牛、鱼、蛇的复合体，被称为「水牛龙」或「鱼龙」。在苗族传说中，龙掌管水域和降雨，是丰收的守护神。',
    occasion: '祭祀、龙舟节、求雨仪式',
    prompt: '苗族龙纹图腾，融合水牛与鱼的形象，几何线条风格，对称构图，红蓝绿配色，辫绣质感',
    image: 'images/pattern-8.jpg',
    lineart: 'images/pattern-8.jpg',
  },
  {
    id: 'kg-003',
    name: '铜鼓纹',
    category: 'geometry',
    region: '松桃/台江',
    year: '明代',
    craft: '织锦',
    size: '50×50cm',
    colors: ['靛蓝', '金色', '骨白'],
    meaning: '权力、财富、太阳崇拜',
    story: '铜鼓是苗族最重要的礼器和权力象征。铜鼓纹以同心圆为基本结构，中心为太阳芒纹，向外依次为云雷纹、蛙纹和翔鹭纹。青蛙在苗族文化中代表繁衍生息。',
    occasion: '鼓社祭、吃新节、丧葬仪式',
    prompt: '铜鼓纹几何图案，同心圆结构，中心太阳芒纹，外围青蛙装饰，蓝白金配色，织锦质感',
    image: 'images/pattern-5.jpg',
    lineart: 'images/pattern-5.jpg',
  },
  {
    id: 'kg-004',
    name: '水波纹',
    category: 'geometry',
    region: '江口蜡染',
    year: '清代',
    craft: '蜡染',
    size: '40×80cm',
    colors: ['靛蓝', '骨白'],
    meaning: '生命源泉、迁徙记忆',
    story: '苗族历史上经历了五次大迁徙，水波纹象征着先民渡过的江河湖泊，也代表着生命的源泉。在蜡染中，水波纹通过蜡刀的自由流动形成独特的冰裂纹效果。',
    occasion: '日常服饰、背扇、被面',
    prompt: '蜡染风格水波纹，流畅的波浪线条与漩涡图案，蓝白配色，手绘冰裂纹质感',
    image: 'images/pattern-6.jpg',
    lineart: 'images/pattern-6.jpg',
  },
  {
    id: 'kg-005',
    name: '牡丹花卉纹',
    category: 'plant',
    region: '松桃苗绣',
    year: '民国',
    craft: '打籽绣',
    size: '30×40cm',
    colors: ['朱红', '靛蓝', '翠绿'],
    meaning: '富贵吉祥、生命绵延',
    story: '牡丹在苗族纹样中被称为「富贵花」，与藤蔓组合寓意子孙绵延。打籽绣的技法使花瓣呈现立体感，每一片花瓣都需要数百颗小籽粒 meticulously 排列。',
    occasion: '婚礼嫁妆、满月贺礼、节庆服饰',
    prompt: '苗绣花卉图案，牡丹与藤蔓交织，几何化处理，红蓝绿配色，打籽绣立体质感',
    image: 'images/pattern-9.jpg',
    lineart: 'images/pattern-9.jpg',
  },
  {
    id: 'kg-006',
    name: '螺旋纹',
    category: 'geometry',
    region: '施秉蜡染',
    year: '清代',
    craft: '蜡染',
    size: '35×35cm',
    colors: ['靛蓝', '骨白', '墨绿'],
    meaning: '时间循环、宇宙秩序',
    story: '螺旋纹是苗族对宇宙和时间理解的可视化表达。在苗族古历中，时间以螺旋方式循环往复，而非线性前进。这种纹样常见于头帕和围腰上。',
    occasion: '年节服饰、祭祀服装',
    prompt: '蜡染螺旋纹图案，多层同心螺旋结构，几何方格点缀，蓝白绿配色，手绘蜡染质感',
    image: 'images/pattern-7.jpg',
    lineart: 'images/pattern-7.jpg',
  },
  {
    id: 'kg-007',
    name: '鱼纹',
    category: 'animal',
    region: '台江苗绣',
    year: '民国',
    craft: '堆绣',
    size: '25×35cm',
    colors: ['靛蓝', '朱红', '金色'],
    meaning: '繁衍、多子多福',
    story: '鱼在苗族文化中是繁衍的象征，因为鱼产籽众多。在苗族婚嫁中，鱼纹是必不可少的装饰元素，寓意新人早生贵子、家族兴旺。',
    occasion: '婚礼、求子祭祀',
    prompt: '苗绣鱼纹图案，几何化鱼形与波浪结合，红蓝金配色，堆绣立体感',
    image: 'images/pattern-4.jpg',
    lineart: 'images/pattern-4.jpg',
  },
  {
    id: 'kg-008',
    name: '枫树纹',
    category: 'plant',
    region: '雷山苗绣',
    year: '清代',
    craft: '平绣',
    size: '40×60cm',
    colors: ['靛蓝', '骨白', '朱红'],
    meaning: '祖先崇拜、生命起源',
    story: '枫树是苗族最神圣的图腾树。据《苗族古歌》记载，枫树心孕育出蝴蝶妈妈，枫香木则用于祭祀祖先。枫树纹常与其他图腾组合出现。',
    occasion: '鼓社祭、祭祖仪式',
    prompt: '苗绣枫树纹，树形与蝴蝶组合，几何对称构图，红蓝白配色，平绣细腻质感',
    image: 'images/pattern-1.jpg',
    lineart: 'images/pattern-1.jpg',
  },
];

// Knowledge graph nodes
const GRAPH_NODES = [
  { id: 'butterfly', label: '蝴蝶妈妈', x: 0.5, y: 0.5, type: 'center', color: '#E84A3A' },
  { id: 'pattern1', label: '蝴蝶纹', x: 0.2, y: 0.2, type: 'pattern', color: '#2441A9' },
  { id: 'pattern2', label: '花卉纹', x: 0.8, y: 0.2, type: 'pattern', color: '#2441A9' },
  { id: 'pattern3', label: '人形纹', x: 0.15, y: 0.7, type: 'pattern', color: '#2441A9' },
  { id: 'myth', label: '枫树传说', x: 0.35, y: 0.15, type: 'story', color: '#C8913A' },
  { id: 'color1', label: '靛蓝', x: 0.7, y: 0.75, type: 'color', color: '#1E2857' },
  { id: 'color2', label: '朱红', x: 0.85, y: 0.55, type: 'color', color: '#E84A3A' },
  { id: 'craft', label: '平绣', x: 0.25, y: 0.85, type: 'craft', color: '#1B4D3E' },
  { id: 'region', label: '松桃', x: 0.65, y: 0.35, type: 'region', color: '#5B2C6F' },
  { id: 'meaning', label: '创世神话', x: 0.45, y: 0.8, type: 'meaning', color: '#C8913A' },
];

const GRAPH_EDGES = [
  ['butterfly', 'pattern1'], ['butterfly', 'pattern2'], ['butterfly', 'pattern3'],
  ['butterfly', 'myth'], ['butterfly', 'meaning'],
  ['pattern1', 'color1'], ['pattern1', 'color2'],
  ['pattern2', 'color1'], ['pattern3', 'craft'],
  ['region', 'pattern1'], ['region', 'craft'],
];

export default function KnowledgeGraph() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [patterns, setPatterns] = useState<Pattern[]>(PATTERNS);
  
  const sectionRef = useRef<HTMLDivElement>(null);

  // 从后端加载纹样数据
  useEffect(() => {
    api.patterns.list({})
      .then((data) => {
        if (data && data.length > 0) {
          setPatterns(data.map(backendPatternToPattern));
        }
      })
      .catch((err) => {
        console.warn('[KnowledgeGraph] 后端加载失败:', err.message);
      })
      .finally(() => {});
  }, []);

  useEffect(() => {
    const cards = sectionRef.current?.querySelectorAll('.kg-card');
    cards?.forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 0.6, delay: i * 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 90%' },
      });
    });
  }, [activeCategory, search]);

  const filteredPatterns = useMemo(() => {
    return patterns.filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = !search || p.name.includes(search) || p.meaning.includes(search) || p.story.includes(search);
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-6 py-8" ref={sectionRef}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen size={24} style={{ color: '#E84A3A' }} />
            <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#E84A3A' }}>
              {t("kg.label")}
            </span>
          </div>
          <h1 className="font-bold text-[#F0EDE0]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            {t("kg.title")}
          </h1>
          <p className="serif-text text-[#F0EDE0] opacity-50 mt-2 max-w-xl">
            {t("kg.desc")}
          </p>
        </div>

        {/* Knowledge Graph Visualization */}
        <div className="mb-10">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium mb-4 transition-all"
            style={{
              backgroundColor: showGraph ? 'rgba(36,65,169,0.2)' : 'rgba(255,255,255,0.02)',
              color: '#F0EDE0',
              border: `1px solid ${showGraph ? '#2441A9' : 'rgba(240,237,224,0.06)'}`,
            }}
          >
            <Network size={16} />
            {showGraph ? '收起' : '展开'}{t("kg.graph_toggle")}
            <ChevronRight size={14} className={`transition-transform ${showGraph ? 'rotate-90' : ''}`} />
          </button>

          {showGraph && (
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                backgroundColor: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(240,237,224,0.06)',
                height: '500px',
              }}
            >
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                {/* Edges */}
                {GRAPH_EDGES.map(([from, to], i) => {
                  const n1 = GRAPH_NODES.find((n) => n.id === from)!;
                  const n2 = GRAPH_NODES.find((n) => n.id === to)!;
                  return (
                    <line
                      key={i}
                      x1={n1.x * 100} y1={n1.y * 100}
                      x2={n2.x * 100} y2={n2.y * 100}
                      stroke="rgba(240,237,224,0.1)"
                      strokeWidth="0.3"
                    />
                  );
                })}
                {/* Nodes */}
                {GRAPH_NODES.map((node) => (
                  <g key={node.id} className="cursor-pointer">
                    <circle
                      cx={node.x * 100} cy={node.y * 100}
                      r={node.type === 'center' ? 5 : 3}
                      fill={node.color}
                      opacity={0.8}
                    />
                    <text
                      x={node.x * 100} y={node.y * 100 + (node.type === 'center' ? 8 : 5)}
                      textAnchor="middle"
                      fill="rgba(240,237,224,0.7)"
                      fontSize={node.type === 'center' ? 3.5 : 2.8}
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="absolute top-4 left-4">
                <span className="text-xs text-[#F0EDE0] opacity-40">点击节点可探索关联 · 蝴蝶妈妈关联图谱</span>
              </div>
            </div>
          )}
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0EDE0] opacity-30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("kg.search")}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-[#F0EDE0]"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="px-4 py-2 rounded-lg text-xs transition-all"
                style={{
                  backgroundColor: activeCategory === cat.key ? '#2441A9' : 'rgba(255,255,255,0.02)',
                  color: activeCategory === cat.key ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
                  border: `1px solid ${activeCategory === cat.key ? '#2441A9' : 'rgba(240,237,224,0.06)'}`,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className="kg-card group rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(240,237,224,0.06)',
              }}
              onClick={() => setSelectedPattern(pattern)}
            >
              <div className="relative overflow-hidden" style={{ height: '180px' }}>
                <img
                  src={pattern.image}
                  alt={pattern.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 40%, rgba(11,14,20,0.9))' }} />
                <div className="absolute bottom-3 left-3 flex gap-1">
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(36,65,169,0.5)', color: '#F0EDE0' }}>
                    {pattern.region}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-[#F0EDE0] font-bold text-sm mb-1">{pattern.name}</h3>
                <p className="serif-text text-[#F0EDE0] opacity-40 text-xs line-clamp-2">{pattern.meaning}</p>
                <div className="flex gap-1 mt-2">
                  {pattern.colors.slice(0, 3).map((c, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(240,237,224,0.5)' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedPattern && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(11,14,20,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setSelectedPattern(null)}
          >
            <div
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl"
              style={{ backgroundColor: '#0B0E14', border: '1px solid rgba(240,237,224,0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPattern(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <X size={16} className="text-[#F0EDE0]" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6">
                  <img
                    src={selectedPattern.image}
                    alt={selectedPattern.name}
                    className="w-full rounded-xl mb-4"
                  />
                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                      style={{ backgroundColor: 'rgba(36,65,169,0.2)', color: '#F0EDE0', border: '1px solid rgba(36,65,169,0.3)' }}
                    >
                      <Download size={12} />
                      {t("kg.download_img")}
                    </button>
                    <button
                      className="flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#F0EDE0', border: '1px solid rgba(240,237,224,0.1)' }}
                    >
                      <FileText size={12} />
                      {t("kg.download_line")}
                    </button>
                    <Link
                      to={`/knowledge-graph/` + selectedPattern.id}
                      className="flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                      style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}
                    >
                      查看详情
                    </Link>
                  </div>
                </div>

                <div className="p-6 border-t md:border-t-0 md:border-l border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(232,74,58,0.2)', color: '#E84A3A' }}>
                      {CATEGORIES.find((c) => c.key === selectedPattern.category)?.label}
                    </span>
                  </div>
                  <h2 className="text-[#F0EDE0] font-bold text-2xl mb-4">{selectedPattern.name}</h2>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#F0EDE0] opacity-30" />
                      <span className="text-xs text-[#F0EDE0] opacity-60">{selectedPattern.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#F0EDE0] opacity-30" />
                      <span className="text-xs text-[#F0EDE0] opacity-60">{selectedPattern.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette size={14} className="text-[#F0EDE0] opacity-30" />
                      <span className="text-xs text-[#F0EDE0] opacity-60">{selectedPattern.craft}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler size={14} className="text-[#F0EDE0] opacity-30" />
                      <span className="text-xs text-[#F0EDE0] opacity-60">{selectedPattern.size}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-xs text-[#F0EDE0] opacity-40 mb-2 flex items-center gap-1">
                      <Info size={12} />
                      {t("kg.culture")}
                    </h4>
                    <p className="serif-text text-[#F0EDE0] opacity-60 text-sm leading-relaxed">
                      {selectedPattern.story}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-xs text-[#F0EDE0] opacity-40 mb-2">{t("kg.occasion")}</h4>
                    <p className="text-[#F0EDE0] opacity-50 text-xs">{selectedPattern.occasion}</p>
                  </div>

                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: 'rgba(36,65,169,0.08)', border: '1px solid rgba(36,65,169,0.15)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs text-[#2441A9] flex items-center gap-1">
                        <Sparkles size={12} />
                        {t("kg.ai_prompt")}
                      </h4>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPattern.prompt);
                          toast('AI Prompt 已复制到剪贴板');
                        }}
                        className="text-[10px] px-2 py-1 rounded transition-opacity hover:opacity-80"
                        style={{ backgroundColor: 'rgba(36,65,169,0.2)', color: '#F0EDE0' }}
                      >
                        复制 Prompt
                      </button>
                    </div>
                    <p className="serif-text text-[#F0EDE0] opacity-50 text-xs leading-relaxed italic">
                      {selectedPattern.prompt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

