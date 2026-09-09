import { useEffect, useState } from 'react';
import { useI18n } from "../i18n";
import { api } from '../api';
import { useAuth } from '../auth';
import {
  Image, MessageSquare, Settings,
  Download, Share2, X,
  LogOut, Shield, Sparkles, Package,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedImage {
  id: string;
  image_url: string;
  prompt: string;
  style: string;
  elements: string[];
  meaning: string;
  created_at: string;
  likes: number;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  items: { name: string; price: number; quantity: number }[];
  created_at: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments_count: number;
  tags: string[];
  created_at: string;
}

export default function Profile() {
  const { t } = useI18n();
  const { user, logout, updateProfile } = useAuth();
  const [tab, setTab] = useState<'works' | 'saved' | 'posts' | 'orders' | 'settings'>('works');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState(user?.bio || '');

  const [works, setWorks] = useState<GeneratedImage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({
    works: false, orders: false, posts: false,
  });

  useEffect(() => {
    setNewName(user?.name || '');
    setNewBio(user?.bio || '');
  }, [user]);

  const fetchWorks = async () => {
    setLoading((l) => ({ ...l, works: true }));
    try {
      const data = await api.ai.history();
      setWorks(data || []);
    } catch (e: any) {
      toast.error(e.message || '作品加载失败');
    } finally {
      setLoading((l) => ({ ...l, works: false }));
    }
  };

  const fetchOrders = async () => {
    setLoading((l) => ({ ...l, orders: true }));
    try {
      const data = await api.orders.list();
      setOrders(data || []);
    } catch (e: any) {
      toast.error(e.message || '订单加载失败');
    } finally {
      setLoading((l) => ({ ...l, orders: false }));
    }
  };

  const fetchPosts = async () => {
    if (!user) return;
    setLoading((l) => ({ ...l, posts: true }));
    try {
      const data = await api.forum.posts({ status: undefined, user_id: user.id });
      setPosts(data || []);
    } catch (e: any) {
      toast.error(e.message || '帖子加载失败');
    } finally {
      setLoading((l) => ({ ...l, posts: false }));
    }
  };

  useEffect(() => {
    if (!user) return;
    if (tab === 'works') fetchWorks();
    if (tab === 'orders') fetchOrders();
    if (tab === 'posts') fetchPosts();
  }, [tab, user]);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const handleUpdateName = async () => {
    if (newName.trim()) {
      await updateProfile({ name: newName.trim() });
      setEditingName(false);
      toast.success('昵称已更新');
    }
  };

  const handleUpdateBio = async () => {
    await updateProfile({ bio: newBio.trim() });
    setEditingBio(false);
    toast.success('简介已更新');
  };

  const TABS = [
    { key: 'works' as const, label: '我的作品', icon: Image },
    { key: 'posts' as const, label: '帖子', icon: MessageSquare },
    { key: 'orders' as const, label: '订单', icon: Package },
    { key: 'settings' as const, label: '设置', icon: Settings },
  ];

  const STATUS_LABEL: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Math.floor(diff / 86400000) + '天前';
  };

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div
          className="rounded-2xl p-8 mb-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(36,65,169,0.08), rgba(232,74,58,0.04))',
            border: '1px solid rgba(240,237,224,0.08)',
          }}
        >
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'url(images/pattern-5.jpg)',
              backgroundSize: 'cover',
              maskImage: 'radial-gradient(circle at top right, black, transparent)',
              WebkitMaskImage: 'radial-gradient(circle at top right, black, transparent)',
            }}
          />

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: '3px solid rgba(36,65,169,0.6)', boxShadow: '0 4px 20px rgba(36,65,169,0.3)' }}
              />
              {isAdmin && (
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#E84A3A', border: '2px solid #0B0E14' }}
                >
                  <Shield size={12} className="text-[#F0EDE0]" />
                </div>
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              {editingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-1 rounded text-sm text-[#F0EDE0]"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(240,237,224,0.1)' }}
                    autoFocus
                  />
                  <button onClick={handleUpdateName} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}>保存</button>
                </div>
              ) : (
                <h1 className="text-[#F0EDE0] font-bold text-2xl mb-1 flex items-center gap-2">
                  {user.name}
                  <button onClick={() => setEditingName(true)} className="text-[10px] px-2 py-0.5 rounded opacity-40 hover:opacity-80" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>{t("prof.edit_name")}</button>
                </h1>
              )}

              <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isAdmin ? 'rgba(232,74,58,0.15)' : 'rgba(36,65,169,0.15)', color: isAdmin ? '#E84A3A' : '#2441A9' }}>
                  {isAdmin ? '项目管理员' : '创作者'}
                </span>
                <span className="text-xs text-[#F0EDE0] opacity-30">{user.email}</span>
              </div>

              {editingBio ? (
                <div className="flex items-center gap-2">
                  <input
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="px-3 py-1 rounded text-sm text-[#F0EDE0] flex-1 max-w-md"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(240,237,224,0.1)' }}
                    autoFocus
                  />
                  <button onClick={handleUpdateBio} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}>保存</button>
                </div>
              ) : (
                <p className="serif-text text-[#F0EDE0] opacity-50 text-sm flex items-center gap-2 justify-center md:justify-start">
                  {user.bio || '暂无简介'}
                  <button onClick={() => setEditingBio(true)} className="text-[10px] px-2 py-0.5 rounded opacity-40 hover:opacity-80" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>{t("prof.edit_bio") || '编辑'}</button>
                </p>
              )}
            </div>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(240,237,224,0.5)', border: '1px solid rgba(240,237,224,0.1)' }}
            >
              <LogOut size={12} />
              {t("prof.logout")}
            </button>
          </div>
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
                border: `1px solid ${tab === t.key ? '#2441A960' : 'rgba(240,237,224,0.06)'}`,
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Works */}
        {tab === 'works' && (
          <div>
            {loading.works ? (
              <div className="text-center py-20 text-[#F0EDE0] opacity-50">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                加载中...
              </div>
            ) : works.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles size={48} className="text-[#F0EDE0] opacity-10 mx-auto mb-4" />
                <p className="text-[#F0EDE0] opacity-30 text-sm">还没有AI生成作品，去创作第一张吧</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {works.map((img) => (
                  <div
                    key={img.id}
                    className="group relative rounded-xl overflow-hidden cursor-pointer aspect-square"
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}
                    onClick={() => setSelectedImage(img.image_url)}
                  >
                    <img src={img.image_url} alt={img.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
                      <p className="text-[10px] text-[#F0EDE0] line-clamp-2 mb-2">{img.prompt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#F0EDE0] opacity-60">{img.likes} 赞</span>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedImage(img.image_url); }} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                            <Download size={12} className="text-[#F0EDE0]" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                            <Share2 size={12} className="text-[#F0EDE0]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posts */}
        {tab === 'posts' && (
          <div className="space-y-4">
            {loading.posts ? (
              <div className="text-center py-20 text-[#F0EDE0] opacity-50">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                加载中...
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare size={48} className="text-[#F0EDE0] opacity-10 mx-auto mb-4" />
                <p className="text-[#F0EDE0] opacity-30 text-sm">还没有发布帖子</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                  <h3 className="text-[#F0EDE0] font-bold text-sm mb-1">{post.title}</h3>
                  <p className="serif-text text-[#F0EDE0] opacity-40 text-xs line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'rgba(240,237,224,0.3)' }}>
                    <span>{post.likes} 赞</span>
                    <span>{post.comments_count} 评论</span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {loading.orders ? (
              <div className="text-center py-20 text-[#F0EDE0] opacity-50">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                加载中...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20">
                <Package size={48} className="text-[#F0EDE0] opacity-10 mx-auto mb-4" />
                <p className="text-[#F0EDE0] opacity-30 text-sm">暂无订单</p>
              </div>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(240,237,224,0.03)', border: '1px solid rgba(240,237,224,0.08)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs opacity-40" style={{ color: '#F0EDE0' }}>订单号 {o.id.slice(0, 8)}</p>
                      <p className="text-xs opacity-40 mt-1" style={{ color: '#F0EDE0' }}>{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(36,65,169,0.15)', color: '#2441A9' }}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm" style={{ color: '#F0EDE0' }}>
                        <span className="opacity-80">{item.name} × {item.quantity}</span>
                        <span className="opacity-60">¥{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(240,237,224,0.06)' }}>
                    <span className="text-lg font-bold text-[#F0EDE0]">
                      合计 <span style={{ color: '#E84A3A' }}>¥{o.total_amount.toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-[#F0EDE0] font-bold text-sm mb-4">账号{t("prof.settings")}</h3>
            {[
              { label: '角色权限', value: isAdmin ? '管理员' : '创作者' },
              { label: '邮箱', value: user.email },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}
              >
                <span className="text-sm text-[#F0EDE0] opacity-70">{item.label}</span>
                <span className="text-sm font-medium" style={{ color: isAdmin ? '#E84A3A' : '#2441A9' }}>{item.value}</span>
              </div>
            ))}
            <div className="mt-6">
              <h3 className="text-[#F0EDE0] font-bold text-sm mb-4">{t("prof.perm_title")}</h3>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                <ul className="space-y-2">
                  {(isAdmin ? [
                    '管理后台数据看板与统计',
                    '纹样数据集上传/编辑/删除',
                    'AI模型版本切换与管理',
                    '用户行为数据分析',
                    '商城订单与商品管理',
                    '研学课程与绣娘信息管理',
                  ] : [
                    '使用AI纹样生成器创作',
                    '体验AR虚拟试穿功能',
                    '浏览纹样知识图谱',
                    '参与社区论坛交流',
                    '收藏与分享作品',
                    '报名研学课程',
                    '购买文创产品',
                  ]).map((perm, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[#F0EDE0] opacity-50">
                      <Shield size={10} style={{ color: isAdmin ? '#E84A3A' : '#2441A9' }} />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(11,14,20,0.92)', backdropFilter: 'blur(16px)' }} onClick={() => setSelectedImage(null)}>
            <img src={selectedImage} alt="Preview" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <X size={20} className="text-[#F0EDE0]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
