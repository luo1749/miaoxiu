import { useI18n } from "../i18n";
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { api } from '../api';
import { useAppStore } from '../store';
import { toast } from 'sonner';
import {
  GraduationCap, Play, Calendar, MapPin, Award,
  Heart, ShoppingCart, Users, Clock,
  Gift, CreditCard, X, Download,
} from 'lucide-react';

const OFFLINE_TRIPS = [
  {
    id: 't1',
    title: '松桃苗绣非遗工坊3日研学',
    desc: '深入松桃县苗绣传承基地，跟随省级传承人学习苗绣针法，参观苗绣博物馆，体验完整的苗绣创作流程。行程包含AR寻宝打卡任务。',
    image: 'images/pattern-1.jpg',
    location: '贵州省铜仁市松桃县',
    duration: '3天2晚',
    price: 1680,
    spots: 20,
    dates: '2024.07.15 - 07.17',
  },
  {
    id: 't2',
    title: '江口蜡染技艺5日深度游',
    desc: '在江口县传统蜡染村落中，跟随国家级传承人学习全套蜡染工艺，从采蓝、制蜡到成品，深度体验蜡染文化。',
    image: 'images/pattern-6.jpg',
    location: '贵州省铜仁市江口县',
    duration: '5天4晚',
    price: 2680,
    spots: 15,
    dates: '2024.08.01 - 08.05',
  },
];

const PRODUCTS = [
  {
    id: 'pd1',
    name: '苗绣丝巾·蝴蝶妈妈',
    price: 268,
    image: 'images/pattern-3.jpg',
    type: 'handmade',
    ratio: '80%{t("st.handmade")} · 20%AI辅助设计',
    maker: '龙绣娘工坊',
  },
  {
    id: 'pd2',
    name: '蜡染T恤·铜鼓纹',
    price: 168,
    image: 'images/pattern-5.jpg',
    type: 'ai',
    ratio: '10%{t("st.handmade")} · 90%AI辅助设计',
    maker: '锦绣黔境工作室',
  },
  {
    id: 'pd3',
    name: '数码印花帆布包',
    price: 128,
    image: 'images/pattern-4.jpg',
    type: 'ai',
    ratio: '0%{t("st.handmade")} · 100%AI辅助设计',
    maker: '锦绣黔境工作室',
  },
  {
    id: 'pd4',
    name: '手工蜡染装饰画',
    price: 588,
    image: 'images/pattern-6.jpg',
    type: 'handmade',
    ratio: '95%{t("st.handmade")} · 5%AI辅助设计',
    maker: '吴大师工坊',
  },
  {
    id: 'pd5',
    name: '苗绣手机壳·龙纹',
    price: 88,
    image: 'images/pattern-8.jpg',
    type: 'ai',
    ratio: '0%{t("st.handmade")} · 100%AI辅助设计',
    maker: '锦绣黔境工作室',
  },
  {
    id: 'pd6',
    name: '手绘蜡染抱枕套',
    price: 198,
    image: 'images/pattern-7.jpg',
    type: 'handmade',
    ratio: '70%{t("st.handmade")} · 30%AI辅助设计',
    maker: '张绣娘工坊',
  },
];

const ARTISANS = [
  {
    name: '龙银花',
    title: '省级非遗传承人',
    image: 'images/pattern-1.jpg',
    specialty: '苗绣平绣、辫绣',
    story: '从事苗绣工艺40余年，培养了30多位学徒，作品多次获得国家级大奖。',
  },
  {
    name: '吴永安',
    title: '国家级非遗传承人',
    image: 'images/pattern-6.jpg',
    specialty: '蜡染全套工艺',
    story: '家族五代传承蜡染技艺，是目前少数掌握古法蓝靛制作的传承人。',
  },
  {
    name: '张小梅',
    title: '县级非遗传承人',
    image: 'images/pattern-9.jpg',
    specialty: '打籽绣、堆绣',
    story: '年轻的新一代传承人，积极探索苗绣与现代设计的结合。',
  },
];

interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  cover_url: string;
  video_url: string;
  duration: number;
  difficulty: string;
  instructor: string;
  is_featured: boolean;
}

