import { useI18n } from "../i18n";
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth';
import { useAppStore } from '../store';
import {
  Image, Heart, MessageSquare, Settings,
  Download, Share2, Trash2, X,
  LogOut, Shield, Sparkles,
} from 'lucide-react';

export default function Profile() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { generatedImages, saveImage, unsaveImage, forumPosts } = useAppStore();
  const [tab, setTab] = useState<'works' | 'saved' | 'posts' | 'settings'>('works');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState(user?.bio || '');

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const handleUpdateName = () => {
    if (newName.trim()) {
      updateProfile({ name: newName.trim() });
      setEditingName(false);
    }
  };

  const handleUpdateBio = () => {
    updateProfile({ bio: newBio.trim() });
    setEditingBio(false);
  };

  const TABS = [
    { key: 'works' as const, label: '我的作品', icon: Image },
    { key: 'saved' as const, label: '收藏', icon: Heart },
    { key: 'posts' as const, label: '帖子', icon: MessageSquare },
    { key: 'settings' as const, label: '设置', icon: Settings },
  ];

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
          {/* Decorative pattern */}
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
                    className="px-3 py-1 rounded text-sm text-[#F0EDE0] flex-1 max-w-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(240,237,224,0.1)' }}
                    autoFocus
                  />
                  <button onClick={handleUpdateBio} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}>保存</button>
                </div>
              ) : (
                <p className="serif-text text-[#F0EDE0] opacity-40 text-sm flex items-center gap-2">
                  {user.bio}
                  <button onClick={() => setEditingBio(true)} className="opacity-30 hover:opacity-80"><Sparkles size={10} /></button>
                </p>
              )}

              <div className="flex items-center justify-center md:justify-start gap-8 mt-4">
                <div className="text-center">
                  <div className="text-[#F0EDE0] font-bold text-xl">{generatedImages.length}</div>
                  <div className="text-[10px] text-[#F0EDE0] opacity-40">生成作品</div>
                </div>
                <div className="text-center">
                  <div className="text-[#F0EDE0] font-bold text-xl">{user.savedWorks?.length || 0}</div>
                  <div className="text-[10px] text-[#F0EDE0] opacity-40">{t("prof.saved")}</div>
                </div>
                <div className="text-center">
                  <div className="text-[#F0EDE0] font-bold text-xl">{user.posts}</div>
                  <div className="text-[10px] text-[#F0EDE0] opacity-40">{t("prof.posts")}</div>
                </div>
                <div className="text-center">
                  <div className="text-[#F0EDE0] font-bold text-xl">{user.likes}</div>
                  <div className="text-[10px] text-[#F0EDE0] opacity-40">获赞</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all hover:opacity-80"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(240,237,224,0.5)', border: '1px solid rgba(240,237,224,0.1)' }}
              >
                <LogOut size={12} />
                {t("prof.logout")}
              </button>
            </div>
          </div>
        </div>

        {/* Role-based permission notice */}
        {isAdmin && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{ backgroundColor: 'rgba(232,74,58,0.06)', border: '1px solid rgba(232,74,58,0.12)' }}
          >
            <Shield size={18} style={{ color: '#E84A3A' }} />
            <div>
              <p className="text-xs text-[#F0EDE0] font-medium">管理员权限已激活</p>
              <p className="text-[10px] text-[#F0EDE0] opacity-40">您可以访问后台管理、数据统计、内容管理等全部功能</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/5 pb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: tab === t.key ? 'rgba(36,65,169,0.2)' : 'transparent',
                color: tab === t.key ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* My Works */}
        {tab === 'works' && (
          <div>
            {generatedImages.length === 0 ? (
              <div className="text-center py-20">
                <Image size={48} className="text-[#F0EDE0] opacity-10 mx-auto mb-4" />
                <p className="text-[#F0EDE0] opacity-30 text-sm mb-4">{t("prof.empty_works")}</p>
                <button onClick={() => navigate('/ai-generator')} className="px-6 py-2 rounded-lg text-xs" style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}>
                  {t("prof.go_create")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative rounded-xl overflow-hidden cursor-pointer group"
                    style={{ border: '1px solid rgba(240,237,224,0.06)' }}
                    onClick={() => setSelectedImage(img.url)}
                  >
                    <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                          <Download size={14} className="text-[#F0EDE0]" />
                        </button>
                        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                          <Share2 size={14} className="text-[#F0EDE0]" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); saveImage(img); }}
                          className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        >
                          <Heart size={14} className="text-[#F0EDE0]" />
                        </button>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(11,14,20,0.7)', color: '#F0EDE0' }}>
                        {img.style}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved */}
        {tab === 'saved' && (
          <div>
            {(!user.savedWorks || user.savedWorks.length === 0) ? (
              <div className="text-center py-20">
                <Heart size={48} className="text-[#F0EDE0] opacity-10 mx-auto mb-4" />
                <p className="text-[#F0EDE0] opacity-30 text-sm">还没有{t("prof.saved")}任何作品</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {user.savedWorks.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(240,237,224,0.06)' }}>
                    <img src={url} alt="" className="w-full aspect-square object-cover" />
                    <button
                      onClick={() => unsaveImage(`saved-${i}`)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(232,74,58,0.8)' }}
                    >
                      <Trash2 size={12} className="text-[#F0EDE0]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posts */}
        {tab === 'posts' && (
          <div className="space-y-4">
            {forumPosts.filter((p) => p.author === user.name).length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare size={48} className="text-[#F0EDE0] opacity-10 mx-auto mb-4" />
                <p className="text-[#F0EDE0] opacity-30 text-sm">还没有发布{t("prof.posts")}</p>
              </div>
            ) : (
              forumPosts.filter((p) => p.author === user.name).map((post) => (
                <div key={post.id} className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}>
                  <h3 className="text-[#F0EDE0] font-bold text-sm mb-1">{post.title}</h3>
                  <p className="serif-text text-[#F0EDE0] opacity-40 text-xs line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'rgba(240,237,224,0.3)' }}>
                    <span>{post.likes} 赞</span>
                    <span>{post.comments} 评论</span>
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
              { label: '隐私{t("prof.settings")}', value: '公开' },
              { label: '消息通知', value: '已开启' },
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
                    '纹样数据集上传/{t("prof.edit_name")}/删除',
                    'AI模型版本切换与管理',
                    '用户行为数据分析',
                    '商城订单与商品管理',
                    '研学课程与绣娘信息管理',
                  ] : [
                    '使用AI纹样生成器创作',
                    '体验AR虚拟试穿功能',
                    '浏览纹样知识图谱',
                    '参与社区论坛交流',
                    '{t("prof.saved")}与分享作品',
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
