import { useState } from 'react';
import { useI18n } from "../i18n";
import { useNavigate } from 'react-router';
import { useAuth } from '../auth';
import { api } from '../api';
import { toast } from 'sonner';
import {
  LogIn, UserPlus, Shield, User, ArrowLeft, Eye, EyeOff,
  Sparkles, Github,
} from 'lucide-react';

export default function Login() {
  const { t } = useI18n();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      if (!email || !password) {
        setError('请填写{t("login.email")}和{t("login.password")}');
        return;
      }
      const ok = await login(email, password, remember);
      if (ok) {
        navigate('/');
      } else {
        setError('{t("login.email")}或{t("login.password")}错误，请重试');
      }
    } else {
      if (!name || !email || !password) {
        setError('请填写所有字段');
        return;
      }
      if (password.length < 6) {
        setError('{t("login.password")}{t("login.error_short")}');
        return;
      }
      const ok = await register(name, email, password, role);
      if (ok) {
        navigate('/');
      } else {
        setError('该{t("login.email")}已被{t("login.register_tab")}');
      }
    }
  };

  const fillDemo = (type: 'admin' | 'user') => {
    setEmail(type === 'admin' ? 'admin@gene-e.com' : 'user@gene-e.com');
    setPassword(type === 'admin' ? 'admin123' : 'user123');
    setError('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: '#0B0E14' }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              backgroundColor: i % 3 === 0 ? '#E84A3A' : i % 3 === 1 ? '#2441A9' : '#F0EDE0',
              opacity: 0.15,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative pattern border */}
      <div
        className="absolute top-0 left-0 w-full h-2"
        style={{
          background: 'linear-gradient(90deg, #2441A9, #E84A3A, #C8913A, #2441A9)',
          backgroundSize: '200% 100%',
          animation: 'gradientShift 8s linear infinite',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-100"
          style={{ color: 'rgba(240,237,224,0.5)' }}
        >
          <ArrowLeft size={16} />
          {t("login.back")}
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src="images/logo.jpg"
              alt="纹智苗韵 Logo"
              className="w-16 h-16 rounded-xl object-cover"
              style={{ border: '2px solid rgba(232,74,58,0.3)' }}
            />
          </div>
          <h1 className="text-[#F0EDE0] font-bold text-2xl tracking-wide">{t("login.brand")}</h1>
          <p className="text-[#F0EDE0] opacity-40 text-sm mt-1">{t("login.subtitle")}</p>
        </div>

        {/* Mode toggle */}
        <div
          className="flex rounded-lg overflow-hidden mb-6"
          style={{ border: '1px solid rgba(240,237,224,0.1)' }}
        >
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className="flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: mode === 'login' ? '#2441A9' : 'transparent',
              color: mode === 'login' ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
            }}
          >
            <LogIn size={14} />
            {t("login.login_tab")}
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className="flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: mode === 'register' ? '#2441A9' : 'transparent',
              color: mode === 'register' ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
            }}
          >
            <UserPlus size={14} />
            {t("login.register_tab")}
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-6 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,237,224,0.06)' }}
        >
          {mode === 'register' && (
            <div>
              <label className="text-xs text-[#F0EDE0] opacity-50 mb-1.5 block">{t("login.name")}</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0EDE0] opacity-30" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("login.name_placeholder")}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-[#F0EDE0]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-[#F0EDE0] opacity-50 mb-1.5 block">{t("login.email")}</label>
            <div className="relative">
              <Sparkles size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0EDE0] opacity-30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.email_placeholder")}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-[#F0EDE0]"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#F0EDE0] opacity-50 mb-1.5 block">{t("login.password")}</label>
            <div className="relative">
              <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0EDE0] opacity-30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '密码至少6位' : '您的{t("login.password")}'}
                className="w-full pl-10 pr-10 py-3 rounded-lg text-sm text-[#F0EDE0]"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(240,237,224,0.1)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={14} className="text-[#F0EDE0] opacity-30" /> : <Eye size={14} className="text-[#F0EDE0] opacity-30" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-xs text-[#F0EDE0] opacity-50 mb-1.5 block">{t("login.register_tab")}身份</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: role === 'user' ? 'rgba(36,65,169,0.2)' : 'rgba(255,255,255,0.02)',
                    color: role === 'user' ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
                    border: `1px solid ${role === 'user' ? '#2441A9' : 'rgba(240,237,224,0.06)'}`,
                  }}
                >
                  <User size={12} />
                  {t("login.role_creator")}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: role === 'admin' ? 'rgba(232,74,58,0.2)' : 'rgba(255,255,255,0.02)',
                    color: role === 'admin' ? '#F0EDE0' : 'rgba(240,237,224,0.5)',
                    border: `1px solid ${role === 'admin' ? '#E84A3A' : 'rgba(240,237,224,0.06)'}`,
                  }}
                >
                  <Shield size={12} />
                  {t("login.role_admin")}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <label className="flex items-center gap-2 text-xs text-[#F0EDE0] opacity-60 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-white/10 bg-white/5"
            />
            记住我（30 天内自动登录）
          </label>

          <button
            type="submit"
            className="w-full py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}
          >
            {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(240,237,224,0.08)' }} />
          <span className="text-[10px] text-[#F0EDE0] opacity-30">或</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(240,237,224,0.08)' }} />
        </div>

        <button
          onClick={async () => {
            try {
              const { url } = await api.auth.githubAuthorize();
              window.location.href = url;
            } catch (e: any) {
              toast?.error?.(e.message || 'GitHub 登录未配置') ?? alert(e.message || 'GitHub 登录未配置');
            }
          }}
          className="w-full mt-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ backgroundColor: 'rgba(240,237,224,0.06)', color: '#F0EDE0', border: '1px solid rgba(240,237,224,0.1)' }}
        >
          <Github size={16} />
          使用 GitHub 登录
        </button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={async () => {
              try {
                const { url } = await api.auth.wechatAuthorize();
                window.location.href = url;
              } catch (e: any) {
                toast?.error?.(e.message || '微信登录未配置') ?? alert(e.message || '微信登录未配置');
              }
            }}
            className="py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: 'rgba(7,193,96,0.12)', color: '#07C160', border: '1px solid rgba(7,193,96,0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 13.5A1.5 1.5 0 1 1 8.5 10.5 1.5 1.5 0 0 1 8.5 13.5Zm6.5-3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4.5 3.5c0 3.5-3.6 6.5-8 6.5-.8 0-1.6-.1-2.3-.2L7.5 21l.4-2.2C5.6 17.5 4 15.6 4 13.5c0-3.5 3.6-6.5 8-6.5s8 2.9 8 6.5Z"/></svg>
            微信登录
          </button>
          <button
            onClick={async () => {
              try {
                const { url } = await api.auth.qqAuthorize();
                window.location.href = url;
              } catch (e: any) {
                toast?.error?.(e.message || 'QQ 登录未配置') ?? alert(e.message || 'QQ 登录未配置');
              }
            }}
            className="py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: 'rgba(18,183,245,0.12)', color: '#12B7F5', border: '1px solid rgba(18,183,245,0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6 2 10.5c0 2.6 1.4 5 3.5 6.6-.1 1-.7 2.8-1.1 3.9 1.6-.2 3.4-1 4.4-1.7.7.2 1.5.2 2.2.2 5.5 0 10-4 10-9S17.5 2 12 2Zm-3 8.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg>
            QQ 登录
          </button>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 space-y-2">
          <p className="text-center text-xs text-[#F0EDE0] opacity-30 mb-3">{t("login.demo_title")}</p>
          <div className="flex gap-2">
            <button
              onClick={() => fillDemo('admin')}
              className="flex-1 py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'rgba(232,74,58,0.08)', border: '1px solid rgba(232,74,58,0.15)', color: '#E84A3A' }}
            >
              <Shield size={12} />
              {t("login.role_admin")}体验
            </button>
            <button
              onClick={() => fillDemo('user')}
              className="flex-1 py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'rgba(36,65,169,0.08)', border: '1px solid rgba(36,65,169,0.15)', color: '#2441A9' }}
            >
              <User size={12} />
              {t("login.role_creator")}体验
            </button>
          </div>
          <p className="text-center text-[10px] text-[#F0EDE0] opacity-20 mt-2">
            游客无需{t("login.login_tab")}即可浏览基础内容
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}