export default function StudyTour() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'courses' | 'trips' | 'shop' | 'artisans'>('courses');
  const [showCert, setShowCert] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const { addToCart, cart } = useAppStore();

  useEffect(() => {
    api.courses.list()
      .then((data) => setCourses(data || []))
      .catch(() => toast.error('课程列表加载失败'));
  }, []);

  const TABS = [
    { key: 'courses' as const, label: '线上课程', icon: Play },
    { key: 'trips' as const, label: '线下研学', icon: Calendar },
    { key: 'shop' as const, label: '文创商城', icon: ShoppingCart },
    { key: 'artisans' as const, label: '绣娘故事', icon: Heart },
  ];

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap size={24} style={{ color: '#E84A3A' }} />
            <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#E84A3A' }}>
              {t("st.label")}
            </span>
          </div>
          <h1 className="font-bold text-[#F0EDE0]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            {t("st.title")}
          </h1>
          <p className="serif-text text-[#F0EDE0] opacity-50 mt-2 max-w-xl">
            {t("st.desc")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all shrink-0"
              style={{
                backgroundColor: tab === t.key ? 'rgba(36,65,169,0.2)' : 'rgba(255,255,255,0.02)',
                color: tab === t.key ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
                border: `1px solid ${tab === t.key ? '#2441A9' : 'rgba(240,237,224,0.06)'}`,
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Online Courses */}
        {tab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[#F0EDE0] font-bold text-lg">非遗{t("st.tab_courses")}</h2>
              <button
                onClick={() => setShowCert(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs"
                style={{ backgroundColor: 'rgba(232,74,58,0.15)', color: '#E84A3A' }}
              >
                <Award size={14} />
                {t("st.cert")}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {courses.map((course) => (
                <Link
                  to={`/study-tour/` + course.id}
                  key={course.id}
                  className="flex gap-4 p-4 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}
                >
                  <img src={course.cover_url} alt={course.title} className="w-32 h-32 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#F0EDE0] font-bold text-sm mb-1">{course.title}</h3>
                    <p className="serif-text text-[#F0EDE0] opacity-40 text-xs line-clamp-2 mb-2">{course.description}</p>
                    <div className="flex items-center gap-3 text-xs text-[#F0EDE0] opacity-40 mb-2">
                      <span className="flex items-center gap-1"><Clock size={10} />{course.duration}分钟</span>
                      <span className="flex items-center gap-1"><Users size={10} />{course.instructor}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#F0EDE0] opacity-50">{course.difficulty}</span>
                      <span
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}
                      >
                        {t("st.free")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Certificate Modal */}
            {showCert && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(11,14,20,0.85)', backdropFilter: 'blur(12px)' }} onClick={() => setShowCert(false)}>
                <div
                  className="relative p-10 rounded-2xl text-center max-w-md w-full"
                  style={{ backgroundColor: '#0B0E14', border: '2px solid rgba(36,65,169,0.3)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => setShowCert(false)} className="absolute top-4 right-4"><X size={16} className="text-[#F0EDE0] opacity-40" /></button>
                  <Award size={48} style={{ color: '#E84A3A' }} className="mx-auto mb-4" />
                  <h3 className="text-[#F0EDE0] font-bold text-xl mb-2">研学证书</h3>
                  <p className="serif-text text-[#F0EDE0] opacity-50 text-sm mb-6">完成课程「苗绣基础针法入门」</p>
                  <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'rgba(36,65,169,0.1)', border: '1px dashed rgba(36,65,169,0.3)' }}>
                    <p className="text-[#F0EDE0] opacity-70 text-sm">证书编号: GENE-E-2024-001</p>
                    <p className="text-[#F0EDE0] opacity-70 text-sm">完成日期: 2024年5月20日</p>
                  </div>
                  <button className="w-full py-3 rounded-lg text-sm font-bold" style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}>
                    <Download size={14} className="inline mr-2" />
                    下载电子证书
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Offline Trips */}
        {tab === 'trips' && (
          <div className="space-y-6">
            <h2 className="text-[#F0EDE0] font-bold text-lg">{t("st.tab_trips")}预约</h2>
            <div className="space-y-5">
              {OFFLINE_TRIPS.map((trip) => (
                <div
                  key={trip.id}
                  className="flex flex-col md:flex-row gap-6 p-5 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}
                >
                  <img src={trip.image} alt={trip.title} className="w-full md:w-64 h-48 rounded-lg object-cover shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-[#F0EDE0] font-bold text-lg mb-2">{trip.title}</h3>
                    <p className="serif-text text-[#F0EDE0] opacity-40 text-sm mb-4">{trip.desc}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#F0EDE0] opacity-50"><MapPin size={12} />{trip.location}</div>
                      <div className="flex items-center gap-1.5 text-xs text-[#F0EDE0] opacity-50"><Clock size={12} />{trip.duration}</div>
                      <div className="flex items-center gap-1.5 text-xs text-[#F0EDE0] opacity-50"><Users size={12} />余{trip.spots}位</div>
                      <div className="flex items-center gap-1.5 text-xs text-[#F0EDE0] opacity-50"><Calendar size={12} />{trip.dates}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#E84A3A] font-bold text-lg">¥{trip.price}</span>
                      <button
                        onClick={() => setShowPayment(trip.id)}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold"
                        style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}
                      >
                        {t("st.book")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Modal */}
            {showPayment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(11,14,20,0.85)', backdropFilter: 'blur(12px)' }} onClick={() => setShowPayment(null)}>
                <div
                  className="relative p-8 rounded-2xl max-w-sm w-full"
                  style={{ backgroundColor: '#0B0E14', border: '1px solid rgba(240,237,224,0.1)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => setShowPayment(null)} className="absolute top-4 right-4"><X size={16} className="text-[#F0EDE0] opacity-40" /></button>
                  <h3 className="text-[#F0EDE0] font-bold text-lg mb-4">预约确认</h3>
                  <div className="space-y-3 mb-6">
                    <input placeholder="姓名" className="w-full px-4 py-3 rounded-lg text-sm text-[#F0EDE0]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }} />
                    <input placeholder="手机号" className="w-full px-4 py-3 rounded-lg text-sm text-[#F0EDE0]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }} />
                    <input placeholder="备注需求（可选）" className="w-full px-4 py-3 rounded-lg text-sm text-[#F0EDE0]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }} />
                  </div>
                  <button
                    onClick={() => { setShowPayment(null); alert('预约成功！我们将尽快与您联系。'); }}
                    className="w-full py-3 rounded-lg text-sm font-bold"
                    style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}
                  >
                    <CreditCard size={14} className="inline mr-2" />
                    确认预约
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shop */}
        {tab === 'shop' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[#F0EDE0] font-bold text-lg">{t("st.tab_shop")}</h2>
              <span className="text-xs text-[#F0EDE0] opacity-40">{cart.length} 件商品</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {PRODUCTS.map((pd) => (
                <div
                  key={pd.id}
                  className="rounded-xl overflow-hidden group"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}
                >
                  <div className="relative overflow-hidden">
                    <img src={pd.image} alt={pd.name} className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: pd.type === 'handmade' ? 'rgba(232,74,58,0.7)' : 'rgba(36,65,169,0.7)', color: '#F0EDE0' }}>
                        {pd.type === 'handmade' ? '绣娘手作' : 'AI设计'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[#F0EDE0] font-bold text-sm mb-1">{pd.name}</h3>
                    <p className="text-[10px] text-[#F0EDE0] opacity-30 mb-2">{pd.ratio}</p>
                    <p className="text-[10px] text-[#F0EDE0] opacity-40 mb-3">{pd.maker}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#E84A3A] font-bold">¥{pd.price}</span>
                      <button
                        onClick={() => addToCart({ id: pd.id, name: pd.name, price: pd.price, image: pd.image, quantity: 1, type: pd.type as 'ai' | 'handmade' })}
                        className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                        style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}
                      >
                        <ShoppingCart size={12} />
                        {t("st.cart")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artisans */}
        {tab === 'artisans' && (
          <div className="space-y-6">
            <h2 className="text-[#F0EDE0] font-bold text-lg">绣娘与传承人故事</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ARTISANS.map((a) => (
                <div
                  key={a.name}
                  className="rounded-xl overflow-hidden text-center p-6"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}
                >
                  <img src={a.image} alt={a.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" style={{ border: '2px solid rgba(36,65,169,0.5)' }} />
                  <h3 className="text-[#F0EDE0] font-bold text-sm mb-1">{a.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(232,74,58,0.15)', color: '#E84A3A' }}>{a.title}</span>
                  <p className="text-xs text-[#F0EDE0] opacity-40 mt-2 mb-3">{a.specialty}</p>
                  <p className="serif-text text-[#F0EDE0] opacity-40 text-xs leading-relaxed mb-4">{a.story}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(232,74,58,0.15)', color: '#E84A3A' }}>
                      <Heart size={12} className="inline mr-1" />
                      {t("st.support")}
                    </button>
                    <button className="flex-1 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(36,65,169,0.15)', color: '#2441A9' }}>
                      <Gift size={12} className="inline mr-1" />
                      {t("st.custom")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

